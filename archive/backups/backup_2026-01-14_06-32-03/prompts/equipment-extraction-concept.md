# Konzept: Extraktion von Items, Equipment und Tools aus PHB 2024

## Quellen

**Hauptquelle:**
- `/daten/projects/dnd_nexus-sheet_engine/resources/books/D&D Spielerhandbuch (2024).pdf`
- PHB 2024 (D&D Spielerhandbuch 2024)
- Deutsche Übersetzung

**Alternativquelle (nur im Notfall):**
- `/daten/projects/dnd_nexus-sheet_engine/resources/books/D&D Spielerhandbuch (2024).docx` (falls besser maschinell auslesbar)

## Zielsetzung

Saubere Trennung der aktuellen `gear`-Tabelle in drei spezialisierte Tabellen:
- `items` (Gegenstände)
- `equipment` (Ausrüstungen/Ausrüstungspakete)
- `tools` (Werkzeuge)

Alle mit `custom_`-Pendant für Homebrew-Inhalte.

## Quellen im Regelwerk (PHB 2024)

### Werkzeuge (Tools)
- **Seite 220-221**: Werkzeuge Tabelle
- **Inhalt**: 
  - Handwerkszeug (z.B. Alchemistenausrüstung, Kalligrafenwerkzeug)
  - Musikinstrumente (z.B. Dudelsack, Harfe)
  - Spielsets (z.B. Kartenspiel, Würfelspiel)
  - Andere Werkzeuge (z.B. Diebeswerkzeug, Navigationswerkzeug)

### Gegenstände (Items)
- **Seite 221+**: Standard-Ausrüstung Tabelle
- **Inhalt**:
  - Einzelgegenstände ohne spezielle Kategorie
  - Beispiele: Laterne, Seil, Rucksack, Wasserflasche, etc.
  - Alle Gegenstände mit Kosten, Gewicht, Beschreibung

### Ausrüstungen (Equipment)
- **Seite 221+**: Ausrüstungspakete/Ausrüstungslisten
- **Inhalt**:
  - Vordefinierte Pakete (z.B. "Bürgerausrüstung", "Klerikerausrüstung")
  - Enthalten mehrere Gegenstände (Items) als Liste
  - Können auch Werkzeuge enthalten
  - Haben Gesamtkosten oder Einzelkosten pro Item

## Schema-Design

### 1. Items (Gegenstände)

```sql
CREATE TABLE core_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    cost_gp REAL NOT NULL,
    weight_kg REAL NOT NULL,
    category TEXT,  -- Optional: Kategorie für Gruppierung (z.B. "Abenteuerausrüstung", "Transport", etc.)
    data JSON,      -- Erweiterte Daten (Properties, etc.)
    created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE custom_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    cost_gp REAL NOT NULL,
    weight_kg REAL NOT NULL,
    category TEXT,
    data JSON,
    parent_id TEXT,
    is_homebrew BOOLEAN DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (parent_id) REFERENCES core_items(id)
);
```

**Kriterien für Items:**
- Einzelgegenstände aus der Standard-Ausrüstung Tabelle
- Haben direkt Kosten und Gewicht
- Keine Untergegenstände/Listen enthalten

### 2. Equipment (Ausrüstungen/Ausrüstungspakete)

```sql
CREATE TABLE core_equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    total_cost_gp REAL,  -- Optional: Gesamtkosten des Pakets
    total_weight_kg REAL, -- Optional: Gesamtgewicht des Pakets
    items JSON NOT NULL,  -- Array von Item-Referenzen: [{"item_id": "...", "quantity": 1}, ...]
    tools JSON,          -- Array von Tool-Referenzen: [{"tool_id": "...", "quantity": 1}, ...]
    data JSON,           -- Erweiterte Daten (Hinweise, Varianten, etc.)
    created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE custom_equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    total_cost_gp REAL,
    total_weight_kg REAL,
    items JSON NOT NULL,
    tools JSON,
    data JSON,
    parent_id TEXT,
    is_homebrew BOOLEAN DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (parent_id) REFERENCES core_equipment(id)
);
```

**Kriterien für Equipment:**
- Pakete/Listen mit mehreren Gegenständen
- Enthalten Referenzen auf Items (und optional Tools)
- Können Gesamtkosten/Gewicht haben ODER Einzelkosten der enthaltenen Items

**JSON-Struktur für `items` und `tools`:**
```json
{
  "items": [
    {"item_id": "laterne", "quantity": 1},
    {"item_id": "seil_50_fuss", "quantity": 1}  // Separate Items für Varianten
  ],
  "tools": [
    {"tool_id": "diebeswerkzeug", "quantity": 1}
  ]
}
```

**Hinweis:** Für Varianten (z.B. "Seil (50 Fuß)" vs "Seil (100 Fuß)") werden separate Items erstellt (z.B. `seil_50_fuss`, `seil_100_fuss`). Die `quantity` in Equipment-Referenzen ist immer in "Stück" (Anzahl), um Gewichtsberechnungen konsistent zu halten.

### 3. Tools (Werkzeuge)

**Hinweis:** Die `core_tools` und `custom_tools` Tabellen existieren bereits im Schema!

Die Struktur ist bereits vorhanden:
```sql
CREATE TABLE core_tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,  -- z.B. "Handwerkszeug", "Musikinstrument", "Spielset"
    cost_gp REAL NOT NULL,
    weight_kg REAL NOT NULL,
    data JSON NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);
```

**Kriterien für Tools:**
- Aus der Werkzeuge-Tabelle (Seite 220-221)
- Haben eine Kategorie (Handwerkszeug, Musikinstrument, Spielset, etc.)
- Können in Equipment-Paketen referenziert werden

## Extraktions-Strategie

### Phase 1: Identifikation im Regelwerk

1. **Werkzeuge (Seite 220-221)**
   - Tabelle "Werkzeuge" komplett extrahieren
   - Jede Zeile = ein Werkzeug
   - Kategorie aus Spalten-Header ableiten

2. **Gegenstände (Seite 221+)**
   - Standard-Ausrüstung Tabelle durchgehen
   - Jede Zeile = ein Item (falls nicht Teil eines Pakets)
   - Items haben: Name, Kosten, Gewicht

3. **Ausrüstungen (Seite 221+)**
   - Textblöcke mit Listen identifizieren (z.B. "Bürgerausrüstung enthält: ...")
   - Jede Liste = ein Equipment-Paket
   - Items in der Liste referenzieren (über Name → Item-ID Mapping)

### Phase 2: Datenbereinigung

**Prinzipien:**
- **Nichts hinzudichten**: Nur extrahieren, was explizit im Regelwerk steht
- **Original-Namen**: Deutsche Namen aus dem Regelwerk verwenden
- **Konsistenz**: Einheitliche Formatierung (Groß-/Kleinschreibung, etc.)

**Probleme & Lösungen:**

1. **Item-Name nicht eindeutig**
   - Lösung: Suffix/Präfix verwenden (z.B. "Laterne (gefüllt)" vs "Laterne (leer)")
   - Oder: In `data` JSON vermerken

2. **Gewicht/Einheiten**
   - Lösung: Immer in kg umrechnen (metrisch)
   - Original-Einheiten in `data` JSON speichern

3. **Kosten-Varianten**
   - Lösung: Standard-Kosten in `cost_gp`, Varianten in `data` JSON

### Phase 3: Abhängigkeiten & Verlinkungen

**Equipment → Items/Tools:**

1. **Extraktion:**
   - Wenn Equipment-Paket "Laterne" enthält → Referenz auf Item-ID "laterne"
   - Wenn Equipment-Paket "Diebeswerkzeug" enthält → Referenz auf Tool-ID "diebeswerkzeug"

2. **Validierung:**
   - Nach Extraktion prüfen: Alle referenzierten Item/Tool-IDs existieren
   - Fehlende Referenzen als Warnung/Fehler markieren

3. **Struktur:**
   ```json
   {
     "items": [
       {"item_id": "laterne", "quantity": 1},
       {"item_id": "seil_50_fuss", "quantity": 1}  // Separate Items für Varianten
     ],
     "tools": [
       {"tool_id": "diebeswerkzeug", "quantity": 1}
     ]
   }
   ```

## Extraktions-Script Strategie

### Script-Struktur

1. **PDF/DOCX → Text**
   - Text aus Regelwerk extrahieren (mammoth für DOCX)
   - Strukturierung erkennen (Tabellen, Listen, Absätze)

2. **Parsing**
   - Tabellen erkennen (z.B. "Werkzeuge Tabelle")
   - Listen erkennen (z.B. "Bürgerausrüstung enthält:")
   - Einzelgegenstände erkennen

3. **Klassifizierung**
   - Tool? → `core_tools`
   - Item? → `core_items` (neue Tabelle)
   - Equipment-Paket? → `core_equipment` (neue Tabelle)

4. **Referenz-Auflösung**
   - Equipment-Paket enthält "Laterne" → Suche Item-ID für "Laterne"
   - Mapping: Name → ID (mit Fallback-Logik)

5. **Validierung**
   - Alle Referenzen vorhanden?
   - Alle Pflichtfelder ausgefüllt?
   - Konsistenz-Checks (z.B. Kosten > 0)

### Beispiel-Extraktion

**Input (Regelwerk Text):**
```
Werkzeuge
Handwerkszeug
Alchemistenausrüstung    50 GM    4 kg
Kalligrafenwerkzeug      10 GM    2,5 kg

Standard-Ausrüstung
Laterne                   5 GM    1 kg
Seil (50 Fuß)             1 GM    5 kg

Bürgerausrüstung
Dieses Paket enthält:
- Kleidung (alltäglich)
- Gürteltasche
- Laterne
- Seil (50 Fuß)
```

**Output:**

```json
// core_tools
{
  "id": "alchemistenausruestung",
  "name": "Alchemistenausrüstung",
  "category": "Handwerkszeug",
  "cost_gp": 50,
  "weight_kg": 4.0,
  "data": {}
}

// core_items
{
  "id": "laterne",
  "name": "Laterne",
  "description": "...",
  "cost_gp": 5,
  "weight_kg": 1.0,
  "category": "Abenteuerausrüstung",
  "data": {}
},
{
  "id": "seil_50_fuss",
  "name": "Seil (50 Fuß)",
  "description": "...",
  "cost_gp": 1,
  "weight_kg": 5.0,
  "category": "Abenteuerausrüstung",
  "data": {"length": "50 Fuß"}
}

// core_equipment
{
  "id": "buergerausruestung",
  "name": "Bürgerausrüstung",
  "description": "Dieses Paket enthält...",
  "total_cost_gp": null,  // Optional: Falls abweichend von Summe der Einzelkosten
  "items": [
    {"item_id": "kleidung_alltag", "quantity": 1},
    {"item_id": "guerteltasche", "quantity": 1},
    {"item_id": "laterne", "quantity": 1},
    {"item_id": "seil_50_fuss", "quantity": 1}
  ],
  "tools": [],
  "data": {}
}
```

## Migration von `core_gear`

**Schritte:**

1. **Bestehende `core_gear` Daten analysieren**
   - Welche Einträge sind Tools?
   - Welche Einträge sind Items?
   - Welche Einträge sind Equipment-Pakete?

2. **Klassifizierung**
   - Script zur automatischen Klassifizierung basierend auf Kriterien
   - Manuelle Überprüfung bei Unsicherheit

3. **Daten-Migration**
   - Tools → `core_tools` (dort bereits vorhanden, prüfen ob doppelt)
   - Items → `core_items` (neue Tabelle)
   - Equipment → `core_equipment` (neue Tabelle)

4. **Cleanup**
   - Nach erfolgreicher Migration: `core_gear` Tabelle optional löschen
   - Oder: `core_gear` View erstellen, der aus allen drei Tabellen kombiniert

## Nächste Schritte

1. ✅ Konzept erstellt
2. ⬜ Schema-Migration: `core_items` und `core_equipment` Tabellen erstellen
3. ⬜ Extraktions-Script für Tools, Items und Equipment
4. ⬜ Referenz-Auflösung: Equipment → Items/Tools
5. ⬜ Validierung: Alle Referenzen vorhanden
6. ⬜ Daten-Migration von `core_gear`
7. ⬜ Frontend: Kompendium-Tabs für Items, Equipment, Tools
8. ⬜ Background-Integration: Equipment-Pakete aus Hintergründen verlinken

## Entscheidungen

1. **Einheiten in Equipment:**
   - `quantity` in Equipment immer in "Stück" (Anzahl)
   - **Entscheidung:** Separate Items für Varianten (z.B. "Seil (50 Fuß)" → `seil_50_fuss`, "Seil (100 Fuß)" → `seil_100_fuss`)
   - **Begründung:** Konsistente Gewichtsangaben pro Item, einfache Berechnung, keine Einheiten-Konvertierung nötig
   - **Beispiel:** `{"item_id": "seil_50_fuss", "quantity": 1}` (statt `{"item_id": "seil", "quantity": 50, "unit": "Fuß"}`)

2. **Varianten:**
   - Wie mit Varianten umgehen? (z.B. "Laterne gefüllt" vs "Laterne leer")
   - **Entscheidung:** Separate Items (z.B. "laterne_gefuellt", "laterne_leer")
   - **Begründung:** Klare Trennung, einfache Referenzierung, bessere Datenintegrität

3. **Kosten-Genauigkeit:**
   - Equipment-Paket hat Gesamtkosten ODER Summe der Einzelkosten?
   - **Entscheidung:** `total_cost_gp` optional, falls abweichend von Summe der Einzelkosten
   - **Berechnung:** Wenn `total_cost_gp` nicht gesetzt → Summe aus referenzierten Items/Tools
   - **Fallback:** Summe der Einzelkosten als Standard

4. **Custom-Tabellen und parent_id-Constraints:**
   - **Entscheidung:** `parent_id` mit FOREIGN KEY Constraint (wie bei allen anderen Custom-Tabellen)
   - **Pattern:** `parent_id TEXT, FOREIGN KEY (parent_id) REFERENCES core_<table>(id)`
   - **Verhalten:**
     - `parent_id` ist optional (NULL erlaubt)
     - Wenn `parent_id` gesetzt → Override (überschreibt Core-Eintrag)
     - Wenn `parent_id` NULL → Homebrew (eigenständiger Eintrag)
   - **ON DELETE:** Standard-Verhalten (kein CASCADE, kein RESTRICT)
     - Bei Löschen eines Core-Eintrags bleiben Custom-Overrides erhalten (mit NULL parent_id)
     - Bei Löschen eines Custom-Override bleibt der Core-Eintrag unberührt
   - **Konsistenz:** Folgt dem bestehenden Pattern (wie `custom_spells`, `custom_species`, etc.)