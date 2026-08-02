import { desc, inArray, sql } from 'drizzle-orm';
import { getDb } from './db';
import { hackathons, type hackathonStatus } from './db/schema';
import { finalizeDueContracts } from './legal-contracts';

export type CustomerBookingStatus = Exclude<(typeof hackathonStatus.enumValues)[number], 'pending'>;
export type AdminBooking = typeof hackathons.$inferSelect;

const CUSTOMER_STATUSES: CustomerBookingStatus[] = ['requested', 'prep_scheduled', 'exit_window', 'contracted', 'withdrawn', 'declined', 'confirmed', 'cancellation_pending', 'cancelled', 'completed'];

export async function listCustomerBookings() {
	const db = await getDb();
	return db.select().from(hackathons)
		.where(inArray(hackathons.status, CUSTOMER_STATUSES))
		.orderBy(desc(hackathons.createdAt));
}

export async function getDashboardSummary() {
	const db = await getDb();
	const [summary] = await db.select({
		bookingCount: sql<number>`count(*)::int`,
		totalRevenue: sql<number>`coalesce(sum(${hackathons.totalPrice}), 0)::int`
	}).from(hackathons).where(inArray(hackathons.status, ['contracted', 'confirmed', 'completed']));
	return summary ?? { bookingCount: 0, totalRevenue: 0 };
}

export async function getDashboardBookings() {
	await finalizeDueContracts();
	const [bookings, summary] = await Promise.all([listCustomerBookings(), getDashboardSummary()]);
	return { bookings, summary };
}

function neutralizeSpreadsheetFormula(value: string) {
	return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: unknown, customerControlled = false) {
	const raw = value == null ? '' : String(value);
	const safe = customerControlled ? neutralizeSpreadsheetFormula(raw) : raw;
	return `"${safe.replace(/"/g, '""')}"`;
}

export function bookingsCsv(bookings: AdminBooking[]) {
	const headers = [
		'ID', 'Status', 'Unternehmen', 'Kontakt', 'E-Mail', 'Telefon', 'Nachricht',
		'Rechnungsfirma', 'Rechnungs-Rechtsform', 'Rechnungskontakt', 'Rechnungs-E-Mail', 'Rechnungsstraße', 'Rechnungs-PLZ', 'Rechnungsort', 'USt-IdNr.', 'Bestellnummer',
		'Event Start', 'Event Ende', 'Prep Call', 'Kapazität', 'Location gestellt',
		'Equipment', 'Lunch', 'Custom Lunch', 'Tool-Bereitstellung', 'Coding Tools',
		'Custom Coding Tool', 'Geräte-Bereitstellung', 'Geräteanzahl', 'Eventfotos', 'Straße', 'PLZ', 'Stadt', 'Land', 'Basispreis',
		'Location-Aufpreis', 'Lunch-Anpassung', 'Tools-Anpassung', 'Geräte-Anpassung', 'Gesamtpreis netto',
		'AGB-Version', 'AGB-SHA-256', 'AGB-Module', 'Mündliche Zustimmung am', 'Lösungsfrist', 'Vertraglich am',
		'Erstellt am', 'Aktualisiert am', 'Storniert am', 'Stornierungs-E-Mail gesendet am'
	];
	const rows = bookings.map((booking) => [
		csvCell(booking.id),
		csvCell(booking.status),
		csvCell(booking.companyName, true),
		csvCell(booking.contactName, true),
		csvCell(booking.contactEmail, true),
		csvCell(booking.contactPhone, true),
		csvCell(booking.message, true),
		csvCell(booking.billing?.companyName, true),
		csvCell(booking.billing?.legalForm, true),
		csvCell(booking.billing?.contactName, true),
		csvCell(booking.billing?.email, true),
		csvCell(booking.billing?.address.street, true),
		csvCell(booking.billing?.address.postalCode, true),
		csvCell(booking.billing?.address.city, true),
		csvCell(booking.billing?.vatId, true),
		csvCell(booking.billing?.purchaseOrder, true),
		csvCell(booking.eventStart),
		csvCell(booking.eventEnd),
		csvCell(booking.consultationSlot),
		csvCell(booking.capacity),
		csvCell(booking.venueProvided ? 'Ja' : 'Nein'),
		csvCell(booking.equipment),
		csvCell(booking.lunch),
		csvCell(booking.customLunch, true),
		csvCell(booking.toolProvision),
		csvCell(booking.codingTools.join(', '), true),
		csvCell(booking.customCodingTool, true),
		csvCell(booking.deviceProvision),
		csvCell(booking.deviceCount),
		csvCell(booking.eventPhotos ? 'Ja' : 'Nein'),
		csvCell(booking.address.street, true),
		csvCell(booking.address.postalCode, true),
		csvCell(booking.address.city, true),
		csvCell(booking.address.country, true),
		csvCell(booking.basePrice),
		csvCell(booking.venueSurcharge),
		csvCell(booking.lunchAdjustment),
		csvCell(booking.toolsAdjustment),
		csvCell(booking.devicesAdjustment),
		csvCell(booking.totalPrice),
		csvCell(booking.legalVersion),
		csvCell(booking.legalContentHash),
		csvCell(booking.legalModules?.join(', ')),
		csvCell(booking.oralAgreementAt),
		csvCell(booking.exitDeadline),
		csvCell(booking.contractedAt),
		csvCell(booking.createdAt),
		csvCell(booking.updatedAt),
		csvCell(booking.cancelledAt),
		csvCell(booking.cancellationEmailSentAt)
	].join(','));
	return `\uFEFF${headers.map((header) => csvCell(header)).join(',')}\r\n${rows.join('\r\n')}\r\n`;
}
