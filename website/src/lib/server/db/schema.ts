import { sql } from 'drizzle-orm';
import { boolean, check, integer, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { CodingTool, Equipment, EventAddress, Lunch, ToolProvision } from '$lib/booking';

export const hackathonStatus = pgEnum('hackathon_status', ['pending', 'confirmed']);

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
	address: jsonb('address').$type<EventAddress>().notNull(),
	eventStart: timestamp('event_start', { withTimezone: true, mode: 'string' }).notNull(),
	eventEnd: timestamp('event_end', { withTimezone: true, mode: 'string' }).notNull(),
	consultationSlot: timestamp('consultation_slot', { withTimezone: true, mode: 'string' }).notNull(),
	basePrice: integer('base_price').notNull(),
	venueSurcharge: integer('venue_surcharge').notNull(),
	lunchAdjustment: integer('lunch_adjustment').notNull(),
	toolsAdjustment: integer('tools_adjustment').notNull(),
	totalPrice: integer('total_price').notNull(),
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
	demoMode: boolean('demo_mode').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
}, (table) => [
	check('hackathons_id_format_check', sql`${table.id} ~ '^H[A-Z0-9]{2}-[A-Z0-9]{3}-[A-Z0-9]{3}$'`),
	check('hackathons_capacity_check', sql`${table.capacity} in (15, 30, 50)`)
]);
