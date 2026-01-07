# Analyse: Werkzeuge & Abenteurerausrüstung (PHB 2024)

## Werkzeuge (S. 220-221)
### Struktur
- Name des Werkzeugs
- Kosten in GM
- Gewicht in kg
- Verknüpfte Attribute (Stärke, Geschicklichkeit, etc.)
- **Verwenden**: Liste von Aktionen mit Schwierigkeitsgraden (SG)
- **Herstellen**: Liste von Gegenständen, die mit diesem Werkzeug hergestellt werden können

### Kategorien
- Handwerkszeug (z.B. Schmiedewerkzeug, Alchemistenapotheke)
- Spiele-Sets (z.B. Drachenschach, Spielkarten)
- Musikinstrumente (z.B. Dudelsack, Flöte)
- Andere Werkzeuge (z.B. Diebeswerkzeug, Navigationswerkzeug)

### Besonderheiten
- Musikinstrumente und Spiele-Sets haben oft Varianten. Jede Variante erhält eine eigene ID (z.B. `musikinstrument_laute`).

---

## Abenteurerausrüstung (S. 222+)
### Haupttabelle
- Name
- Kosten (Normalisierung auf GM: 1 SM = 0.1 GM, 1 KM = 0.01 GM)
- Gewicht in kg
- Beschreibung (Fließtext unter dem Namen)

### Spezial-Tabellen
- **Behälter** (S. 223): Tragkraft/Kapazität
- **Lichtquellen** (S. 224): Reichweite und Dauer des Lichts
- **Nahrung & Trinken**: Rationen, Wasser
- **Seile**: Belastbarkeit

---

## Datenbank-Mapping
### core_tools
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | TEXT | Slugified Name (z.B. schmiedewerkzeug) |
| name | TEXT | Anzeigename |
| category | TEXT | Handwerkszeug, Musikinstrument, etc. |
| cost_gp | REAL | Kosten in Gold |
| weight_kg | REAL | Gewicht in kg |
| data | JSON | { abilities: [], use_actions: [], crafting_items: [], source_page: 221 } |

### core_gear
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | TEXT | Slugified Name |
| name | TEXT | Anzeigename |
| description| TEXT | Regeltext / Beschreibung |
| cost_gp | REAL | Kosten in Gold |
| weight_kg | REAL | Gewicht in kg |
| data | JSON | Zusätzliche Metadaten (z.B. Kapazität für Behälter) |






