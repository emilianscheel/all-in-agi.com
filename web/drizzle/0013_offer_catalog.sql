CREATE TABLE "client_logos" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"svg" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_logos_id_format_check" CHECK ("client_logos"."id" ~ '^L[A-Z0-9]{2}-[A-Z0-9]{3}-[A-Z0-9]{3}$')
);
--> statement-breakpoint
CREATE TABLE "offer_service_links" (
	"offer_id" text NOT NULL,
	"service_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "offer_service_links_offer_id_service_id_pk" PRIMARY KEY("offer_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "offer_services" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"label_en" text NOT NULL,
	"description" text,
	"description_en" text,
	"icon" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offer_service_links" ADD CONSTRAINT "offer_service_links_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_service_links" ADD CONSTRAINT "offer_service_links_service_id_offer_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."offer_services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "offer_service_links_offer_position_unique" ON "offer_service_links" USING btree ("offer_id","position");
--> statement-breakpoint
INSERT INTO "offer_services" ("id", "label", "label_en", "description", "description_en", "icon", "sort_order") VALUES
  ($seed$facilitators$seed$, $seed$Zwei Facilitators$seed$, $seed$Two facilitators$seed$, NULL, NULL, $seed$users$seed$, 0),
  ($seed$preparation$seed$, $seed$4 Tage Vorbereitungstage Konzeption$seed$, $seed$4 days of preparation (concepting)$seed$, NULL, NULL, $seed$list-checks$seed$, 1),
  ($seed$challenge-design$seed$, $seed$Challenge Design$seed$, $seed$Challenge Design$seed$, NULL, NULL, $seed$lightbulb$seed$, 2),
  ($seed$demo-follow-up$seed$, $seed$Demo Session$seed$, $seed$Demo session$seed$, NULL, NULL, $seed$presentation$seed$, 3),
  ($seed$on-site$seed$, $seed$Wir begleiten das Event von Berlin aus oder bei Ihnen vor Ort$seed$, $seed$We accompany the event from Berlin or on-site at your location$seed$, NULL, NULL, $seed$map-pin$seed$, 4),
  ($seed$date-range$seed$, $seed$Januar oder Februar 2026$seed$, $seed$January or February 2026$seed$, NULL, NULL, $seed$calendar-days$seed$, 5),
  ($seed$duration$seed$, $seed$2,5 Tage gesamt, 1 Tag à 10 h$seed$, $seed$2.5 days total, 1 day at 10 h$seed$, NULL, NULL, $seed$clock-3$seed$, 6),
  ($seed$project-work$seed$, $seed$2 Tage Projektarbeit$seed$, $seed$2 days of project work$seed$, NULL, NULL, $seed$code-2$seed$, 7),
  ($seed$pitch-preparation$seed$, $seed$0,5 Tage Pitch und Projektpitches$seed$, $seed$0.5 day for pitch and project pitches$seed$, NULL, NULL, $seed$monitor-play$seed$, 8),
  ($seed$participants$seed$, $seed$Bis zu 100 teilnehmende Personen$seed$, $seed$Up to 100 participants$seed$, NULL, NULL, $seed$users$seed$, 9),
  ($seed$remote-teams$seed$, $seed$Vollkommen online über Microsoft Teams$seed$, $seed$Fully online via Microsoft Teams$seed$, NULL, NULL, $seed$video$seed$, 10),
  ($seed$availability$seed$, $seed$Während der Wettbewerbszeit jederzeit erreichbar$seed$, $seed$Reachable at all times during the competition period$seed$, NULL, NULL, $seed$badge-check$seed$, 11),
  ($seed$breakout-sessions$seed$, $seed$Proaktive Unterstützung in direkten Breakout-Sessions$seed$, $seed$Proactive support in live breakout sessions$seed$, NULL, NULL, $seed$message-square-more$seed$, 12),
  ($seed$introduction$seed$, $seed$30-minütige Einführungspräsentation am ersten Wettbewerbstag$seed$, $seed$30-minute introductory presentation on the first competition day$seed$, NULL, NULL, $seed$presentation$seed$, 13),
  ($seed$matchmaking$seed$, $seed$Gebrandete Match-making Platform$seed$, $seed$Branded matchmaking platform$seed$, $seed$Magischer Link, Profile und automatische, internationale Teamzusammenstellung.$seed$, $seed$Magic link, profiles, and automatic international team formation.$seed$, $seed$sparkles$seed$, 14),
  ($seed$whiteboard$seed$, $seed$Gebrandetes kollaboratives Whiteboard$seed$, $seed$Branded collaborative whiteboard$seed$, $seed$Gemeinsamer Raum für Projektideen während des Hackathons.$seed$, $seed$Shared space for project ideas during the hackathon.$seed$, $seed$panels-top-left$seed$, 15),
  ($seed$timetable$seed$, $seed$Gebrandete Time Table View$seed$, $seed$Branded timetable view$seed$, $seed$Klarer Ablauf und Orientierung für alle Teilnehmenden.$seed$, $seed$Clear agenda and orientation for all participants.$seed$, $seed$calendar-clock$seed$, 16),
  ($seed$pitch-voting$seed$, $seed$Gebrandetes Pitch & Voting System$seed$, $seed$Branded pitch & voting system$seed$, $seed$Screen-Recording-Upload, Pitch-Vorbereitung und Abstimmung.$seed$, $seed$Screen-recording upload, pitch preparation, and voting.$seed$, $seed$vote$seed$, 17),
  ($seed$winner-posters$seed$, $seed$Siegerposter$seed$, $seed$Winning posters$seed$, $seed$Poster zur Auszeichnung der Gewinnerteams.$seed$, $seed$Posters to recognize the winning teams.$seed$, $seed$award$seed$, 18),
  ($seed$winner-trophies$seed$, $seed$Siegerpokale$seed$, $seed$Winning trophies$seed$, $seed$Pokale für die Gewinnerteams.$seed$, $seed$Trophies for the winning teams.$seed$, $seed$trophy$seed$, 19)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "offer_service_links" ("offer_id", "service_id", "position")
SELECT chosen.id, chosen.service_id, row_number() OVER (PARTITION BY chosen.id ORDER BY chosen.ordinality) - 1
FROM (
  SELECT DISTINCT ON (o.id, service.value) o.id, service.value AS service_id, service.ordinality
  FROM "offers" o
  CROSS JOIN LATERAL jsonb_array_elements_text(o.config->'services') WITH ORDINALITY AS service(value, ordinality)
  JOIN "offer_services" s ON s.id = service.value
  ORDER BY o.id, service.value, service.ordinality
) chosen
ON CONFLICT ("offer_id", "service_id") DO NOTHING;
