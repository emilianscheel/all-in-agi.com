# WERKSPRUNG Website

Deutsche Marketing- und Buchungswebsite für den WERKSPRUNG AI Coding Hackathon. Gebaut mit SvelteKit, TypeScript, Bun und Motion.

## Lokal starten

```sh
bun install
bun run dev
```

Ohne Umgebungsvariablen läuft die Kalenderstrecke in der lokalen Entwicklung in einem gekennzeichneten Demo-Modus. Ohne MapKit-Token zeigt die Karte einen Setup-Zustand; die Adresse bleibt manuell editierbar.

## Integrationen

`.env.example` nach `.env` kopieren und ergänzen:

- `CAL_API_KEY`: serverseitiger Cal.com API-Key
- `CAL_EVENT_TYPE_ID`: ID des 30-minütigen Cal.com Event Types
- `PUBLIC_MAPKIT_TOKEN`: domainbeschränkter Apple MapKit JS Token für Karte, Marker und Address Search

## Vor einem Livegang zwingend erledigen

- Betreiberangaben im Impressum ergänzen und rechtlich prüfen
- vollständige Datenschutzerklärung für Hosting, Cal.com und Apple MapKit bereitstellen
- Domain in MapKit freigeben und Produktionstoken testen
- Cal.com Event Type, Zeitzone, Verfügbarkeit und Bestätigungs-E-Mails prüfen
- finale Domain in Sitemap, strukturierten Daten und Social-Metadaten bestätigen
- WERKSPRUNG Wort-/Bildmarke rechtlich prüfen

Die ursprüngliche Repo-README und das Brand Kit wurden vor der Initialisierung unter `docs/` archiviert.
