ALTER TABLE "hackathons" RENAME COLUMN "preferred_event_date" TO "event_start";--> statement-breakpoint
ALTER TABLE "hackathons" ALTER COLUMN "event_start" TYPE timestamp with time zone USING (("event_start"::date + TIME '09:00') AT TIME ZONE 'Europe/Berlin');--> statement-breakpoint
ALTER TABLE "hackathons" RENAME COLUMN "booking_uid" TO "prep_call_booking_uid";--> statement-breakpoint
ALTER TABLE "hackathons" RENAME COLUMN "booking_ics_uid" TO "prep_call_booking_ics_uid";--> statement-breakpoint
ALTER TABLE "hackathons" RENAME COLUMN "booking_title" TO "prep_call_booking_title";--> statement-breakpoint
ALTER TABLE "hackathons" RENAME COLUMN "booking_start" TO "prep_call_booking_start";--> statement-breakpoint
ALTER TABLE "hackathons" RENAME COLUMN "booking_end" TO "prep_call_booking_end";--> statement-breakpoint
ALTER TABLE "hackathons" RENAME COLUMN "meeting_url" TO "prep_call_meeting_url";--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "event_end" timestamp with time zone;--> statement-breakpoint
UPDATE "hackathons" SET "event_end" = "event_start" + INTERVAL '8 hours';--> statement-breakpoint
ALTER TABLE "hackathons" ALTER COLUMN "event_end" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "hackathon_booking_uid" text;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "hackathon_booking_ics_uid" text;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "hackathon_booking_title" text;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "hackathon_booking_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "hackathon_booking_end" timestamp with time zone;
