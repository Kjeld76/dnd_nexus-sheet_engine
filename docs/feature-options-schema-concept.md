# Feature Options Schema Konzept

## Problem
Aktuell werden Optionen für Choice-Features (z.B. "URTÜMLICHE ORDNUNG" mit "Magier" und "Wächter") aus der Beschreibung extrahiert. Das ist:
- Fehleranfällig (Regex-Parsing)
- Nicht strukturiert
- Schwer zu warten
- Funktioniert nur für bestimmte Textformate

## Lösung: Separate Tabelle für Feature-Optionen

### Schema

```sql
CREATE TABLE IF NOT EXISTS core_feature_options (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL,
    option_name TEXT NOT NULL,
    option_description TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (feature_id) REFERENCES core_class_features(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_feature_options (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL,
    option_name TEXT NOT NULL,
    option_description TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    parent_id TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (feature_id) REFERENCES custom_class_features(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES core_feature_options(id) ON DELETE SET NULL
);

CREATE VIEW all_feature_options AS
SELECT 
    COALESCE(c.id, core.id) as id,
    COALESCE(c.feature_id, core.feature_id) as feature_id,
    COALESCE(c.option_name, core.option_name) as option_name,
    COALESCE(c.option_description, core.option_description) as option_description,
    COALESCE(c.display_order, core.display_order) as display_order,
    CASE 
        WHEN c.parent_id IS NOT NULL THEN 'override'
        WHEN c.id IS NOT NULL THEN 'custom'
        ELSE 'core'
    END as source
FROM core_feature_options core
LEFT JOIN custom_feature_options c ON c.parent_id = core.id
UNION ALL
SELECT 
    id, feature_id, option_name, option_description, display_order,
    'custom' as source
FROM custom_feature_options
WHERE parent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_core_feature_options_feature ON core_feature_options(feature_id);
CREATE INDEX IF NOT EXISTS idx_custom_feature_options_feature ON custom_feature_options(feature_id);
```

## Vorteile

1. **Strukturiert**: Optionen sind klar getrennt und können einfach abgefragt werden
2. **Wartbar**: Optionen können einzeln bearbeitet werden ohne die Feature-Beschreibung zu ändern
3. **Erweiterbar**: Zusätzliche Felder (z.B. `icon`, `effects`) können einfach hinzugefügt werden
4. **Konsistent**: Funktioniert für alle Features mit Optionen (Klassen, Unterklassen, etc.)
5. **Performance**: Direkte Abfrage statt Regex-Parsing

## Migration

1. Bestehende Features mit Optionen identifizieren
2. Optionen aus Beschreibungen extrahieren (einmalig)
3. In neue Tabelle migrieren
4. Frontend anpassen: Statt `extractOptions()` direkt aus DB laden

## Beispiel-Daten

```sql
-- URTÜMLICHE ORDNUNG (druide_urtuemliche_ordnung_l1)
INSERT INTO core_feature_options (id, feature_id, option_name, option_description, display_order)
VALUES 
    ('druide_urtuemliche_ordnung_l1_magier', 'druide_urtuemliche_ordnung_l1', 'Magier', 'Du kennst einen zusätzlichen Zaubertrick aus der Zauberliste des Druiden. Außerdem gibt dir deine mystische Verbindung mit der Natur einen Bonus auf deine Intelligenzwürfe (Arkane Kunde oder Naturkunde). Dieser Bonus entspricht deinem Weisheitsmodifikator (mindestens +1).', 1),
    ('druide_urtuemliche_ordnung_l1_waechter', 'druide_urtuemliche_ordnung_l1', 'Wächter', 'Du wurdest für den Kampf ausgebildet, daher hast du Übung im Umgang mit Kriegswaffen und Vertrautheit mit mittelschwerer Rüstung.', 2);

-- ELEMENTARE WUT (druide_elementare_wut_l2)
INSERT INTO core_feature_options (id, feature_id, option_name, option_description, display_order)
VALUES 
    ('druide_elementare_wut_l2_urschlag', 'druide_elementare_wut_l2', 'Urschlag', 'Einmal in jedem deiner Züge kannst du, wenn du eine Kreatur mit einem Angriffswurf triffst, den du mit einer Waffe oder in Tiergestalt mit dem Angriff des Tieres ausführst, dem Ziel zusätzlich 1W8 Blitz-, Feuer-, Kälteoder Schallschaden (nach deiner Wahl) zufügen.', 1),
    ('druide_elementare_wut_l2_verstaerkte_zaubertricks', 'druide_elementare_wut_l2', 'Verstärkte Zaubertricks', 'Füge dem Schaden, den du mit Druidenzaubertricks bewirkst, deinen Weisheitsmodifikator hinzu.', 2);
```

## Frontend-Änderungen

Statt:
```typescript
const availableOptions = useMemo(() => extractOptions(feature.description), [feature.description]);
```

Neu:
```typescript
const availableOptions = useCompendiumStore((state) => 
  state.featureOptions?.filter(opt => opt.feature_id === feature.id) || []
);
```

## Tauri Command

```rust
#[tauri::command]
pub async fn get_feature_options(
    state: State<'_, Database>,
    feature_id: String,
) -> Result<Vec<FeatureOption>, String> {
    // Query all_feature_options WHERE feature_id = ?
}
```
