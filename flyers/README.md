# Berliner Flyer-Kampagne

**Ziel:** Berliner Unternehmen für einen internen KI-Hackathon gewinnen: Das eigene Team baut an einem Tag vor Ort einen funktionierenden Prototyp zu einer eigenen Aufgabe.

**Methode:** DIN-A4-Flyer von WIRmachenDRUCK, 4/4-farbig und beidseitig. A und B sind die zwei Seiten des ersten Druckentwurfs; C ist eine dritte Variante zur Auswahl. Flyer persönlich in Berliner Nachbarschaften an Interessierte übergeben, bevorzugt rund um Büros und Gewerbe. Keine Briefkästen oder Ablage ohne Erlaubnis.

**Inhalt:**

| Seite | Titel | Untertitel / Nutzen |
| --- | --- | --- |
| A | „Noch eine KI-Schulung? Bitte nicht.“ | „Beim Hackathon in Ihrem Büro baut Ihr Team mit KI-Agenten an einer echten Aufgabe aus dem Unternehmen.“ |
| B | „Nein, es geht zu schnell“ | „Dranbleiben bei KI ist möglich. Ein moderierter KI-Hackathon bei Ihnen vor Ort. Ihr Team arbeitet an eigenen Aufgaben und erarbeitet echte KI-gestützte Workflows.“ |
| C | „Sie wollen KI im Team wirklich nutzen?“ | „Praktisch Ausprobieren ist der Schlüssel. Ein Hackathon Tag mit KI-Agenten bei Ihnen vor Ort.“ |

Alle Varianten zeigen das ALL-IN-AGI-Logo, `all-in-agi.com`, `go@all-in-agi.com`, `0152 57257750` und einen QR-Code zur Website.

**Druckdateien:** [all-in-agi-a4-beidseitig.pdf](all-in-agi-a4-beidseitig.pdf) enthält A vorn und B hinten. [all-in-agi-a4-varianten.pdf](all-in-agi-a4-varianten.pdf) enthält A, B und C zur Auswahl. Das Layout nutzt die Website-Farben, das Eventfoto und Instrument Serif für das Logo. Format: 216 × 303 mm einschließlich 3 mm Beschnitt rundum; Endformat: 210 × 297 mm. Die PDFs sind in CMYK umgewandelt. Beim Bestellen die Druckdatenanforderungen der gewählten WIRmachenDRUCK-Option gegenprüfen und einen Probedruck auf Lesbarkeit und QR-Scan prüfen.

**QR-Tracking:** Alle Codes verlinken auf `https://all-in-agi.com/` mit `utm_source=flyer`, `utm_medium=offline`, `utm_campaign=berlin_nachbarschaft_2026` und je einem `utm_content=seite_a`, `seite_b` oder `seite_c`. Die Weiterleitung zur Sprachversion erhält die UTM-Werte. GA4 erfasst sie nach Analytics-Einwilligung; Ablehnung und nicht gescannte Flyer erscheinen nicht als Besuch.

**Aktionsplan:** 200 Exemplare als Pilot drucken, zwei bis drei Büro- und Gewerbegebiete auswählen, persönlich verteilen und Ort sowie verteilte Stückzahl notieren. Nach zwei Wochen GA4-Sitzungen nach Kampagne und `utm_content` vergleichen; danach Text oder Verteilorte anpassen.

**Bearbeiten:** `node flyers/generate.mjs` erzeugt beide PDFs aus den drei Layouts und den QR-Links neu (`magick` und `gs` erforderlich).
