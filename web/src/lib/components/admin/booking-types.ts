import type { BillingDetails } from '$lib/booking';

export type BookingTableRow = {
	id: string;
	companyName: string;
	contactName: string;
	contactEmail: string;
	status: string;
	eventStart: string | null;
	eventEnd: string | null;
	capacity: number;
	totalPrice: number;
	createdAt: string;
	cancellationEmailSentAt: string | null;
	billing?: BillingDetails | null;
};

export type UserTableRow = {
	id: string;
	name: string;
	email: string;
	hasPasskey: boolean;
	createdAt: string | Date;
};
