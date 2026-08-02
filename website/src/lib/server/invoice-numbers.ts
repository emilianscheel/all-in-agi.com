import { sql } from 'drizzle-orm';
import { getDb } from './db';
import { invoiceSequences } from './db/schema';

export type InvoiceNumberKind = 'invoice' | 'down-payment' | 'final' | 'cancellation' | 'credit';

export async function allocateInvoiceNumber(kind: InvoiceNumberKind, issuedAt = new Date()) {
	const year = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Europe/Berlin' }).format(issuedAt));
	const sequenceKey = `${year}:${kind}`;
	const db = await getDb();
	const [row] = await db.insert(invoiceSequences).values({ sequenceKey, nextValue: 2, updatedAt: issuedAt.toISOString() })
		.onConflictDoUpdate({
			target: invoiceSequences.sequenceKey,
			set: { nextValue: sql`${invoiceSequences.nextValue} + 1`, updatedAt: issuedAt.toISOString() }
		})
		.returning({ nextValue: invoiceSequences.nextValue });
	if (!row) throw new Error('Rechnungsnummer konnte nicht vergeben werden.');
	const value = row.nextValue - 1;
	const suffix = kind === 'down-payment' ? 'AZ' : kind === 'final' ? 'ER' : kind === 'cancellation' ? 'ST' : kind === 'credit' ? 'GS' : 'RE';
	return `${suffix}-${year}-${String(value).padStart(6, '0')}`;
}

