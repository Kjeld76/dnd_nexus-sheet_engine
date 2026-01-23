# Konzept: Frontend Feature-Dokumentation und Transparenz

## Übersicht

Dieses Konzept beschreibt die Frontend-Implementierung für die transparente und nachvollziehbare Dokumentation aller Klassenmerkmale (Features), Entscheidungen und Modifikationen auf dem Charakterbogen. Jede Berechnung muss ihre Quelle offenlegen, und alle Entscheidungen müssen von Stufe 1 bis Stufe 20 nachvollziehbar sein.

## Zielsetzung

1. **Vollständige Transparenz**: Alle angewandten Features und Modifikationen sind sichtbar
2. **Nachvollziehbarkeit**: Jeder Wert kann bis zu seiner Quelle zurückverfolgt werden
3. **Dokumentation**: Alle Entscheidungen (Feature-Auswahl, Optionen) werden gespeichert
4. **Progression**: Historie aller Features von Level 1 bis aktuelles Level
5. **Benutzerfreundlichkeit**: Klare, übersichtliche Darstellung ohne Überforderung

---

## 1. Datenstrukturen für Feature-Tracking

### 1.1 Erweiterte Character-Datenstruktur

```typescript
// src/lib/types.ts - Erweiterung
export interface Character {
  // ... bestehende Felder
  
  // NEU: Feature-Dokumentation
  feature_tracking: FeatureTracking;
}

export interface FeatureTracking {
  // Aktive Features (derzeit aktiviert)
  active_features: Record<string, ActiveFeatureState>;
  
  // Alle Feature-Entscheidungen (permanent)
  feature_choices: Record<string, FeatureChoice>;
  
  // Feature-Historie (chronologisch nach Level)
  feature_history: FeatureHistoryEntry[];
  
  // Modifikations-Tracking (automatisch generiert)
  modifier_trace: ModifierTrace[];
}

export interface ActiveFeatureState {
  feature_id: string;
  active: boolean;
  uses_remaining: number;
  uses_max: number;
  activated_at: number | null;
  last_restored_at: number | null;
}

export interface FeatureChoice {
  level: number;
  feature_id: string;
  feature_name: string;
  choice_type: 'ability_scores' | 'feat' | 'skill' | 'tool' | 'subclass' | 'other';
  choice_value: unknown; // Strukturiert je nach choice_type
  timestamp: number;
}

// Beispiel choice_value Strukturen:
// ability_scores: { str: 2 } oder { str: 1, dex: 1 }
// feat: "feat_id"
// skill: "skill_id"
// tool: { tool_id: "tool_id", category: "category" }
// subclass: "subclass_id"

export interface FeatureHistoryEntry {
  level: number;
  feature_id: string;
  feature_name: string;
  feature_type: 'passive' | 'active' | 'choice' | 'progression';
  source: 'class' | 'subclass' | 'feat' | 'species' | 'background';
  source_name: string;
  description: string;
  obtained_at: number; // Timestamp
}

export interface ModifierTrace {
  target: string; // z.B. "ac", "str", "movement_speed", "attack_rolls"
  value: number | string; // Zahl oder "advantage"/"disadvantage"
  source: string; // Feature-Name oder Feat-Name
  source_id: string; // Feature-ID
  level: number; // Auf welchem Level erhalten
  type: 'add' | 'multiply' | 'override' | 'calculation' | 'advantage' | 'resistance';
  condition?: string; // Wenn Bedingung erfüllt
  is_active: boolean; // Nur für active features
}
```

### 1.2 Feature-Anzeige-Struktur

```typescript
// src/lib/features/featureDisplay.ts
export interface FeatureDisplayData {
  feature: Feature; // Aus Backend
  state: ActiveFeatureState | null; // Aktueller Zustand
  choice: FeatureChoice | null; // Wenn Choice-Feature
  modifiers: ModifierTrace[]; // Alle Modifikationen von diesem Feature
  level_obtained: number;
  is_active: boolean;
  can_activate: boolean;
  can_deactivate: boolean;
}

export interface FeatureGroup {
  level: number;
  features: FeatureDisplayData[];
  choices_pending: Feature[]; // Features, die noch eine Entscheidung brauchen
}
```

---

## 2. UI-Komponenten

### 2.1 Features-Tab im Charakterbogen

Ein neuer Tab "Merkmale" (Features) zeigt alle Features übersichtlich:

```
[Übersicht] [Kampf] [Ausrüstung] [Zauber] [Merkmale] [Einstellungen]
```

### 2.2 Feature-Progression-Ansicht

**Hauptkomponente: `FeatureProgressionView`**

```tsx
// src/components/features/FeatureProgressionView.tsx
export function FeatureProgressionView({ character, classData, subclassData }) {
  const featureGroups = useMemo(() => 
    groupFeaturesByLevel(character, classData, subclassData),
    [character, classData, subclassData]
  );
  
  return (
    <div className="feature-progression">
      <FeatureSummary 
        character={character}
        totalFeatures={getTotalFeatureCount(featureGroups)}
        activeFeatures={getActiveFeatureCount(character)}
        pendingChoices={getPendingChoices(featureGroups)}
      />
      
      {featureGroups.map(group => (
        <FeatureLevelGroup
          key={group.level}
          level={group.level}
          features={group.features}
          choicesPending={group.choices_pending}
          character={character}
        />
      ))}
    </div>
  );
}
```

**Visuelles Layout:**

```
┌─────────────────────────────────────────────────────────┐
│ Merkmale (12 aktiv, 3 Entscheidungen offen)           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Stufe 1                                                │
│ ┌───────────────────────────────────────────────────┐ │
│ │ ⚔️ KAMPFRAUSCH [Aktiv] [2/2]                     │ │
│ │    Level 1 • Barbar • Basis-Klasse               │ │
│ │    Du kannst dich mit Urmacht versehen...        │ │
│ │    📊 Effekte:                                    │ │
│ │    • Resistenz: Hieb, Stich, Wucht               │ │
│ │    • Schadensbonus: +1W2 (wenn aktiv)            │ │
│ │    • Vorteil: Stärke-Würfe                       │ │
│ │    [Details] [Deaktivieren]                      │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 🛡️ UNGERÜSTETE VERTEIDIGUNG [Passiv]             │ │
│ │    Level 1 • Barbar • Basis-Klasse               │ │
│ │    AC = 10 + GES + KON (wenn keine Rüstung)     │ │
│ │    📊 Aktuell: 15 (10 + 2 + 3)                   │ │
│ │    [Details]                                     │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ Stufe 3                                                │
│ ┌───────────────────────────────────────────────────┐ │
│ │ ⚡ URWISSEN [Passiv]                              │ │
│ │    Level 3 • Barbar • Basis-Klasse               │ │
│ │    Fertigkeit gewählt: Überlebenskunst           │ │
│ │    📊 Effekte:                                    │ │
│ │    • Fertigkeit: Überlebenskunst (+ÜB)           │ │
│ │    [Details] [Fertigkeit ändern]                 │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ Stufe 4                                                │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 📈 ATTRIBUTSWERTERHÖHUNG [Entscheidung offen]    │ │
│ │    Level 4 • Barbar • Basis-Klasse               │ │
│ │    Wähle: Feat oder +2 Attributspunkte           │ │
│ │    [Entscheidung treffen]                        │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Feature-Card Komponente

```tsx
// src/components/features/FeatureCard.tsx
export function FeatureCard({ 
  feature, 
  state, 
  choice, 
  modifiers, 
  level, 
  character 
}: FeatureCardProps) {
  const isActive = state?.active ?? false;
  const canActivate = feature.feature_type === 'active' && !isActive;
  const canDeactivate = feature.feature_type === 'active' && isActive;
  const needsChoice = feature.feature_type === 'choice' && !choice;
  
  return (
    <div className="feature-card" data-feature-type={feature.feature_type}>
      <div className="feature-header">
        <FeatureIcon type={feature.feature_type} />
        <h3>{feature.name}</h3>
        <FeatureBadges 
          type={feature.feature_type}
          isActive={isActive}
          usesRemaining={state?.uses_remaining}
          usesMax={state?.uses_max}
        />
      </div>
      
      <div className="feature-meta">
        <span>Stufe {level}</span>
        <span>•</span>
        <span>{feature.source_name}</span>
        {feature.subclass_id && (
          <>
            <span>•</span>
            <span>{subclassName}</span>
          </>
        )}
      </div>
      
      <p className="feature-description">{feature.description}</p>
      
      {/* Modifier-Anzeige */}
      {modifiers.length > 0 && (
        <div className="feature-modifiers">
          <strong>📊 Aktuelle Effekte:</strong>
          <ModifierBreakdown modifiers={modifiers} />
        </div>
      )}
      
      {/* Choice-Anzeige */}
      {choice && (
        <div className="feature-choice">
          <strong>✅ Entscheidung (Stufe {choice.level}):</strong>
          <ChoiceDisplay choice={choice} />
        </div>
      )}
      
      {/* Aktionen */}
      <div className="feature-actions">
        {canActivate && (
          <Button onClick={() => handleActivate(feature.id)}>
            Aktivieren
          </Button>
        )}
        {canDeactivate && (
          <Button onClick={() => handleDeactivate(feature.id)}>
            Deaktivieren
          </Button>
        )}
        {needsChoice && (
          <Button onClick={() => handleMakeChoice(feature.id)}>
            Entscheidung treffen
          </Button>
        )}
        <Button variant="ghost" onClick={() => showDetails(feature.id)}>
          Details
        </Button>
      </div>
    </div>
  );
}
```

### 2.4 Modifier-Breakdown Komponente

Zeigt alle Modifikationen eines Features:

```tsx
// src/components/features/ModifierBreakdown.tsx
export function ModifierBreakdown({ modifiers }: { modifiers: ModifierTrace[] }) {
  return (
    <div className="modifier-breakdown">
      {modifiers.map((mod, idx) => (
        <div key={idx} className="modifier-item">
          <ModifierIcon type={mod.type} />
          <span className="modifier-target">{formatTarget(mod.target)}</span>
          <span className="modifier-value">
            {formatModifierValue(mod.value, mod.type)}
          </span>
          {mod.condition && (
            <span className="modifier-condition">
              (wenn: {mod.condition})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// Beispiele:
// "Rüstungsklasse" → "+3" (Berechnung: 10 + GES + KON)
// "Schadensresistenz" → "Hieb, Stich, Wucht"
// "Angriffswürfe" → "Vorteil" (wenn: Stärke-basierter Angriff)
// "Schadensbonus" → "+1W2" (wenn aktiv)
```

### 2.5 Value-Trace Komponente

Zeigt für jeden Wert die Quellen an:

```tsx
// src/components/features/ValueTrace.tsx
export function ValueTrace({ 
  label, 
  value, 
  baseValue, 
  modifiers 
}: ValueTraceProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="value-trace">
      <div className="value-trace-header" onClick={() => setExpanded(!expanded)}>
        <span className="value-label">{label}:</span>
        <span className="value-final">{value}</span>
        <ChevronIcon direction={expanded ? 'up' : 'down'} />
      </div>
      
      {expanded && (
        <div className="value-breakdown">
          <div className="value-base">
            Basis: {baseValue}
          </div>
          {modifiers.map((mod, idx) => (
            <div key={idx} className="value-modifier">
              {mod.type === 'add' && '+'}
              {mod.type === 'multiply' && '×'}
              {mod.value}
              <span className="value-source">({mod.source})</span>
            </div>
          ))}
          <div className="value-final">
            = {value}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Verwendung in CombatStats:**

```tsx
// src/components/character/CombatStats.tsx
<ValueTrace
  label="Rüstungsklasse"
  value={derivedStats.ac}
  baseValue={10}
  modifiers={[
    { type: 'add', value: dexMod, source: 'Geschicklichkeit (+2)' },
    { type: 'add', value: conMod, source: 'Ungerüstete Verteidigung (KON)' },
    { type: 'add', value: 2, source: 'Schild' }
  ]}
/>

<ValueTrace
  label="Bewegungsrate"
  value={derivedStats.movement_speed}
  baseValue={9}
  modifiers={[
    { type: 'add', value: 3, source: 'Schnelle Bewegung (Barbar Stufe 5)' }
  ]}
/>
```

---

## 3. Feature-Detail-Dialog

### 3.1 Feature-Details Komponente

Zeigt vollständige Informationen eines Features:

```tsx
// src/components/features/FeatureDetailsDialog.tsx
export function FeatureDetailsDialog({ 
  feature, 
  character, 
  isOpen, 
  onClose 
}: FeatureDetailsDialogProps) {
  const modifiers = getFeatureModifiers(character, feature);
  const choice = character.feature_tracking.feature_choices[feature.id];
  const history = getFeatureHistory(character, feature);
  
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogHeader>
        <FeatureIcon type={feature.feature_type} />
        <h2>{feature.name}</h2>
        <FeatureMeta feature={feature} character={character} />
      </DialogHeader>
      
      <DialogBody>
        {/* Beschreibung */}
        <section>
          <h3>Beschreibung</h3>
          <p>{feature.description}</p>
        </section>
        
        {/* Aktuelle Effekte */}
        {modifiers.length > 0 && (
          <section>
            <h3>📊 Aktuelle Effekte</h3>
            <ModifierBreakdown modifiers={modifiers} />
            {modifiers.some(m => m.condition) && (
              <FeatureConditions 
                feature={feature}
                character={character}
              />
            )}
          </section>
        )}
        
        {/* Entscheidung */}
        {choice && (
          <section>
            <h3>✅ Getroffene Entscheidung</h3>
            <ChoiceDisplay choice={choice} detailed />
            <Button onClick={() => handleChangeChoice(feature.id)}>
              Entscheidung ändern
            </Button>
          </section>
        )}
        
        {/* Verwendungen */}
        {feature.uses_per_rest && (
          <section>
            <h3>Verwendungen</h3>
            <UsesDisplay 
              remaining={state?.uses_remaining ?? 0}
              max={state?.uses_max ?? 0}
              restType={feature.rest_type}
            />
          </section>
        )}
        
        {/* Historie */}
        <section>
          <h3>Progression</h3>
          <FeatureHistory history={history} />
        </section>
      </DialogBody>
    </Dialog>
  );
}
```

---

## 4. Feature-Entscheidungs-Dialoge

### 4.1 Attributswerterhöhung Dialog

```tsx
// src/components/features/AbilityScoreChoiceDialog.tsx
export function AbilityScoreChoiceDialog({
  feature,
  character,
  onConfirm,
  onCancel
}: AbilityScoreChoiceDialogProps) {
  const [choiceType, setChoiceType] = useState<'ability' | 'feat'>('ability');
  const [abilityScores, setAbilityScores] = useState<Record<string, number>>({});
  const [selectedFeat, setSelectedFeat] = useState<string | null>(null);
  
  return (
    <Dialog>
      <DialogHeader>
        <h2>{feature.name}</h2>
        <p>Stufe {feature.level} • {feature.source_name}</p>
      </DialogHeader>
      
      <DialogBody>
        <Tabs value={choiceType} onValueChange={setChoiceType}>
          <TabList>
            <Tab value="ability">Attributspunkte (+2)</Tab>
            <Tab value="feat">Talent</Tab>
          </TabList>
          
          <TabPanel value="ability">
            <AbilityScoreSelector
              availablePoints={2}
              currentScores={character.attributes}
              onSelectionChange={setAbilityScores}
            />
            <AbilityScorePreview 
              current={character.attributes}
              changes={abilityScores}
            />
          </TabPanel>
          
          <TabPanel value="feat">
            <FeatSelector
              character={character}
              onFeatSelect={setSelectedFeat}
            />
          </TabPanel>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={onCancel}>Abbrechen</Button>
          <Button onClick={() => handleConfirm()}>
            Bestätigen
          </Button>
        </DialogFooter>
      </DialogBody>
    </Dialog>
  );
}
```

### 4.2 Fertigkeitsauswahl Dialog

```tsx
// src/components/features/SkillChoiceDialog.tsx
export function SkillChoiceDialog({
  feature,
  character,
  availableSkills,
  onConfirm,
  onCancel
}: SkillChoiceDialogProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const requiredCount = feature.skill_choices?.choose ?? 1;
  
  return (
    <Dialog>
      <DialogHeader>
        <h2>{feature.name}</h2>
        <p>
          Wähle {requiredCount} Fertigkeit{requiredCount > 1 ? 'en' : ''} 
          aus {availableSkills.length} Optionen
        </p>
      </DialogHeader>
      
      <DialogBody>
        <SkillSelector
          availableSkills={availableSkills}
          selectedSkills={selectedSkills}
          maxSelections={requiredCount}
          onSelectionChange={setSelectedSkills}
        />
        
        {selectedSkills.length === requiredCount && (
          <SkillPreview 
            selectedSkills={selectedSkills}
            currentProficiencies={character.proficiencies.skills}
          />
        )}
      </DialogBody>
      
      <DialogFooter>
        <Button onClick={onCancel}>Abbrechen</Button>
        <Button 
          onClick={() => handleConfirm(selectedSkills)}
          disabled={selectedSkills.length !== requiredCount}
        >
          Bestätigen ({selectedSkills.length}/{requiredCount})
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
```

---

## 5. Integration in bestehende Komponenten

### 5.1 CombatStats-Erweiterung

```tsx
// src/components/character/CombatStats.tsx
export function CombatStats({ character, classData, features }) {
  const derivedStats = calculateDerivedStats(character, classData, ...);
  const modifierTraces = getModifierTraces(character, features);
  
  return (
    <div className="combat-stats">
      <h2>Kampfwerte</h2>
      
      {/* AC mit Trace */}
      <ValueTrace
        label="Rüstungsklasse"
        value={derivedStats.ac}
        baseValue={getBaseAC(character)}
        modifiers={getACModifiers(modifierTraces, character)}
      />
      
      {/* Initiative mit Trace */}
      <ValueTrace
        label="Initiative"
        value={derivedStats.initiative}
        baseValue={getModifier(character.attributes.dex)}
        modifiers={getInitiativeModifiers(modifierTraces)}
      />
      
      {/* Bewegung mit Trace */}
      <ValueTrace
        label="Bewegungsrate"
        value={derivedStats.movement_speed}
        baseValue={getBaseSpeed(character.meta.species_id)}
        modifiers={getMovementModifiers(modifierTraces, character)}
      />
      
      {/* Resistenz-Anzeige */}
      {derivedStats.damage_resistances.length > 0 && (
        <div className="damage-resistances">
          <strong>Schadensresistenz:</strong>
          <ResistanceList 
            resistances={derivedStats.damage_resistances}
            sources={getResistanceSources(modifierTraces)}
          />
        </div>
      )}
      
      {/* Aktive Features Badge */}
      {getActiveFeatureCount(character) > 0 && (
        <ActiveFeaturesBadge 
          count={getActiveFeatureCount(character)}
          onClick={() => navigateToFeatures()}
        />
      )}
    </div>
  );
}
```

### 5.2 AttributeBlock-Erweiterung

```tsx
// src/components/character/AttributeBlock.tsx
export function AttributeBlock({ character, features }) {
  const modifierTraces = getModifierTraces(character, features);
  
  return (
    <div className="attribute-block">
      {Object.entries(character.attributes).map(([attr, value]) => {
        const modifiers = getAttributeModifiers(modifierTraces, attr);
        const finalValue = calculateFinalAttributeValue(value, modifiers);
        
        return (
          <div key={attr} className="attribute">
            <ValueTrace
              label={getAttributeLabel(attr)}
              value={finalValue}
              baseValue={value}
              modifiers={modifiers}
            />
            <ModifierDisplay value={getModifier(finalValue)} />
          </div>
        );
      })}
    </div>
  );
}
```

---

## 6. Feature-State-Management

### 6.1 Feature-Aktivierung

```tsx
// src/lib/features/featureActivation.ts
export async function activateFeature(
  characterId: string,
  featureId: string,
  features: Feature[]
): Promise<void> {
  const feature = features.find(f => f.id === featureId);
  if (!feature || feature.feature_type !== 'active') {
    throw new Error('Feature kann nicht aktiviert werden');
  }
  
  // Prüfe Bedingungen
  if (!checkFeatureConditions(feature, character)) {
    throw new Error('Feature-Bedingungen nicht erfüllt');
  }
  
  // Prüfe Uses
  const state = character.feature_tracking.active_features[featureId];
  if (state && state.uses_remaining <= 0) {
    throw new Error('Feature aufgebraucht');
  }
  
  // Aktiviere Feature
  await updateCharacter(characterId, {
    feature_tracking: {
      ...character.feature_tracking,
      active_features: {
        ...character.feature_tracking.active_features,
        [featureId]: {
          feature_id: featureId,
          active: true,
          uses_remaining: (state?.uses_remaining ?? getMaxUses(feature, character)) - 1,
          uses_max: getMaxUses(feature, character),
          activated_at: Date.now(),
          last_restored_at: state?.last_restored_at ?? null
        }
      }
    }
  });
  
  // Log in Historie
  await logFeatureActivation(characterId, featureId);
}
```

### 6.2 Feature-Entscheidung speichern

```tsx
// src/lib/features/featureChoice.ts
export async function saveFeatureChoice(
  characterId: string,
  featureId: string,
  choice: FeatureChoiceValue,
  choiceType: FeatureChoice['choice_type']
): Promise<void> {
  const feature = await getFeature(featureId);
  
  // Validiere Choice
  validateFeatureChoice(feature, choice, choiceType);
  
  // Speichere Choice
  await updateCharacter(characterId, {
    feature_tracking: {
      ...character.feature_tracking,
      feature_choices: {
        ...character.feature_tracking.feature_choices,
        [featureId]: {
          level: feature.level,
          feature_id: featureId,
          feature_name: feature.name,
          choice_type: choiceType,
          choice_value: choice,
          timestamp: Date.now()
        }
      }
    }
  });
  
  // Wende Choice-Effekte an
  await applyChoiceEffects(characterId, feature, choice, choiceType);
}
```

### 6.3 Modifier-Trace-Generierung

```tsx
// src/lib/features/modifierTrace.ts
export function generateModifierTraces(
  character: Character,
  features: Feature[]
): ModifierTrace[] {
  const traces: ModifierTrace[] = [];
  const activeFeatureIds = Object.keys(
    character.feature_tracking.active_features
  ).filter(
    id => character.feature_tracking.active_features[id].active
  );
  
  for (const feature of features) {
    // Passive Features
    if (feature.feature_type === 'passive') {
      const effects = feature.effects.when_passive || [];
      for (const effect of effects) {
        traces.push({
          target: effect.target || '',
          value: effect.value || 0,
          source: feature.name,
          source_id: feature.id,
          level: feature.level,
          type: mapEffectTypeToModifierType(effect.type),
          condition: effect.condition,
          is_active: false
        });
      }
    }
    
    // Active Features (nur wenn aktiv)
    if (feature.feature_type === 'active' && activeFeatureIds.includes(feature.id)) {
      const effects = feature.effects.when_active || [];
      for (const effect of effects) {
        traces.push({
          target: effect.target || '',
          value: effect.value || 0,
          source: feature.name,
          source_id: feature.id,
          level: feature.level,
          type: mapEffectTypeToModifierType(effect.type),
          condition: effect.condition,
          is_active: true
        });
      }
    }
    
    // Choice Features (angewandte Entscheidungen)
    const choice = character.feature_tracking.feature_choices[feature.id];
    if (choice) {
      const choiceEffects = getChoiceEffects(feature, choice);
      for (const effect of choiceEffects) {
        traces.push({
          target: effect.target || '',
          value: effect.value || 0,
          source: `${feature.name} (Entscheidung)`,
          source_id: feature.id,
          level: feature.level,
          type: mapEffectTypeToModifierType(effect.type),
          is_active: false
        });
      }
    }
  }
  
  return traces;
}
```

---

## 7. Feature-Übersichts-Seite

### 7.1 Kompakt-Ansicht

Eine kompakte Übersicht aller Features:

```tsx
// src/components/features/FeatureOverview.tsx
export function FeatureOverview({ character, features }) {
  const grouped = groupFeaturesByCategory(features);
  const stats = calculateFeatureStats(character, features);
  
  return (
    <div className="feature-overview">
      <FeatureStatsBar stats={stats} />
      
      <Tabs>
        <TabList>
          <Tab value="all">Alle ({features.length})</Tab>
          <Tab value="active">Aktiv ({stats.active})</Tab>
          <Tab value="passive">Passiv ({stats.passive})</Tab>
          <Tab value="choices">Entscheidungen ({stats.choices})</Tab>
          <Tab value="pending">Offen ({stats.pending})</Tab>
        </TabList>
        
        <TabPanel value="all">
          <FeatureList features={features} character={character} />
        </TabPanel>
        
        <TabPanel value="active">
          <FeatureList 
            features={features.filter(f => isFeatureActive(character, f))}
            character={character}
          />
        </TabPanel>
        
        {/* ... weitere Tabs */}
      </Tabs>
    </div>
  );
}
```

---

## 8. Progression-Historie

### 8.1 Level-Historie-Komponente

Zeigt alle Features nach Level geordnet:

```tsx
// src/components/features/LevelHistory.tsx
export function LevelHistory({ character, features }) {
  const history = buildLevelHistory(character, features);
  
  return (
    <div className="level-history">
      <h2>Progression von Stufe 1 bis {character.meta.level}</h2>
      
      {history.map(entry => (
        <LevelEntry key={entry.level} entry={entry} />
      ))}
    </div>
  );
}

function LevelEntry({ entry }: { entry: LevelHistoryEntry }) {
  return (
    <div className="level-entry">
      <div className="level-header">
        <h3>Stufe {entry.level}</h3>
        <span className="proficiency-bonus">
          Übungsbonus: +{entry.proficiency_bonus}
        </span>
      </div>
      
      <div className="level-features">
        {entry.features.map(feature => (
          <FeatureTimelineCard 
            key={feature.id}
            feature={feature}
            obtainedAt={entry.obtained_at}
          />
        ))}
      </div>
      
      {entry.choices.length > 0 && (
        <div className="level-choices">
          <h4>Entscheidungen:</h4>
          {entry.choices.map(choice => (
            <ChoiceTimelineCard key={choice.feature_id} choice={choice} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 9. Export/Druck-Funktion

### 9.1 Feature-Report generieren

```tsx
// src/lib/features/featureReport.ts
export function generateFeatureReport(
  character: Character,
  features: Feature[]
): string {
  const report = [];
  
  report.push(`# Feature-Report: ${character.meta.name}`);
  report.push(`Level: ${character.meta.level}`);
  report.push(`Klasse: ${character.meta.class_id}`);
  report.push('');
  
  // Aktive Features
  report.push('## Aktive Features');
  const activeFeatures = features.filter(f => 
    isFeatureActive(character, f)
  );
  for (const feature of activeFeatures) {
    report.push(`- ${feature.name} (Stufe ${feature.level})`);
    report.push(`  Verwendungen: ${getUsesDisplay(character, feature)}`);
  }
  report.push('');
  
  // Alle Features nach Level
  report.push('## Feature-Progression');
  const byLevel = groupByLevel(features);
  for (const [level, levelFeatures] of Object.entries(byLevel)) {
    report.push(`### Stufe ${level}`);
    for (const feature of levelFeatures) {
      report.push(`- ${feature.name}`);
      const choice = character.feature_tracking.feature_choices[feature.id];
      if (choice) {
        report.push(`  Entscheidung: ${formatChoice(choice)}`);
      }
    }
  }
  
  // Modifikationen
  report.push('');
  report.push('## Aktive Modifikationen');
  const traces = generateModifierTraces(character, features);
  const byTarget = groupByTarget(traces);
  for (const [target, targetTraces] of Object.entries(byTarget)) {
    report.push(`### ${target}`);
    for (const trace of targetTraces) {
      report.push(`- ${trace.value} von ${trace.source} (Stufe ${trace.level})`);
    }
  }
  
  return report.join('\n');
}
```

---

## 10. Integration in CharacterSheetLayout

### 10.1 Neuer Tab "Merkmale"

```tsx
// src/components/character/CharacterSheetLayout.tsx
export function CharacterSheetLayout({ children, currentTab, onTabChange }) {
  return (
    <div className="character-sheet-layout">
      <TabList>
        <Tab value="overview" icon={User}>Übersicht</Tab>
        <Tab value="combat" icon={Shield}>Kampf</Tab>
        <Tab value="equipment" icon={Backpack}>Ausrüstung</Tab>
        <Tab value="spells" icon={Wand2}>Zauber</Tab>
        <Tab value="features" icon={Sparkles}>Merkmale</Tab> {/* NEU */}
        <Tab value="settings" icon={Settings}>Einstellungen</Tab>
      </TabList>
      
      <TabPanels>
        <TabPanel value="features">
          <FeatureProgressionView />
        </TabPanel>
        {/* ... andere Panels */}
      </TabPanels>
    </div>
  );
}
```

---

## 11. Implementierungsreihenfolge

### Phase 1: Grundstruktur
1. ⬜ Feature-Tracking-Datenstruktur erweitern
2. ⬜ Feature-Loader implementieren
3. ⬜ Modifier-Trace-Generierung

### Phase 2: UI-Komponenten
1. ⬜ FeatureProgressionView
2. ⬜ FeatureCard
3. ⬜ ModifierBreakdown
4. ⬜ ValueTrace (für bestehende Komponenten)

### Phase 3: Entscheidungs-Dialoge
1. ⬜ AbilityScoreChoiceDialog
2. ⬜ SkillChoiceDialog
3. ⬜ ToolChoiceDialog
4. ⬜ FeatChoiceDialog

### Phase 4: Integration
1. ⬜ CombatStats-Erweiterung
2. ⬜ AttributeBlock-Erweiterung
3. ⬜ Tab "Merkmale" hinzufügen

### Phase 5: Erweiterte Features
1. ⬜ Feature-Details-Dialog
2. ⬜ Level-Historie
3. ⬜ Export-Funktion

---

## 12. Design-Prinzipien

### 12.1 Transparenz
- **Jeder Wert ist nachvollziehbar**: Klick auf Wert zeigt Breakdown
- **Jede Modifikation hat eine Quelle**: Feature-Name und Level sichtbar
- **Keine versteckten Berechnungen**: Alles wird angezeigt

### 12.2 Benutzerfreundlichkeit
- **Progressive Disclosure**: Details auf Anfrage
- **Visuelle Hierarchie**: Wichtige Informationen hervorgehoben
- **Konsistente Icons**: Feature-Typen erkennbar

### 12.3 Nachvollziehbarkeit
- **Chronologische Historie**: Alles nach Level sortiert
- **Entscheidungen dokumentiert**: Was wurde wann gewählt
- **Exportierbar**: PDF/Text-Report möglich

---

*Dieses Konzept ergänzt das Backend-Konzept und stellt sicher, dass alle Features transparent und nachvollziehbar im Frontend dargestellt werden.*
