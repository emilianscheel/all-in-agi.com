ALTER TABLE "hackathons" ADD COLUMN "invoice_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "invoice_issued_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "invoice_email_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "invoice_email_message_id" text;