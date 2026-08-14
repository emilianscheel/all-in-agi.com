ALTER TYPE "public"."hackathon_status" ADD VALUE 'requested' BEFORE 'confirmed';--> statement-breakpoint
ALTER TYPE "public"."hackathon_status" ADD VALUE 'prep_scheduled' BEFORE 'confirmed';--> statement-breakpoint
ALTER TYPE "public"."hackathon_status" ADD VALUE 'exit_window' BEFORE 'confirmed';--> statement-breakpoint
ALTER TYPE "public"."hackathon_status" ADD VALUE 'contracted' BEFORE 'confirmed';--> statement-breakpoint
ALTER TYPE "public"."hackathon_status" ADD VALUE 'withdrawn' BEFORE 'confirmed';--> statement-breakpoint
ALTER TYPE "public"."hackathon_status" ADD VALUE 'declined' BEFORE 'confirmed';--> statement-breakpoint
ALTER TYPE "public"."hackathon_status" ADD VALUE 'completed';--> statement-breakpoint
CREATE TABLE "contract_events" (
	"id" text PRIMARY KEY NOT NULL,
	"hackathon_id" text NOT NULL,
	"type" text NOT NULL,
	"actor" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_sequences" (
	"sequence_key" text PRIMARY KEY NOT NULL,
	"next_value" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_document_versions" (
	"version" text PRIMARY KEY NOT NULL,
	"content_hash" text NOT NULL,
	"status" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "legal_document_versions_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "event_photos" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "billing" jsonb;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "business_customer_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "authority_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "legal_modules" jsonb;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "legal_version" text;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "legal_content_hash" text;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "legal_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "legal_acknowledged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "customer_agreement_name" text;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "organizer_agreement_name" text;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "oral_agreement_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "exit_deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "contracted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "withdrawn_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "withdrawn_by" text;--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "withdrawal_reason" text;--> statement-breakpoint
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_hackathon_id_hackathons_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contract_events_hackathon_idx" ON "contract_events" USING btree ("hackathon_id");