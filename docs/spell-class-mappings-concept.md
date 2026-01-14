# Zauber-Klassen-Mapping: Konzept

## Übersicht

Mapping-Tabelle für viele-zu-viele Beziehung zwischen Zaubern und Klassen. Ersetzt komma-getrennte `classes` Strings durch normalisierte Struktur für optimale Performance und Typsicherheit.

---

## Problemstellung

### Aktueller Zustand

```sql
-- core_spells.classes: TEXT (z.B. "Kleriker, Paladin, Hexenmeister")
SELECT * FROM core_spells WHERE classes LIKE '%Kleriker%';
```

**Probleme:**
- ❌ Komma-getrennte Strings sind schwer durchsuchbar
- ❌ Keine Typsicherheit (Tippfehler möglich)
- ❌ Langsame LIKE-Abfragen (kein Index)
- ❌ Schwer zu erweitern (z.B. "Welche Klassen können diesen Zauber?")
- ❌ Keine Validierung (ungültige Klassennamen möglich)

### Zielzustand

```sql
-- Schnelle JOIN-basierte Abfragen
SELECT s.* FROM all_spells s
JOIN spell_class_mappings scm ON s.id = scm.spell_id
WHERE scm.class_id = 'kleriker';
```

**Vorteile:**
- ✅ Schnelle JOIN-Abfragen (indiziert)
- ✅ Typsicherheit durch FOREIGN KEYs
- ✅ Einfache Erweiterung
- ✅ Validierung durch Referenzielle Integrität

---

## Datenbank-Schema

### 1. Klassen-Tabelle (BESTEHEND)

```sql
-- Bereits vorhanden, KEINE Änderungen
CREATE TABLE core_classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);
```

**Beispiel-Klassen:**
- `kleriker` → "Kleriker"
- `paladin` → "Paladin"
- `hexenmeister` → "Hexenmeister"
- `magier` → "Magier"
- `barde` → "Barde"
- `druide` → "Druide"
- `waldlaeufer` → "Waldläufer"
- `schurke` → "Schurke"
- `kaempfer` → "Kämpfer"
- `barbar` → "Barbar"
- `moench` → "Mönch"

### 2. Mapping-Tabelle (NEU)

```sql
-- NEU: Verknüpfung Zauber ↔ Klassen
-- Unterstützt sowohl core_spells als auch custom_spells via all_spells View
CREATE TABLE spell_class_mappings (
    spell_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    
    PRIMARY KEY (spell_id, class_id),
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE,
    -- FOREIGN KEY für spell_id wird über View validiert (spell_id muss in all_spells existieren)
    CHECK (EXISTS (SELECT 1 FROM all_spells WHERE id = spell_id))
);

CREATE INDEX idx_spell_class_spell ON spell_class_mappings(spell_id);
CREATE INDEX idx_spell_class_class ON spell_class_mappings(class_id);
```

**Hinweis:** 
- `spell_id` wird über `all_spells` View validiert (unterstützt `core_spells` UND `custom_spells`)
- `custom_spells` können eigene Klassen-Mappings haben (nicht nur über `parent_id`)
- Die bestehende `all_spells` View (aus `migrations.rs`) wird genutzt

### 3. Zauber-Tabellen (ANPASSUNG)

```sql
-- classes Feld bleibt für Rückwärtskompatibilität
-- Wird berechnet aus spell_class_mappings
CREATE TABLE core_spells (
    -- ... bestehende Felder ...
    classes TEXT NOT NULL,  -- BEHALTEN (für Legacy)
    -- ... rest ...
);
```

**Migration-Strategie:**
- `classes` Feld bleibt erhalten (Rückwärtskompatibilität)
- Wird automatisch aus `spell_class_mappings` berechnet (via View oder Trigger)

---

## Migration-Strategie

### Phase 1: Mapping-Tabelle erstellen

**File:** `migrations/006_add_spell_class_mappings.sql`

```sql
-- Migration: Spell Class Mappings Tabelle hinzufügen
-- Datum: 2025-01-12

CREATE TABLE IF NOT EXISTS spell_class_mappings (
    spell_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    
    PRIMARY KEY (spell_id, class_id),
    FOREIGN KEY (spell_id) REFERENCES core_spells(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_spell_class_spell 
    ON spell_class_mappings(spell_id);
    
CREATE INDEX IF NOT EXISTS idx_spell_class_class 
    ON spell_class_mappings(class_id);
```

### Phase 2: Bestehende Daten migrieren

**Script:** `scripts/migrate-spell-classes.ts`

```typescript
interface SpellClassMigration {
    spell_id: string;
    classes_string: string;  // z.B. "Kleriker, Paladin"
}

async function migrateSpellClasses() {
    const db = new Database();
    
    // 1. Alle Zauber mit classes String abrufen
    const spells = await db.query(`
        SELECT id, classes 
        FROM core_spells
        WHERE classes IS NOT NULL AND classes != ''
    `);
    
    console.log(`Migrating ${spells.length} spells...`);
    
    let migrated = 0;
    let failed = 0;
    
    for (const spell of spells) {
        try {
            // 2. Klassen-String parsen
            const classNames = parseClassString(spell.classes);
            
            // 3. Für jede Klasse Mapping erstellen
            for (const className of classNames) {
                const classId = slugify(className);
                
                // Prüfe ob Klasse existiert
                const classExists = await db.query(`
                    SELECT id FROM core_classes WHERE id = ?
                `, [classId]);
                
                if (classExists.length === 0) {
                    console.warn(`⚠️  Klasse nicht gefunden: ${className} (${classId})`);
                    // Optional: Klasse automatisch erstellen
                    // await createClass(classId, className);
                    continue;
                }
                
                // Mapping einfügen
                await db.insert('spell_class_mappings', {
                    spell_id: spell.id,
                    class_id: classId
                });
            }
            
            migrated++;
            process.stdout.write(`\r  Fortschritt: ${migrated}/${spells.length}`);
            
        } catch (error) {
            failed++;
            console.error(`\n❌ Fehler bei ${spell.id}:`, error.message);
        }
    }
    
    console.log(`\n✅ ${migrated} Zauber migriert, ${failed} fehlgeschlagen`);
}

function parseClassString(classes: string): string[] {
    // "Kleriker, Paladin, Hexenmeister" → ["Kleriker", "Paladin", "Hexenmeister"]
    return classes
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}
```

### Phase 3: View für Rückwärtskompatibilität

**File:** `migrations/006_add_spell_class_mappings.sql` (erweitert)

```sql
-- View: Berechnet classes String aus Mappings (Rückwärtskompatibilität)
CREATE VIEW IF NOT EXISTS spells_with_classes AS
SELECT 
    s.*,
    COALESCE(
        (SELECT GROUP_CONCAT(c.name, ', ')
         FROM spell_class_mappings scm
         JOIN core_classes c ON scm.class_id = c.id
         WHERE scm.spell_id = s.id),
        s.classes  -- Fallback auf altes Feld
    ) as classes_computed
FROM all_spells s;
```

---

## Abfrage-Beispiele

### 1. Alle Zauber für eine Klasse

```sql
SELECT 
    s.id,
    s.name,
    s.level,
    s.school,
    s.casting_time,
    s.range
FROM all_spells s
JOIN spell_class_mappings scm ON s.id = scm.spell_id
WHERE scm.class_id = 'kleriker'
ORDER BY s.level, s.name;
```

**Performance:** ⚡ Sehr schnell (indiziert)

### 2. Welche Klassen können einen Zauber?

```sql
SELECT 
    c.id,
    c.name
FROM core_classes c
JOIN spell_class_mappings scm ON c.id = scm.class_id
WHERE scm.spell_id = 'feuerball'
ORDER BY c.name;
```

**Performance:** ⚡ Sehr schnell (indiziert)

### 3. Zauber für mehrere Klassen

```sql
SELECT DISTINCT
    s.id,
    s.name,
    s.level
FROM all_spells s
JOIN spell_class_mappings scm ON s.id = scm.spell_id
WHERE scm.class_id IN ('kleriker', 'paladin')
ORDER BY s.level, s.name;
```

### 4. Zauber die NUR für eine Klasse verfügbar sind

```sql
SELECT 
    s.id,
    s.name,
    COUNT(scm.class_id) as class_count
FROM all_spells s
JOIN spell_class_mappings scm ON s.id = scm.spell_id
GROUP BY s.id, s.name
HAVING class_count = 1;
```

### 5. Klassen-Statistiken

```sql
SELECT 
    c.name as class_name,
    COUNT(DISTINCT scm.spell_id) as spell_count,
    COUNT(DISTINCT CASE WHEN s.level = 0 THEN s.id END) as cantrips,
    COUNT(DISTINCT CASE WHEN s.level = 1 THEN s.id END) as level_1_spells
FROM core_classes c
LEFT JOIN spell_class_mappings scm ON c.id = scm.class_id
LEFT JOIN all_spells s ON scm.spell_id = s.id
GROUP BY c.id, c.name
ORDER BY spell_count DESC;
```

---

## Import-Strategie

### Neuer Zauber mit Klassen

```typescript
async function createSpellWithClasses(spell: Spell, classIds: string[]) {
    const db = new Database();
    
    // 1. Zauber erstellen
    await db.insert('core_spells', {
        id: spell.id,
        name: spell.name,
        level: spell.level,
        school: spell.school,
        casting_time: spell.casting_time,
        range: spell.range,
        components: spell.components,
        material_components: spell.material_components,
        duration: spell.duration,
        concentration: spell.concentration,
        ritual: spell.ritual,
        description: spell.description,
        higher_levels: spell.higher_levels,
        classes: classIds.join(', '),  // Legacy-Format
        data: JSON.stringify(spell.data)
    });
    
    // 2. Klassen-Mappings erstellen
    for (const classId of classIds) {
        await db.insert('spell_class_mappings', {
            spell_id: spell.id,
            class_id: classId
        });
    }
}
```

---

## Validierung

**Script:** `scripts/validate-spell-classes.ts`

```typescript
async function validateSpellClassMappings() {
    const errors = [];
    
    // 1. Alle class_ids existieren
    const invalidClasses = await db.query(`
        SELECT scm.spell_id, scm.class_id
        FROM spell_class_mappings scm
        LEFT JOIN core_classes c ON scm.class_id = c.id
        WHERE c.id IS NULL
    `);
    
    if (invalidClasses.length > 0) {
        errors.push({
            type: 'invalid_class',
            count: invalidClasses.length,
            items: invalidClasses
        });
    }
    
    // 2. Alle spell_ids existieren (in all_spells View: core oder custom)
    const invalidSpells = await db.query(`
        SELECT scm.spell_id, scm.class_id
        FROM spell_class_mappings scm
        LEFT JOIN all_spells s ON scm.spell_id = s.id
        WHERE s.id IS NULL
    `);
    
    if (invalidSpells.length > 0) {
        errors.push({
            type: 'invalid_spell',
            count: invalidSpells.length,
            items: invalidSpells
        });
    }
    
    // 3. Keine Duplikate
    const duplicates = await db.query(`
        SELECT spell_id, class_id, COUNT(*) as count
        FROM spell_class_mappings
        GROUP BY spell_id, class_id
        HAVING count > 1
    `);
    
    if (duplicates.length > 0) {
        errors.push({
            type: 'duplicate_mapping',
            count: duplicates.length,
            items: duplicates
        });
    }
    
    // 4. Konsistenz-Check: classes String vs. Mappings
    const inconsistencies = await db.query(`
        SELECT 
            s.id,
            s.name,
            s.classes as classes_string,
            (SELECT GROUP_CONCAT(c.name, ', ')
             FROM spell_class_mappings scm
             JOIN core_classes c ON scm.class_id = c.id
             WHERE scm.spell_id = s.id) as classes_from_mappings
        FROM core_spells s
        WHERE s.classes != COALESCE(
            (SELECT GROUP_CONCAT(c.name, ', ')
             FROM spell_class_mappings scm
             JOIN core_classes c ON scm.class_id = c.id
             WHERE scm.spell_id = s.id),
            ''
        )
    `);
    
    // Warnung, kein Fehler (Legacy-Feld kann abweichen)
    if (inconsistencies.length > 0) {
        console.warn(`⚠️  ${inconsistencies.length} Zauber mit inkonsistenten Klassen:`, inconsistencies);
    }
    
    // Ergebnis
    if (errors.length > 0) {
        console.error('❌ Validierung fehlgeschlagen:');
        errors.forEach(error => {
            console.error(`  - ${error.type}: ${error.count} Fehler`);
            console.error(JSON.stringify(error.items, null, 2));
        });
        throw new Error('Spell class validation failed');
    }
    
    console.log('✅ Validierung erfolgreich!');
    
    // Statistiken
    const stats = await db.query(`
        SELECT 
            COUNT(DISTINCT spell_id) as spells_with_classes,
            COUNT(DISTINCT class_id) as classes_used,
            COUNT(*) as total_mappings,
            (SELECT COUNT(*) FROM core_spells) as total_spells
        FROM spell_class_mappings
    `);
    
    console.log('📊 Statistiken:', stats[0]);
}
```

---

## Frontend-Integration

### TypeScript Types

```typescript
// src/lib/types/spell.ts
export interface Spell {
    id: string;
    name: string;
    level: number;
    school: string;
    // ... andere Felder ...
    classes: string[];  // ✅ Array statt String
    source: 'core' | 'homebrew' | 'override';
}

// API Response mit Klassen
export interface SpellWithClasses extends Spell {
    classes: string[];  // Array von Klassen-IDs
    classes_details: Array<{
        id: string;
        name: string;
    }>;
}
```

### API Query

```typescript
// src/lib/api.ts
export const compendiumApi = {
    // Bestehend: Gibt classes als String zurück
    async getAllSpells(): Promise<Spell[]> {
        return await invoke("get_all_spells");
    },
    
    // NEU: Gibt classes als Array zurück
    async getAllSpellsWithClasses(): Promise<SpellWithClasses[]> {
        return await invoke("get_all_spells_with_classes");
    },
    
    // NEU: Zauber für eine Klasse
    async getSpellsByClass(classId: string): Promise<Spell[]> {
        return await invoke("get_spells_by_class", { classId });
    },
    
    // NEU: Klassen für einen Zauber
    async getClassesForSpell(spellId: string): Promise<Class[]> {
        return await invoke("get_classes_for_spell", { spellId });
    }
};
```

### Rust Command

```rust
// src-tauri/src/commands/compendium.rs
#[tauri::command]
pub async fn get_all_spells_with_classes(
    db: State<'_, Database>
) -> Result<Vec<SpellWithClasses>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut stmt = conn.prepare(
        "SELECT 
            s.id, s.name, s.level, s.school, s.casting_time, s.range,
            s.components, s.material_components, s.duration, s.concentration,
            s.ritual, s.description, s.higher_levels, s.data, s.source,
            json_group_array(json_object('id', c.id, 'name', c.name)) as classes_details
        FROM all_spells s
        LEFT JOIN spell_class_mappings scm ON s.id = scm.spell_id
        LEFT JOIN core_classes c ON scm.class_id = c.id
        GROUP BY s.id
        ORDER BY s.level, s.name"
    ).map_err(|e| e.to_string())?;
    
    // ... Query ausführen und parsen ...
}
```

---

## Zusammenfassung & Checkliste

### ✅ Vorteile:

1. **Performance**
   - Schnelle JOIN-Abfragen (indiziert)
   - Keine LIKE-Suchen mehr
   - < 10ms Lookups

2. **Typsicherheit**
   - FOREIGN KEYs garantieren gültige Klassen
   - Keine Tippfehler möglich
   - Referenzielle Integrität

3. **Flexibilität**
   - Einfache Erweiterung
   - Komplexe Abfragen möglich
   - Statistiken einfach

4. **Rückwärtskompatibilität**
   - `classes` Feld bleibt erhalten
   - View berechnet String automatisch
   - Legacy-Code läuft weiter

### 📋 Implementation Checklist:

- [ ] Migration ausführen (`006_add_spell_class_mappings.sql`)
- [ ] Bestehende Daten migrieren (`migrate-spell-classes.ts` - core + custom via all_spells)
- [ ] View für Rückwärtskompatibilität erstellen
- [ ] Validierung durchführen
- [ ] Rust Commands erweitern (`get_all_spells_with_classes`)
- [ ] Frontend Types anpassen
- [ ] API Layer erweitern
- [ ] Tests schreiben

### 🎯 Priorität:

**HOCH** - Sollte parallel zu Waffen-Mapping implementiert werden, da:
- Sehr häufige Abfrage ("Alle Zauber für Kleriker")
- Großer Performance-Gewinn
- Einfache Migration (bestehende Daten vorhanden)
