# ALL IN AGI Website

Deutsche Marketing- und Buchungswebsite für den ALL IN AGI Agentic Engineering Hackathon. Gebaut mit SvelteKit, TypeScript, Bun, Motion und MapLibre GL.

## Lokal starten

```sh
bun install
bun run dev
```

`bun run dev` startet für eine lokale `DATABASE_URL` PostgreSQL über Apples `container` CLI, wendet offene Drizzle-Migrationen an und startet danach den SvelteKit-Entwicklungsserver. Dafür werden ein Mac mit Apple Silicon, die installierte und initialisierte [`container` CLI](https://github.com/apple/container) sowie die Werte aus `.env.example` benötigt. Zeigt `DATABASE_URL` auf einen externen Host, wird kein lokaler Container gestartet.

Die lokale Datenbank läuft als `postgres:17-alpine` unter dem Namen `all-in-agi-postgres`, ist nur über `127.0.0.1:5432` erreichbar und speichert ihre Daten dauerhaft im Volume `all-in-agi-postgres-data`.

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
- `CAL_HACKATHON_EVENT_TYPE_ID`: ID des Cal.com Event Types für den Hackathontag; unterstützt die angebotenen Dauern in 30-Minuten-Schritten
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account-ID für den E-Mail-Versand
- `CLOUDFLARE_EMAIL_API_TOKEN`: serverseitiger Token mit `Email Sending: Edit`
- `PLAN_URL_SECRET`: mindestens 32 Zeichen langes, serverseitiges Secret für verschlüsselte Plan-Links
- `DATABASE_URL`: einzige PostgreSQL-Konfiguration für Anwendung, Drizzle und lokale Entwicklung; der lokale Container übernimmt daraus Benutzername, Passwort, Datenbankname und Port
- `BETTER_AUTH_SECRET`: mindestens 32 Zeichen langes Secret für Better-Auth-Sessions
- `BETTER_AUTH_URL`: vollständiger Origin der Anwendung ohne abschließenden Slash; lokal standardmäßig `http://localhost:5173`
- `SEED_ADMIN_EMAIL`: einzige E-Mail-Adresse, die das Admin-Konto einrichten darf
- `SEED_ADMIN_PASSWORD`: Seed-Passwort mit mindestens 8 Zeichen; es wird nur bis zur erfolgreichen Passkey-Einrichtung akzeptiert

In der lokalen Entwicklung wird ein festes Development-Secret verwendet. Im Live-Betrieb verweigert die App das Erstellen und Öffnen von Plan-Links ohne eigenes Secret. Plan-Links enthalten die vollständige Konfiguration inklusive Kontakt- und Adressdaten; jede Person mit dem Link kann diese Daten nach dem Öffnen sehen. Eine Rotation des Secrets macht bestehende Links ungültig.

Gebuchte Hackathons werden dauerhaft in PostgreSQL gespeichert und erhalten eine öffentliche ID im Format `HAA-AAA-AAA`. Die Route `/<id>` ist nicht indexiert, aber als nicht gelisteter Bearer-Link erreichbar: Wer den Link kennt, kann die Veranstaltungsdetails und den PDF-Plan einschließlich der hinterlegten Kontaktdaten öffnen.

## Admin-Dashboard

Das Admin-Dashboard liegt unter `/dashboard`. Beim ersten Aufruf wird ausschließlich die in `SEED_ADMIN_EMAIL` konfigurierte Adresse akzeptiert. Nach der Anmeldung mit `SEED_ADMIN_PASSWORD` muss unmittelbar ein Passkey registriert werden; Buchungsdaten und Admin-Endpunkte bleiben bis dahin gesperrt. Sobald ein Passkey vorhanden ist, weist der Server alle Passwort-Anmeldungen zurück und akzeptiert nur noch WebAuthn/Passkey.

Passkeys benötigen im Live-Betrieb HTTPS und einen `BETTER_AUTH_URL`-Origin, der exakt zur aufgerufenen Domain passt. `localhost` funktioniert für die lokale Entwicklung. Das Dashboard zeigt bestätigte und stornierte Kundenbuchungen, bietet einen CSV-Export und ergänzt die öffentliche Hackathon-Detailseite für angemeldete Admins um Timer- und Stornierungsaktionen.

Wenn alle Passkeys verloren gehen, gibt es bewusst keinen Seed-Bypass. Für die manuelle Wiederherstellung müssen in der Datenbank zunächst alle Sessions des Seed-Benutzers widerrufen und dessen Einträge aus `passkey` entfernt werden. Danach darf das Seed-Passwort erneut zur Passkey-Einrichtung verwendet werden. Vor diesem Eingriff sollte ein Datenbank-Backup erstellt werden.

Das Drizzle-Schema liegt unter `src/lib/server/db/schema.ts`; generierte und geprüfte SQL-Migrationen werden im Ordner `drizzle/` versioniert. Schemaänderungen werden mit `bun run db:generate` erzeugt und mit `bun run db:migrate` angewendet.

Die Karte verwendet den Positron-Stil von OpenFreeMap. Die optionale deutsche Adresssuche nutzt die öffentliche Photon-Instanz. Photon hat keine Verfügbarkeitsgarantie; deshalb bleiben alle Adressfelder immer manuell editierbar.

Nach einer bestätigten Buchung versendet der Server über Cloudflare Email Service eine HTML-Bestätigung mit Text-Fallback an den Kunden und eine inhaltlich angepasste Benachrichtigung an `go@all-in-agi.com`. Absender und Antwortadresse sind `go@all-in-agi.com`. Beide E-Mails enthalten den öffentlichen Buchungslink sowie den vollständigen PDF-Plan und den Vorbereitungstermin als Anhänge. Der Vorbereitungstermin im E-Mail-Anhang verlinkt ebenfalls auf die Buchungsverwaltung. Ein Fehler beim E-Mail-Versand macht die bereits bestätigte Cal.com- und Datenbankbuchung nicht rückgängig.

## Vor einem Livegang zwingend erledigen

- Betreiberangaben im Impressum ergänzen und rechtlich prüfen
- vollständige Datenschutzerklärung für Hosting, Cal.com, OpenFreeMap, Photon und MapLibre bereitstellen
- OpenFreeMap-Kartenstil und Photon-Fallback im Zielhosting testen
- Beide Cal.com Event Types, Zeitzone, Verfügbarkeit, unterstützte Hackathon-Dauern und Bestätigungs-E-Mails prüfen
- finale Domain in Sitemap, strukturierten Daten und Social-Metadaten bestätigen
- ALL IN AGI Wort-/Bildmarke rechtlich prüfen

Die ursprüngliche Repo-README und das Brand Kit wurden vor der Initialisierung unter `docs/` archiviert.
