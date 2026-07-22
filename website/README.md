# WERKSPRUNG Website

Deutsche Marketing- und Buchungswebsite für den WERKSPRUNG Agentic Engineering Hackathon. Gebaut mit SvelteKit, TypeScript, Bun, Motion und MapLibre GL.

## Lokal starten

```sh
bun install
bun run dev
```

Ohne Umgebungsvariablen läuft die Kalenderstrecke in der lokalen Entwicklung in einem gekennzeichneten Demo-Modus. Ohne MapTiler-Key zeigt die Karte einen Setup-Zustand; die Adresse bleibt manuell editierbar.

## Integrationen

`.env.example` nach `.env` kopieren und ergänzen:

- `CAL_API_KEY`: serverseitiger Cal.com API-Key
- `CAL_EVENT_TYPE_ID`: ID des 30-minütigen Cal.com Event Types
- `PUBLIC_MAPTILER_API_KEY`: domainbeschränkter öffentlicher MapTiler-Key für Kartenstil und deutsche Adresssuche

## Vor einem Livegang zwingend erledigen

- Betreiberangaben im Impressum ergänzen und rechtlich prüfen
- vollständige Datenschutzerklärung für Hosting, Cal.com, MapTiler und MapLibre bereitstellen
- Domain im MapTiler-Key freigeben und Kartenstil sowie Geocoding testen
- Cal.com Event Type, Zeitzone, Verfügbarkeit und Bestätigungs-E-Mails prüfen
- finale Domain in Sitemap, strukturierten Daten und Social-Metadaten bestätigen
- WERKSPRUNG Wort-/Bildmarke rechtlich prüfen

Die ursprüngliche Repo-README und das Brand Kit wurden vor der Initialisierung unter `docs/` archiviert.
