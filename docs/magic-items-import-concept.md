# Konzept: Magische Gegenstände aus `2024_D&D Spielleiterhandbuch (2024).pdf` nach `exports/items.json`

Ziel: Die magischen Gegenstände (ab Buchseite 227 / physisch 228) automatisiert aus dem PDF extrahieren und **unter dem passenden Objekt** in `exports/items.json` ablegen.  
Wichtig: **Nichts erfinden** – nur Fakten aus dem Buch. Gleichzeitig sollen erkannte Eigenschaften **atomar** gespeichert werden, ohne Informationsverlust (Text/Tables bleiben vollständig erhalten).

---

## 1) Ziel-Output: Erweiterung von `exports/items.json`

Aktueller Zustand: `exports/items.json` ist ein JSON-Array von Objekten mit mindestens:

```json
{ "name": "..." }
```

Neuer Zustand: Jedes Objekt darf (optional) eine strukturierte `source` und `magic`-Sektion erhalten. Nicht-magische Items können weiterhin nur `{ "name": "..." }` enthalten.

### 1.1 Empfohlenes Schema (atomar + „verlustfrei“)

```json
{
  "name": "AMULETT DER GESUNDHEIT",
  "source": {
    "book": "2024_D&D Spielleiterhandbuch (2024).pdf",
    "start_page_logical": 227,
    "end_page_logical": 227,
    "start_page_physical": 228,
    "end_page_physical": 228
  },
  "magic": {
    "category": "Wundersamer Gegenstand",
    "rarity": "selten",
    "requires_attunement": true,
    "attunement": {
      "required": true,
      "condition": null
    },
    "crafting": {
      "tools": ["Tüftlerwerkzeug"],
      "tool_basis": "category_mapping",
      "tool_note": null
    },
    "tags": ["magisch"],
    "facts": {
      "bonuses": {
        "ac": null,
        "attack_roll": null,
        "damage_roll": null,
        "save_dc": null,
        "spell_attack": null
      },
      "charges": {
        "max": null,
        "recharge": null
      },
      "activation": {
        "time": null,
        "action_type": null,
        "trigger": null,
        "command_word": null
      },
      "duration": null,
      "range": null,
      "area": null,
      "saving_throw": {
        "ability": null,
        "dc": null
      },
      "spells_granted": [],
      "requirements": []
    },
    "text_blocks": [
      { "type": "paragraph", "text": "..." },
      {
        "type": "table",
        "columns": ["...", "..."],
        "rows": [["...", "..."], ["...", "..."]],
        "raw": null
      }
    ],
    "raw": {
      "title": "AMULETT DER GESUNDHEIT",
      "meta_line": "Wundersamer Gegenstand, selten (Einstimmung erforderlich)",
      "notes": []
    }
  }
}
```

**Prinzipien:**
- **Atomar**: alles, was sicher extrahiert werden kann (Seltenheit, Kategorie, Einstimmung, Boni, Aufladungen, etc.) landet in `facts`.
- **Verlustfrei**: die vollständige Beschreibung inkl. Tabellen landet als Sequenz in `text_blocks`.
- **Auditierbar**: `raw.meta_line` + `source` machen Debug/Review möglich.
- **Kein Erfinden**: Felder bleiben `null`/leer, wenn nicht eindeutig im Buch steht.

---

## 2) Kategorien + Herstellwerkzeuge (Mapping)

Die Herstellwerkzeuge werden automatisch aus der Kategorie abgeleitet und im Item gespeichert:

| Gegenstandskategorie | Erforderliches Werkzeug |
| :--- | :--- |
| Ring | Juwelierwerkzeug |
| Rüstung | Ledererwerkzeug, Schmiedewerkzeug oder Weberwerkzeug (je nach Art der Rüstung) |
| Schriftrolle | Kalligrafiewerkzeug |
| Stab | Holzschnitzwerkzeug |
| Trank | Alchemistenausrüstung oder Kräuterkundeausrüstung |
| Waffe | Ledererwerkzeug, Schmiedewerkzeug oder Holzschnitzwerkzeug (je nach Art der Waffe) |
| Wundersamer Gegenstand | Tüftlerwerkzeug oder das Werkzeug für den entsprechenden Basisgegenstand |
| Zauberstab | Holzschnitzwerkzeug |
| Zepter | Holzschnitzwerkzeug |

### 2.1 „Je nach Art …“ ohne Erfinden
Wenn das Buch die konkrete Art nicht klar macht, speichern wir **die erlaubte Tool-Liste** und kennzeichnen die Basis:
- `crafting.tools`: Liste
- `crafting.tool_basis`: `"category_mapping"`
- `crafting.tool_note`: optional, z.B. „abhängig von Material/Grundobjekt“

Falls das Grundobjekt eindeutig ist (z.B. „Plattenpanzer“, „Lederrüstung“, „Langschwert“, „Bogen“), darf zusätzlich eine deterministische Eingrenzung erfolgen:
- `crafting.tool_basis`: `"inferred_from_name_or_text"`
- `crafting.tool_note`: kurzer Begründungstext (kein Fließroman)

---

## 3) Extraktion aus PDF: Warum `pdf-parse` „roh“ nicht reicht

Der bestehende Parser nutzt `pdf-parse` und `data.text`. Das ist für:
- **2-Spalten-Layout**
- **spaltenübergreifende Tabellen**
- **Umbrüche über Seiten**

nicht zuverlässig, weil die Lesereihenfolge im Fließtext „vermischt“ werden kann.

**Konzept-Ansatz**: PDF seitenweise mit Layout-Information (X/Y) lesen und selbst eine stabile Lesereihenfolge rekonstruieren.

### 3.1 Technischer Ansatz
- `pdf-parse` lässt eine Custom-`pagerender`-Funktion zu (PDF.js-TextItems mit Transform/X/Y).
- Pro Seite wird eine Liste von Tokens erzeugt:
  - `{ text, x, y, fontSize?, width?, height? }`

Danach werden Tokens zu Zeilen/Spalten gruppiert und in eine definierte Reihenfolge gebracht.

---

## 4) Robustheit: Mehrspalten + Mehrseiten + Tabellen

### 4.1 Zeilenbildung (pro Seite)
- Cluster nach `y` (Toleranz z.B. 1–3px relativ zur Skala)
- innerhalb einer Zeile nach `x` sortieren und zusammenfügen
- Silbentrennungen heilen (`-\n`-Artefakte), aber nur wenn sicher (wie im bestehenden Spell-Parser)

### 4.2 Spaltenerkennung (pro Seite)
- Analyse der `x`-Verteilung pro Zeile → typischerweise 2 Hauptcluster (links/rechts)
- Spalten-Grenze dynamisch bestimmen (z.B. Median-Lücke)
- Lesereihenfolge:
  - linke Spalte von oben nach unten
  - dann rechte Spalte von oben nach unten

### 4.3 Item-Grenzen (Start/Ende eines Gegenstands)
**Start-Heuristiken (kombiniert, um False Positives zu vermeiden):**
- Titel-Zeile ist kurz/mittel (z.B. 3–60 Zeichen), keine Satzendzeichen
- typografisch hervorgehoben (wenn Font-Infos verfügbar)
- gefolgt von einer Meta-Zeile mit Keywords: Kategorie + Seltenheit + optional Einstimmung

**Ende**: nächster erkannter Item-Start oder Ende des Abschnitts.

### 4.4 Meta-Zeile parsen (Kategorie/Seltenheit/Einstimmung)
Aus der Meta-Zeile werden atomar extrahiert:
- `category`: eines der Keywords (Ring/Rüstung/Schild/Waffe/…)
- `rarity`: {gewöhnlich, ungewöhnlich, selten, sehr selten, legendär}
- `requires_attunement`: wenn „Einstimmung“ vorkommt
- `attunement.condition`: falls im Text enthalten (z.B. „(nur von …)“)

Wenn Meta-Zeile nicht sauber erkannt wird:
- `raw.meta_line` befüllen
- `magic.category|rarity|attunement` bleiben leer/`null`
- Item geht in den QA-Report (siehe §7)

### 4.5 Tabellen erkennen & rekonstruieren
Tabellen sind kritisch, weil sie oft spaltenübergreifend sind.

**Erkennung (Layout-basiert):**
- viele Tokens in einem begrenzten `y`-Band
- mehrere stabile `x`-Cluster (mehr als 2) über mehrere Zeilen
- wiederkehrende `x`-Startpunkte (Spaltenraster)

**Rekonstruktion:**
- Spaltenraster aus `x`-Clustern ableiten
- Zeilen per `y` clustern
- pro Zeile die Tokens dem nächsten Spaltenbucket zuordnen

**Output**:
- als eigener `text_blocks`-Eintrag `{type:"table", columns?, rows, raw?}`
- wenn die Rekonstruktion unsicher ist: `raw` mit dem „best effort“ Text füllen und im Report markieren.

### 4.6 Multi-Page-Fortsetzungen
Der aktuelle Item-Block bleibt offen, wenn:
- am Seitenende kein neuer validierter Item-Start kommt
- die nächste Seite im selben Abschnitt weitergeht

`source.end_page_*` wird entsprechend hochgezogen.

---

## 5) „Atomare Fakten“ aus Beschreibung extrahieren (ohne Erfinden)

Zusätzlich zur Meta-Zeile werden aus der Beschreibung **nur sicher erkennbare** Fakten extrahiert:

### 5.1 Typische Muster (Beispiele)
- **Boni**: „+1 Bonus auf Angriffs- und Schadenswürfe“ → `facts.bonuses.attack_roll=1`, `damage_roll=1`
- **RK/AC**: „Du erhältst +1 auf RK“ → `facts.bonuses.ac=1`
- **Aufladungen**: „hat X Aufladungen“ → `facts.charges.max=X`
- **Aufladen**: „lädt sich bei Tagesanbruch …“ → `facts.charges.recharge="..."` (Text, nicht interpretieren)
- **Rettungswurf/DC**: „SG 15 WEI-Rettungswurf“ → `facts.saving_throw.ability="WIS"`, `facts.saving_throw.dc=15`
- **Zauber**: „Du kannst den Zauber … wirken“ → `facts.spells_granted[]` (Name + falls genannt Grad/Frequenz)

### 5.2 Regel: immer Text bleibt Wahrheit
Selbst wenn `facts` gefüllt werden, bleibt die komplette Beschreibung in `text_blocks`.  
`facts` ist nur eine „Indexierung“/Strukturierung.

---

## 6) Verknüpfung mit `exports/items.json` („unter dem passenden Objekt“)

### 6.1 Matching
Für jeden extrahierten Gegenstand:
- Normalisierung:
  - Trim
  - Mehrfachspaces reduzieren
  - Bindestriche vereinheitlichen
  - optional: Unicode Normalization (NFKC)
- Matching-Strategie:
  - **exakt** auf `name`
  - sonst **fuzzy** (Token-Set + Levenshtein) mit Schwellwert

### 6.2 Schreibregel
- Bei sicherem Match: `items[i].magic = …` (überschreiben, aber mit Backup/Report)
- Bei unsicherem/kein Match:
  - **nicht** blind anlegen (um Duplikate zu vermeiden)
  - in Report schreiben (siehe §7)

Optional (wenn gewünscht): `items[i].source` auch für nicht-magische Einträge befüllen, falls sie im Buch vorkommen.

---

## 7) QA/Review: Report statt stille Fehler

Neben dem Update von `exports/items.json` wird ein Report erzeugt, z.B.:
- `exports/magic-items-import-report.json`

Inhalte:
- `unmatched`: extrahierte Items ohne Match
- `fuzzy_matches`: Match-Vorschläge mit Confidence
- `missing_meta`: Items ohne sauber geparste Meta-Zeile
- `table_parse_warnings`: Tabellen, die nur „raw“ gespeichert wurden
- `stats`: Anzahl extrahierter Items, aktualisierte Items, etc.

---

## 8) Konfigurierbarkeit

Damit das reproduzierbar wird, sollten diese Parameter konfigurierbar sein:
- PDF-Dateipfad
- Start/Ende des Abschnitts (logische/physische Seiten oder Marker-Text)
- Spaltenanzahl-Heuristik (2-Spalten/1-Spalte je nach Seiten)
- Schwellwerte (Y-Cluster, Fuzzy-Match)

---

## 9) Umsetzungsschritte (high level)

1. PDF-Seitenlayout extrahieren (X/Y-Tokens pro Seite)
2. Lesereihenfolge stabil rekonstruieren (Spalten/Zeilen)
3. Item-Start/Meta zuverlässig erkennen
4. Beschreibung + Tabellen als `text_blocks` sammeln (multi-page)
5. Fakten „best effort“ atomar extrahieren (nur sichere Patterns)
6. Match gegen `exports/items.json` und dort unter dem Objekt speichern
7. Report + Stats erzeugen

