import {
	createDownPaymentInvoiceSnapshot,
	createFinalInvoiceSnapshot,
	createInvoiceSnapshot,
	type InvoiceLegalConfiguration,
	type InvoiceSnapshot
} from '$lib/invoice';
import { getInvoiceLegalConfiguration } from './invoice-config';
import {
	freezeInvoiceSnapshot,
	freezeDownPaymentInvoiceSnapshot,
	getCustomerHackathonRecord,
	type HackathonRecord
} from './hackathons';

export class InvoiceNotFoundError extends Error {
	constructor() {
		super('Hackathon nicht gefunden.');
		this.name = 'InvoiceNotFoundError';
	}
}

export class InvoiceNotIssuableError extends Error {
	constructor() {
		super('Für diese Buchung kann keine Rechnung ausgestellt werden.');
		this.name = 'InvoiceNotIssuableError';
	}
}

export interface InvoicePersistenceDependencies {
	getRecord?: (id: string) => Promise<HackathonRecord | null>;
	freeze?: (id: string, snapshot: InvoiceSnapshot, issuedAt: string) => Promise<HackathonRecord | null>;
	freezeDownPayment?: (id: string, snapshot: InvoiceSnapshot, issuedAt: string) => Promise<HackathonRecord | null>;
	getConfiguration?: () => InvoiceLegalConfiguration;
	now?: () => Date;
}

export interface IssuedInvoice {
	record: HackathonRecord;
	snapshot: InvoiceSnapshot;
}

export async function getOrCreateInvoice(
	id: string,
	dependencies: InvoicePersistenceDependencies = {}
): Promise<IssuedInvoice> {
	const getRecord = dependencies.getRecord ?? getCustomerHackathonRecord;
	const current = await getRecord(id);
	if (!current) throw new InvoiceNotFoundError();
	if (current.invoiceSnapshot) return { record: current, snapshot: current.invoiceSnapshot };
	if (current.status !== 'confirmed') throw new InvoiceNotIssuableError();

	const now = dependencies.now?.() ?? new Date();
	const legal = (dependencies.getConfiguration ?? getInvoiceLegalConfiguration)();
	let snapshot: InvoiceSnapshot;
	if (current.billingModel === 'deposit_30') {
		if (!current.downPaymentInvoiceSnapshot || !current.downPaymentPaidAt || now < new Date(current.eventEnd)) {
			throw new InvoiceNotIssuableError();
		}
		if (current.downPaymentInvoiceSnapshot.version !== 2 || current.downPaymentInvoiceSnapshot.kind !== 'down-payment') {
			throw new InvoiceNotIssuableError();
		}
		snapshot = createFinalInvoiceSnapshot(current, legal, current.downPaymentInvoiceSnapshot, now);
	} else {
		snapshot = createInvoiceSnapshot(current, legal, now);
	}
	const frozen = await (dependencies.freeze ?? freezeInvoiceSnapshot)(id, snapshot, now.toISOString());
	if (frozen?.invoiceSnapshot) return { record: frozen, snapshot: frozen.invoiceSnapshot };

	const concurrent = await getRecord(id);
	if (!concurrent) throw new InvoiceNotFoundError();
	if (concurrent.invoiceSnapshot) return { record: concurrent, snapshot: concurrent.invoiceSnapshot };
	throw new InvoiceNotIssuableError();
}

export async function getOrCreateDownPaymentInvoice(
	id: string,
	dependencies: InvoicePersistenceDependencies = {}
): Promise<IssuedInvoice> {
	const getRecord = dependencies.getRecord ?? getCustomerHackathonRecord;
	const current = await getRecord(id);
	if (!current) throw new InvoiceNotFoundError();
	if (current.downPaymentInvoiceSnapshot) return { record: current, snapshot: current.downPaymentInvoiceSnapshot };
	if (current.status !== 'confirmed' || current.billingModel !== 'deposit_30' || current.invoiceSnapshot) {
		throw new InvoiceNotIssuableError();
	}
	const now = dependencies.now?.() ?? new Date();
	const snapshot = createDownPaymentInvoiceSnapshot(
		current,
		(dependencies.getConfiguration ?? getInvoiceLegalConfiguration)(),
		now
	);
	const frozen = await (dependencies.freezeDownPayment ?? freezeDownPaymentInvoiceSnapshot)(id, snapshot, now.toISOString());
	if (frozen?.downPaymentInvoiceSnapshot) return { record: frozen, snapshot: frozen.downPaymentInvoiceSnapshot };
	const concurrent = await getRecord(id);
	if (!concurrent) throw new InvoiceNotFoundError();
	if (concurrent.downPaymentInvoiceSnapshot) return { record: concurrent, snapshot: concurrent.downPaymentInvoiceSnapshot };
	throw new InvoiceNotIssuableError();
}

export async function getExistingInvoice(
	id: string,
	dependencies: Pick<InvoicePersistenceDependencies, 'getRecord'> = {}
) {
	const record = await (dependencies.getRecord ?? getCustomerHackathonRecord)(id);
	if (!record) throw new InvoiceNotFoundError();
	if (!record.invoiceSnapshot) throw new InvoiceNotIssuableError();
	return { record, snapshot: record.invoiceSnapshot };
}
