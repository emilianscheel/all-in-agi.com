CREATE TABLE "slide_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
