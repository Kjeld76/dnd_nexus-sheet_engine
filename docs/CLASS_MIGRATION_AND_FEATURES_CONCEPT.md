# Konzept: Klassen-Migration und regeltechnische Umsetzung

## Übersicht

Dieses Konzept beschreibt die Migration der Klassen-Daten aus `export_classes.md` in die Datenbank und die regeltechnische Umsetzung der Klassenmerkmale (Features) im D&D Nexus Sheet Engine.

## Zielsetzung

1. **Datenbank-Migration**: Strukturierte Speicherung aller Klassen-Daten in SQLite
2. **Feature-Umsetzung**: Regeltechnische Implementierung aller Klassenmerkmale mit automatischen Berechnungen
3. **Flexibilität**: Unterstützung für Homebrew-Klassen und -Unterklassen
4. **Performance**: Effiziente Abfragen und Berechnungen

---

## 1. Datenbank-Schema

### 1.1 Erweiterte Klassen-Tabellen

Die bestehenden `core_classes` und `custom_classes` Tabellen bleiben erhalten. Das `data`-Feld wird als strukturiertes JSON erweitert.

```sql
-- Bestehende Tabelle bleibt
CREATE TABLE IF NOT EXISTS core_classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data TEXT NOT NULL,  -- JSON mit erweitertem ClassData-Schema
    created_at INTEGER DEFAULT (unixepoch())
);

-- Erweitertes ClassData JSON-Schema:
{
  "hit_die": 12,  // 6, 8, 10, oder 12
  "description": "Klassenbeschreibung aus PHB",
  "primary_attributes": ["stä"],
  "saving_throws": ["stä", "kon"],
  "skill_choices": {
    "choose": 2,
    "from": ["athletik", "einschüchtern", "überlebenskunst", ...]
  },
  "tool_proficiencies": {
    "fixed": [],
    "choose": null
  },
  "weapon_proficiencies": {
    "simple_weapons": true,
    "martial_weapons": false,
    "additional": []
  },
  "armor_proficiencies": {
    "light_armor": false,
    "medium_armor": false,
    "heavy_armor": false,
    "shields": false
  },
  "multiclassing": {
    "prerequisites": [{"attribute": "stä", "value": 13}],
    "proficiencies_gained": {}
  },
  "progression_table": {
    // Level-abhängige Werte (siehe unten)
  }
}
```

### 1.2 Progressionstabellen

Jede Klasse hat eine Progressionstabelle mit level-spezifischen Werten.

```sql
-- NEU: Tabelle für Klassen-Progressionstabellen
CREATE TABLE IF NOT EXISTS class_progression_tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    proficiency_bonus INTEGER NOT NULL,  -- Übungsbonus
    feature_names TEXT,  -- JSON Array: ["Kampfrausch", "Ungerüstete Verteidigung"]
    class_specific_data JSON,  -- Z.B. {"kampfrausch_uses": 2, "kampfrausch_damage": "+1W2", "weapon_mastery_count": 2}
    created_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(class_id, level),
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
);

CREATE INDEX idx_progression_class_level ON class_progression_tables(class_id, level);
```

**Beispiel `class_specific_data` für Barbar Level 1:**
```json
{
  "kampfrausch_uses": 2,
  "kampfrausch_damage": "+1W2",
  "weapon_mastery_count": 2
}
```

### 1.3 Klassen-Features

Features werden in einer eigenen Tabelle gespeichert, um sie wiederverwendbar und regeltechnisch umsetzbar zu machen.

```sql
-- NEU: Tabelle für Klassen-Features (Basis- und Unterklassen-Features)
CREATE TABLE IF NOT EXISTS class_features (
    id TEXT PRIMARY KEY,  -- z.B. "barbar_kampfrausch", "barbar_berserker_raserei"
    class_id TEXT,  -- NULL für universelle Features (z.B. "Attributswerterhöhung")
    subclass_id TEXT,  -- NULL für Basis-Features
    name TEXT NOT NULL,  -- "KAMPFRAUSCH"
    description TEXT NOT NULL,  -- Vollständige Beschreibung
    level INTEGER NOT NULL,  -- Auf welchem Level erhält der Charakter dieses Feature
    feature_type TEXT NOT NULL CHECK(feature_type IN (
        'passive',      // Immer aktiv (z.B. "Ungerüstete Verteidigung")
        'active',       // Muss aktiviert werden (z.B. "Kampfrausch")
        'progression',  // Level-abhängige Änderung (z.B. "Waffenmeisterung")
        'choice',       // Spieler muss wählen (z.B. "Attributswerterhöhung", "Fertigkeitsauswahl")
        'reaction',     // Reaktion (z.B. "Vergeltung")
        'bonus_action'  // Bonusaktion (z.B. "Instinktiver Sprung")
    )),
    effects JSON NOT NULL,  // Strukturierte Effekte (siehe unten)
    conditions JSON,  // Bedingungen für Aktivierung/Gültigkeit
    uses_per_rest TEXT,  // z.B. "2", "WIS", "Proficiency", NULL für unbegrenzt
    rest_type TEXT CHECK(rest_type IN ('short', 'long', NULL)),
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
);

CREATE INDEX idx_features_class_level ON class_features(class_id, level);
CREATE INDEX idx_features_subclass ON class_features(subclass_id);
```

### 1.4 Unterklassen

```sql
-- NEU: Tabelle für Unterklassen
CREATE TABLE IF NOT EXISTS class_subclasses (
    id TEXT PRIMARY KEY,  -- z.B. "barbar_berserker", "barbar_weltenbaum"
    class_id TEXT NOT NULL,
    name TEXT NOT NULL,  -- "PFAD DES BERSERKERS"
    description TEXT NOT NULL,
    level INTEGER NOT NULL,  -- Auf welchem Level wird die Unterklasse gewählt
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
);

CREATE INDEX idx_subclasses_class ON class_subclasses(class_id);
```

### 1.5 Feature-Effekte Schema

Das `effects` JSON-Feld in `class_features` enthält strukturierte Regel-Effekte:

```typescript
interface FeatureEffect {
  type: 'modifier' | 'calculation' | 'proficiency' | 'action' | 'condition' | 'resistance' | 'damage_bonus';
  target?: string;  // z.B. "ac", "str_saves", "movement_speed", "damage"
  value?: number | string;  // Z.B. 3, "+3", "DEX + CON"
  calculation?: string;  // Z.B. "10 + DEX + CON" für Ungerüstete Verteidigung
  attribute?: string;  // z.B. "str", "dex", "wis"
  condition?: string;  // Z.B. "no_armor", "in_rage", "heavy_armor_not_worn"
}

interface FeatureEffects {
  when_active?: FeatureEffect[];  // Effekte wenn Feature aktiv ist
  when_passive?: FeatureEffect[];  // Immer aktive Effekte
  on_activation?: FeatureEffect[];  // Effekte beim Aktivieren
  on_deactivation?: FeatureEffect[];  // Effekte beim Deaktivieren
}
```

**Beispiele:**

**Kampfrausch (Aktiv):**
```json
{
  "when_active": [
    {
      "type": "resistance",
      "target": "damage",
      "damage_types": ["hieb", "stich", "wucht"]
    },
    {
      "type": "modifier",
      "target": "damage",
      "value": "+1W2",  // Level-abhängig, aus progression_table
      "condition": "strength_based_attack"
    },
    {
      "type": "modifier",
      "target": "str_saves",
      "value": "advantage"
    },
    {
      "type": "modifier",
      "target": "str_checks",
      "value": "advantage"
    },
    {
      "type": "condition",
      "condition": "cannot_concentrate",
      "value": true
    },
    {
      "type": "condition",
      "condition": "cannot_cast_spells",
      "value": true
    }
  ]
}
```

**Ungerüstete Verteidigung (Passiv):**
```json
{
  "when_passive": [
    {
      "type": "calculation",
      "target": "ac",
      "calculation": "10 + DEX + CON",
      "condition": "no_armor",
      "overrides_armor": true
    }
  ]
}
```

**Rücksichtsloser Angriff (Aktiv):**
```json
{
  "type": "active",
  "uses_per_rest": null,  // Jeder Zug einmal
  "when_active": [
    {
      "type": "modifier",
      "target": "attack_rolls",
      "value": "advantage",
      "condition": "strength_based_attack"
    },
    {
      "type": "modifier",
      "target": "incoming_attack_rolls",
      "value": "advantage"
    }
  ],
  "duration": "until_next_turn_start"
}
```

**Schnelle Bewegung (Passiv):**
```json
{
  "when_passive": [
    {
      "type": "modifier",
      "target": "movement_speed",
      "value": 3,
      "condition": "no_heavy_armor"
    }
  ]
}
```

**Zusätzlicher Angriff (Passiv):**
```json
{
  "when_passive": [
    {
      "type": "modifier",
      "target": "attacks_per_action",
      "value": 2
    }
  ]
}
```

### 1.6 Charakter-Features (Active Features State)

Features, die aktiviert werden können, müssen ihren Zustand speichern.

```sql
-- Bestehende characters Tabelle erweitern
-- Im character.data JSON hinzufügen:
{
  "active_features": {
    "barbar_kampfrausch": {
      "active": false,
      "uses_remaining": 2,
      "uses_max": 2,
      "activated_at": null
    }
  },
  "feature_choices": {
    "level_4": "feat_athletisch",  // Gewähltes Feat/Talent
    "level_4_ability_scores": {"str": 2}  // Gewählte Attributswerterhöhung
  }
}
```

---

## 2. Migration aus export_classes.md

### 2.1 Parsing-Strategie

Das Markdown-File `export_classes.md` wird systematisch geparst:

1. **Klassen-Abschnitte erkennen**: `## KLASSENNAME`
2. **Basis-Daten extrahieren**: Trefferwürfel, Hauptattribute, Rettungswürfe, etc.
3. **Progressionstabelle parsen**: Markdown-Tabelle → `class_progression_tables`
4. **Klassenbeschreibung extrahieren**: Text zwischen Progressionstabelle und "Features nach Level"
5. **Features nach Level parsen**: `#### Level X` → `class_features`
6. **Unterklassen parsen**: `#### UNTERKLASSENNAME` → `class_subclasses` + Features

### 2.2 Feature-Erkennung und -Kategorisierung

**Automatische Kategorisierung:**

- **Passive Features**: Immer aktiv, keine Aktivierung nötig
  - Beispiele: "Ungerüstete Verteidigung", "Schnelle Bewegung", "Zusätzlicher Angriff"
  - Erkennung: Keine "als Bonusaktion", "als Reaktion", etc. in der Beschreibung

- **Active Features**: Müssen aktiviert werden
  - Erkennung: "als Bonusaktion", "als Aktion", "kannst du", "du kannst"
  - Beispiele: "Kampfrausch", "Rücksichtsloser Angriff"

- **Choice Features**: Spieler muss wählen
  - Erkennung: "deiner Wahl", "auswählen", "oder"
  - Beispiele: "Attributswerterhöhung", "Fertigkeitsauswahl"

- **Progression Features**: Level-abhängige Werte
  - Erkennung: Verweis auf Progressionstabelle
  - Beispiele: "Waffenmeisterung", "Kampfrausch-Schaden"

### 2.3 Effekt-Extraktion

**Regex-Pattern für häufige Effekte:**

- **Schadenresistenz**: `gegen (.+?)-Schaden resistent` → `resistance.damage_types`
- **Vorteil/Nachteil**: `im Vorteil` / `im Nachteil` → `modifier.value = "advantage"/"disadvantage"`
- **Bewegungsrate**: `Bewegungsrate (?:erhöht sich )?um (\d+) Meter` → `modifier.target = "movement_speed"`
- **AC-Berechnung**: `Rüstungsklasse (\d+) plus (.+)` → `calculation`
- **Angriffe**: `(\d+)-mal angreifen` → `modifier.target = "attacks_per_action"`
- **Schadensbonus**: `\+(\d+W\d+)` → `damage_bonus`

### 2.4 Migration-Script

```typescript
// scripts/migrate_classes.ts
async function migrateClasses() {
  const markdown = await fs.readFile('export_classes.md', 'utf-8');
  const classes = parseClassesFromMarkdown(markdown);
  
  for (const classData of classes) {
    // 1. Erstelle Klassen-Eintrag
    await db.insert('core_classes', {
      id: classData.id,
      name: classData.name,
      data: JSON.stringify(classData.baseData)
    });
    
    // 2. Erstelle Progressionstabelle
    for (const row of classData.progressionTable) {
      await db.insert('class_progression_tables', {
        class_id: classData.id,
        level: row.level,
        proficiency_bonus: row.proficiency_bonus,
        feature_names: JSON.stringify(row.features),
        class_specific_data: JSON.stringify(row.classSpecificData)
      });
    }
    
    // 3. Erstelle Features
    for (const feature of classData.features) {
      await db.insert('class_features', {
        id: feature.id,
        class_id: classData.id,
        subclass_id: feature.subclassId || null,
        name: feature.name,
        description: feature.description,
        level: feature.level,
        feature_type: feature.type,
        effects: JSON.stringify(feature.effects),
        conditions: JSON.stringify(feature.conditions || {}),
        uses_per_rest: feature.usesPerRest || null,
        rest_type: feature.restType || null
      });
    }
    
    // 4. Erstelle Unterklassen
    for (const subclass of classData.subclasses) {
      await db.insert('class_subclasses', {
        id: subclass.id,
        class_id: classData.id,
        name: subclass.name,
        description: subclass.description,
        level: subclass.level
      });
    }
  }
}
```

---

## 3. Regeltechnische Umsetzung

### 3.1 Feature-System Architektur

Das Feature-System besteht aus drei Hauptkomponenten:

1. **Feature Loader**: Lädt Features aus der DB basierend auf Charakter-Klasse und Level
2. **Feature Processor**: Verarbeitet Feature-Effekte und wendet sie an
3. **Modifier System**: Berechnet finale Werte basierend auf allen aktiven Modifiern

### 3.2 Feature Loader

```typescript
// src/lib/features/featureLoader.ts
export async function loadCharacterFeatures(
  character: Character,
  classData: Class,
  subclassId?: string
): Promise<Feature[]> {
  const level = character.meta.level;
  const classId = classData.id;
  
  // Lade alle Features bis zum aktuellen Level
  const features = await db.query(`
    SELECT * FROM class_features
    WHERE class_id = ? AND level <= ?
    AND (subclass_id IS NULL OR subclass_id = ?)
    ORDER BY level ASC
  `, [classId, level, subclassId || null]);
  
  return features.map(parseFeatureFromDb);
}
```

### 3.3 Feature Processor

```typescript
// src/lib/features/featureProcessor.ts
export function applyFeatureEffects(
  character: Character,
  features: Feature[],
  activeFeatureIds: string[]
): Modifier[] {
  const modifiers: Modifier[] = [];
  
  for (const feature of features) {
    // Passive Features immer anwenden
    if (feature.type === 'passive' && feature.effects.when_passive) {
      modifiers.push(...extractModifiers(feature.effects.when_passive, feature));
    }
    
    // Active Features nur wenn aktiviert
    if (feature.type === 'active' && activeFeatureIds.includes(feature.id)) {
      if (feature.effects.when_active) {
        modifiers.push(...extractModifiers(feature.effects.when_active, feature));
      }
    }
  }
  
  return modifiers;
}

function extractModifiers(effects: FeatureEffect[], feature: Feature): Modifier[] {
  const modifiers: Modifier[] = [];
  
  for (const effect of effects) {
    switch (effect.type) {
      case 'modifier':
        modifiers.push({
          id: `${feature.id}_${effect.target}`,
          source: feature.name,
          target: effect.target,
          modifier_type: 'Add',
          value: parseValue(effect.value),
          condition: effect.condition
        });
        break;
        
      case 'calculation':
        // Für Berechnungen wie AC: Spezialbehandlung
        // Wird in calculateDerivedStats behandelt
        break;
        
      case 'resistance':
        // Speichere als besonderen Modifier-Typ
        modifiers.push({
          id: `${feature.id}_resistance`,
          source: feature.name,
          target: 'damage_resistance',
          modifier_type: 'Override',
          value: effect.damage_types,
          condition: effect.condition
        });
        break;
    }
  }
  
  return modifiers;
}
```

### 3.4 Erweiterte Berechnungen

**AC-Berechnung (z.B. Ungerüstete Verteidigung):**

```typescript
// src/lib/characterLogic.ts
export function calculateAC(
  character: Character,
  features: Feature[],
  armor?: Armor
): number {
  // Prüfe auf "Ungerüstete Verteidigung" oder ähnliche Features
  const unarmoredDefense = features.find(f => 
    f.id.includes('ungeruestete_verteidigung') || 
    f.effects.when_passive?.some(e => e.target === 'ac' && e.calculation)
  );
  
  if (unarmoredDefense && !armor) {
    const effect = unarmoredDefense.effects.when_passive?.find(e => e.target === 'ac');
    if (effect?.calculation) {
      // Parse "10 + DEX + CON"
      return evaluateCalculation(effect.calculation, character.attributes);
    }
  }
  
  // Standard AC-Berechnung
  if (armor) {
    return calculateArmorAC(armor, character.attributes.dex);
  }
  
  return 10 + getModifier(character.attributes.dex);
}
```

**Schadensresistenz:**

```typescript
export function getDamageResistances(
  character: Character,
  features: Feature[],
  activeFeatures: string[]
): string[] {
  const resistances: string[] = [];
  
  for (const feature of features) {
    if (feature.type === 'active' && !activeFeatures.includes(feature.id)) {
      continue;
    }
    
    const resistanceEffects = [
      ...(feature.effects.when_active || []),
      ...(feature.effects.when_passive || [])
    ].filter(e => e.type === 'resistance');
    
    for (const effect of resistanceEffects) {
      if (checkCondition(effect.condition, character)) {
        resistances.push(...(effect.damage_types || []));
      }
    }
  }
  
  return [...new Set(resistances)]; // Deduplizieren
}
```

**Bewegungsrate:**

```typescript
export function calculateMovementSpeed(
  character: Character,
  features: Feature[],
  armor?: Armor
): number {
  const baseSpeed = getBaseSpeed(character.meta.species_id); // z.B. 9 Meter
  let totalSpeed = baseSpeed;
  
  for (const feature of features) {
    const speedEffects = (feature.effects.when_passive || [])
      .filter(e => e.target === 'movement_speed');
    
    for (const effect of speedEffects) {
      if (checkCondition(effect.condition, character, armor)) {
        totalSpeed += parseValue(effect.value) || 0;
      }
    }
  }
  
  return totalSpeed;
}
```

### 3.5 Feature-Aktivierung

```typescript
// src/lib/features/featureActivation.ts
export async function activateFeature(
  characterId: string,
  featureId: string,
  features: Feature[]
): Promise<void> {
  const feature = features.find(f => f.id === featureId);
  if (!feature || feature.type !== 'active') {
    throw new Error('Feature kann nicht aktiviert werden');
  }
  
  // Prüfe Bedingungen
  if (!checkFeatureConditions(feature, character)) {
    throw new Error('Feature-Bedingungen nicht erfüllt');
  }
  
  // Prüfe Uses
  const uses = getFeatureUses(character, feature);
  if (uses.remaining <= 0) {
    throw new Error('Feature aufgebraucht');
  }
  
  // Aktiviere Feature
  await updateCharacterData(characterId, {
    active_features: {
      ...character.active_features,
      [featureId]: {
        active: true,
        uses_remaining: uses.remaining - 1,
        uses_max: uses.max,
        activated_at: Date.now()
      }
    }
  });
}
```

---

## 4. UI-Integration

### 4.1 Feature-Anzeige

Features werden im Charakterbogen angezeigt:

- **Passive Features**: Immer sichtbar, mit Effekt-Beschreibung
- **Active Features**: Button zum Aktivieren/Deaktivieren, Anzeige der verbleibenden Uses
- **Choice Features**: Dropdown/Selection für Spieler-Entscheidungen

### 4.2 Feature-Verwaltung

```typescript
// src/components/features/FeatureList.tsx
export function FeatureList({ character, features }: Props) {
  const [activeFeatures, setActiveFeatures] = useState<string[]>(
    Object.keys(character.active_features || {}).filter(
      id => character.active_features[id].active
    )
  );
  
  return (
    <div>
      {features.map(feature => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          isActive={activeFeatures.includes(feature.id)}
          usesRemaining={getUsesRemaining(character, feature)}
          onActivate={() => handleActivate(feature.id)}
          onDeactivate={() => handleDeactivate(feature.id)}
        />
      ))}
    </div>
  );
}
```

---

## 5. Migration-Phasen

### Phase 1: Schema-Erstellung
1. ✅ SQL-Migrationen für neue Tabellen erstellen
2. ✅ Indizes hinzufügen
3. ✅ Trigger für Validierung

### Phase 2: Parser-Entwicklung
1. ⬜ Markdown-Parser für `export_classes.md`
2. ⬜ Feature-Erkennung und -Kategorisierung
3. ⬜ Effekt-Extraktion (manuell + automatisch)
4. ⬜ Validierung der geparsten Daten

### Phase 3: Daten-Migration
1. ⬜ Migration-Script ausführen
2. ⬜ Daten-Validierung
3. ⬜ Manuelle Korrekturen für komplexe Features

### Phase 4: Feature-System-Implementierung
1. ⬜ Feature Loader
2. ⬜ Feature Processor
3. ⬜ Erweiterte Berechnungen (AC, Bewegung, etc.)
4. ⬜ Feature-Aktivierung

### Phase 5: UI-Integration
1. ⬜ Feature-Anzeige im Charakterbogen
2. ⬜ Feature-Aktivierung UI
3. ⬜ Effekt-Anzeige (Tooltips, etc.)

### Phase 6: Testing & Optimierung
1. ⬜ Unit-Tests für Feature-System
2. ⬜ Integration-Tests für alle Klassen
3. ⬜ Performance-Optimierung
4. ⬜ Edge-Cases abdecken

---

## 6. Herausforderungen & Lösungen

### 6.1 Komplexe Features

**Problem**: Einige Features haben sehr komplexe Regeln (z.B. "Brutaler Hieb", "Kampfrausch").

**Lösung**: 
- Strukturierte Effekte für häufige Fälle
- Spezialbehandlung für besonders komplexe Features
- Manuelle Codierung für Edge-Cases

### 6.2 Level-abhängige Werte

**Problem**: Viele Features haben level-abhängige Werte (z.B. Kampfrausch-Schaden: +1W2 → +1W4 → +1W6).

**Lösung**:
- Werte in `class_progression_tables.class_specific_data` speichern
- Feature-System referenziert diese Werte
- Automatische Aktualisierung bei Level-Up

### 6.3 Bedingungen

**Problem**: Viele Features haben komplexe Bedingungen (z.B. "keine schwere Rüstung", "während Kampfrausch").

**Lösung**:
- Strukturiertes Condition-System in `feature.conditions`
- Evaluierungsfunktion für Bedingungen
- Caching für Performance

### 6.4 Interaktion zwischen Features

**Problem**: Features können sich gegenseitig beeinflussen (z.B. "Kampfrausch" + "Rücksichtsloser Angriff").

**Problem**: 
- Modifier-System kombiniert alle Effekte
- Prioritäten für Overrides
- Reihenfolge der Anwendung definieren

---

## 7. TypScript-Interfaces

```typescript
// src/lib/types/features.ts
export interface Feature {
  id: string;
  class_id: string;
  subclass_id?: string;
  name: string;
  description: string;
  level: number;
  feature_type: 'passive' | 'active' | 'progression' | 'choice' | 'reaction' | 'bonus_action';
  effects: FeatureEffects;
  conditions?: FeatureConditions;
  uses_per_rest?: string | number;
  rest_type?: 'short' | 'long';
}

export interface FeatureEffects {
  when_active?: FeatureEffect[];
  when_passive?: FeatureEffect[];
  on_activation?: FeatureEffect[];
  on_deactivation?: FeatureEffect[];
}

export interface FeatureEffect {
  type: 'modifier' | 'calculation' | 'proficiency' | 'action' | 'condition' | 'resistance' | 'damage_bonus';
  target?: string;
  value?: number | string;
  calculation?: string;
  attribute?: string;
  condition?: string;
  damage_types?: string[];
}

export interface FeatureConditions {
  armor_type?: 'light' | 'medium' | 'heavy' | 'none';
  requires_active_feature?: string[];
  requires_proficiency?: string[];
  [key: string]: unknown;
}
```

---

## 8. Nächste Schritte

1. **Sofort**: SQL-Migrationen für neue Tabellen erstellen
2. **Kurzfristig**: Markdown-Parser entwickeln
3. **Mittelfristig**: Feature-System implementieren
4. **Langfristig**: Alle Features regeltechnisch umsetzen

---

## 9. Anhang: Feature-Beispiele

### Beispiel 1: Kampfrausch (Komplex)
- **Typ**: Active
- **Uses**: Aus Progressionstabelle
- **Effekte**: Resistenz, Schadensbonus, Vorteil, Konzentration sperren
- **Bedingungen**: Keine schwere Rüstung
- **Dauer**: Bis Ende nächsten Zugs (verlängerbar)

### Beispiel 2: Ungerüstete Verteidigung (Berechnung)
- **Typ**: Passive
- **Effekt**: AC = 10 + DEX + CON (wenn keine Rüstung)
- **Override**: Überschreibt Standard-AC-Berechnung

### Beispiel 3: Zusätzlicher Angriff (Progression)
- **Typ**: Passive
- **Effekt**: +1 Angriff pro Aktion (ab Level 5)
- **Universal**: Alle kämpferischen Klassen haben dies auf unterschiedlichen Levels

### Beispiel 4: Attributswerterhöhung (Choice)
- **Typ**: Choice
- **Effekt**: Spieler wählt Feat oder +2 Attributspunkte (oder +1/+1)
- **Speicherung**: In `character.feature_choices`

---

*Dieses Konzept ist ein lebendiges Dokument und wird basierend auf Implementierungserfahrungen aktualisiert.*
