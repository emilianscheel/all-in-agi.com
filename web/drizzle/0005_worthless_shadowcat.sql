ALTER TABLE "hackathons" ADD COLUMN "billing_model" text DEFAULT 'legacy_full' NOT NULL;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "down_payment_invoice_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "down_payment_invoice_issued_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "down_payment_invoice_email_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "down_payment_invoice_email_message_id" text;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "down_payment_paid_at" timestamp with time zone;