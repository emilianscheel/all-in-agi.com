CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offers_id_format_check" CHECK ("offers"."id" ~ '^O[A-Z0-9]{2}-[A-Z0-9]{3}-[A-Z0-9]{3}$')
);
--> statement-breakpoint
ALTER TABLE "hackathons" ADD COLUMN "offer_id" text;--> statement-breakpoint
ALTER TABLE "hackathons" ADD CONSTRAINT "hackathons_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hackathons_offer_id_unique" ON "hackathons" USING btree ("offer_id") WHERE "hackathons"."offer_id" is not null;