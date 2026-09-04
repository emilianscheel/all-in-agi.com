ALTER TABLE "hackathons" ADD COLUMN "customer_locale" text DEFAULT 'de' NOT NULL;
--> statement-breakpoint
ALTER TABLE "hackathons" ADD CONSTRAINT "hackathons_customer_locale_check" CHECK ("hackathons"."customer_locale" in ('de', 'en'));
