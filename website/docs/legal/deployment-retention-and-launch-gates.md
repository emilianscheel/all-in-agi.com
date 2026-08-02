# Deployment-, Datenschutz- und Aufbewahrungsfreigabe

## Harte Produktiv-Sperren

- [ ] Deutsche Rechtsberatung hat AGB-Version, Stornopauschalen, Haftung, Location-, Catering-, Geräte- und Tool-Module schriftlich freigegeben.
- [ ] Steuerberatung hat die Behandlung des gebündelten Hackathon-Angebots mit 19 % sowie Anzahlungs-/Schlussrechnungslogik schriftlich bestätigt.
- [ ] Versicherer hat die in `supplier-insurance-safety-checklists.md` aufgeführten Risiken und Ausschlüsse schriftlich bestätigt.
- [ ] `LEGAL_DOCUMENT_STATUS` wird erst nach Freigabe von `review-required` auf `published` gestellt; Inhalt, Version und SHA-256 werden danach nicht mehr verändert.
- [ ] ZUGFeRD-Datei wurde zusätzlich zum internen Strukturtest mit einem aktuellen EN-16931-/ZUGFeRD-Validator geprüft. Der PDF-Generator bettet `factur-x.xml` ein; die externe Prüfung ist dennoch Release-Pflicht.

## Vercel

- [ ] Pro- oder Enterprise-Plan, für den das aktuelle DPA gilt
- [ ] DPA/SCC dokumentiert und Transfer Impact Assessment für US-Verarbeitung abgeschlossen
- [ ] Subprozessor-Benachrichtigungen abonniert
- [ ] Logs, Preview-Deployments, Teamzugriffe und Aufbewahrung minimiert
- [ ] Produktionsgeheimnisse ausschließlich in geschützten Vercel-Umgebungsvariablen
- [ ] Stündlicher geschützter Aufruf von `/api/cron/contracts` mit `Authorization: Bearer $CRON_SECRET`, damit abgelaufene Lösungsfristen auch ohne Dashboard-Aufruf festgeschrieben werden

## Neon PostgreSQL

- [ ] Produktionsprojekt in `aws-eu-central-1` (Frankfurt)
- [ ] Neon-DPA und aktuelle Subprozessorliste dokumentiert
- [ ] Verbindung mit TLS und vollständiger Zertifikatsprüfung
- [ ] Getrennte Rollen für Migration und Anwendung; Anwendung ohne Schema-/Adminrechte
- [ ] Backups, Wiederherstellungstest, Credential-Rotation und Zugriffsdokumentation

## Weitere Dienstleister

- [ ] Cal.com DPA/SCC und Transferprüfung
- [ ] Cloudflare DPA/SCC und Transferprüfung
- [ ] `GEOCODING_API_URL` verweist ausschließlich auf einen selbst betriebenen oder vertraglich/DPA-abgesicherten HTTPS-Dienst. Ohne Konfiguration bleibt nur die manuelle Eingabe aktiv.
- [ ] OpenFreeMap/MapLibre-Verarbeitung und technisch erforderliche Verbindungsdaten in der Datenschutzerklärung aktuell beschrieben

## Aufbewahrung und Löschung

| Datenkategorie | Standardfrist / Auslöser | Umsetzung |
| --- | --- | --- |
| Anfrage ohne Vertrag | sechs Monate nach letztem Kontakt | geplanter Löschlauf mit dokumentierter Ausnahme für Rechtsansprüche |
| Vertrags-/Änderungs-/Rücktrittsnachweise | bis Ende der gesetzlichen Anspruchs-/Nachweisfrist | unveränderliche Snapshots und Audit-Events |
| Rechnungen und eingebettete strukturierte Originale | acht Jahre | unveränderliche Speicherung; Korrektur nur durch neuen Beleg |
| Geräteprotokolle | drei Jahre nach Rückgabe, länger nur bei offenem Schaden | Seriennummern und Vorfallbezug minimieren |
| Fotoeinwilligung/Widerruf | solange Nutzung plus erforderliche Nachweisfrist | Zweck-/Kanal-Matrix und Removal-Status |
| Temporäre Geräte-/Tooldaten | unmittelbar nach Rückgabe beziehungsweise Eventabschluss | Reset-/Löschprotokoll |

Löschläufe müssen offene Verträge, Rechnungsaufbewahrung, Rechtsansprüche, Widerrufe und Legal Holds berücksichtigen und werden protokolliert, ohne gelöschte Inhalte erneut zu speichern.
