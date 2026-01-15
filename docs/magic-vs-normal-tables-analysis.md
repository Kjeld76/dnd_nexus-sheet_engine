# Analyse: Magische vs. Normale Tabellenstrukturen

## 🔍 Status Quo: Struktur-Unterschiede

### 1. Waffen

#### Normale Waffen: `core_weapons` / `custom_weapons`
**Design:** Monolithisch - alle Daten in einer Tabelle
```sql
core_weapons:
  - id (PK)
  - name, category, weapon_type
  - damage_dice, damage_type
  - weight_kg, cost_gp
  - data (JSON)
  - mastery_id
  - created_at
```

#### Magische Waffen: `core_mag_weapons` + `core_mag_items_base`
**Design:** Normalisiert - Basis-Tabelle + Erweiterungstabelle
```sql
core_mag_items_base:
  - id (PK)
  - name, category, rarity
  - source_book, source_page
  - requires_attunement
  - facts_json
  - created_at

core_mag_weapons:
  - item_base_id (PK, FK → core_mag_items_base.id)
  - weapon_type
  - attack_bonus, damage_bonus
```

**Problem:** 
- ❌ **Unterschiedliche Design-Patterns** (monolithisch vs. normalisiert)
- ❌ **Fehlende Felder** in `core_mag_weapons`: `damage_dice`, `damage_type`, `weight_kg`, `cost_gp`, `mastery_id`
- ❌ **Keine Custom-Variante**: `custom_mag_weapons` existiert nicht

---

### 2. Rüstungen

#### Normale Rüstungen: `core_armors` / `custom_armors`
**Design:** Monolithisch
```sql
core_armors:
  - id (PK)
  - name, category
  - base_ac, ac_bonus, ac_formula
  - strength_requirement
  - stealth_disadvantage
  - don_time_minutes, doff_time_minutes
  - weight_kg, cost_gp
  - data (JSON)
  - created_at
```

#### Magische Rüstungen: `core_mag_armor` + `core_mag_items_base`
**Design:** Normalisiert
```sql
core_mag_armor:
  - item_base_id (PK, FK → core_mag_items_base.id)
  - armor_type
  - ac_bonus
```

**Problem:**
- ❌ **Fehlende Felder** in `core_mag_armor`: `base_ac`, `ac_formula`, `strength_requirement`, `stealth_disadvantage`, `don_time_minutes`, `doff_time_minutes`, `weight_kg`, `cost_gp`
- ❌ **Keine Custom-Variante**: `custom_mag_armor` existiert nicht

---

### 3. Items

#### Normale Items: `core_items` / `custom_items`
**Design:** Monolithisch
```sql
core_items:
  - id (PK)
  - name, description
  - cost_gp, weight_kg
  - category
  - data (JSON)
  - created_at
```

#### Magische Items: `core_mag_items_base` + Kategorie-spezifische Tabellen
**Design:** Normalisiert
```sql
core_mag_items_base:
  - id (PK)
  - name, category, rarity
  - source_book, source_page
  - requires_attunement
  - facts_json
  - created_at

+ core_mag_consumables, core_mag_focus_items, 
  core_mag_jewelry, core_mag_wondrous, etc.
```

**Problem:**
- ❌ **Unterschiedliche Felder**: `core_items` hat `description`, `cost_gp`, `weight_kg` - `core_mag_items_base` hat diese nicht direkt
- ❌ **Keine Custom-Variante**: `custom_mag_items_base` existiert nicht

---

## ⚠️ Kritische Probleme

### 1. Fehlende Custom-Varianten
**Betroffene Tabellen:**
- ❌ `custom_mag_weapons` - existiert nicht
- ❌ `custom_mag_armor` - existiert nicht  
- ❌ `custom_mag_items_base` - existiert nicht
- ❌ `custom_mag_consumables` - existiert nicht
- ❌ `custom_mag_focus_items` - existiert nicht
- ❌ `custom_mag_jewelry` - existiert nicht
- ❌ `custom_mag_wondrous` - existiert nicht

**Impact:** 
- **Keine Möglichkeit, Homebrew magische Items zu speichern**
- Inkonsistent mit dem Rest der Datenbank (core/custom Pattern)

### 2. Fehlende Felder in magischen Tabellen
**core_mag_weapons fehlt:**
- `damage_dice`, `damage_type` (wichtig für Schadensberechnung)
- `weight_kg`, `cost_gp` (wichtig für Encumbrance/Wirtschaft)
- `mastery_id` (wichtig für Waffen-Meisterschaften)

**core_mag_armor fehlt:**
- `base_ac`, `ac_formula` (wichtig für RK-Berechnung)
- `strength_requirement` (wichtig für Anforderungen)
- `stealth_disadvantage` (wichtig für Stealth-Regeln)
- `don_time_minutes`, `doff_time_minutes` (wichtig für Anlegezeiten)
- `weight_kg`, `cost_gp`

### 3. Inkonsistente Design-Patterns
- **Normale Items:** Monolithisch (alles in einer Tabelle)
- **Magische Items:** Normalisiert (Basis + Erweiterungstabellen)

**Problem:** 
- Unterschiedliche Query-Patterns
- Schwerer zu warten
- Inkonsistente API-Struktur

---

## 💡 Empfehlungen

### Option A: Magische Tabellen erweitern (Minimal-Invasiv)
**Vorgehen:**
1. Fehlende Felder zu `core_mag_weapons` und `core_mag_armor` hinzufügen
2. Custom-Varianten erstellen (analog zu `custom_weapons`, `custom_armors`)

**Vorteile:**
- ✅ Minimal-invasive Änderungen
- ✅ Behält aktuelles Design bei
- ✅ Schnell umsetzbar

**Nachteile:**
- ⚠️ Behält Design-Inkonsistenz bei

### Option B: Normale Tabellen normalisieren (Konsistent)
**Vorgehen:**
1. `core_weapons` → `core_weapons_base` + `core_weapons_stats` (analog zu magischen Items)
2. `core_armors` → `core_armors_base` + `core_armors_stats`
3. Alle Tabellen folgen demselben Pattern

**Vorteile:**
- ✅ Konsistentes Design
- ✅ Einheitliche Query-Patterns
- ✅ Einfacher zu erweitern

**Nachteile:**
- ⚠️ Breaking Changes für Frontend
- ⚠️ Mehr Aufwand

### Option C: Hybrid (Empfohlen)
**Vorgehen:**
1. **Magische Tabellen erweitern** (fehlende Felder + Custom-Varianten)
2. **Normale Tabellen unverändert lassen** (zu viel Breaking Change)
3. **Views erstellen**, die beide Strukturen vereinheitlichen

**Vorteile:**
- ✅ Keine Breaking Changes
- ✅ Magische Items vollständig
- ✅ Custom-Varianten möglich
- ✅ Views für konsistente API

**Nachteile:**
- ⚠️ Weiterhin zwei Design-Patterns (aber durch Views abstrahiert)

---

## 📋 Konkrete SQL-Änderungen (Option C)

### 1. Erweitere `core_mag_weapons`
```sql
ALTER TABLE core_mag_weapons ADD COLUMN damage_dice TEXT;
ALTER TABLE core_mag_weapons ADD COLUMN damage_type TEXT;
ALTER TABLE core_mag_weapons ADD COLUMN weight_kg REAL;
ALTER TABLE core_mag_weapons ADD COLUMN cost_gp REAL;
ALTER TABLE core_mag_weapons ADD COLUMN mastery_id TEXT;
```

### 2. Erweitere `core_mag_armor`
```sql
ALTER TABLE core_mag_armor ADD COLUMN base_ac INTEGER;
ALTER TABLE core_mag_armor ADD COLUMN ac_formula TEXT;
ALTER TABLE core_mag_armor ADD COLUMN strength_requirement INTEGER;
ALTER TABLE core_mag_armor ADD COLUMN stealth_disadvantage BOOLEAN DEFAULT 0;
ALTER TABLE core_mag_armor ADD COLUMN don_time_minutes INTEGER;
ALTER TABLE core_mag_armor ADD COLUMN doff_time_minutes INTEGER;
ALTER TABLE core_mag_armor ADD COLUMN weight_kg REAL;
ALTER TABLE core_mag_armor ADD COLUMN cost_gp REAL;
```

### 3. Erstelle Custom-Varianten
```sql
-- Analog zu core_mag_* Tabellen
CREATE TABLE custom_mag_items_base (...);
CREATE TABLE custom_mag_weapons (...);
CREATE TABLE custom_mag_armor (...);
-- etc.
```

---

## 🎯 Empfehlung

**Option C (Hybrid)** ist die beste Balance:
- ✅ Minimal-invasive Änderungen
- ✅ Vollständige Funktionalität für magische Items
- ✅ Custom-Varianten möglich
- ✅ Keine Breaking Changes

Soll ich mit Option C fortfahren?
