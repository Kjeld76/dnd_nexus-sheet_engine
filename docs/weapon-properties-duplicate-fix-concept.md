# Konzept: Behebung doppelter Waffeneigenschaften im Kompendium

## Problembeschreibung

Waffeneigenschaften werden im Kompendium doppelt angezeigt:
- In der Zusammenfassung (z.B. "Leicht, Leicht, Wurfwaffe, Wurfwaffe")
- In der detaillierten Eigenschaftenliste (z.B. "LEICHT" erscheint zweimal mit identischer Beschreibung)

## Ursachenanalyse

### 1. Datenbankebene
**Mögliche Ursachen:**
- Duplikate in `weapon_property_mappings` Tabelle
- Migration fügt Properties hinzu, die bereits existieren
- Mehrfache Einträge für dieselbe `weapon_id` + `property_id` Kombination

**Prüfung:**
```sql
-- Finde Duplikate in weapon_property_mappings
SELECT weapon_id, property_id, COUNT(*) as count
FROM weapon_property_mappings
GROUP BY weapon_id, property_id
HAVING COUNT(*) > 1;
```

### 2. Backend-Ebene (Rust)
**Mögliche Ursachen:**
- SQL-JOIN erzeugt mehrere Zeilen für dieselbe Property
- Properties werden mehrfach zum Array hinzugefügt
- Keine Duplikatsprüfung beim Laden aus der Datenbank

**Aktuelle Implementierung:**
```rust
// In compendium.rs, Zeile 324
if !weapon.properties.iter().any(|p| p.id == prop_id) {
    weapon.properties.push(WeaponProperty { ... });
}
```
Diese Prüfung sollte Duplikate verhindern, aber möglicherweise werden Properties aus mehreren JOIN-Zeilen hinzugefügt.

### 3. Frontend-Ebene (React)
**Mögliche Ursachen:**
- Properties werden sowohl aus `weapon.properties` als auch aus `weapon.data.properties` geladen
- Duplikatsprüfung funktioniert nicht korrekt
- Map-basierte Deduplizierung übersieht einige Fälle

**Aktuelle Implementierung:**
```typescript
// Duplikatsprüfung mit Map
const propertyMap = new Map<string, typeof weapon.properties[0]>();
for (const prop of weapon.properties) {
  if (!propertyMap.has(prop.id)) {
    propertyMap.set(prop.id, prop);
  } else {
    // Bevorzuge die mit Beschreibung
  }
}
```

## Lösungsansätze

### Lösung 1: Datenbankbereinigung (Priorität: HOCH)

**Ziel:** Entferne alle Duplikate aus `weapon_property_mappings`

**Implementierung:**
```sql
-- Migration: Entferne Duplikate, behalte nur die erste Eintragung
DELETE FROM weapon_property_mappings 
WHERE rowid NOT IN (
    SELECT MIN(rowid) 
    FROM weapon_property_mappings 
    GROUP BY weapon_id, property_id
);

-- Füge UNIQUE Constraint hinzu, um zukünftige Duplikate zu verhindern
CREATE UNIQUE INDEX IF NOT EXISTS idx_weapon_property_unique 
ON weapon_property_mappings(weapon_id, property_id);
```

**Vorteile:**
- Behebt das Problem an der Quelle
- Verhindert zukünftige Duplikate
- Keine Performance-Einbußen im Frontend

**Nachteile:**
- Erfordert Migration
- Muss bei bestehenden Datenbanken ausgeführt werden

### Lösung 2: Backend-Deduplizierung (Priorität: MITTEL)

**Ziel:** Entferne Duplikate beim Laden aus der Datenbank

**Implementierung:**
```rust
// In compendium.rs, nach dem SQL-JOIN
let mut weapons_map: HashMap<String, Weapon> = HashMap::new();

for row in rows {
    let weapon_id = row.get(0)?;
    let weapon = weapons_map.entry(weapon_id.clone())
        .or_insert_with(|| Weapon { 
            properties: Vec::new(),
            // ... andere Felder
        });
    
    // Prüfe, ob Property bereits existiert
    if let (Some(prop_id), Some(prop_name), Some(prop_desc)) = 
        (prop_id, prop_name, prop_desc) {
        if !weapon.properties.iter().any(|p| p.id == prop_id) {
            weapon.properties.push(WeaponProperty {
                id: prop_id,
                name: prop_name,
                description: prop_desc,
                // ...
            });
        }
    }
}
```

**Vorteile:**
- Sicherheitsnetz, falls Datenbank-Duplikate übersehen werden
- Funktioniert auch bei fehlerhaften Daten

**Nachteile:**
- Zusätzliche Verarbeitung im Backend
- Behebt nicht die Ursache

### Lösung 3: Frontend-Deduplizierung (Priorität: HOCH)

**Ziel:** Robuste Duplikatsprüfung im Frontend

**Aktuelle Probleme:**
1. Map-basierte Deduplizierung bevorzugt möglicherweise die falsche Version
2. Properties aus `weapon.data.properties` werden hinzugefügt, obwohl sie bereits in Mapping-Tabelle sind

**Verbesserte Implementierung:**
```typescript
// 1. Entferne Duplikate aus weapon.properties
const seenIds = new Set<string>();
const uniqueProperties = weapon.properties.filter((prop) => {
  if (seenIds.has(prop.id)) {
    return false; // Duplikat, überspringe
  }
  seenIds.add(prop.id);
  return true;
});

// 2. Verwende NUR Properties aus Mapping-Tabelle
// Ignoriere weapon.data.properties komplett, da Migration sie hinzufügt
const finalProperties = uniqueProperties;

// 3. Finale Sicherheitsprüfung
const finalSeenIds = new Set<string>();
const deduplicatedProperties = finalProperties.filter((prop) => {
  if (finalSeenIds.has(prop.id)) {
    console.warn(`Duplicate property detected: ${prop.id} for ${weapon.name}`);
    return false;
  }
  finalSeenIds.add(prop.id);
  return true;
});
```

**Vorteile:**
- Mehrschichtige Duplikatsprüfung
- Logging für Debugging
- Funktioniert auch bei fehlerhaften Daten

**Nachteile:**
- Zusätzliche Verarbeitung im Frontend
- Behebt nicht die Ursache

### Lösung 4: Migration-Verbesserung (Priorität: MITTEL)

**Ziel:** Verhindere Duplikate bei der Migration

**Aktuelle Migration:**
```sql
INSERT INTO weapon_property_mappings (weapon_id, property_id, parameter_value)
SELECT w.id, json_each.value, NULL
FROM all_weapons_unified w
CROSS JOIN json_each(json_extract(w.data, '$.properties'))
WHERE NOT EXISTS (
    SELECT 1 FROM weapon_property_mappings wpm 
    WHERE wpm.weapon_id = w.id AND wpm.property_id = json_each.value
);
```

**Problem:** Diese Migration wird bei jedem App-Start ausgeführt, könnte aber Duplikate erzeugen, wenn sie mehrfach läuft.

**Verbesserung:**
```sql
-- Verwende INSERT OR IGNORE oder ON CONFLICT
INSERT OR IGNORE INTO weapon_property_mappings (weapon_id, property_id, parameter_value)
SELECT w.id, json_each.value, NULL
FROM all_weapons_unified w
CROSS JOIN json_each(json_extract(w.data, '$.properties'))
WHERE json_each.value IS NOT NULL AND json_each.value != '';
```

**Vorteile:**
- Verhindert Duplikate bei wiederholter Ausführung
- Idempotent

**Nachteile:**
- Erfordert UNIQUE Constraint

## Empfohlene Implementierungsreihenfolge

### Phase 1: Sofortige Behebung (Frontend)
1. ✅ Verbesserte Duplikatsprüfung im Frontend implementieren
2. ✅ Logging hinzufügen, um Duplikate zu identifizieren
3. ✅ NUR Properties aus Mapping-Tabelle verwenden

### Phase 2: Datenbankbereinigung
1. ✅ UNIQUE Constraint auf `weapon_property_mappings` hinzufügen
2. ✅ Migration zum Entfernen bestehender Duplikate
3. ✅ Migration verbessern, um Duplikate zu verhindern

### Phase 3: Backend-Verbesserung
1. ✅ Zusätzliche Duplikatsprüfung im Backend
2. ✅ Unit-Tests für Duplikatsprüfung

## Testplan

### Test 1: Duplikate in Datenbank finden
```sql
SELECT weapon_id, property_id, COUNT(*) as count
FROM weapon_property_mappings
GROUP BY weapon_id, property_id
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

### Test 2: Frontend-Deduplizierung testen
- Waffe mit bekannten Duplikaten auswählen (z.B. "Beil")
- Prüfen, ob Properties nur einmal angezeigt werden
- Browser-Konsole auf Warnungen prüfen

### Test 3: Migration testen
- Datenbank zurücksetzen
- Migration ausführen
- Prüfen, ob keine Duplikate erzeugt wurden

## Erfolgskriterien

- ✅ Keine doppelten Properties in der Zusammenfassung
- ✅ Keine doppelten Properties in der detaillierten Liste
- ✅ Alle Properties werden korrekt angezeigt (inkl. Geschosse mit Reichweite)
- ✅ Keine Warnungen in der Browser-Konsole
- ✅ UNIQUE Constraint verhindert zukünftige Duplikate

## Monitoring

- Browser-Konsole auf Warnungen prüfen
- SQL-Abfrage zur Duplikatsprüfung regelmäßig ausführen
- Logs im Backend für Duplikatsprüfung
