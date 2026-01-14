# Empfehlung: Strukturierung von core_items und custom_items

## Analyse-Zusammenfassung

**Datum:** 2026-01-12  
**Analysierte Tabellen:** `core_items`, `custom_items`, `core_equipment`, Character-Inventar

### Ergebnisse

1. **Items selbst (core_items/custom_items):**
   - ✅ **0 Items** mit Klammern im Namen
   - ✅ **0 Items** mit Mengenangaben im Namen
   - ✅ **0 Items** mit Varianten im Namen
   - Items sind bereits atomar strukturiert: "Pergament", "Öl", "Buch"

2. **Equipment-Pakete (core_equipment):**
   - ✅ Verwenden bereits `quantity`-Felder: `{"item_id": "öl", "quantity": 10}`
   - ✅ 20 Einträge mit quantity > 1 gefunden
   - Struktur ist bereits korrekt

3. **Character-Inventar (CharacterItem):**
   - ✅ Hat bereits `quantity`-Feld in der Struktur
   - ✅ Struktur: `{id, item_id, quantity, is_equipped, custom_data}`

4. **Background starting_equipment:**
   - ✅ Wurde bereits strukturiert (separate Migration)
   - Items werden jetzt als strukturierte Objekte gespeichert

## Empfehlung: **NICHT strukturieren**

### Begründung

#### 1. Items sind atomare Einheiten

Items in `core_items` und `custom_items` repräsentieren **einzelne Gegenstände**:
- Ein Item = ein Eintrag in der Datenbank
- Ein Item hat einen Namen, Kosten, Gewicht, Beschreibung
- Mengen werden **nicht** im Item selbst gespeichert

**Beispiel:**
```sql
-- ✅ RICHTIG: Atomares Item
INSERT INTO core_items (id, name, cost_gp, weight_kg) 
VALUES ('pergament', 'Pergament', 0.2, 0.0);

-- ❌ FALSCH: Item mit Menge
INSERT INTO core_items (id, name, cost_gp, weight_kg) 
VALUES ('pergament_10', 'Pergament (10 Blätter)', 2.0, 0.0);
```

#### 2. Mengen werden auf höherer Ebene verwaltet

Mengenangaben gehören **nicht** in die Item-Definition, sondern in die **Verwendung**:

- **Equipment-Pakete:** `{"item_id": "pergament", "quantity": 10}`
- **Character-Inventar:** `{item_id: "pergament", quantity: 10}`
- **Background starting_equipment:** `{name: "Pergament", quantity: 10, unit: "Blätter"}`

#### 3. Varianten sollten separate Items sein

Wenn es verschiedene Varianten eines Items gibt (z.B. "Buch (Gebete)" vs. "Buch (Philosophie)"), sollten diese als **separate Items** gespeichert werden:

```sql
-- ✅ RICHTIG: Separate Items für Varianten
INSERT INTO core_items (id, name) VALUES ('buch_gebete', 'Buch (Gebete)');
INSERT INTO core_items (id, name) VALUES ('buch_philosophie', 'Buch (Philosophie)');

-- ❌ FALSCH: Ein Item mit Varianten-Feld
INSERT INTO core_items (id, name, variant) VALUES ('buch', 'Buch', 'Gebete');
```

**Alternative:** Varianten können im `data` JSON-Feld gespeichert werden, wenn sie nur für Anzeige-Zwecke sind.

#### 4. Aktuelle Architektur ist korrekt

Die aktuelle Struktur folgt dem **Single Source of Truth** Prinzip:

```
core_items (atomare Items)
    ↓
Equipment-Pakete (Referenzen + quantity)
    ↓
Character-Inventar (Referenzen + quantity)
```

**Vorteile:**
- Ein Item wird einmal definiert
- Mengen werden dort verwaltet, wo sie benötigt werden
- Keine Redundanz
- Einfache Wartung

## Vergleich: Background vs. Items

### Background starting_equipment (strukturiert)

**Warum strukturiert?**
- Items kommen als **Strings** aus dem Regelwerk: "Pergament (10 Blätter)"
- Müssen **parsed** werden, um Item-Referenz zu finden
- Strukturierung macht Parsing und Zuordnung einfacher

**Struktur:**
```json
{
  "name": "Pergament",
  "quantity": 10,
  "unit": "Blätter",
  "variant": null
}
```

### Items (nicht strukturiert)

**Warum nicht strukturiert?**
- Items sind bereits **atomar** definiert
- Keine Parsing nötig
- Mengen werden in Equipment/Inventar verwaltet
- Strukturierung würde Redundanz schaffen

**Struktur:**
```sql
-- Item-Definition (atomar)
name: "Pergament"
cost_gp: 0.2
weight_kg: 0.0

-- Verwendung (mit Menge)
Equipment: {"item_id": "pergament", "quantity": 10}
Inventar: {item_id: "pergament", quantity: 10}
```

## Szenarien-Analyse

### Szenario 1: "Pergament (10 Blätter)" als Item

**Aktuell:**
```sql
-- Item
id: "pergament", name: "Pergament"

-- Background
{name: "Pergament", quantity: 10, unit: "Blätter"}

-- Equipment
{"item_id": "pergament", "quantity": 10}
```

**Mit Strukturierung:**
```sql
-- Item (redundant)
id: "pergament", name: "Pergament", default_quantity: 10, default_unit: "Blätter"

-- Background (redundant)
{name: "Pergament", quantity: 10, unit: "Blätter"}

-- Equipment (redundant)
{"item_id": "pergament", "quantity": 10}
```

**Problem:** Redundanz, Inkonsistenz-Risiko

### Szenario 2: "Buch (Gebete)" als Item

**Aktuell:**
```sql
-- Separate Items
id: "buch_gebete", name: "Buch (Gebete)"
id: "buch_philosophie", name: "Buch (Philosophie)"
```

**Mit Strukturierung:**
```sql
-- Ein Item mit Varianten
id: "buch", name: "Buch", variants: ["Gebete", "Philosophie"]
```

**Problem:** 
- Komplexere Abfragen nötig
- Varianten müssen separat gespeichert werden
- Kein Vorteil gegenüber separaten Items

## Empfehlung: Beibehaltung der aktuellen Struktur

### ✅ Vorteile der aktuellen Struktur

1. **Klarheit:** Items sind atomar, Mengen werden dort verwaltet, wo sie gebraucht werden
2. **Flexibilität:** Gleiches Item kann in verschiedenen Kontexten unterschiedliche Mengen haben
3. **Wartbarkeit:** Änderungen an Items betreffen alle Verwendungen automatisch
4. **Performance:** Einfache Abfragen, keine komplexen JSON-Parsing-Operationen
5. **Konsistenz:** Equipment-Pakete und Inventar verwenden bereits quantity-Felder

### ❌ Nachteile einer Strukturierung

1. **Redundanz:** Mengen würden mehrfach gespeichert (Item, Equipment, Inventar)
2. **Inkonsistenz-Risiko:** Verschiedene Mengen in verschiedenen Kontexten
3. **Komplexität:** Zusätzliche Felder, die nicht immer benötigt werden
4. **Kein Nutzen:** Items haben keine Mengenangaben im Namen, daher keine Parsing nötig

## Ausnahmen und Sonderfälle

### Wenn Items doch Mengenangaben hätten

Falls in Zukunft Items mit Mengenangaben im Namen auftauchen (z.B. "Öl (Flasche)"), sollten diese:

1. **Als separate Items** gespeichert werden: "Öl (Flasche)" vs. "Öl (Fass)"
2. **Oder im `data` JSON-Feld** als Metadaten gespeichert werden
3. **NICHT** in die Hauptstruktur integriert werden

### Beispiel für data-Feld:

```json
{
  "id": "öl",
  "name": "Öl",
  "data": {
    "default_unit": "Flasche",
    "default_quantity": 1,
    "variants": ["Flasche", "Fass"]
  }
}
```

## Fazit

**Empfehlung: Items NICHT strukturieren**

Die aktuelle Architektur ist korrekt und folgt Best Practices:
- Items sind atomare Einheiten
- Mengen werden auf der Verwendungs-Ebene verwaltet
- Keine Redundanz
- Einfache Wartung

Die Strukturierung von Background starting_equipment war notwendig, weil Items dort als Strings mit Mengenangaben kommen. Bei Items selbst ist dies nicht der Fall.

## Checkliste

- [x] Items haben keine Mengenangaben im Namen
- [x] Equipment-Pakete verwenden bereits quantity-Felder
- [x] Character-Inventar verwendet bereits quantity-Felder
- [x] Items sind atomar strukturiert
- [x] Keine Redundanz in der aktuellen Struktur
- [x] Background starting_equipment wurde bereits strukturiert (separate Migration)

**Entscheidung: Keine Änderung nötig**
