# WERKSPRUNG Website

Deutsche Marketing- und Buchungswebsite für den WERKSPRUNG Agentic Engineering Hackathon. Gebaut mit SvelteKit, TypeScript, Bun, Motion und MapLibre GL.

## Lokal starten

```sh
bun install
bun run dev
```

Ohne Umgebungsvariablen läuft die Cal.com-Terminbuchung in der lokalen Entwicklung in einem gekennzeichneten Demo-Modus. Karte und Adresssuche benötigen keinen API-Key.

## Integrationen

`.env.example` nach `.env` kopieren und ergänzen:

- `CAL_API_KEY`: serverseitiger Cal.com API-Key
- `CAL_EVENT_TYPE_ID`: ID des 30-minütigen Cal.com Event Types

Die Karte verwendet den Positron-Stil von OpenFreeMap. Die optionale deutsche Adresssuche nutzt die öffentliche Photon-Instanz. Photon hat keine Verfügbarkeitsgarantie; deshalb bleiben alle Adressfelder immer manuell editierbar.

## Vor einem Livegang zwingend erledigen

- Betreiberangaben im Impressum ergänzen und rechtlich prüfen
- vollständige Datenschutzerklärung für Hosting, Cal.com, OpenFreeMap, Photon und MapLibre bereitstellen
- OpenFreeMap-Kartenstil und Photon-Fallback im Zielhosting testen
- Cal.com Event Type, Zeitzone, Verfügbarkeit und Bestätigungs-E-Mails prüfen
- finale Domain in Sitemap, strukturierten Daten und Social-Metadaten bestätigen
- WERKSPRUNG Wort-/Bildmarke rechtlich prüfen

Die ursprüngliche Repo-README und das Brand Kit wurden vor der Initialisierung unter `docs/` archiviert.
