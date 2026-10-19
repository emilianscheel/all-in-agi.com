import {
	createDownPaymentInvoiceSnapshot,
	createFinalInvoiceSnapshot,
	createInvoiceSnapshot,
	type InvoiceLegalConfiguration,
	type InvoiceSnapshot
} from '$lib/invoice';
import { validateBillingDetails } from '$lib/booking';
import { getInvoiceLegalConfiguration } from './invoice-config';
import {
	freezeInvoiceSnapshot,
	freezeDownPaymentInvoiceSnapshot,
	getCustomerHackathonRecord,
	type HackathonRecord
} from './hackathons';
import { finalizeDueContracts } from './legal-contracts';
import { allocateInvoiceNumber } from './invoice-numbers';

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
	allocateNumber?: typeof allocateInvoiceNumber;
}

export interface IssuedInvoice {
	record: HackathonRecord;
	snapshot: InvoiceSnapshot;
}

async function invoiceNumber(
	kind: 'invoice' | 'down-payment' | 'final',
	record: HackathonRecord,
	now: Date,
	dependencies: InvoicePersistenceDependencies
) {
	if (dependencies.allocateNumber) return dependencies.allocateNumber(kind, now);
	if (!dependencies.getRecord) return allocateInvoiceNumber(kind, now);
	return kind === 'down-payment' ? `RE-${record.id}-AZ` : kind === 'final' ? `RE-${record.id}-ER` : `RE-${record.id}`;
}

export async function getOrCreateInvoice(
	id: string,
	dependencies: InvoicePersistenceDependencies = {}
): Promise<IssuedInvoice> {
	const getRecord = dependencies.getRecord ?? getCustomerHackathonRecord;
	if (!dependencies.getRecord) await finalizeDueContracts();
	const current = await getRecord(id);
	if (!current) throw new InvoiceNotFoundError();
	if (current.invoiceSnapshot) return { record: current, snapshot: current.invoiceSnapshot };
	if (!['contracted', 'confirmed', 'completed'].includes(current.status)) throw new InvoiceNotIssuableError();
	if (current.billingModel === 'deposit_30' && validateBillingDetails(current.billing).length) throw new InvoiceNotIssuableError();

	const now = dependencies.now?.() ?? new Date();
	const legal = (dependencies.getConfiguration ?? getInvoiceLegalConfiguration)();
	let snapshot: InvoiceSnapshot;
	if (current.billingModel === 'deposit_30') {
		if (!current.eventStart || !current.eventEnd || !current.downPaymentInvoiceSnapshot || !current.downPaymentPaidAt || now < new Date(current.eventEnd)) {
			throw new InvoiceNotIssuableError();
		}
		if (current.downPaymentInvoiceSnapshot.version === 1 || current.downPaymentInvoiceSnapshot.kind !== 'down-payment') {
			throw new InvoiceNotIssuableError();
		}
		snapshot = createFinalInvoiceSnapshot({ ...current, locale: current.customerLocale }, legal, current.downPaymentInvoiceSnapshot, now, await invoiceNumber('final', current, now, dependencies));
	} else {
		snapshot = createInvoiceSnapshot({ ...current, locale: current.customerLocale }, legal, now, await invoiceNumber('invoice', current, now, dependencies));
	}
	const frozen = await (dependencies.freeze ?? freezeInvoiceSnapshot)(id, snapshot, now.toISOString());
	if (frozen?.invoiceSnapshot) return { record: frozen, snapshot: frozen.invoiceSnapshot };

	const concurrent = await getRecord(id);
	if (!concurrent) throw new InvoiceNotFoundError();
	if (concurrent.invoiceSnapshot) return { record: concurrent, snapshot: concurrent.invoiceSnapshot };
	throw new InvoiceNotIssuableError();
}

function canIssueDownPayment(record: HackathonRecord) {
	return record.billingModel === 'deposit_30' && ['contracted', 'confirmed', 'completed'].includes(record.status);
}

export async function getOrCreateDownPaymentInvoice(
	id: string,
	dependencies: InvoicePersistenceDependencies = {}
): Promise<IssuedInvoice> {
	const getRecord = dependencies.getRecord ?? getCustomerHackathonRecord;
	if (!dependencies.getRecord) await finalizeDueContracts();
	const current = await getRecord(id);
	if (!current) throw new InvoiceNotFoundError();
	if (current.downPaymentInvoiceSnapshot) return { record: current, snapshot: current.downPaymentInvoiceSnapshot };
	if (!canIssueDownPayment(current)) throw new InvoiceNotIssuableError();
	if (validateBillingDetails(current.billing).length) throw new InvoiceNotIssuableError();
	const now = dependencies.now?.() ?? new Date();
	const snapshot = createDownPaymentInvoiceSnapshot(
		{ ...current, locale: current.customerLocale },
		(dependencies.getConfiguration ?? getInvoiceLegalConfiguration)(),
		now,
		await invoiceNumber('down-payment', current, now, dependencies)
	);
	const frozen = await (dependencies.freezeDownPayment ?? freezeDownPaymentInvoiceSnapshot)(id, snapshot, now.toISOString());
	if (frozen?.downPaymentInvoiceSnapshot) return { record: frozen, snapshot: frozen.downPaymentInvoiceSnapshot };
	const concurrent = await getRecord(id);
	if (!concurrent) throw new InvoiceNotFoundError();
	if (concurrent.downPaymentInvoiceSnapshot) return { record: concurrent, snapshot: concurrent.downPaymentInvoiceSnapshot };
	throw new InvoiceNotIssuableError();
}

export async function previewInvoice(
	id: string,
	dependencies: InvoicePersistenceDependencies = {}
): Promise<IssuedInvoice> {
	const getRecord = dependencies.getRecord ?? getCustomerHackathonRecord;
	if (!dependencies.getRecord) await finalizeDueContracts();
	const current = await getRecord(id);
	if (!current) throw new InvoiceNotFoundError();
	if (current.invoiceSnapshot) return { record: current, snapshot: current.invoiceSnapshot };
	if (!['contracted', 'confirmed', 'completed'].includes(current.status)) throw new InvoiceNotIssuableError();
	if (current.billingModel === 'deposit_30' && validateBillingDetails(current.billing).length) throw new InvoiceNotIssuableError();

	const now = dependencies.now?.() ?? new Date();
	const legal = (dependencies.getConfiguration ?? getInvoiceLegalConfiguration)();
	if (current.billingModel === 'deposit_30') {
		if (!current.eventStart || !current.eventEnd || !current.downPaymentInvoiceSnapshot || !current.downPaymentPaidAt || now < new Date(current.eventEnd)) {
			throw new InvoiceNotIssuableError();
		}
		if (current.downPaymentInvoiceSnapshot.version === 1 || current.downPaymentInvoiceSnapshot.kind !== 'down-payment') {
			throw new InvoiceNotIssuableError();
		}
		return {
			record: current,
			snapshot: createFinalInvoiceSnapshot({ ...current, locale: current.customerLocale }, legal, current.downPaymentInvoiceSnapshot, now, `RE-${current.id}-ER`)
		};
	}
	return {
		record: current,
		snapshot: createInvoiceSnapshot({ ...current, locale: current.customerLocale }, legal, now, `RE-${current.id}`)
	};
}

export async function previewDownPaymentInvoice(
	id: string,
	dependencies: InvoicePersistenceDependencies = {}
): Promise<IssuedInvoice> {
	const getRecord = dependencies.getRecord ?? getCustomerHackathonRecord;
	if (!dependencies.getRecord) await finalizeDueContracts();
	const current = await getRecord(id);
	if (!current) throw new InvoiceNotFoundError();
	if (current.downPaymentInvoiceSnapshot) return { record: current, snapshot: current.downPaymentInvoiceSnapshot };
	if (!canIssueDownPayment(current)) throw new InvoiceNotIssuableError();
	if (validateBillingDetails(current.billing).length) throw new InvoiceNotIssuableError();
	const now = dependencies.now?.() ?? new Date();
	return {
		record: current,
		snapshot: createDownPaymentInvoiceSnapshot(
			{ ...current, locale: current.customerLocale },
			(dependencies.getConfiguration ?? getInvoiceLegalConfiguration)(),
			now,
			`RE-${current.id}-AZ`
		)
	};
}

const draftStatuses = ['prep_scheduled', 'exit_window', 'contracted', 'confirmed', 'completed'];

export async function previewInvoiceDraft(
	id: string,
	dependencies: InvoicePersistenceDependencies = {},
	locale?: 'de' | 'en'
): Promise<IssuedInvoice> {
	const getRecord = dependencies.getRecord ?? getCustomerHackathonRecord;
	if (!dependencies.getRecord) await finalizeDueContracts();
	const current = await getRecord(id);
	if (!current) throw new InvoiceNotFoundError();
	if (current.invoiceSnapshot) return { record: current, snapshot: current.invoiceSnapshot };
	if (!draftStatuses.includes(current.status) || !current.eventStart) throw new InvoiceNotIssuableError();
	const now = dependencies.now?.() ?? new Date();
	return {
		record: current,
		snapshot: createInvoiceSnapshot(
			{ ...current, locale: locale ?? current.customerLocale },
			(dependencies.getConfiguration ?? getInvoiceLegalConfiguration)(),
			now,
			`RE-${current.id}`
		)
	};
}

export async function previewDownPaymentInvoiceDraft(
	id: string,
	dependencies: InvoicePersistenceDependencies = {},
	locale?: 'de' | 'en'
): Promise<IssuedInvoice> {
	const getRecord = dependencies.getRecord ?? getCustomerHackathonRecord;
	if (!dependencies.getRecord) await finalizeDueContracts();
	const current = await getRecord(id);
	if (!current) throw new InvoiceNotFoundError();
	if (current.downPaymentInvoiceSnapshot) return { record: current, snapshot: current.downPaymentInvoiceSnapshot };
	if (current.billingModel !== 'deposit_30' || !draftStatuses.includes(current.status)) throw new InvoiceNotIssuableError();
	const now = dependencies.now?.() ?? new Date();
	return {
		record: current,
		snapshot: createDownPaymentInvoiceSnapshot(
			{ ...current, locale: locale ?? current.customerLocale },
			(dependencies.getConfiguration ?? getInvoiceLegalConfiguration)(),
			now,
			`RE-${current.id}-AZ`
		)
	};
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
