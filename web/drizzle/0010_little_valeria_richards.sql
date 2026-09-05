ALTER TABLE "hackathons" ALTER COLUMN "event_start" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hackathons" ALTER COLUMN "event_end" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "customer_locale" text DEFAULT 'de' NOT NULL;--> statement-breakpoint
ALTER TABLE "hackathons" ADD CONSTRAINT "hackathons_customer_locale_check" CHECK ("hackathons"."customer_locale" in ('de', 'en'));--> statement-breakpoint
ALTER TABLE "hackathons" ADD CONSTRAINT "hackathons_event_time_pair_check" CHECK (("hackathons"."event_start" is null and "hackathons"."event_end" is null) or ("hackathons"."event_start" is not null and "hackathons"."event_end" is not null and "hackathons"."event_end" > "hackathons"."event_start"));