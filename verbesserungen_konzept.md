Ich habe die drei Dokumente analysiert. Das Konzept ist bereits sehr durchdacht, aber ich sehe einige wichtige Verbesserungspotenziale:

## Hauptverbesserungen

### 1. **Datenkonsistenz zwischen Frontend und Backend**

**Problem:** Die beiden Konzepte definieren teilweise unterschiedliche Datenstrukturen für dieselben Entitäten.

**Verbesserung:**
```typescript
// Einheitliche FeatureTracking-Struktur für beide Seiten
export interface FeatureTracking {
  // Backend (Rust) speichert als JSON in characters.data
  // Frontend (TypeScript) nutzt exakt dieselbe Struktur
  active_features: Record<string, ActiveFeatureState>;
  feature_choices: Record<string, FeatureChoice>;
  feature_history: FeatureHistoryEntry[];
  
  // NEU: Synchronisations-Metadaten
  last_synced: number;
  version: number; // Schema-Version für Migrations
}
```

### 2. **Feature-System: Berechnungs-Caching**

**Problem:** Das Frontend-Konzept zeigt `ModifierTrace[]` als flache Liste, aber komplexe Berechnungen (AC, Bewegung) werden bei jedem Render neu berechnet.

**Verbesserung:**
```typescript
// src/lib/features/featureCache.ts
export class FeatureCache {
  private cache = new Map<string, CachedValue>();
  
  // Memoization mit Abhängigkeits-Tracking
  getDerivedStat(
    key: string,
    dependencies: unknown[],
    calculator: () => unknown
  ) {
    const depsHash = hashDependencies(dependencies);
    const cached = this.cache.get(key);
    
    if (cached?.depsHash === depsHash) {
      return cached.value;
    }
    
    const value = calculator();
    this.cache.set(key, { value, depsHash });
    return value;
  }
}

// Verwendung in CombatStats
const derivedStats = useMemo(() => {
  return featureCache.getDerivedStat(
    'combat_stats',
    [character, features, activeFeatures],
    () => calculateDerivedStats(character, features, activeFeatures)
  );
}, [character, features, activeFeatures]);
```

### 3. **Feature-Migration: Inkrementelle Migration statt Bulk**

**Problem:** Das Backend-Konzept plant eine Bulk-Migration aller Klassen. Bei 13+ Klassen mit Hunderten Features ist das fehleranfällig.

**Verbesserung:**
```typescript
// scripts/migrate_classes_incremental.ts
async function migrateClassIncremental(className: string) {
  const checkpoint = await loadCheckpoint(className);
  
  try {
    // Phase 1: Parse & Validate
    const classData = parseClassFromMarkdown(className);
    await validateClassData(classData);
    await saveCheckpoint(className, 'parsed');
    
    // Phase 2: Insert Core Data
    await insertClassData(classData);
    await saveCheckpoint(className, 'core_inserted');
    
    // Phase 3: Insert Features
    for (const feature of classData.features) {
      await insertFeature(feature);
      await saveCheckpoint(className, `feature_${feature.id}`);
    }
    
    // Phase 4: Validate in DB
    await validateClassInDB(classData.id);
    await saveCheckpoint(className, 'complete');
    
  } catch (error) {
    console.error(`Migration failed at checkpoint: ${checkpoint}`);
    throw error;
  }
}
```

### 4. **UI: Progressive Disclosure für Feature-Details**

**Problem:** Die FeatureCard zeigt alle Informationen auf einmal, was bei vielen Features überwältigend wirkt.

**Verbesserung:**
```tsx
// Drei-Stufen-Ansicht
export function FeatureCard({ feature, ... }: FeatureCardProps) {
  const [detailLevel, setDetailLevel] = useState<'compact' | 'summary' | 'full'>('compact');
  
  return (
    <div className="feature-card">
      {/* Stufe 1: Compact - Nur Name + Badge */}
      {detailLevel === 'compact' && (
        <div onClick={() => setDetailLevel('summary')}>
          <h3>{feature.name}</h3>
          <FeatureBadges {...} />
        </div>
      )}
      
      {/* Stufe 2: Summary - + Beschreibung + Effekte-Zusammenfassung */}
      {detailLevel === 'summary' && (
        <>
          <CompactHeader onClick={() => setDetailLevel('full')} />
          <p className="truncate-3-lines">{feature.description}</p>
          <EffectSummary modifiers={modifiers} /> {/* "AC +3, Vorteil auf STR" */}
        </>
      )}
      
      {/* Stufe 3: Full - Alle Details */}
      {detailLevel === 'full' && <FeatureDetailView {...} />}
    </div>
  );
}
```

### 5. **Backend: Feature-Effekt-Validierung**

**Problem:** Das Backend-Konzept definiert `FeatureEffect` als JSON, aber keine Validierung der Struktur.

**Verbesserung:**
```rust
// src-tauri/src/db/migrations.rs
CREATE TRIGGER validate_feature_effects
BEFORE INSERT ON class_features
FOR EACH ROW
BEGIN
  -- Validate effects JSON structure
  SELECT CASE
    WHEN json_type(NEW.effects) != 'object' THEN
      RAISE(ABORT, 'effects must be a JSON object')
    WHEN json_extract(NEW.effects, '$.when_active') IS NOT NULL 
      AND json_type(json_extract(NEW.effects, '$.when_active')) != 'array' THEN
      RAISE(ABORT, 'when_active must be an array')
    -- Weitere Validierungen...
  END;
END;

// TypeScript-Side: Runtime-Validierung
import { z } from 'zod';

const FeatureEffectSchema = z.object({
  type: z.enum(['modifier', 'calculation', 'proficiency', ...]),
  target: z.string().optional(),
  value: z.union([z.number(), z.string()]).optional(),
  calculation: z.string().optional(),
  condition: z.string().optional(),
});

const FeatureEffectsSchema = z.object({
  when_active: z.array(FeatureEffectSchema).optional(),
  when_passive: z.array(FeatureEffectSchema).optional(),
  on_activation: z.array(FeatureEffectSchema).optional(),
  on_deactivation: z.array(FeatureEffectSchema).optional(),
});
```

### 6. **Feature-Choice-System: Rollback-Mechanismus**

**Problem:** Wenn ein Spieler eine Feature-Entscheidung ändert (z.B. Attributswerterhöhung), gibt es keine Möglichkeit, die alte Entscheidung rückgängig zu machen.

**Verbesserung:**
```typescript
export interface FeatureChoice {
  level: number;
  feature_id: string;
  choice_type: 'ability_scores' | 'feat' | 'skill' | ...;
  choice_value: unknown;
  timestamp: number;
  
  // NEU: Rollback-Support
  previous_choice?: FeatureChoice; // Verkettete Liste
  locked: boolean; // Kann nicht mehr geändert werden (z.B. nach Level-Up)
}

async function changeFeatureChoice(
  characterId: string,
  featureId: string,
  newChoice: unknown
) {
  const currentChoice = character.feature_tracking.feature_choices[featureId];
  
  if (currentChoice?.locked) {
    throw new Error('Choice is locked and cannot be changed');
  }
  
  // Speichere alte Choice als Rollback
  const updatedChoice: FeatureChoice = {
    ...currentChoice,
    choice_value: newChoice,
    timestamp: Date.now(),
    previous_choice: currentChoice, // Verkettung
  };
  
  // Entferne alte Effekte
  await removeChoiceEffects(characterId, currentChoice);
  
  // Wende neue Effekte an
  await applyChoiceEffects(characterId, featureId, newChoice);
}
```

### 7. **Performance: Virtuelle Listen für Features**

**Problem:** Bei Level 20 können Charaktere 50+ Features haben. Alle auf einmal zu rendern ist langsam.

**Verbesserung:**
```tsx
// src/components/features/FeatureProgressionView.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function FeatureProgressionView({ character, ... }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const featureGroups = useMemo(() => ..., [...]);
  
  const virtualizer = useVirtualizer({
    count: featureGroups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Geschätzte Höhe pro Level-Group
    overscan: 2, // Pre-render 2 Items außerhalb Viewport
  });
  
  return (
    <div ref={parentRef} className="feature-progression">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <FeatureLevelGroup
              level={featureGroups[virtualRow.index].level}
              features={featureGroups[virtualRow.index].features}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 8. **Backend: Feature-Dependencies & Prerequisites**

**Problem:** Einige Features erfordern andere Features (z.B. Unterklassen-Features erfordern Basisklassen-Features).

**Verbesserung:**
```sql
-- Neue Tabelle für Feature-Abhängigkeiten
CREATE TABLE IF NOT EXISTS feature_prerequisites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_id TEXT NOT NULL,
    prerequisite_type TEXT NOT NULL CHECK(prerequisite_type IN (
        'feature',      -- Erfordert anderes Feature
        'level',        -- Mindest-Level
        'attribute',    -- Mindest-Attributswert
        'class',        -- Erfordert bestimmte Klasse
        'subclass'      -- Erfordert bestimmte Unterklasse
    )),
    prerequisite_value TEXT NOT NULL, -- JSON mit Details
    FOREIGN KEY (feature_id) REFERENCES class_features(id) ON DELETE CASCADE
);

-- TypeScript
export interface FeaturePrerequisite {
  type: 'feature' | 'level' | 'attribute' | 'class' | 'subclass';
  value: string | number | { attribute: string; minimum: number };
}

// Validierung vor Feature-Aktivierung
function canActivateFeature(
  character: Character,
  feature: Feature,
  prerequisites: FeaturePrerequisite[]
): boolean {
  for (const prereq of prerequisites) {
    switch (prereq.type) {
      case 'feature':
        if (!character.feature_tracking.active_features[prereq.value]) {
          return false;
        }
        break;
      case 'level':
        if (character.meta.level < prereq.value) {
          return false;
        }
        break;
      // ...
    }
  }
  return true;
}
```

### 9. **UI: Feature-Filter & Gruppierung**

**Problem:** Die FeatureProgressionView zeigt alle Features chronologisch. Bei vielen Features schwer zu navigieren.

**Verbesserung:**
```tsx
export function FeatureProgressionView({ ... }) {
  const [groupBy, setGroupBy] = useState<'level' | 'type' | 'source'>('level');
  const [filterType, setFilterType] = useState<FeatureType | 'all'>('all');
  
  const groupedFeatures = useMemo(() => {
    const filtered = features.filter(f => 
      filterType === 'all' || f.feature_type === filterType
    );
    
    switch (groupBy) {
      case 'level':
        return groupByLevel(filtered);
      case 'type':
        return groupByType(filtered); // Passive, Active, Choice
      case 'source':
        return groupBySource(filtered); // Class, Subclass, Feat
    }
  }, [features, groupBy, filterType]);
  
  return (
    <div>
      <div className="feature-controls">
        <ButtonGroup>
          <Button onClick={() => setGroupBy('level')}>Nach Level</Button>
          <Button onClick={() => setGroupBy('type')}>Nach Typ</Button>
          <Button onClick={() => setGroupBy('source')}>Nach Quelle</Button>
        </ButtonGroup>
        
        <Select value={filterType} onChange={setFilterType}>
          <option value="all">Alle Features</option>
          <option value="passive">Passive</option>
          <option value="active">Aktive</option>
          <option value="choice">Entscheidungen</option>
        </Select>
      </div>
      
      {/* Grouped Features */}
    </div>
  );
}
```

### 10. **Persistenz: Optimistische Updates mit Rollback**

**Problem:** Wenn ein Feature aktiviert wird, wird der State sofort aktualisiert, aber die DB-Operation könnte fehlschlagen.

**Verbesserung:**
```typescript
// src/lib/features/featureActivation.ts
export async function activateFeature(
  characterId: string,
  featureId: string
): Promise<void> {
  const character = useCharacterStore.getState().currentCharacter;
  const previousState = { ...character.feature_tracking };
  
  try {
    // Optimistisches Update (sofort)
    useCharacterStore.setState({
      currentCharacter: {
        ...character,
        feature_tracking: {
          ...character.feature_tracking,
          active_features: {
            ...character.feature_tracking.active_features,
            [featureId]: {
              active: true,
              uses_remaining: getUsesRemaining(character, featureId) - 1,
              uses_max: getMaxUses(character, featureId),
              activated_at: Date.now(),
            }
          }
        }
      }
    });
    
    // Backend-Update (async)
    await characterApi.update(characterId, {
      feature_tracking: character.feature_tracking
    });
    
  } catch (error) {
    // Rollback bei Fehler
    useCharacterStore.setState({
      currentCharacter: {
        ...character,
        feature_tracking: previousState
      }
    });
    
    throw error;
  }
}
```

## Zusammenfassung der Verbesserungen

| Bereich | Verbesserung | Priorität |
|---------|--------------|-----------|
| Datenkonsistenz | Einheitliche Typen Frontend/Backend | **Hoch** |
| Performance | Feature-Cache + Virtuelle Listen | **Hoch** |
| Migration | Inkrementelle Migration mit Checkpoints | **Mittel** |
| UI/UX | Progressive Disclosure + Filter | **Mittel** |
| Validierung | Runtime + DB-Trigger | **Hoch** |
| Rollback | Choice-Änderungen + Optimistische Updates | **Mittel** |
| Dependencies | Feature-Prerequisites-System | **Niedrig** |

Die Konzepte sind bereits **sehr gut durchdacht**. Die vorgeschlagenen Verbesserungen fokussieren sich auf:
1. **Robustheit** (Validierung, Rollback)
2. **Performance** (Caching, Virtualisierung)
3. **UX** (Progressive Disclosure, Filter)
4. **Wartbarkeit** (Inkrementelle Migration)

Soll ich eines dieser Verbesserungskonzepte detaillierter ausarbeiten?