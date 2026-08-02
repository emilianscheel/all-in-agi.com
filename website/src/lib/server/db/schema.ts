import { relations, sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { CodingTool, DeviceProvision, Equipment, EventAddress, Lunch, ToolProvision } from '$lib/booking';
import type { InvoiceSnapshot } from '$lib/invoice';

export type BillingModel = 'legacy_full' | 'deposit_30';

export const hackathonStatus = pgEnum('hackathon_status', ['pending', 'confirmed', 'cancellation_pending', 'cancelled']);

export const hackathons = pgTable('hackathons', {
	id: text('id').primaryKey(),
	status: hackathonStatus('status').notNull().default('pending'),
	companyName: text('company_name').notNull(),
	contactName: text('contact_name').notNull(),
	contactEmail: text('contact_email').notNull(),
	contactPhone: text('contact_phone').notNull(),
	message: text('message').notNull().default(''),
	capacity: integer('capacity').notNull(),
	venueProvided: boolean('venue_provided').notNull(),
	equipment: text('equipment').$type<Equipment>().notNull(),
	lunch: text('lunch').$type<Lunch>().notNull(),
	customLunch: text('custom_lunch').notNull().default(''),
	toolProvision: text('tool_provision').$type<ToolProvision>().notNull(),
	codingTools: jsonb('coding_tools').$type<CodingTool[]>().notNull(),
	customCodingTool: text('custom_coding_tool').notNull().default(''),
	deviceProvision: text('device_provision').$type<DeviceProvision>().notNull().default('existing'),
	deviceCount: integer('device_count').notNull().default(0),
	address: jsonb('address').$type<EventAddress>().notNull(),
	eventStart: timestamp('event_start', { withTimezone: true, mode: 'string' }).notNull(),
	eventEnd: timestamp('event_end', { withTimezone: true, mode: 'string' }).notNull(),
	consultationSlot: timestamp('consultation_slot', { withTimezone: true, mode: 'string' }).notNull(),
	basePrice: integer('base_price').notNull(),
	venueSurcharge: integer('venue_surcharge').notNull(),
	lunchAdjustment: integer('lunch_adjustment').notNull(),
	toolsAdjustment: integer('tools_adjustment').notNull(),
	devicesAdjustment: integer('devices_adjustment').notNull().default(0),
	totalPrice: integer('total_price').notNull(),
	billingModel: text('billing_model').$type<BillingModel>().notNull().default('legacy_full'),
	prepCallBookingUid: text('prep_call_booking_uid'),
	prepCallBookingIcsUid: text('prep_call_booking_ics_uid'),
	prepCallBookingTitle: text('prep_call_booking_title'),
	prepCallBookingStart: timestamp('prep_call_booking_start', { withTimezone: true, mode: 'string' }),
	prepCallBookingEnd: timestamp('prep_call_booking_end', { withTimezone: true, mode: 'string' }),
	prepCallMeetingUrl: text('prep_call_meeting_url'),
	hackathonBookingUid: text('hackathon_booking_uid'),
	hackathonBookingIcsUid: text('hackathon_booking_ics_uid'),
	hackathonBookingTitle: text('hackathon_booking_title'),
	hackathonBookingStart: timestamp('hackathon_booking_start', { withTimezone: true, mode: 'string' }),
	hackathonBookingEnd: timestamp('hackathon_booking_end', { withTimezone: true, mode: 'string' }),
	hackathonCancelledAt: timestamp('hackathon_cancelled_at', { withTimezone: true, mode: 'string' }),
	prepCallCancelledAt: timestamp('prep_call_cancelled_at', { withTimezone: true, mode: 'string' }),
	cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'string' }),
	cancellationEmailSentAt: timestamp('cancellation_email_sent_at', { withTimezone: true, mode: 'string' }),
	cancellationEmailMessageId: text('cancellation_email_message_id'),
	cancellationProcessingAt: timestamp('cancellation_processing_at', { withTimezone: true, mode: 'string' }),
	invoiceSnapshot: jsonb('invoice_snapshot').$type<InvoiceSnapshot>(),
	invoiceIssuedAt: timestamp('invoice_issued_at', { withTimezone: true, mode: 'string' }),
	invoiceEmailSentAt: timestamp('invoice_email_sent_at', { withTimezone: true, mode: 'string' }),
	invoiceEmailMessageId: text('invoice_email_message_id'),
	downPaymentInvoiceSnapshot: jsonb('down_payment_invoice_snapshot').$type<InvoiceSnapshot>(),
	downPaymentInvoiceIssuedAt: timestamp('down_payment_invoice_issued_at', { withTimezone: true, mode: 'string' }),
	downPaymentInvoiceEmailSentAt: timestamp('down_payment_invoice_email_sent_at', { withTimezone: true, mode: 'string' }),
	downPaymentInvoiceEmailMessageId: text('down_payment_invoice_email_message_id'),
	downPaymentPaidAt: timestamp('down_payment_paid_at', { withTimezone: true, mode: 'string' }),
	demoMode: boolean('demo_mode').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
}, (table) => [
	check('hackathons_id_format_check', sql`${table.id} ~ '^H[A-Z0-9]{2}-[A-Z0-9]{3}-[A-Z0-9]{3}$'`),
	check('hackathons_capacity_check', sql`${table.capacity} in (15, 30, 50)`),
	check('hackathons_device_provision_check', sql`${table.deviceProvision} in ('existing', 'needed')`),
	check('hackathons_device_count_check', sql`(${table.deviceProvision} = 'existing' and ${table.deviceCount} = 0) or (${table.deviceProvision} = 'needed' and ${table.deviceCount} between 1 and ${table.capacity})`),
	check('hackathons_devices_adjustment_check', sql`${table.devicesAdjustment} = case when ${table.deviceProvision} = 'needed' then ${table.deviceCount} * 150 else 0 end`)
]);

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date()).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
}, (table) => [index('session_userId_idx').on(table.userId)]);

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date()).notNull()
}, (table) => [index('account_userId_idx').on(table.userId)]);

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull()
}, (table) => [index('verification_identifier_idx').on(table.identifier)]);

export const passkey = pgTable('passkey', {
	id: text('id').primaryKey(),
	name: text('name'),
	publicKey: text('public_key').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	credentialID: text('credential_id').notNull(),
	counter: integer('counter').notNull(),
	deviceType: text('device_type').notNull(),
	backedUp: boolean('backed_up').notNull(),
	transports: text('transports'),
	createdAt: timestamp('created_at'),
	aaguid: text('aaguid')
}, (table) => [
	index('passkey_userId_idx').on(table.userId),
	index('passkey_credentialID_idx').on(table.credentialID)
]);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	passkeys: many(passkey)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] })
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] })
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
	user: one(user, { fields: [passkey.userId], references: [user.id] })
}));
