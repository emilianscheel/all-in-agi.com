# WERKSPRUNG Website

Deutsche Marketing- und Buchungswebsite für den WERKSPRUNG Agentic Engineering Hackathon. Gebaut mit SvelteKit, TypeScript, Bun, Motion und MapLibre GL.

## Lokal starten

```sh
bun install
bun run dev
```

`bun run dev` startet PostgreSQL über Apples `container` CLI, wendet offene Drizzle-Migrationen an und startet danach den SvelteKit-Entwicklungsserver. Dafür werden ein Mac mit Apple Silicon, die installierte und initialisierte [`container` CLI](https://github.com/apple/container) sowie die Werte aus `.env.example` benötigt.

Die lokale Datenbank läuft als `postgres:17-alpine` unter dem Namen `werksprung-postgres`, ist nur über `127.0.0.1:5432` erreichbar und speichert ihre Daten dauerhaft im Volume `werksprung-postgres-data`.

Weitere Entwicklungsbefehle:

```sh
bun run dev:web       # nur SvelteKit, ohne Datenbankstart
bun run db:start      # PostgreSQL starten
bun run db:stop       # PostgreSQL stoppen
bun run db:generate   # SQL-Migration aus dem Drizzle-Schema erzeugen
bun run db:migrate    # offene Migrationen anwenden
bun run db:studio     # Drizzle Studio öffnen
```

Ohne Cal.com-Umgebungsvariablen läuft die Terminbuchung in der lokalen Entwicklung in einem gekennzeichneten Demo-Modus. Karte und Adresssuche benötigen keinen API-Key.

## Integrationen

`.env.example` nach `.env` kopieren und ergänzen:

- `CAL_API_KEY`: serverseitiger Cal.com API-Key
- `CAL_EVENT_TYPE_ID`: ID des 60-minütigen Cal.com Event Types
- `PLAN_URL_SECRET`: mindestens 32 Zeichen langes, serverseitiges Secret für verschlüsselte Plan-Links
- `DATABASE_URL`: serverseitige PostgreSQL-Verbindung für Hackathon-Buchungen
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`: lokale Container-Konfiguration
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`: für eine spätere Better-Auth-Integration reserviert; aktuell noch nicht verwendet

In der lokalen Entwicklung wird ein festes Development-Secret verwendet. Im Live-Betrieb verweigert die App das Erstellen und Öffnen von Plan-Links ohne eigenes Secret. Plan-Links enthalten die vollständige Konfiguration inklusive Kontakt- und Adressdaten; jede Person mit dem Link kann diese Daten nach dem Öffnen sehen. Eine Rotation des Secrets macht bestehende Links ungültig.

Gebuchte Hackathons werden dauerhaft in PostgreSQL gespeichert und erhalten eine öffentliche ID im Format `HAA-AAA-AAA`. Die Route `/<id>` ist nicht indexiert, aber als nicht gelisteter Bearer-Link erreichbar: Wer den Link kennt, kann die Veranstaltungsdetails und datenschutzreduzierten Downloads öffnen. E-Mail-Adresse und Telefonnummer werden dort nicht ausgeliefert.

Das Drizzle-Schema liegt unter `src/lib/server/db/schema.ts`; generierte und geprüfte SQL-Migrationen werden im Ordner `drizzle/` versioniert. Schemaänderungen werden mit `bun run db:generate` erzeugt und mit `bun run db:migrate` angewendet.

Die Karte verwendet den Positron-Stil von OpenFreeMap. Die optionale deutsche Adresssuche nutzt die öffentliche Photon-Instanz. Photon hat keine Verfügbarkeitsgarantie; deshalb bleiben alle Adressfelder immer manuell editierbar.

## Vor einem Livegang zwingend erledigen

- Betreiberangaben im Impressum ergänzen und rechtlich prüfen
- vollständige Datenschutzerklärung für Hosting, Cal.com, OpenFreeMap, Photon und MapLibre bereitstellen
- OpenFreeMap-Kartenstil und Photon-Fallback im Zielhosting testen
- Cal.com Event Type, Zeitzone, Verfügbarkeit und Bestätigungs-E-Mails prüfen
- finale Domain in Sitemap, strukturierten Daten und Social-Metadaten bestätigen
- WERKSPRUNG Wort-/Bildmarke rechtlich prüfen

Die ursprüngliche Repo-README und das Brand Kit wurden vor der Initialisierung unter `docs/` archiviert.
