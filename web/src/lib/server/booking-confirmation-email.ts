import { createPlanPdf, hackathonDetailUrl } from "$lib/booking-artifacts";
import type { BookingConfiguration } from "$lib/booking";
import { bookingOverviewRows } from "$lib/booking-overview";
import { createPrepCallIcs, type BookingResultSummary } from "$lib/booking-ics";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "$lib/contact";
import { EmailTransportError, sendEmailMessage } from './email-transport';

export interface BookingConfirmationInput {
    id: string;
    config: BookingConfiguration;
    booking: BookingResultSummary;
}

export interface BookingConfirmationDependencies {
    fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    accountId?: string;
    apiToken?: string;
    maxMessageBytes?: number;
    createPdf?: typeof createPlanPdf;
    createCalendar?: typeof createPrepCallIcs;
}

export type BookingConfirmationRecipientRole = "customer" | "organizer";
export type BookingConfirmationStage =
    "configuration" | "attachments" | "serialization" | "network" | "provider";

export type BookingConfirmationAttempt =
    | {
          role: BookingConfirmationRecipientRole;
          sent: true;
          status: "delivered" | "queued" | "accepted";
          messageId?: string;
      }
    | {
          role: BookingConfirmationRecipientRole;
          sent: false;
          error: BookingConfirmationEmailError;
      };

export interface BookingConfirmationReport {
    customer: BookingConfirmationAttempt;
    organizer: BookingConfirmationAttempt;
}

interface PreparedBookingConfirmation {
    subject: string;
    text: string;
    html: string;
    headers: { "X-Booking-ID": string };
    attachments: Array<{
        content: string;
        filename: string;
        type: string;
        disposition: "attachment";
    }>;
}

interface BookingConfirmationErrorOptions {
    stage: BookingConfirmationStage;
    status?: number;
    providerCode?: number | string;
    messageId?: string;
    cause?: unknown;
}

export class BookingConfirmationEmailError extends Error {
    readonly stage: BookingConfirmationStage;
    readonly status?: number;
    readonly providerCode?: number | string;
    readonly messageId?: string;
    readonly causeName?: string;
    readonly causeMessage?: string;

    constructor(message: string, options: BookingConfirmationErrorOptions) {
        super(message);
        this.name = "BookingConfirmationEmailError";
        this.stage = options.stage;
        this.status = options.status;
        this.providerCode = options.providerCode;
        this.messageId = options.messageId;
        if (options.cause instanceof Error) {
            this.causeName = options.cause.name;
            this.causeMessage = options.cause.message;
        }
    }
}

function bytesToBase64(bytes: Uint8Array) {
    if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");

    let binary = "";
    const chunkSize = 32_768;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
}

function failedAttempt(
    role: BookingConfirmationRecipientRole,
    error: BookingConfirmationEmailError,
): BookingConfirmationAttempt {
    return { role, sent: false, error };
}

function failedReport(error: BookingConfirmationEmailError): BookingConfirmationReport {
    return {
        customer: failedAttempt("customer", error),
        organizer: failedAttempt("organizer", error),
    };
}

function normalizeConfirmationError(error: unknown) {
    return error instanceof BookingConfirmationEmailError
        ? error
        : new BookingConfirmationEmailError(
              "Die Buchungsbestätigung ist unerwartet fehlgeschlagen.",
              {
                  stage: "provider",
                  providerCode: "unexpected_error",
                  cause: error,
              },
          );
}

export function bookingDetailUrl(id: string, locale: 'de' | 'en' = 'de') {
    return hackathonDetailUrl(id, locale);
}

function rowText(row: ReturnType<typeof bookingOverviewRows>[number]) {
	return `- ${row.label}: ${row.value}${row.status === "Inklusive" || row.status === 'Included' ? "" : ` — ${row.status}`}`;
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function buildBookingConfirmationText(
    input: BookingConfirmationInput,
    role: BookingConfirmationRecipientRole = "customer",
) {
    const customer = role === "customer";
	const english = customer && input.config.locale === 'en';
	const deferred = !input.config.eventStart;
	const rows = bookingOverviewRows({ ...input.config, locale: english ? 'en' : 'de' }, input.booking);
    const content = [
		customer ? (english ? `Hello ${input.config.contactName},` : `Hallo ${input.config.contactName},`) : "Hallo ALL IN AGI,",
        "",
        customer
			? (english
				? deferred ? 'Thank you for your non-binding company inquiry. The preparation call is reserved; the hackathon date will be selected later. This does not yet create a contract.' : 'Thank you for your non-binding company inquiry. The preparation call and hackathon day are initially reserved; this does not yet create a contract.'
				: deferred ? 'vielen Dank für Ihre unverbindliche Firmenanfrage. Der Prep-Call ist reserviert; den Hackathon-Termin legen wir später fest. Ein Vertrag entsteht dadurch noch nicht.' : "vielen Dank für Ihre unverbindliche Firmenanfrage. Der Prep-Call und der Hackathontag sind zunächst reserviert; ein Vertrag entsteht dadurch noch nicht.")
			: "Es wurde eine neue unverbindliche Hackathon-Anfrage gestellt.",
        "",
        ...rows.map(rowText),
        "",
		`${english ? 'View inquiry' : 'Anfrage ansehen'}: ${bookingDetailUrl(input.id, english ? 'en' : 'de')}`,
    ];

    if (customer) {
        content.push(
            "",
			english ? 'Please contact us at any time if you have questions or would like to make changes.' : "Bei Fragen oder Änderungswünschen können Sie uns gerne jederzeit kontaktieren.",
			`${english ? 'Phone' : 'Telefon'}: ${CONTACT_PHONE_DISPLAY} (tel:${CONTACT_PHONE_HREF})`,
			`${english ? 'Email' : 'E-Mail'}: ${CONTACT_EMAIL} (mailto:${CONTACT_EMAIL})`,
            "",
			english ? 'We look forward to working with you!' : "Wir freuen uns auf Sie!",
        );
    }

    // Keep two blank lines between the body and the mail client's attachment area.
    return `${content.join("\n")}\n\n\n`;
}

export function buildBookingConfirmationHtml(
    input: BookingConfirmationInput,
    role: BookingConfirmationRecipientRole = "customer",
) {
	const customer = role === "customer";
	const english = customer && input.config.locale === 'en';
	const deferred = !input.config.eventStart;
	const rows = bookingOverviewRows({ ...input.config, locale: english ? 'en' : 'de' }, input.booking);
	const detailUrl = escapeHtml(bookingDetailUrl(input.id, english ? 'en' : 'de'));
    const options = rows
        .map((row) => {
			const status = row.status === "Inklusive" || row.status === 'Included' ? "" : ` — ${escapeHtml(row.status)}`;
            return `<strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}${status}`;
        })
        .join("<br>");
    const contact = customer
		? (english ? `<p>Please contact us at any time if you have questions or would like to make changes.</p>
			<p><strong>Phone:</strong> <a href="tel:${escapeHtml(CONTACT_PHONE_HREF)}">${escapeHtml(CONTACT_PHONE_DISPLAY)}</a><br><strong>Email:</strong> <a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a></p><p>We look forward to working with you!</p>` : `<p>Bei Fragen oder Änderungswünschen können Sie uns gerne jederzeit kontaktieren.</p>
			<p><strong>Telefon:</strong> <a href="tel:${escapeHtml(CONTACT_PHONE_HREF)}">${escapeHtml(CONTACT_PHONE_DISPLAY)}</a><br><strong>E-Mail:</strong> <a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a></p>
			<p>Wir freuen uns auf Sie!</p>`)
        : "";

	return `<p>${customer ? (english ? `Hello ${escapeHtml(input.config.contactName)},` : `Hallo ${escapeHtml(input.config.contactName)},`) : "Hallo ALL IN AGI,"}</p>
	<p>${customer ? (english
		? deferred ? 'Thank you for your non-binding company inquiry. The preparation call is reserved; the hackathon date will be selected later. This does not yet create a contract.' : 'Thank you for your non-binding company inquiry. The preparation call and hackathon day are initially reserved; this does not yet create a contract.'
		: deferred ? 'vielen Dank für Ihre unverbindliche Firmenanfrage. Der Prep-Call ist reserviert; den Hackathon-Termin legen wir später fest. Ein Vertrag entsteht dadurch noch nicht.' : "vielen Dank für Ihre unverbindliche Firmenanfrage. Der Prep-Call und der Hackathontag sind zunächst reserviert; ein Vertrag entsteht dadurch noch nicht.") : "Es wurde eine neue unverbindliche Hackathon-Anfrage gestellt."}</p>
	<p>${options}</p>
	<p><a href="${detailUrl}">${english ? 'View inquiry' : 'Anfrage ansehen'}</a></p>
	${contact}
	<p><br><br></p>`;
}

async function prepareBookingConfirmation(
    input: BookingConfirmationInput,
    dependencies: BookingConfirmationDependencies,
    role: BookingConfirmationRecipientRole,
): Promise<PreparedBookingConfirmation> {
    let pdf: Uint8Array;
    let calendar: string;
    try {
        pdf = await (dependencies.createPdf ?? createPlanPdf)(input.config, {
            booking: input.booking,
            hackathonId: input.id,
        });
        calendar = (dependencies.createCalendar ?? createPrepCallIcs)(
            input.config,
            input.booking,
			bookingDetailUrl(input.id, input.config.locale ?? 'de'),
        );
    } catch (cause) {
        throw new BookingConfirmationEmailError(
            "Die Anhänge der Buchungsbestätigung konnten nicht erstellt werden.",
            {
                stage: "attachments",
                providerCode: "attachment_generation_failed",
                cause,
            },
        );
    }

    try {
        return {
            subject:
				role === "customer"
					? (input.config.locale === 'en' ? `Your hackathon inquiry ${input.id}` : `Eingang Ihrer Hackathon-Anfrage ${input.id}`)
					: `Neue Hackathon-Anfrage ${input.id}`,
            text: buildBookingConfirmationText(input, role),
            html: buildBookingConfirmationHtml(input, role),
            headers: { "X-Booking-ID": input.id },
            attachments: [
                {
                    content: bytesToBase64(new TextEncoder().encode(calendar)),
					filename: input.config.locale === 'en' ? 'Preparation-call.ics' : "Vorbereitungsgespräch.ics",
                    type: "text/calendar; charset=utf-8",
                    disposition: "attachment",
                },
                {
                    content: bytesToBase64(pdf),
                    filename: "Hackathon.pdf",
                    type: "application/pdf",
                    disposition: "attachment",
                },
            ],
        };
    } catch (cause) {
        throw new BookingConfirmationEmailError(
            "Die Buchungsbestätigung konnte nicht serialisiert werden.",
            {
                stage: "serialization",
                providerCode: "attachment_encoding_failed",
                cause,
            },
        );
    }
}

async function sendPreparedBookingConfirmation(
    role: BookingConfirmationRecipientRole,
    recipient: { address: string; name: string },
    prepared: PreparedBookingConfirmation,
    accountId: string,
    apiToken: string,
    dependencies: BookingConfirmationDependencies,
): Promise<BookingConfirmationAttempt> {
    try {
        const result = await sendEmailMessage({
            to: recipient,
            ...prepared,
        }, {
            fetch: dependencies.fetch,
            accountId,
            apiToken,
            maxMessageBytes: dependencies.maxMessageBytes
        });
        return { role, sent: true, messageId: result.messageId, status: result.status };
    } catch (error) {
        if (!(error instanceof EmailTransportError)) throw error;
        throw new BookingConfirmationEmailError(
            error.message,
            {
                stage: error.stage,
                status: error.details.status,
                providerCode: error.details.providerCode,
                messageId: error.details.messageId,
                cause: error.details.cause
            },
        );
    }
}

export async function sendCustomerBookingConfirmationEmail(
    input: BookingConfirmationInput,
    dependencies: BookingConfirmationDependencies = {},
): Promise<BookingConfirmationAttempt> {
    const accountId = dependencies.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = dependencies.apiToken ?? process.env.CLOUDFLARE_EMAIL_API_TOKEN;
    if (!accountId || !apiToken) {
        return failedAttempt(
            "customer",
            new BookingConfirmationEmailError(
                "Cloudflare Email Service ist nicht vollständig konfiguriert.",
                {
                    stage: "configuration",
                    providerCode: "configuration_missing",
                },
            ),
        );
    }

    try {
        const prepared = await prepareBookingConfirmation(input, dependencies, "customer");
        return await sendPreparedBookingConfirmation(
            "customer",
            { address: input.config.email, name: input.config.contactName },
            prepared,
            accountId,
            apiToken,
            dependencies,
        );
    } catch (error) {
        return failedAttempt("customer", normalizeConfirmationError(error));
    }
}

export async function sendBookingConfirmationEmails(
    input: BookingConfirmationInput,
    dependencies: BookingConfirmationDependencies = {},
): Promise<BookingConfirmationReport> {
    const accountId = dependencies.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = dependencies.apiToken ?? process.env.CLOUDFLARE_EMAIL_API_TOKEN;
    if (!accountId || !apiToken) {
        return failedReport(
            new BookingConfirmationEmailError(
                "Cloudflare Email Service ist nicht vollständig konfiguriert.",
                {
                    stage: "configuration",
                    providerCode: "configuration_missing",
                },
            ),
        );
    }

    let customerPrepared: PreparedBookingConfirmation;
    let organizerPrepared: PreparedBookingConfirmation;
    try {
        customerPrepared = await prepareBookingConfirmation(input, dependencies, "customer");
        organizerPrepared = {
            ...customerPrepared,
			subject: `Neue Hackathon-Anfrage ${input.id}`,
            text: buildBookingConfirmationText(input, "organizer"),
            html: buildBookingConfirmationHtml(input, "organizer"),
        };
    } catch (error) {
        if (error instanceof BookingConfirmationEmailError) return failedReport(error);
        return failedReport(
            new BookingConfirmationEmailError(
                "Die Buchungsbestätigung konnte nicht vorbereitet werden.",
                {
                    stage: "attachments",
                    providerCode: "preparation_failed",
                    cause: error,
                },
            ),
        );
    }

    const attempts = await Promise.allSettled([
        sendPreparedBookingConfirmation(
            "customer",
            { address: input.config.email, name: input.config.contactName },
            customerPrepared,
            accountId,
            apiToken,
            dependencies,
        ),
        sendPreparedBookingConfirmation(
            "organizer",
            { address: CONTACT_EMAIL, name: "ALL IN AGI" },
            organizerPrepared,
            accountId,
            apiToken,
            dependencies,
        ),
    ]);

    const resolveAttempt = (
        role: BookingConfirmationRecipientRole,
        result: PromiseSettledResult<BookingConfirmationAttempt>,
    ): BookingConfirmationAttempt => {
        if (result.status === "fulfilled") return result.value;
        return failedAttempt(role, normalizeConfirmationError(result.reason));
    };

    return {
        customer: resolveAttempt("customer", attempts[0]),
        organizer: resolveAttempt("organizer", attempts[1]),
    };
}
