# Zauber-Tags-Mapping: Konzept (Optional)

## Übersicht

Mapping-Tabelle für viele-zu-viele Beziehung zwischen Zaubern und Tags. Optional, nur wenn viele Tag-basierte Abfragen nötig sind. Tags werden aktuell im `data JSON` gespeichert.

---

## Problemstellung

### Aktueller Zustand

```sql
-- Tags im data JSON (z.B. data.tags: ["Heilung", "Verzauberung"])
SELECT * FROM core_spells 
WHERE json_extract(data, '$.tags') LIKE '%Heilung%';
```

**Probleme:**
- ❌ JSON-Suche ist langsam (kein Index)
- ❌ Komplexe Abfragen schwierig
- ❌ Keine Typsicherheit
- ❌ Schwer zu erweitern

### Zielzustand

```sql
-- Schnelle JOIN-basierte Abfragen
SELECT s.* FROM all_spells s
JOIN spell_tag_mappings stm ON s.id = stm.spell_id
WHERE stm.tag_id = 'heilung';
```

**Vorteile:**
- ✅ Schnelle JOIN-Abfragen (indiziert)
- ✅ Typsicherheit durch FOREIGN KEYs
- ✅ Einfache Erweiterung

**ABER:**
- ⚠️ Nur sinnvoll wenn viele Tag-basierte Abfragen nötig
- ⚠️ Zusätzliche Komplexität
- ⚠️ Tags sind optional (nicht alle Zauber haben Tags)

---

## Datenbank-Schema

### 1. Tags-Tabelle (NEU)

```sql
-- NEU: Zauber-Tags Definition
CREATE TABLE spell_tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,  -- z.B. "Schadensart", "Effekt", "Ziel"
    description TEXT,
    data JSON,
    created_at INTEGER DEFAULT (unixepoch())
);
```

**Beispiel-Tags:**

| ID | Name | Kategorie | Beschreibung |
|---|---|---|---|
| `heilung` | Heilung | Effekt | Stellt HP wieder her |
| `schaden` | Schaden | Effekt | Fügt Schaden zu |
| `verzauberung` | Verzauberung | Schule | Verzauberungszauber |
| `beschwoerung` | Beschwörung | Schule | Beschwörungszauber |
| `selbst` | Selbst | Ziel | Wirkt auf Zauberer |
| `beruehrung` | Berührung | Reichweite | Reichweite: Berührung |
| `ritual` | Ritual | Eigenschaft | Kann als Ritual gewirkt werden |
| `konzentration` | Konzentration | Eigenschaft | Erfordert Konzentration |

### 2. Mapping-Tabelle (NEU)

```sql
-- NEU: Verknüpfung Zauber ↔ Tags
-- Unterstützt sowohl core_spells als auch custom_spells via all_spells View
CREATE TABLE spell_tag_mappings (
    spell_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    
    PRIMARY KEY (spell_id, tag_id),
    FOREIGN KEY (tag_id) REFERENCES spell_tags(id) ON DELETE CASCADE,
    -- FOREIGN KEY für spell_id wird über View validiert (spell_id muss in all_spells existieren)
    CHECK (EXISTS (SELECT 1 FROM all_spells WHERE id = spell_id))
);

CREATE INDEX idx_spell_tag_spell ON spell_tag_mappings(spell_id);
CREATE INDEX idx_spell_tag_tag ON spell_tag_mappings(tag_id);
```

**Hinweis:** 
- `spell_id` wird über `all_spells` View validiert (unterstützt `core_spells` UND `custom_spells`)
- `custom_spells` können eigene Tag-Mappings haben (nicht nur über `parent_id`)
- Die bestehende `all_spells` View (aus `migrations.rs`) wird genutzt

---

## Abfrage-Beispiele

### 1. Alle Heilungszauber

```sql
SELECT 
    s.id,
    s.name,
    s.level,
    s.school
FROM all_spells s
JOIN spell_tag_mappings stm ON s.id = stm.spell_id
WHERE stm.tag_id = 'heilung'
ORDER BY s.level, s.name;
```

### 2. Zauber mit mehreren Tags

```sql
SELECT 
    s.id,
    s.name,
    s.level
FROM all_spells s
JOIN spell_tag_mappings stm ON s.id = stm.spell_id
WHERE stm.tag_id IN ('heilung', 'ritual')
GROUP BY s.id, s.name
HAVING COUNT(DISTINCT stm.tag_id) = 2;
```

### 3. Tags für einen Zauber

```sql
SELECT 
    t.id,
    t.name,
    t.category
FROM spell_tags t
JOIN spell_tag_mappings stm ON t.id = stm.tag_id
WHERE stm.spell_id = 'feuerball'
ORDER BY t.category, t.name;
```

---

## Migration-Strategie

### Phase 1: Tags aus JSON extrahieren

**Script:** `scripts/extract-spell-tags.ts`

```typescript
async function extractSpellTags() {
    const db = new Database();
    
    // 1. Alle Zauber mit data JSON abrufen
    const spells = await db.query(`
        SELECT id, name, data 
        FROM core_spells
        WHERE data IS NOT NULL
    `);
    
    const tagSet = new Set<string>();
    
    for (const spell of spells) {
        const data = JSON.parse(spell.data);
        
        // Tags aus verschiedenen Quellen extrahieren
        if (Array.isArray(data.tags)) {
            data.tags.forEach((tag: string) => tagSet.add(tag));
        }
        
        // Weitere Quellen (z.B. data.category, data.effects, etc.)
        // ...
    }
    
    console.log(`Gefundene Tags: ${Array.from(tagSet).join(', ')}`);
    return Array.from(tagSet);
}
```

### Phase 2: Tags importieren

**Script:** `scripts/import-spell-tags.ts`

```typescript
const predefinedTags = [
    { id: 'heilung', name: 'Heilung', category: 'Effekt' },
    { id: 'schaden', name: 'Schaden', category: 'Effekt' },
    { id: 'verzauberung', name: 'Verzauberung', category: 'Schule' },
    { id: 'beschwoerung', name: 'Beschwörung', category: 'Schule' },
    { id: 'selbst', name: 'Selbst', category: 'Ziel' },
    { id: 'beruehrung', name: 'Berührung', category: 'Reichweite' },
    { id: 'ritual', name: 'Ritual', category: 'Eigenschaft' },
    { id: 'konzentration', name: 'Konzentration', category: 'Eigenschaft' }
];

async function importSpellTags() {
    const db = new Database();
    
    for (const tag of predefinedTags) {
        await db.insert('spell_tags', {
            id: tag.id,
            name: tag.name,
            category: tag.category,
            description: null,
            data: JSON.stringify({})
        });
    }
    
    console.log(`✅ ${predefinedTags.length} Tags importiert`);
}
```

### Phase 3: Mappings erstellen

**Script:** `scripts/migrate-spell-tags.ts`

```typescript
async function migrateSpellTags() {
    const db = new Database();
    
    const spells = await db.query(`
        SELECT id, name, data 
        FROM core_spells
        WHERE data IS NOT NULL
    `);
    
    let migrated = 0;
    
    for (const spell of spells) {
        const data = JSON.parse(spell.data);
        const tags = data.tags || [];
        
        for (const tagName of tags) {
            const tagId = slugify(tagName);
            
            // Prüfe ob Tag existiert
            const tagExists = await db.query(`
                SELECT id FROM spell_tags WHERE id = ?
            `, [tagId]);
            
            if (tagExists.length === 0) {
                // Optional: Tag automatisch erstellen
                await db.insert('spell_tags', {
                    id: tagId,
                    name: tagName,
                    category: null,
                    description: null,
                    data: JSON.stringify({})
                });
            }
            
            // Mapping erstellen
            await db.insert('spell_tag_mappings', {
                spell_id: spell.id,
                tag_id: tagId
            });
        }
        
        migrated++;
        process.stdout.write(`\r  Fortschritt: ${migrated}/${spells.length} (${spell.source})`);
    }
    
    console.log(`\n✅ ${migrated} Zauber migriert (core + custom)`);
}
```

---

## Validierung

**Script:** `scripts/validate-spell-tags.ts`

```typescript
async function validateSpellTagMappings() {
    const errors = [];
    
    // 1. Alle tag_ids existieren
    const invalidTags = await db.query(`
        SELECT stm.spell_id, stm.tag_id
        FROM spell_tag_mappings stm
        LEFT JOIN spell_tags t ON stm.tag_id = t.id
        WHERE t.id IS NULL
    `);
    
    if (invalidTags.length > 0) {
        errors.push({
            type: 'invalid_tag',
            count: invalidTags.length,
            items: invalidTags
        });
    }
    
    // 2. Alle spell_ids existieren (in all_spells View: core oder custom)
    const invalidSpells = await db.query(`
        SELECT stm.spell_id, stm.tag_id
        FROM spell_tag_mappings stm
        LEFT JOIN all_spells s ON stm.spell_id = s.id
        WHERE s.id IS NULL
    `);
    
    if (invalidSpells.length > 0) {
        errors.push({
            type: 'invalid_spell',
            count: invalidSpells.length,
            items: invalidSpells
        });
    }
    
    // Ergebnis
    if (errors.length > 0) {
        console.error('❌ Validierung fehlgeschlagen:');
        errors.forEach(error => {
            console.error(`  - ${error.type}: ${error.count} Fehler`);
        });
        throw new Error('Spell tag validation failed');
    }
    
    console.log('✅ Validierung erfolgreich!');
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
    // ... andere Felder ...
    tags?: string[];  // Optional: Array von Tag-IDs
}

export interface SpellTag {
    id: string;
    name: string;
    category?: string;
    description?: string;
}
```

### API Query

```typescript
// src/lib/api.ts
export const compendiumApi = {
    // NEU: Zauber nach Tag filtern
    async getSpellsByTag(tagId: string): Promise<Spell[]> {
        return await invoke("get_spells_by_tag", { tagId });
    },
    
    // NEU: Alle Tags abrufen
    async getAllSpellTags(): Promise<SpellTag[]> {
        return await invoke("get_all_spell_tags");
    }
};
```

---

## Zusammenfassung & Checkliste

### ✅ Vorteile:

1. **Performance**
   - Schnelle JOIN-Abfragen (indiziert)
   - Keine JSON-Suche mehr

2. **Typsicherheit**
   - FOREIGN KEYs garantieren gültige Tags
   - Konsistente Tag-Namen

3. **Flexibilität**
   - Einfache Erweiterung
   - Komplexe Abfragen möglich

### ⚠️ Nachteile:

1. **Zusätzliche Komplexität**
   - Zwei neue Tabellen
   - Migration nötig
   - Wartungsaufwand

2. **Optional**
   - Nicht alle Zauber haben Tags
   - Tags sind nicht zwingend nötig

### 📋 Implementation Checklist:

- [ ] **Entscheidung:** Werden Tag-basierte Abfragen wirklich benötigt?
- [ ] Tags-Tabelle erstellen
- [ ] Mapping-Tabelle erstellen
- [ ] Bestehende Tags aus JSON extrahieren (core + custom via all_spells)
- [ ] Mappings erstellen (core + custom)
- [ ] Validierung durchführen
- [ ] Rust Commands erweitern
- [ ] Frontend Integration
- [ ] Tests schreiben

### 🎯 Priorität:

**NIEDRIG** - Nur implementieren wenn:
- ✅ Viele Tag-basierte Abfragen nötig
- ✅ Performance-Probleme mit JSON-Suche
- ✅ Tags werden häufig verwendet

**Alternative:** Tags im JSON belassen, wenn:
- ❌ Wenige Tag-basierte Abfragen
- ❌ Tags sind optional
- ❌ JSON-Suche ist ausreichend schnell

---

## Empfehlung

**NICHT implementieren**, es sei denn:
1. Es gibt konkrete Performance-Probleme mit JSON-Suche
2. Tags werden sehr häufig für Filterungen verwendet
3. Die Komplexität ist gerechtfertigt

**Stattdessen:**
- Tags im `data JSON` belassen
- Bei Bedarf JSON-Indexierung nutzen (SQLite 3.38+)
- Oder später migrieren, wenn Bedarf besteht
