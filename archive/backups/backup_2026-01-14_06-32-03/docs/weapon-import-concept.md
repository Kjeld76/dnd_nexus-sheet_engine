# Waffenimport-Konzept: Hybrid-Ansatz

## Übersicht

Hybrid-Ansatz kombiniert bestehende Tabellenstruktur mit Mapping-Tabelle für optimale Performance und Typsicherheit. **Bereit für magische Waffen** durch flexible Eigenschaften-Mappings. Import aus PHB 2024, Kapitel 6, Seiten 213-215.

---

## Datenbank-Schema

### 1. Waffen-Tabellen (BESTEHEND)

```sql
-- Bereits vorhanden, KEINE Änderungen
CREATE TABLE core_weapons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN (
        'simple_melee',
        'simple_ranged', 
        'martial_melee',
        'martial_ranged'
    )),
    damage_dice TEXT NOT NULL,
    damage_type TEXT NOT NULL CHECK(damage_type IN ('hieb', 'stich', 'wucht')),
    weight_kg REAL NOT NULL,
    cost_gp REAL NOT NULL,
    mastery_id TEXT NOT NULL,
    data JSON,
    created_at INTEGER DEFAULT (unixepoch()),
    
    FOREIGN KEY (mastery_id) REFERENCES weapon_masteries(id)
);

CREATE TABLE custom_weapons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    damage_dice TEXT NOT NULL,
    damage_type TEXT NOT NULL,
    weight_kg REAL NOT NULL,
    cost_gp REAL NOT NULL,
    mastery_id TEXT NOT NULL,
    parent_id TEXT,
    is_homebrew BOOLEAN DEFAULT 1,
    data JSON,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    
    FOREIGN KEY (parent_id) REFERENCES core_weapons(id),
    FOREIGN KEY (mastery_id) REFERENCES weapon_masteries(id)
);
```

**Kategorie-Mapping:**
```
simple_melee   → Einfache Nahkampfwaffen
simple_ranged  → Einfache Fernkampfwaffen
martial_melee  → Kriegswaffen (Nahkampf)
martial_ranged → Kriegswaffen (Fernkampf)
```

**data JSON (vereinfacht):**
```json
{
    "source_page": 213,
    "notes": "Optionale freie Notizen"
}
```

### 2. Eigenschaften-Tabelle (BESTEHEND)

```sql
-- Bereits vorhanden, KEINE Änderungen
CREATE TABLE weapon_properties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    has_parameter BOOLEAN DEFAULT 0,
    parameter_type TEXT CHECK(parameter_type IN ('range', 'damage', 'ammo', 'range+ammo')),
    parameter_required BOOLEAN DEFAULT 0,  -- NEU: TRUE wenn Parameter MUSS gesetzt sein
    data JSON,
    created_at INTEGER DEFAULT (unixepoch())
);
```

**Eigenschaften (10 Stück):**

| ID | Name | has_parameter | parameter_type | parameter_required |
|---|---|---|---|---|
| `finesse` | Finesse | FALSE | NULL | FALSE |
| `geschosse` | Geschosse | TRUE | range+ammo | TRUE |
| `laden` | Laden | FALSE | NULL | FALSE |
| `leicht` | Leicht | FALSE | NULL | FALSE |
| `reichweite` | Reichweite | TRUE | range | TRUE |
| `schwer` | Schwer | FALSE | NULL | FALSE |
| `vielseitig` | Vielseitig | TRUE | damage | TRUE |
| `weitreichend` | Weitreichend | FALSE | NULL | FALSE |
| `wurfwaffe` | Wurfwaffe | TRUE | range | TRUE |
| `zweihaendig` | Zweihändig | FALSE | NULL | FALSE |

### 3. Meisterschaften-Tabelle (BESTEHEND)

```sql
-- Bereits vorhanden, KEINE Änderungen
CREATE TABLE weapon_masteries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    data JSON,
    created_at INTEGER DEFAULT (unixepoch())
);
```

**Meisterschaften (8 Stück):**

| ID | Name |
|---|---|
| `auslaugen` | Auslaugen |
| `einkerben` | Einkerben |
| `plagen` | Plagen |
| `spalten` | Spalten |
| `stossen` | Stoßen |
| `streifen` | Streifen |
| `umstossen` | Umstoßen |
| `verlangsamen` | Verlangsamen |

### 4. Mapping-Tabelle (NEU)

```sql
-- NEU: Verknüpfung Waffen ↔ Eigenschaften
-- Unterstützt sowohl core_weapons als auch custom_weapons
CREATE TABLE weapon_property_mappings (
    weapon_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    parameter_value TEXT,  -- JSON für komplexe Parameter
    is_custom BOOLEAN DEFAULT 0,  -- NEU: TRUE für custom_weapons
    
    PRIMARY KEY (weapon_id, property_id, is_custom),
    FOREIGN KEY (property_id) REFERENCES weapon_properties(id),
    -- FOREIGN KEY für weapon_id wird über Trigger validiert
    CHECK (
        (is_custom = 0 AND EXISTS (SELECT 1 FROM core_weapons WHERE id = weapon_id))
        OR
        (is_custom = 1 AND EXISTS (SELECT 1 FROM custom_weapons WHERE id = weapon_id))
    )
);

CREATE INDEX idx_weapon_property_weapon ON weapon_property_mappings(weapon_id, is_custom);
CREATE INDEX idx_weapon_property_property ON weapon_property_mappings(property_id);
```

**Alternative (sauberer): Union-View für einheitliche Referenzierung**

```sql
-- View: Alle Waffen (core + custom) vereint
CREATE VIEW all_weapons_unified AS
SELECT 
    id,
    name,
    category,
    damage_dice,
    damage_type,
    weight_kg,
    cost_gp,
    data,
    'core' as source_type,
    NULL as parent_id,
    NULL as is_homebrew
FROM core_weapons
UNION ALL
SELECT 
    id,
    name,
    category,
    damage_dice,
    damage_type,
    weight_kg,
    cost_gp,
    data,
    CASE 
        WHEN parent_id IS NOT NULL THEN 'override'
        WHEN is_homebrew = 1 THEN 'homebrew'
        ELSE 'custom'
    END as source_type,
    parent_id,
    is_homebrew
FROM custom_weapons;

-- Mapping-Tabelle mit vereinfachter Referenzierung
CREATE TABLE weapon_property_mappings (
    weapon_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    parameter_value TEXT,  -- JSON für komplexe Parameter
    
    PRIMARY KEY (weapon_id, property_id),
    FOREIGN KEY (property_id) REFERENCES weapon_properties(id),
    -- FOREIGN KEY wird über View validiert (weapon_id muss in all_weapons_unified existieren)
    CHECK (EXISTS (SELECT 1 FROM all_weapons_unified WHERE id = weapon_id))
);

CREATE INDEX idx_weapon_property_weapon ON weapon_property_mappings(weapon_id);
CREATE INDEX idx_weapon_property_property ON weapon_property_mappings(property_id);
```

**Empfehlung:** Union-View-Ansatz ist sauberer und konsistenter mit bestehenden `all_*` Views.

**parameter_value Strukturen:**

```json
// Reichweite (Wurfwaffe, Geschosse)
{
    "normal": 6,
    "max": 18,
    "unit": "m"
}

// Vielseitig
{
    "damage": "1W10"
}

// Geschosse (erweitert)
{
    "ammo_type": "pfeil",
    "normal": 24,
    "max": 96,
    "unit": "m"
}

// Magisch (z.B. +1 Waffe) - Flat Bonus
{
    "bonus_type": "flat",
    "attack_bonus": 1,
    "damage_bonus": 1,
    "enchantment_level": 1
}

// Magisch (z.B. +2 Waffe) - Flat Bonus
{
    "bonus_type": "flat",
    "attack_bonus": 2,
    "damage_bonus": 2,
    "enchantment_level": 2
}

// Verzaubert (z.B. Flammende Waffe) - Flat Bonus + Special Properties
{
    "bonus_type": "flat",
    "attack_bonus": 1,
    "damage_bonus": 1,
    "enchantment_level": 1,
    "special_properties": ["flammend"],
    "additional_damage": {
        "type": "Feuer",
        "bonus_type": "dice",
        "dice": "1W6"
    }
}

// Verzaubert (z.B. Waffe mit Würfel-Bonus) - Dice Bonus
{
    "bonus_type": "dice",
    "attack_bonus": 1,
    "damage_bonus": {
        "type": "dice",
        "dice": "1W4",
        "damage_type": "Feuer"
    },
    "enchantment_level": 2
}
```

**Struktur-Erklärung:**

- `bonus_type`: `"flat"` (fester Bonus, z.B. +1) oder `"dice"` (Würfel-Bonus, z.B. +1W4)
- `attack_bonus`: Immer Zahl (fester Bonus zum Angriffswurf)
- `damage_bonus`: 
  - Bei `bonus_type: "flat"`: Zahl (fester Bonus zum Schaden)
  - Bei `bonus_type: "dice"`: Objekt mit `dice` und `damage_type`
- `enchantment_level`: Verzauberungsstufe (1-3)
- `special_properties`: Array von Strings (z.B. ["flammend", "frostig"])
- `additional_damage`: Optional, zusätzlicher Schaden (z.B. Feuer 1W6)
```

---

## Import-Strategie

### Phase 1: Eigenschaften importieren

**Script:** `scripts/import-weapon-properties.ts`

```typescript
const properties = [
    {
        id: 'finesse',
        name: 'Finesse',
        description: 'Wenn du mit Finesse-Waffen angreifst, hast du bei Angriffs- und Schadenswürfen die Wahl zwischen deinem Stärke- und deinem Geschicklichkeitsmodifikator. Du musst allerdings bei beiden Würfen denselben Modifikator verwenden.',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    },
    {
        id: 'geschosse',
        name: 'Geschosse',
        description: 'Du kannst Waffen mit der Eigenschaft Geschosse nur für Fernkampfangriffe verwenden, wenn du über entsprechende Geschosse verfügst. Die Art der erforderlichen Geschosse ist jeweils bei der Reichweite der Waffe angegeben. Jeder Angriff verbraucht ein Geschoss...',
        has_parameter: true,
        parameter_type: 'range+ammo',  // ✅ GEÄNDERT
        parameter_required: true       // ✅ NEU
    },
    {
        id: 'laden',
        name: 'Laden',
        description: 'Du kannst mit einer Aktion, Bonusaktion oder Reaktion immer nur ein Geschoss aus einer Waffe mit der Eigenschaft Laden abfeuern, egal, wie viele Angriffe dir zur Verfügung stehen.',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    },
    {
        id: 'leicht',
        name: 'Leicht',
        description: 'Wenn du in deinem Zug die Angriffsaktion ausführst und mit einer leichten Waffe angreifst, kannst du später im selben Zug als Bonusaktion einen zusätzlichen Angriff ausführen...',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    },
    {
        id: 'schwer',
        name: 'Schwer',
        description: 'Du bist bei Angriffswürfen mit schweren Waffen im Nachteil, wenn du bei Nahkampfwaffen einen Stärkewert von weniger als 13 und bei Fernkampfwaffen einen Geschicklichkeitswert von weniger als 13 hast.',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    },
    {
        id: 'vielseitig',
        name: 'Vielseitig',
        description: 'Waffen mit der Eigenschaft Vielseitig können mit einer Hand oder mit zwei Händen geführt werden. Mit der Eigenschaft wird ein Schadenswert in Klammern genannt. Diesen Schaden bewirkt die Waffe, wenn sie mit zwei Händen geführt wird...',
        has_parameter: true,
        parameter_type: 'damage',
        parameter_required: true  // ✅ NEU
    },
    {
        id: 'weitreichend',
        name: 'Weitreichend',
        description: 'Bei Waffen mit der Eigenschaft Weitreichend ist die normale Angriffsreichweite um 1,5 Meter erhöht. Dies gilt auch bei Gelegenheitsangriffen.',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    },
    {
        id: 'wurfwaffe',
        name: 'Wurfwaffe',
        description: 'Waffen mit der Eigenschaft Wurfwaffe können geworfen werden, um Fernkampfangriffe auszuführen, und sie können als Teil des Angriffs gezogen werden. Wenn es sich um eine Nahkampfwaffe handelt, die du wirfst, verwendest du bei Angriffs- und Schadenswürfen den gleichen Attributsmodifikator wie bei Nahkampfangriffen mit der Waffe.',
        has_parameter: true,
        parameter_type: 'range',
        parameter_required: true  // ✅ NEU
    },
    {
        id: 'zweihaendig',
        name: 'Zweihändig',
        description: 'Waffen mit der Eigenschaft Zweihändig müssen mit zwei Händen geführt werden.',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    }
];

// Import
for (const prop of properties) {
    await db.insert('weapon_properties', prop);
}
```

### Phase 2: Meisterschaften importieren

**Script:** `scripts/import-weapon-masteries.ts`

```typescript
const masteries = [
    {
        id: 'auslaugen',
        name: 'Auslaugen',
        description: 'Wenn du eine Kreatur mit dieser Waffe triffst, ist diese Kreatur bei ihrem nächsten Angriffswurf vor Beginn deines nächsten Zugs im Nachteil.'
    },
    {
        id: 'einkerben',
        name: 'Einkerben',
        description: 'Wenn du den zusätzlichen Angriff der Eigenschaft Leicht ausführst, kannst du dies als Teil der Angriffsaktion statt als Bonusaktion tun. Du kannst diesen zusätzlichen Angriff nur einmal pro Zug ausführen.'
    },
    {
        id: 'plagen',
        name: 'Plagen',
        description: 'Wenn du eine Kreatur mit dieser Waffe triffst und ihr Schaden zufügst, bist du beim nächsten Angriffswurf gegen diese Kreatur vor Ende deines nächsten Zugs im Vorteil.'
    },
    {
        id: 'spalten',
        name: 'Spalten',
        description: 'Wenn du eine Kreatur mit einem Nahkampfangriffswurf triffst, den du mit dieser Waffe ausführst, kannst du mit der Waffe einen weiteren Nahkampfangriff auf eine zweite Kreatur im Abstand von bis zu 1,5 Metern von der ersten ausführen, sofern die zweite sich ebenfalls in Reichweite befindet. Bei einem Treffer erleidet die Kreatur den Waffenschaden. Du fügst dem Schaden jedoch nicht deinen Attributsmodifikator hinzu, sofern dieser Modifikator nicht negativ ist. Du kannst diesen zusätzlichen Angriff nur einmal pro Zug ausführen.'
    },
    {
        id: 'stossen',
        name: 'Stoßen',
        description: 'Wenn du eine Kreatur mit dieser Waffe triffst, kannst du sie bis zu drei Meter weit in gerader Linie von dir wegstoßen, sofern sie von höchstens großer Größe ist.'
    },
    {
        id: 'streifen',
        name: 'Streifen',
        description: 'Wenn dein Angriffswurf mit dieser Waffe eine Kreatur verfehlt, kannst du der Kreatur Schaden in Höhe des Attributsmodifikators zufügen, den du für den Angriffswurf verwendet hast. Die Schadensart entspricht der Waffe. Der Schaden kann nur durch Erhöhen des Attributsmodifikators erhöht werden.'
    },
    {
        id: 'umstossen',
        name: 'Umstoßen',
        description: 'Wenn du eine Kreatur mit dieser Waffe triffst, kannst du sie zu einem Konstitutionsrettungswurf (SG 8 plus Attributsmodifikator für den Angriffswurf plus dein Übungsbonus) zwingen. Scheitert der Wurf, so wird die Kreatur umgestoßen.'
    },
    {
        id: 'verlangsamen',
        name: 'Verlangsamen',
        description: 'Wenn du eine Kreatur mit dieser Waffe triffst und ihr Schaden zufügst, kannst du ihre Bewegungsrate bis zum Beginn deines nächsten Zugs um drei Meter verringern. Wird die Kreatur mehrfach von Waffen mit dieser Eigenschaft getroffen, so wird ihre Bewegungsrate dennoch nur um drei Meter verringert.'
    }
];

// Import
for (const mastery of masteries) {
    await db.insert('weapon_masteries', mastery);
}
```

### Phase 3: Waffen extrahieren & parsen

**Script:** `scripts/extract-weapons.ts`

```typescript
interface WeaponRow {
    name: string;
    damage: string;
    damageType: string;
    properties: string;
    mastery: string;
    weight: string;
    cost: string;
    category: 'simple_melee' | 'simple_ranged' | 'martial_melee' | 'martial_ranged';
}

function parseWeaponRow(row: string, category: string): WeaponRow {
    // Beispiel-Input: "Beil 1W6 Hieb Leicht, Wurfwaffe (Reichweite 6/18) Plagen l kg 5GM"
    
    const parts = row.split(/\s{2,}/); // Mehrfache Leerzeichen = Spalten-Trenner
    
    return {
        name: parts[0].trim(),
        damage: parts[1].trim(),
        damageType: parts[2].trim().toLowerCase(),
        properties: parts[3].trim(),
        mastery: parts[4].trim(),
        weight: parts[5].trim(),
        cost: parts[6].trim(),
        category: category as any
    };
}

function parseProperties(propertyString: string): Array<{
    property_id: string;
    parameter_value: string | null;
}> {
    const results = [];
    
    // Regex: Eigenschaft (optional mit Parameter in Klammern)
    const regex = /(\w+(?:\s+\w+)?)(?:\s*\(([^)]+)\))?/g;
    
    let match;
    while ((match = regex.exec(propertyString)) !== null) {
        const propName = match[1].trim();
        const params = match[2]?.trim();
        
        const propId = slugify(propName);
        
        let paramValue = null;
        
        // Parameter je nach Eigenschaft parsen
        if (params) {
            if (propName.toLowerCase().includes('vielseitig')) {
                // Vielseitig (1W10)
                paramValue = JSON.stringify({ damage: params });
                
            } else if (propName.toLowerCase().includes('reichweite') || 
                       propName.toLowerCase().includes('wurfwaffe')) {
                // Reichweite 6/18 oder Wurfwaffe (Reichweite 6/18)
                const rangeMatch = params.match(/(\d+)\/(\d+)/);
                if (rangeMatch) {
                    paramValue = JSON.stringify({
                        normal: parseInt(rangeMatch[1]),
                        max: parseInt(rangeMatch[2]),
                        unit: 'm'
                    });
                }
                
            } else if (propName.toLowerCase().includes('geschosse')) {
                // Geschosse (Reichweite 24/96, Pfeil)
                const ammoMatch = params.match(/Reichweite\s+(\d+)\/(\d+),\s+(\w+)/i);
                if (ammoMatch) {
                    paramValue = JSON.stringify({
                        ammo_type: ammoMatch[3].toLowerCase(),
                        normal: parseInt(ammoMatch[1]),
                        max: parseInt(ammoMatch[2]),
                        unit: 'm'
                    });
                }
            }
        }
        
        results.push({
            property_id: propId,
            parameter_value: paramValue
        });
    }
    
    return results;
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

function parseWeight(weight: string): number {
    // "1,5 kg" → 1.5
    return parseFloat(weight.replace(/\s*kg$/i, '').replace(',', '.'));
}

function parseCost(cost: string): number {
    // "5GM" → 5.0
    // "2SM" → 0.1 (1 SM = 0.1 GM)
    // "5KM" → 0.01 (1 KM = 0.01 GM)
    
    const match = cost.match(/(\d+)\s*([KSG]M)/i);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2].toUpperCase();
    
    switch (unit) {
        case 'GM': return value;
        case 'SM': return value * 0.1;
        case 'KM': return value * 0.01;
        default: return 0;
    }
}
```

### Phase 4: Datenbank-Import

**Script:** `scripts/import-weapons.ts`

```typescript
interface Weapon {
    id: string;
    name: string;
    category: string;
    damage_dice: string;
    damage_type: string;
    weight_kg: number;
    cost_gp: number;
    mastery_id: string;
    properties: Array<{
        property_id: string;
        parameter_value: string | null;
    }>;
}

async function importWeapon(weapon: Weapon) {
    // 1. Waffe einfügen
    await db.insert('core_weapons', {
        id: weapon.id,
        name: weapon.name,
        category: weapon.category,
        damage_dice: weapon.damage_dice,
        damage_type: weapon.damage_type,
        weight_kg: weapon.weight_kg,
        cost_gp: weapon.cost_gp,
        mastery_id: weapon.mastery_id,
        data: JSON.stringify({ source_page: 213 })
    });
    
    // 2. Properties verknüpfen
    for (const prop of weapon.properties) {
        await db.insert('weapon_property_mappings', {
            weapon_id: weapon.id,
            property_id: prop.property_id,
            parameter_value: prop.parameter_value
        });
    }
}

// Beispiel: Beil importieren
const beil: Weapon = {
    id: 'beil',
    name: 'Beil',
    category: 'simple_melee',
    damage_dice: '1W6',
    damage_type: 'hieb',
    weight_kg: 1.0,
    cost_gp: 5.0,
    mastery_id: 'plagen',
    properties: [
        { property_id: 'leicht', parameter_value: null },
        { 
            property_id: 'wurfwaffe', 
            parameter_value: JSON.stringify({ normal: 6, max: 18, unit: 'm' })
        }
    ]
};

await importWeapon(beil);
```

---

## Beispiel-Daten

### Beispiel 1: Beil (Einfache Nahkampfwaffe)

**core_weapons:**
```sql
INSERT INTO core_weapons VALUES (
    'beil',
    'Beil',
    'simple_melee',
    '1W6',
    'hieb',
    1.0,
    5.0,
    'plagen',
    '{"source_page": 213}',
    unixepoch()
);
```

**weapon_property_mappings:**
```sql
INSERT INTO weapon_property_mappings VALUES
('beil', 'leicht', NULL),
('beil', 'wurfwaffe', '{"normal": 6, "max": 18, "unit": "m"}');
```

### Beispiel 2: Langschwert (Kriegswaffe, Nahkampf)

**core_weapons:**
```sql
INSERT INTO core_weapons VALUES (
    'langschwert',
    'Langschwert',
    'martial_melee',
    '1W8',
    'hieb',
    1.5,
    15.0,
    'auslaugen',
    '{"source_page": 214}',
    unixepoch()
);
```

**weapon_property_mappings:**
```sql
INSERT INTO weapon_property_mappings VALUES
('langschwert', 'vielseitig', '{"damage": "1W10"}');
```

### Beispiel 3: Kurzbogen (Einfache Fernkampfwaffe)

**core_weapons:**
```sql
INSERT INTO core_weapons VALUES (
    'kurzbogen',
    'Kurzbogen',
    'simple_ranged',
    '1W6',
    'stich',
    1.0,
    25.0,
    'plagen',
    '{"source_page": 214}',
    unixepoch()
);
```

**weapon_property_mappings:**
```sql
INSERT INTO weapon_property_mappings VALUES
('kurzbogen', 'geschosse', '{"ammo_type": "pfeil", "normal": 24, "max": 96, "unit": "m"}'),
('kurzbogen', 'zweihaendig', NULL);
```

---

## Abfrage-Beispiele

### 1. Waffe mit allen Details abrufen

```sql
SELECT 
    w.id,
    w.name,
    w.category,
    w.damage_dice,
    w.damage_type,
    w.weight_kg,
    w.cost_gp,
    m.name as mastery_name,
    m.description as mastery_description,
    json_group_array(
        json_object(
            'property_id', wp.id,
            'property_name', wp.name,
            'description', wp.description,
            'parameter', wpm.parameter_value
        )
    ) FILTER (WHERE wp.id IS NOT NULL) as properties
FROM core_weapons w
LEFT JOIN weapon_masteries m ON w.mastery_id = m.id
LEFT JOIN weapon_property_mappings wpm ON w.id = wpm.weapon_id
LEFT JOIN weapon_properties wp ON wpm.property_id = wp.id
WHERE w.id = 'beil'
GROUP BY w.id;
```

**Ergebnis:**
```json
{
    "id": "beil",
    "name": "Beil",
    "category": "simple_melee",
    "damage_dice": "1W6",
    "damage_type": "hieb",
    "weight_kg": 1.0,
    "cost_gp": 5.0,
    "mastery_name": "Plagen",
    "mastery_description": "Wenn du eine Kreatur...",
    "properties": [
        {
            "property_id": "leicht",
            "property_name": "Leicht",
            "description": "Wenn du in deinem Zug...",
            "parameter": null
        },
        {
            "property_id": "wurfwaffe",
            "property_name": "Wurfwaffe",
            "description": "Waffen mit der Eigenschaft...",
            "parameter": "{\"normal\": 6, \"max\": 18, \"unit\": \"m\"}"
        }
    ]
}
```

### 2. Alle leichten Waffen finden

```sql
SELECT DISTINCT w.name, w.damage_dice, w.cost_gp
FROM core_weapons w
JOIN weapon_property_mappings wpm ON w.id = wpm.weapon_id
WHERE wpm.property_id = 'leicht'
ORDER BY w.cost_gp;
```

### 3. Alle Waffen mit Auslaugen-Meisterschaft

```sql
SELECT name, category, damage_dice, cost_gp
FROM core_weapons
WHERE mastery_id = 'auslaugen'
ORDER BY category, name;
```

### 4. Fernkampfwaffen mit Reichweite > 30m

```sql
SELECT 
    w.name,
    w.damage_dice,
    json_extract(wpm.parameter_value, '$.normal') as normal_range,
    json_extract(wpm.parameter_value, '$.max') as max_range
FROM core_weapons w
JOIN weapon_property_mappings wpm ON w.id = wpm.weapon_id
WHERE w.category IN ('simple_ranged', 'martial_ranged')
  AND wpm.property_id IN ('geschosse', 'wurfwaffe')
  AND json_extract(wpm.parameter_value, '$.normal') > 30
ORDER BY normal_range DESC;
```

### 5. Waffen für Finesse-Kämpfer

```sql
SELECT 
    w.name,
    w.category,
    w.damage_dice,
    w.cost_gp,
    m.name as mastery
FROM core_weapons w
JOIN weapon_property_mappings wpm ON w.id = wpm.weapon_id
JOIN weapon_masteries m ON w.mastery_id = m.id
WHERE wpm.property_id = 'finesse'
ORDER BY w.damage_dice DESC, w.cost_gp;
```

### 6. Magische Waffen

```sql
SELECT 
    w.name,
    w.damage_dice,
    json_extract(wpm.parameter_value, '$.attack_bonus') as attack_bonus,
    json_extract(wpm.parameter_value, '$.damage_bonus') as damage_bonus,
    json_extract(wpm.parameter_value, '$.enchantment_level') as enchantment_level
FROM core_weapons w
JOIN weapon_property_mappings wpm ON w.id = wpm.weapon_id
WHERE wpm.property_id IN ('magisch', 'verzaubert')
ORDER BY enchantment_level DESC, w.name;
```

### 7. +1 Waffen

```sql
SELECT 
    w.name,
    w.damage_dice,
    w.cost_gp,
    json_extract(wpm.parameter_value, '$.attack_bonus') as attack_bonus
FROM core_weapons w
JOIN weapon_property_mappings wpm ON w.id = wpm.weapon_id
WHERE wpm.property_id = 'magisch'
  AND json_extract(wpm.parameter_value, '$.attack_bonus') = 1
ORDER BY w.name;
```

---

## Validierung

**Script:** `scripts/validate-weapons.ts`

```typescript
async function validateWeaponImport() {
    const errors = [];
    
    // 1. Alle Meisterschafts-IDs existieren
    const invalidMasteries = await db.query(`
        SELECT w.id, w.name, w.mastery_id
        FROM core_weapons w
        LEFT JOIN weapon_masteries m ON w.mastery_id = m.id
        WHERE m.id IS NULL
    `);
    
    if (invalidMasteries.length > 0) {
        errors.push({
            type: 'invalid_mastery',
            count: invalidMasteries.length,
            items: invalidMasteries
        });
    }
    
    // 2. Alle Property-IDs in Mappings existieren
    const invalidProperties = await db.query(`
        SELECT wpm.weapon_id, wpm.property_id
        FROM weapon_property_mappings wpm
        LEFT JOIN weapon_properties wp ON wpm.property_id = wp.id
        WHERE wp.id IS NULL
    `);
    
    if (invalidProperties.length > 0) {
        errors.push({
            type: 'invalid_property',
            count: invalidProperties.length,
            items: invalidProperties
        });
    }
    
    // 3. Parameter-JSON ist valide
    const invalidJSON = await db.query(`
        SELECT weapon_id, property_id, parameter_value
        FROM weapon_property_mappings
        WHERE parameter_value IS NOT NULL
          AND json_valid(parameter_value) = 0
    `);
    
    if (invalidJSON.length > 0) {
        errors.push({
            type: 'invalid_json',
            count: invalidJSON.length,
            items: invalidJSON
        });
    }
    
    // 4. Waffen mit Geschosse/Wurfwaffe haben Reichweite
    const missingRange = await db.query(`
        SELECT w.id, w.name, wpm.property_id
        FROM core_weapons w
        JOIN weapon_property_mappings wpm ON w.id = wpm.weapon_id
        WHERE wpm.property_id IN ('geschosse', 'wurfwaffe')
          AND (wpm.parameter_value IS NULL 
               OR json_extract(wpm.parameter_value, '$.normal') IS NULL)
    `);
    
    if (missingRange.length > 0) {
        errors.push({
            type: 'missing_range',
            count: missingRange.length,
            items: missingRange
        });
    }
    
    // 5. Waffen mit Vielseitig haben Schaden-Parameter
    const missingVersatile = await db.query(`
        SELECT w.id, w.name
        FROM core_weapons w
        JOIN weapon_property_mappings wpm ON w.id = wpm.weapon_id
        WHERE wpm.property_id = 'vielseitig'
          AND (wpm.parameter_value IS NULL
               OR json_extract(wpm.parameter_value, '$.damage') IS NULL)
    `);
    
    if (missingVersatile.length > 0) {
        errors.push({
            type: 'missing_versatile_damage',
            count: missingVersatile.length,
            items: missingVersatile
        });
    }
    
    // 6. Keine Waffen ohne Properties
    const noProperties = await db.query(`
        SELECT w.id, w.name
        FROM core_weapons w
        LEFT JOIN weapon_property_mappings wpm ON w.id = wpm.weapon_id
        WHERE wpm.weapon_id IS NULL
    `);
    
    // Warnung, kein Fehler (manche Waffen könnten keine Properties haben)
    if (noProperties.length > 0) {
        console.warn(`⚠️  ${noProperties.length} Waffen ohne Properties:`, noProperties);
    }
    
    // Ergebnis
    if (errors.length > 0) {
        console.error('❌ Validierung fehlgeschlagen:');
        errors.forEach(error => {
            console.error(`  - ${error.type}: ${error.count} Fehler`);
            console.error(JSON.stringify(error.items, null, 2));
        });
        throw new Error('Weapon validation failed');
    }
    
    console.log('✅ Validierung erfolgreich!');
    
    // Statistiken
    const stats = await db.query(`
        SELECT 
            COUNT(*) as total_weapons,
            COUNT(DISTINCT category) as categories,
            COUNT(DISTINCT mastery_id) as masteries_used,
            (SELECT COUNT(*) FROM weapon_property_mappings) as total_property_mappings
        FROM core_weapons
    `);
    
    console.log('📊 Statistiken:', stats[0]);
}
```

---

## Migration Script

**File:** `migrations/005_add_weapon_property_mappings.sql`

```sql
-- Migration: Weapon Property Mappings Tabelle hinzufügen
-- Datum: 2025-01-12
-- Erweitert: Unterstützung für custom_weapons via Union-View

-- 1. Union-View für alle Waffen (core + custom)
CREATE VIEW IF NOT EXISTS all_weapons_unified AS
SELECT 
    id,
    name,
    category,
    damage_dice,
    damage_type,
    weight_kg,
    cost_gp,
    data,
    'core' as source_type,
    NULL as parent_id,
    NULL as is_homebrew,
    NULL as mastery_id
FROM core_weapons
UNION ALL
SELECT 
    id,
    name,
    category,
    damage_dice,
    damage_type,
    weight_kg,
    cost_gp,
    data,
    CASE 
        WHEN parent_id IS NOT NULL THEN 'override'
        WHEN is_homebrew = 1 THEN 'homebrew'
        ELSE 'custom'
    END as source_type,
    parent_id,
    is_homebrew,
    mastery_id
FROM custom_weapons;

-- 2. Mapping-Tabelle (unterstützt core + custom via View)
CREATE TABLE IF NOT EXISTS weapon_property_mappings (
    weapon_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    parameter_value TEXT,  -- JSON für komplexe Parameter
    
    PRIMARY KEY (weapon_id, property_id),
    FOREIGN KEY (property_id) REFERENCES weapon_properties(id)
);

-- 3. Trigger: Validiere weapon_id existiert in all_weapons_unified
CREATE TRIGGER IF NOT EXISTS validate_weapon_id
BEFORE INSERT ON weapon_property_mappings
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (SELECT 1 FROM all_weapons_unified WHERE id = NEW.weapon_id)
        THEN RAISE(ABORT, 'weapon_id must exist in all_weapons_unified (core_weapons or custom_weapons)')
    END;
END;

-- 4. Trigger: Validiere parameter_value JSON
CREATE TRIGGER IF NOT EXISTS validate_property_parameter
BEFORE INSERT ON weapon_property_mappings
BEGIN
    SELECT CASE
        WHEN NEW.parameter_value IS NOT NULL 
         AND json_valid(NEW.parameter_value) = 0
        THEN RAISE(ABORT, 'parameter_value must be valid JSON')
    END;
END;

-- 5. Trigger: Prüfe ob Property PFLICHT-Parameter benötigt
CREATE TRIGGER IF NOT EXISTS check_property_parameter_requirement
BEFORE INSERT ON weapon_property_mappings
BEGIN
    SELECT CASE
        WHEN (
            SELECT parameter_required 
            FROM weapon_properties 
            WHERE id = NEW.property_id
        ) = 1
        AND NEW.parameter_value IS NULL
        THEN RAISE(ABORT, 'Property requires parameter_value (parameter_required=TRUE)')
    END;
END;

-- 6. Trigger: Validiere bonus_type für magische Waffen
CREATE TRIGGER IF NOT EXISTS validate_magical_bonus_structure
BEFORE INSERT ON weapon_property_mappings
WHEN NEW.property_id IN ('magisch', 'verzaubert')
BEGIN
    SELECT CASE
        WHEN NEW.parameter_value IS NOT NULL
         AND json_extract(NEW.parameter_value, '$.bonus_type') NOT IN ('flat', 'dice')
        THEN RAISE(ABORT, 'bonus_type must be "flat" or "dice" for magical weapons')
    END;
END;

-- 7. Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_weapon_property_weapon 
    ON weapon_property_mappings(weapon_id);
    
CREATE INDEX IF NOT EXISTS idx_weapon_property_property 
    ON weapon_property_mappings(property_id);

-- 8. View: Rückwärtskompatibilität für weapon_type
CREATE VIEW IF NOT EXISTS weapons_legacy AS
SELECT 
    w.*,
    CASE 
        WHEN w.category IN ('simple_melee', 'martial_melee') THEN 'Nahkampf'
        WHEN w.category IN ('simple_ranged', 'martial_ranged') THEN 'Fernkampf'
    END as weapon_type,
    CASE
        WHEN w.category IN ('simple_melee', 'simple_ranged') THEN 'Einfache Waffe'
        WHEN w.category IN ('martial_melee', 'martial_ranged') THEN 'Kriegswaffe'
    END as weapon_category_name
FROM all_weapons_unified w;
```

---

## Vollständiger Import-Workflow

**File:** `scripts/import-all-weapons.ts`

```typescript
import { Database } from './database';
import { parsePDF } from './utils/pdf-parser';
import { importWeaponProperties } from './import-weapon-properties';
import { importWeaponMasteries } from './import-weapon-masteries';
import { validateWeaponImport } from './validate-weapons';

async function importAllWeapons() {
    const db = new Database();
    
    console.log('🚀 Starte Waffen-Import...\n');
    
    try {
        // Phase 1: Eigenschaften
        console.log('📋 Phase 1: Eigenschaften importieren...');
        await importWeaponProperties(db);
        console.log('✅ Eigenschaften importiert\n');
        
        // Phase 2: Meisterschaften
        console.log('📋 Phase 2: Meisterschaften importieren...');
        await importWeaponMasteries(db);
        console.log('✅ Meisterschaften importiert\n');
        
        // Phase 3: Waffen extrahieren
        console.log('📋 Phase 3: Waffen aus PDF extrahieren...');
        const weapons = await extractWeaponsFromPDF();
        console.log(`✅ ${weapons.length} Waffen extrahiert\n`);
        
        // Phase 4: Waffen importieren
        console.log('📋 Phase 4: Waffen in Datenbank importieren...');
        let imported = 0;
        let failed = 0;
        
        for (const weapon of weapons) {
            try {
                await importWeapon(db, weapon);
                imported++;
                process.stdout.write(`\r  Fortschritt: ${imported}/${weapons.length}`);
            } catch (error) {
                failed++;
                console.error(`\n❌ Fehler bei ${weapon.name}:`, error.message);
            }
        }
        
        console.log(`\n✅ ${imported} Waffen importiert, ${failed} fehlgeschlagen\n`);
        
        // Phase 5: Validierung
        console.log('📋 Phase 5: Validierung...');
        await validateWeaponImport(db);
        
        console.log('\n🎉 Waffen-Import erfolgreich abgeschlossen!');
        
    } catch (error) {
        console.error('\n❌ Import fehlgeschlagen:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

async function extractWeaponsFromPDF(): Promise<Weapon[]> {
    const pdfPath = './resources/books/D&D Spielerhandbuch (2024).pdf';
    const weapons: Weapon[] = [];
    
    // PDF Seiten 213-215 extrahieren
    const text = await parsePDF(pdfPath, { startPage: 213, endPage: 215 });
    
    // Tabellen-Abschnitte identifizieren
    const sections = {
        simple_melee: extractSection(text, 'Einfache Nahkampfwaffen'),
        simple_ranged: extractSection(text, 'Einfache Fernkampfwaffen'),
        martial_melee: extractSection(text, 'Nahkampf Kriegswaffen'),
        martial_ranged: extractSection(text, 'Fernkampf Kriegswaffen')
    };
    
    // Jede Sektion parsen
    for (const [category, rows] of Object.entries(sections)) {
        for (const row of rows) {
            try {
                const weapon = parseWeaponRow(row, category);
                weapons.push(weapon);
            } catch (error) {
                console.warn(`⚠️  Fehler beim Parsen: ${row}`, error.message);
            }
        }
    }
    
    return weapons;
}

function extractSection(text: string, header: string): string[] {
    const lines = text.split('\n');
    const startIdx = lines.findIndex(line => line.includes(header));
    
    if (startIdx === -1) return [];
    
    const rows = [];
    for (let i = startIdx + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Stop bei nächstem Header oder leerem Bereich
        if (!line || /^[A-ZÄÖÜ][a-zäöü\s]+$/.test(line)) break;
        
        // Überspringe Tabellen-Header
        if (line.includes('Name') && line.includes('Schaden')) continue;
        
        rows.push(line);
    }
    
    return rows;
}

// Start
importAllWeapons();
```

---

## Vollständige Waffentabelle (Referenz)

**File:** `data/weapons-reference.json`

```json
{
  "simple_melee": [
    {
      "id": "beil",
      "name": "Beil",
      "damage": "1W6",
      "damage_type": "hieb",
      "properties": ["leicht", "wurfwaffe"],
      "mastery": "plagen",
      "weight_kg": 1.0,
      "cost_gp": 5.0,
      "property_params": {
        "wurfwaffe": {"normal": 6, "max": 18}
      }
    },
    {
      "id": "dolch",
      "name": "Dolch",
      "damage": "1W4",
      "damage_type": "stich",
      "properties": ["finesse", "leicht", "wurfwaffe"],
      "mastery": "einkerben",
      "weight_kg": 0.5,
      "cost_gp": 2.0,
      "property_params": {
        "wurfwaffe": {"normal": 6, "max": 18}
      }
    },
    {
      "id": "kampfstab",
      "name": "Kampfstab",
      "damage": "1W6",
      "damage_type": "wucht",
      "properties": ["vielseitig"],
      "mastery": "umstossen",
      "weight_kg": 2.0,
      "cost_gp": 0.2,
      "property_params": {
        "vielseitig": {"damage": "1W8"}
      }
    },
    {
      "id": "knueppel",
      "name": "Knüppel",
      "damage": "1W4",
      "damage_type": "wucht",
      "properties": ["leicht"],
      "mastery": "verlangsamen",
      "weight_kg": 1.0,
      "cost_gp": 0.1
    },
    {
      "id": "leichter_hammer",
      "name": "Leichter Hammer",
      "damage": "1W4",
      "damage_type": "wucht",
      "properties": ["leicht", "wurfwaffe"],
      "mastery": "einkerben",
      "weight_kg": 1.0,
      "cost_gp": 2.0,
      "property_params": {
        "wurfwaffe": {"normal": 6, "max": 18}
      }
    },
    {
      "id": "sichel",
      "name": "Sichel",
      "damage": "1W4",
      "damage_type": "hieb",
      "properties": ["leicht"],
      "mastery": "einkerben",
      "weight_kg": 1.0,
      "cost_gp": 1.0
    },
    {
      "id": "speer",
      "name": "Speer",
      "damage": "1W6",
      "damage_type": "stich",
      "properties": ["vielseitig", "wurfwaffe"],
      "mastery": "auslaugen",
      "weight_kg": 1.5,
      "cost_gp": 1.0,
      "property_params": {
        "vielseitig": {"damage": "1W8"},
        "wurfwaffe": {"normal": 6, "max": 18}
      }
    },
    {
      "id": "streitkolben",
      "name": "Streitkolben",
      "damage": "1W6",
      "damage_type": "wucht",
      "properties": [],
      "mastery": "auslaugen",
      "weight_kg": 2.0,
      "cost_gp": 5.0
    },
    {
      "id": "wurfspeer",
      "name": "Wurfspeer",
      "damage": "1W6",
      "damage_type": "stich",
      "properties": ["wurfwaffe"],
      "mastery": "verlangsamen",
      "weight_kg": 1.0,
      "cost_gp": 0.5,
      "property_params": {
        "wurfwaffe": {"normal": 9, "max": 36}
      }
    },
    {
      "id": "zweihandknueppel",
      "name": "Zweihandknüppel",
      "damage": "1W8",
      "damage_type": "wucht",
      "properties": ["zweihaendig"],
      "mastery": "stossen",
      "weight_kg": 5.0,
      "cost_gp": 0.2
    }
  ],
  "simple_ranged": [
    {
      "id": "kurzbogen",
      "name": "Kurzbogen",
      "damage": "1W6",
      "damage_type": "stich",
      "properties": ["geschosse", "zweihaendig"],
      "mastery": "plagen",
      "weight_kg": 1.0,
      "cost_gp": 25.0,
      "property_params": {
        "geschosse": {"ammo_type": "pfeil", "normal": 24, "max": 96}
      }
    },
    {
      "id": "leichte_armbrust",
      "name": "Leichte Armbrust",
      "damage": "1W8",
      "damage_type": "stich",
      "properties": ["geschosse", "laden", "zweihaendig"],
      "mastery": "verlangsamen",
      "weight_kg": 2.5,
      "cost_gp": 25.0,
      "property_params": {
        "geschosse": {"ammo_type": "bolzen", "normal": 24, "max": 96}
      }
    },
    {
      "id": "schleuder",
      "name": "Schleuder",
      "damage": "1W4",
      "damage_type": "wucht",
      "properties": ["geschosse"],
      "mastery": "verlangsamen",
      "weight_kg": 0.0,
      "cost_gp": 0.1,
      "property_params": {
        "geschosse": {"ammo_type": "kugel", "normal": 9, "max": 36}
      }
    },
    {
      "id": "wurfpfeil",
      "name": "Wurfpfeil",
      "damage": "1W4",
      "damage_type": "stich",
      "properties": ["finesse", "wurfwaffe"],
      "mastery": "plagen",
      "weight_kg": 0.125,
      "cost_gp": 0.05,
      "property_params": {
        "wurfwaffe": {"normal": 6, "max": 18}
      }
    }
  ]
}
```

---

## Frontend-Integration

**File:** `components/WeaponCard.tsx`

```typescript
interface WeaponCardProps {
    weapon: {
        id: string;
        name: string;
        category: string;
        damage_dice: string;
        damage_type: string;
        weight_kg: number;
        cost_gp: number;
        mastery: {
            id: string;
            name: string;
            description: string;
        };
        properties: Array<{
            id: string;
            name: string;
            description: string;
            parameter?: any;
        }>;
    };
}

export function WeaponCard({ weapon }: WeaponCardProps) {
    // Magische Boni extrahieren
    const magicalProperty = weapon.properties.find(p => 
        p.id === 'magisch' || p.id === 'verzaubert'
    );
    const magicalBonus = magicalProperty?.magical_bonus;
    
    // Schaden berechnen (mit magischen Boni)
    const calculateDamage = () => {
        let baseDamage = weapon.damage_dice;
        
        if (magicalBonus) {
            if (magicalBonus.bonus_type === 'flat') {
                const bonus = typeof magicalBonus.damage_bonus === 'number' 
                    ? magicalBonus.damage_bonus 
                    : 0;
                return `${baseDamage} + ${bonus}`;
            } else if (magicalBonus.bonus_type === 'dice') {
                const bonusDice = typeof magicalBonus.damage_bonus === 'object'
                    ? magicalBonus.damage_bonus.dice
                    : '';
                return `${baseDamage} + ${bonusDice}`;
            }
        }
        
        return baseDamage;
    };
    
    return (
        <div className="weapon-card">
            <h3>{weapon.name}</h3>
            
            <div className="weapon-stats">
                <span className="damage">
                    {calculateDamage()} {weapon.damage_type}
                </span>
                {magicalBonus && (
                    <span className="attack-bonus">
                        +{magicalBonus.attack_bonus} Angriff
                    </span>
                )}
                <span className="weight">{weapon.weight_kg} kg</span>
                <span className="cost">{weapon.cost_gp} GM</span>
            </div>
            
            <div className="weapon-category">
                {formatCategory(weapon.category)}
                {weapon.source_type !== 'core' && (
                    <span className="source-badge">{weapon.source_type}</span>
                )}
            </div>
            
            <div className="weapon-properties">
                {weapon.properties.map(prop => (
                    <PropertyBadge 
                        key={prop.id}
                        property={prop}
                    />
                ))}
            </div>
            
            {magicalBonus?.special_properties && (
                <div className="magical-properties">
                    <strong>Besondere Eigenschaften:</strong>
                    <ul>
                        {magicalBonus.special_properties.map(prop => (
                            <li key={prop}>{prop}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            <div className="weapon-mastery">
                <strong>{weapon.mastery.name}:</strong>
                <p>{weapon.mastery.description}</p>
            </div>
        </div>
    );
}

function formatCategory(category: string): string {
    const map = {
        'simple_melee': 'Einfache Nahkampfwaffe',
        'simple_ranged': 'Einfache Fernkampfwaffe',
        'martial_melee': 'Kriegswaffe (Nahkampf)',
        'martial_ranged': 'Kriegswaffe (Fernkampf)'
    };
    return map[category] || category;
}
```

---

## Zusammenfassung & Checkliste

### ✅ Verbesserungen integriert:

1. **`parameter_type` erweitert**
   - ✅ Neue Option: `'range+ammo'` für Geschosse
   - Erlaubt kombinierte Parameter (Reichweite + Munitionstyp)

2. **`parameter_required` Feld hinzugefügt**
   - ✅ Unterscheidung: `has_parameter` (kann) vs. `parameter_required` (muss)
   - Trigger prüft nur bei `parameter_required = TRUE`
   - Flexibler für optionale Parameter

3. **Rückwärtskompatibilität via View**
   - ✅ `weapons_legacy` View erstellt
   - Berechnet `weapon_type` ("Nahkampf"/"Fernkampf")
   - Berechnet `weapon_category_name` ("Einfache Waffe"/"Kriegswaffe")
   - Legacy-Code kann ohne Änderung weiterlaufen

### 📋 Parameter-Logik:

| Property | has_parameter | parameter_required | Bedeutung |
|----------|--------------|-------------------|-----------|
| Finesse | FALSE | FALSE | Keine Parameter möglich |
| Geschosse | TRUE | TRUE | Parameter MUSS gesetzt sein |
| Vielseitig | TRUE | TRUE | Parameter MUSS gesetzt sein |
| Wurfwaffe | TRUE | TRUE | Parameter MUSS gesetzt sein |
| Laden | FALSE | FALSE | Keine Parameter nötig |

**Trigger-Verhalten:**
```sql
-- ✅ Erlaubt (parameter_required = FALSE)
INSERT INTO weapon_property_mappings 
VALUES ('dolch', 'leicht', NULL);

-- ❌ Fehler (parameter_required = TRUE, aber NULL)
INSERT INTO weapon_property_mappings 
VALUES ('langschwert', 'vielseitig', NULL);

-- ✅ Erlaubt (parameter_required = TRUE und gesetzt)
INSERT INTO weapon_property_mappings 
VALUES ('langschwert', 'vielseitig', '{"damage": "1W10"}');
```

### 🔄 Migration von altem Code:

**Alt (mit weapon_type):**
```sql
SELECT * FROM core_weapons 
WHERE weapon_type = 'Nahkampf';
```

**Neu (mit weapons_legacy View):**
```sql
SELECT * FROM weapons_legacy 
WHERE weapon_type = 'Nahkampf';
-- Funktioniert ohne Code-Änderung!
```

**Oder modern (mit category):**
```sql
SELECT * FROM core_weapons 
WHERE category IN ('simple_melee', 'martial_melee');
```

### ✅ Was ist enthalten:

1. **Vollständiges Schema**
   - `weapon_property_mappings` Tabelle
   - `parameter_required` Feld in `weapon_properties`
   - `'range+ammo'` als parameter_type
   - Trigger für Validierung (prüft nur `parameter_required`)
   - `weapons_legacy` View für Rückwärtskompatibilität
   - Indizes für Performance

2. **Import-Scripts**
   - Properties importieren (mit `parameter_required`)
   - Masteries importieren
   - Waffen extrahieren & importieren
   - Vollständiger Workflow

3. **Validierung**
   - Referenzielle Integrität
   - JSON-Validierung
   - Parameter-Vollständigkeit (nur bei `parameter_required = TRUE`)
   - Statistiken

4. **Beispiel-Daten**
   - Alle einfachen Waffen
   - Property-Mappings
   - SQL-Beispiele

5. **Frontend-Integration**
   - React Component
   - Formatierung
   - Badge-System

6. **Rückwärtskompatibilität**
   - `weapons_legacy` View
   - Legacy-Code läuft ohne Änderung
   - Schrittweise Migration möglich

### 📋 Implementation Checklist:

- [ ] Migration ausführen (`005_add_weapon_property_mappings.sql`)
- [ ] `weapons_legacy` View erstellen (Rückwärtskompatibilität)
- [ ] Properties importieren (10 Eigenschaften mit `parameter_required`)
- [ ] Masteries importieren (8 Meisterschaften)
- [ ] PDF extrahieren (Seiten 213-215)
- [ ] Waffen parsen (alle Kategorien)
- [ ] Waffen importieren (core_weapons + mappings)
- [ ] Validierung durchführen
- [ ] Legacy-Code auf View umstellen (optional, schrittweise)
- [ ] Frontend-Komponenten erstellen
- [ ] Tests schreiben
- [ ] **Magische Waffen hinzufügen** (optional, wenn verfügbar)

### 🎯 Vorteile der Verbesserungen:

| Verbesserung | Vorteil | Use Case |
|-------------|---------|----------|
| `range+ammo` | Semantisch klarer | Geschosse brauchen beides |
| `parameter_required` | Flexible Validierung | Optionale vs. Pflicht-Parameter |
| `weapons_legacy` View | Smooth Migration | Legacy-Code läuft weiter |
| `all_weapons_unified` View | Einheitliche Referenzierung | Core + Custom Waffen gleich behandeln |
| `bonus_type` in JSON | Klare Struktur für Frontend | Kalkulator weiß, ob flat oder dice |
| `magical_bonus` Typisierung | Typsicherheit im Frontend | Kein Raten bei Schadensberechnung |

### 🚀 Nächster Schritt:

Die Verbesserungen sind jetzt integriert. Welchen Teil soll ich als nächstes konkret umsetzen?
1. Migration SQL-Datei (mit View)
2. Extraktions-Script für PDF
3. Frontend-Komponenten (mit Legacy-Support)
4. Test-Suite