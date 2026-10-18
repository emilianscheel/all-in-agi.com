import { describe, expect, test } from "bun:test";
import { PDFDocument } from "pdf-lib";
import type { BookingConfiguration } from "$lib/booking";
import {
    bookingDetailUrl,
    buildBookingConfirmationHtml,
    buildBookingConfirmationText,
    sendCustomerBookingConfirmationEmail,
    sendBookingConfirmationEmails,
} from "./booking-confirmation-email";

const config: BookingConfiguration = {
    capacity: 15,
    venueProvided: true,
    equipment: "projector",
    lunch: "pizza",
    customLunch: "",
    toolProvision: "existing",
    codingTools: ["codex"],
    customCodingTool: "",
	deviceProvision: "existing",
	deviceCount: 0,
	eventPhotos: true,
    companyName: "Musterwerke GmbH",
    contactName: "Ada Beispiel",
    email: "ada@example.com",
    phone: "+49 30 123456",
    message: "",
    address: {
        label: "Musterstraße 1, 10115 Berlin",
        street: "Musterstraße 1",
        postalCode: "10115",
        city: "Berlin",
        country: "Deutschland",
    },
    eventStart: "2099-06-20T07:00:00.000Z",
    eventEnd: "2099-06-20T15:00:00.000Z",
    consultationSlot: "2099-05-10T10:00:00.000Z",
};

const input = {
    id: "HAA-AAA-AAA",
    config,
    booking: {
        start: "2099-05-10T10:00:00.000Z",
        end: "2099-05-10T10:30:00.000Z",
        uid: "booking-1",
        icsUid: "booking-1@all-in-agi.com",
        title: "ALL IN AGI Preparation Call",
        meetingUrl: "https://meet.example.com/booking-1",
    },
};

describe("booking confirmation email", () => {
    test("builds recipient-specific plain-text confirmation structures", () => {
        const text = buildBookingConfirmationText(input);
        expect(text.split("\n").slice(0, 3)).toEqual([
            "Hallo Ada Beispiel,",
            "",
			"vielen Dank für Ihre unverbindliche Anfrage. Der Preparation Call und der Hackathontag sind zunächst reserviert; ein Vertrag entsteht dadurch noch nicht.",
        ]);
        expect(text).toContain("- Coding Tools: Bereits vorhanden: Codex");
        expect(text).not.toContain("Inklusive");
        expect(text).toContain("- Gesamt: Gesamt — 4.000 € netto");
		expect(text).toContain("Anfrage ansehen: https://all-in-agi.com/de/HAA-AAA-AAA");
        expect(text).toContain("Telefon: 0152 57257750 (tel:+4915257257750)");
        expect(text).toContain("E-Mail: go@all-in-agi.com (mailto:go@all-in-agi.com)");
        expect(text).toContain("Wir freuen uns auf Sie!");
        expect(text.endsWith("\n\n\n")).toBe(true);

        const organizer = buildBookingConfirmationText(input, "organizer");
		expect(organizer).toStartWith("Es wurde eine neue unverbindliche Hackathon-Anfrage gestellt.");
		expect(organizer).not.toContain("Hallo ALL IN AGI,");
		expect(organizer).toContain("Anfrage ansehen: https://all-in-agi.com/de/HAA-AAA-AAA");
        expect(organizer).not.toContain("Bei Fragen oder Änderungswünschen");
        expect(organizer).not.toContain("Wir freuen uns auf Sie!");
		expect(bookingDetailUrl(input.id)).toBe("https://all-in-agi.com/de/HAA-AAA-AAA");
    });

    test("builds escaped rich-text booking details and customer contact links", () => {
        const html = buildBookingConfirmationHtml({
            ...input,
            config: {
                ...config,
                contactName: "Ada <Admin> & Co.",
                lunch: "custom",
                customLunch: "Bowls <vegan> & Salat",
            },
        });
        expect(html).toContain("Hallo Ada &lt;Admin&gt; &amp; Co.,");
        expect(html).toContain("vielen Dank für Ihre unverbindliche Anfrage.");
        expect(html).toContain("<strong>Team:</strong> Bis 15 Personen");
        expect(html).toContain("<strong>Lunch:</strong> Bowls &lt;vegan&gt; &amp; Salat");
        expect(html).not.toContain("Inklusive");
        expect(html).toContain(
			'<a href="https://all-in-agi.com/de/HAA-AAA-AAA">Anfrage ansehen</a>',
        );
        expect(html).toContain('<a href="tel:+4915257257750">0152 57257750</a>');
        expect(html).toContain('<a href="mailto:go@all-in-agi.com">go@all-in-agi.com</a>');
        expect(html).not.toMatch(/<!doctype|<html|<body|<table|style=/i);
        expect(html).not.toContain("Ada <Admin>");

        const organizerHtml = buildBookingConfirmationHtml(input, "organizer");
        expect(organizerHtml).toContain("<p>Es wurde eine neue unverbindliche Hackathon-Anfrage gestellt.</p>");
        expect(organizerHtml).not.toContain("Hallo ALL IN AGI,");
    });

    test("sends customer and organizer copies with the same generated attachments", async () => {
        const submissions: any[] = [];
        const result = await sendBookingConfirmationEmails(input, {
            username: "owner@icloud.com",
            password: "test-password",
            sendMail: async (options) => {
                submissions.push(options);
                const address = (options.to as { address: string }).address;
                return { accepted: [address], messageId: `message-${address}` };
            },
        });

        expect(result.customer).toMatchObject({ role: "customer", sent: true, status: "accepted" });
        expect(result.organizer).toMatchObject({ role: "organizer", sent: true, status: "accepted" });
        expect(submissions).toHaveLength(2);
        const customer = submissions.find((mail) => mail.to.address === config.email);
        const organizer = submissions.find((mail) => mail.to.address === "go@all-in-agi.com");
        expect(customer).toMatchObject({
            from: { address: "go@all-in-agi.com", name: "ALL IN AGI" },
            replyTo: { address: "go@all-in-agi.com", name: "ALL IN AGI" },
            to: { address: "ada@example.com", name: "Ada Beispiel" },
            subject: "Eingang Ihrer Hackathon-Anfrage HAA-AAA-AAA",
            headers: { "X-Booking-ID": "HAA-AAA-AAA" },
        });
        expect(organizer.subject).toBe("Neue Hackathon-Anfrage HAA-AAA-AAA");
        expect(organizer.text).not.toBe(customer.text);
        expect(organizer.html).not.toBe(customer.html);
        expect(organizer.attachments).toEqual(customer.attachments);
        expect(customer.attachments.map((attachment: any) => ({ filename: attachment.filename, contentType: attachment.contentType }))).toEqual([
            { filename: "Vorbereitungsgespräch.ics", contentType: "text/calendar; charset=utf-8" },
            { filename: "Hackathon.pdf", contentType: "application/pdf" },
        ]);
        const calendar = customer.attachments[0].content.toString("utf8");
        expect(calendar).toContain("LOCATION:https://meet.example.com/booking-1");
        expect(calendar).toContain("UID:booking-1@all-in-agi.com");
        expect(calendar).toContain("URL:https://all-in-agi.com/de/HAA-AAA-AAA");
        expect((await PDFDocument.load(customer.attachments[1].content)).getPageCount()).toBe(1);
    });

    test("resends a confirmation only to the customer", async () => {
        const recipients: string[] = [];
        const result = await sendCustomerBookingConfirmationEmail(input, {
            username: "owner@icloud.com",
            password: "test-password",
            sendMail: async (options) => {
                const address = (options.to as { address: string }).address;
                recipients.push(address);
                return { accepted: [address] };
            },
        });
        expect(result).toMatchObject({ role: "customer", sent: true, status: "accepted" });
        expect(recipients).toEqual(["ada@example.com"]);
    });

    test("reports missing SMTP credentials without sending", async () => {
        let called = false;
        const result = await sendBookingConfirmationEmails(input, {
            username: "",
            password: "",
            sendMail: async () => { called = true; return { accepted: [] }; },
        });
        expect(called).toBe(false);
        expect(result.customer).toMatchObject({ sent: false, error: { stage: "configuration", providerCode: "configuration_missing" } });
        expect(result.organizer).toMatchObject({ sent: false, error: { stage: "configuration" } });
    });

    test("reports attachment preparation failures with the original cause", async () => {
        let called = false;
        const result = await sendBookingConfirmationEmails(input, {
            username: "owner@icloud.com",
            password: "test-password",
            createPdf: async () => { throw new Error("font asset missing"); },
            sendMail: async () => { called = true; return { accepted: [] }; },
        });
        expect(called).toBe(false);
        expect(result.customer).toMatchObject({ sent: false, error: {
            stage: "attachments", providerCode: "attachment_generation_failed",
            causeName: "Error", causeMessage: "font asset missing",
        } });
        expect(result.organizer).toMatchObject({ sent: false, error: { stage: "attachments" } });
    });

    test("keeps recipient attempts independent", async () => {
        const result = await sendBookingConfirmationEmails(input, {
            username: "owner@icloud.com",
            password: "test-password",
            sendMail: async (options) => {
                const address = (options.to as { address: string }).address;
                if (address === "go@all-in-agi.com") {
                    throw Object.assign(new Error("recipient rejected"), { code: "EENVELOPE", responseCode: 550 });
                }
                return { accepted: [address], messageId: "customer-id" };
            },
        });
        expect(result.customer).toMatchObject({ sent: true, status: "accepted", messageId: "customer-id" });
        expect(result.organizer).toMatchObject({ sent: false, error: { stage: "provider", status: 550, providerCode: "EENVELOPE" } });
    });

    test("reports oversized messages and network failures by stage", async () => {
        const oversized = await sendBookingConfirmationEmails(input, {
            username: "owner@icloud.com", password: "test-password", maxMessageBytes: 1,
            sendMail: async () => { throw new Error("should not send"); },
        });
        expect(oversized.customer).toMatchObject({ sent: false, error: { stage: "serialization", providerCode: "message_too_big" } });
        expect(oversized.organizer).toMatchObject({ sent: false, error: { stage: "serialization" } });

        const network = await sendBookingConfirmationEmails(input, {
            username: "owner@icloud.com", password: "test-password",
            sendMail: async () => { throw Object.assign(new Error("connection lost"), { code: "ECONNECTION" }); },
        });
        expect(network.customer).toMatchObject({ sent: false, error: { stage: "network", providerCode: "ECONNECTION", causeMessage: "connection lost" } });
        expect(network.organizer).toMatchObject({ sent: false, error: { stage: "network" } });
    });
});
