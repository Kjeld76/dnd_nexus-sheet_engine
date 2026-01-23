# Beurteilung der Verbesserungsvorschläge

## Übersicht

Diese Analyse bewertet die beiden Verbesserungsdokumente (`verbesserungen_konzept.md` und `custom_classes verbesserung.md`) im Kontext der bestehenden Konzepte (`CLASS_MIGRATION_AND_FEATURES_CONCEPT.md` und `FRONTEND_FEATURE_DOCUMENTATION_CONCEPT.md`) und der aktuellen Projektarchitektur.

---

## 1. Kritisches Problem: Schema-Inkonsistenz

### 🔴 **KRITISCHER FEHLER im Backend-Konzept**

**Problem:**
Das `CLASS_MIGRATION_AND_FEATURES_CONCEPT.md` definiert `class_features` als **einzige Tabelle** ohne Trennung in `core_*` / `custom_*`, obwohl das gesamte Projekt diesem Architektur-Prinzip folgt.

**Beweis aus migrations.rs:**
- ✅ `core_classes` / `custom_classes` (Zeile 93-109)
- ✅ `core_feats` / `custom_feats` (Zeile 243-261)
- ✅ `core_weapons` / `custom_weapons` (Zeile 162-199)
- ✅ `core_armors` / `custom_armors` (Zeile 202-240)
- ✅ `core_items` / `custom_items` (Zeile 360-384)
- ✅ `all_*` Views für Unified Access (Zeile 607-725)
- ❌ **FEHLT:** `core_class_features` / `custom_class_features`

**Konsequenz:**
- Verletzung des etablierten Architektur-Prinzips
- Keine Möglichkeit, Custom-Class-Features zu erstellen
- Inkonsistenz mit restlichem System
- `custom_classes verbesserung.md` hat diesen Fehler **korrekt identifiziert**

**Lösung aus `custom_classes verbesserung.md`:** ✅ **KORREKT**
- Separate Tabellen: `core_class_features` / `custom_class_features`
- Unified View: `all_class_features`
- Source-Tracking: `class_source` Discriminator
- Override-Mechanismus via `parent_id`

**Empfehlung:** **SOFORT korrigieren** - Dies ist ein Architektur-Fundament und muss vor jeder Implementierung gefixt werden.

---

## 2. Bewertung: `verbesserungen_konzept.md`

### 2.1 Datenkonsistenz zwischen Frontend und Backend ⭐⭐⭐⭐⭐

**Status:** Sehr wichtig, gut durchdacht

**Problematik:**
- Backend (Rust) und Frontend (TypeScript) definieren möglicherweise unterschiedliche Strukturen
- Feature-Tracking muss identisch sein

**Verbesserungsvorschlag:**
```typescript
// Einheitliche FeatureTracking-Struktur
export interface FeatureTracking {
  active_features: Record<string, ActiveFeatureState>;
  feature_choices: Record<string, FeatureChoice>;
  feature_history: FeatureHistoryEntry[];
  last_synced: number;  // NEU: Sync-Metadaten
  version: number;      // NEU: Schema-Version
}
```

**Beurteilung:**
- ✅ **Empfehlenswert**: Sorgt für Type-Safety zwischen Frontend/Backend
- ✅ **Version-Feld**: Ermöglicht Schema-Migrationen
- ⚠️ **Hinweis**: `version` muss auch in Rust-Side definiert werden

**Priorität:** **HOCH** - Verhindert Runtime-Fehler

---

### 2.2 Feature-System: Berechnungs-Caching ⭐⭐⭐⭐

**Status:** Performance-Optimierung, sinnvoll

**Problematik:**
- Modifier-Traces werden bei jedem Render neu berechnet
- Bei 50+ Features auf Level 20 kann das langsam werden

**Verbesserungsvorschlag:**
```typescript
class FeatureCache {
  getDerivedStat(key, dependencies, calculator) {
    // Memoization mit Dependency-Tracking
  }
}
```

**Beurteilung:**
- ✅ **Empfehlenswert**: Verhindert unnötige Re-Berechnungen
- ✅ **useMemo** bereits vorhanden, aber Feature-Cache ist besser strukturiert
- ⚠️ **Hinweis**: Caching-Strategie muss Invalidierung handhaben (z.B. bei Feature-Aktivierung)

**Priorität:** **MITTEL** - Performance-Optimierung, nicht kritisch für MVP

---

### 2.3 Feature-Migration: Inkrementelle Migration ⭐⭐⭐⭐⭐

**Status:** Sehr wichtig für Robustheit

**Problematik:**
- Bulk-Migration aller Klassen fehleranfällig
- Bei Fehler: Alles oder nichts

**Verbesserungsvorschlag:**
```typescript
async function migrateClassIncremental(className: string) {
  // Checkpoints nach jeder Phase
  // Rollback bei Fehler möglich
}
```

**Beurteilung:**
- ✅ **KRITISCH**: Bei 13 Klassen mit hunderten Features ist Bulk-Migration riskant
- ✅ **Checkpoints**: Ermöglicht Resume nach Fehler
- ✅ **Validierung**: Jede Phase wird validiert
- ✅ **Best Practice**: Sollte Standard für alle Migrationen sein

**Priorität:** **SEHR HOCH** - Verhindert Datenverlust und vereinfacht Debugging

---

### 2.4 UI: Progressive Disclosure ⭐⭐⭐⭐

**Status:** UX-Verbesserung, nicht kritisch

**Problematik:**
- FeatureCards zeigen alle Infos auf einmal → überwältigend
- Bei vielen Features scrollt man ewig

**Verbesserungsvorschlag:**
- Drei-Stufen-Ansicht: Compact → Summary → Full
- Expandierbar bei Bedarf

**Beurteilung:**
- ✅ **Empfehlenswert**: Bessere UX, besonders bei vielen Features
- ⚠️ **Nicht kritisch**: Kann auch später hinzugefügt werden
- ✅ **Passend**: Ergänzt das Frontend-Konzept gut

**Priorität:** **NIEDRIG** - UX-Verbesserung, kann im Iteration nach MVP kommen

---

### 2.5 Backend: Feature-Effekt-Validierung ⭐⭐⭐⭐⭐

**Status:** Kritisch für Datenintegrität

**Problematik:**
- JSON in `effects` Feld wird nicht validiert
- Fehlerhafte Daten könnten System zum Absturz bringen

**Verbesserungsvorschlag:**
- DB-Trigger für SQLite-Validierung
- Zod-Schema für TypeScript-Runtime-Validierung

**Beurteilung:**
- ✅ **KRITISCH**: Verhindert Korrupte Daten
- ✅ **DB-Trigger**: Verhindert invalide Daten bereits beim INSERT
- ✅ **Zod-Schema**: Frontend-Validierung vor Backend-Call
- ✅ **Best Practice**: Defense in Depth

**Priorität:** **SEHR HOCH** - Datenintegrität ist fundamental

---

### 2.6 Feature-Choice-System: Rollback-Mechanismus ⭐⭐⭐

**Status:** Nett zu haben, aber nicht kritisch

**Problematik:**
- Wenn Spieler Feature-Entscheidung ändert, alte Entscheidung weg

**Verbesserungsvorschlag:**
- `previous_choice` Verkettung
- `locked` Flag für irreversible Entscheidungen

**Beurteilung:**
- ✅ **Sinnvoll**: Ermöglicht Undo für Fehler
- ⚠️ **Gameplay-Frage**: Sollten Entscheidungen nach Level-Up änderbar sein?
- ⚠️ **Komplexität**: Erhöht die Komplexität des Choice-Systems
- ❓ **Frage**: Ist Rollback wirklich nötig oder reicht Historie?

**Priorität:** **NIEDRIG** - Kann später hinzugefügt werden, wenn Bedarf besteht

---

### 2.7 Performance: Virtuelle Listen ⭐⭐⭐

**Status:** Performance-Optimierung, nur bei vielen Features nötig

**Problematik:**
- Bei 50+ Features auf Level 20: Langsames Rendering

**Verbesserungsvorschlag:**
- `@tanstack/react-virtual` für Virtualisierung

**Beurteilung:**
- ✅ **Sinnvoll**: Bei vielen Features definitiv schneller
- ⚠️ **Voreilig**: Möglicherweise nicht nötig bei aktueller Feature-Anzahl
- ⚠️ **Komplexität**: Virtualisierung erhöht Komplexität
- ✅ **Messbar**: Performance sollte erst gemessen werden, dann optimiert

**Priorität:** **NIEDRIG** - Performance-Optimierung, nur wenn nötig

---

### 2.8 Backend: Feature-Dependencies & Prerequisites ⭐⭐⭐⭐

**Status:** Wichtig für Validierung

**Problematik:**
- Features können andere Features erfordern (z.B. Unterklassen-Features erfordern Basisklassen-Features)
- Keine Validierung vorhanden

**Verbesserungsvorschlag:**
- Neue Tabelle `feature_prerequisites`
- Validierung vor Feature-Aktivierung

**Beurteilung:**
- ✅ **Sinnvoll**: Verhindert Regel-Verstöße
- ✅ **Erweiterbar**: Ermöglicht komplexe Abhängigkeiten
- ⚠️ **Komplexität**: Erfordert Dependency-Graph-Validierung
- ⚠️ **Frage**: Wie häufig werden Prerequisites tatsächlich benötigt?

**Priorität:** **MITTEL** - Wichtig, aber nicht kritisch für MVP

---

### 2.9 UI: Feature-Filter & Gruppierung ⭐⭐⭐⭐

**Status:** UX-Verbesserung, sehr nützlich

**Problematik:**
- Bei vielen Features schwer zu navigieren
- Nur chronologische Ansicht vorhanden

**Verbesserungsvorschlag:**
- Filter nach Typ (Passive/Active/Choice)
- Gruppierung nach Level/Typ/Quelle

**Beurteilung:**
- ✅ **Sehr nützlich**: Verbessert Navigation erheblich
- ✅ **Einfach umzusetzen**: Bestehende Datenstrukturen nutzen
- ✅ **Passend**: Ergänzt `FRONTEND_FEATURE_DOCUMENTATION_CONCEPT.md` gut

**Priorität:** **MITTEL** - UX-Verbesserung, sollte relativ früh implementiert werden

---

### 2.10 Persistenz: Optimistische Updates mit Rollback ⭐⭐⭐⭐

**Status:** Wichtig für UX und Datenkonsistenz

**Problematik:**
- Feature-Aktivierung aktualisiert UI sofort, aber DB-Operation könnte fehlschlagen
- UI und DB sind dann inkonsistent

**Verbesserungsvorschlag:**
- Optimistisches Update (sofort in UI)
- Rollback bei Fehler

**Beurteilung:**
- ✅ **Empfehlenswert**: Bessere UX (sofortiges Feedback)
- ✅ **Fehlerbehandlung**: Verhindert Inkonsistenz
- ✅ **Best Practice**: Standard für moderne UIs
- ⚠️ **Komplexität**: Erfordert State-Management

**Priorität:** **HOCH** - Verhindert frustrierende UX und Datenfehler

---

## 3. Bewertung: `custom_classes verbesserung.md`

### 3.1 Feature-Zuordnung: Core vs Custom Classes ⭐⭐⭐⭐⭐

**Status:** **KRITISCH** - Architektur-Fundament

**Problem identifiziert:** ✅ **KORREKT**
Das Backend-Konzept definiert nur `class_features` ohne `core_*` / `custom_*` Trennung.

**Beweis:**
- ✅ Bestehendes Pattern: Alle anderen Entitäten haben `core_*` / `custom_*`
- ✅ `class_starting_equipment` nutzt bereits `is_custom` Flag (Zeile 1007)
- ❌ `class_features` im Konzept: Nur eine Tabelle, kein `is_custom`

**Lösung:** ✅ **SEHR GUT DURCHDACHT**
```sql
-- Separate Tabellen
CREATE TABLE core_class_features (...);
CREATE TABLE custom_class_features (...);

-- Unified View
CREATE VIEW all_class_features AS ...;
```

**Beurteilung:**
- ✅ **MUSS implementiert werden**: Konsistenz mit restlichem System
- ✅ **Override-Mechanismus**: `parent_id` ermöglicht Core-Feature-Override
- ✅ **Source-Tracking**: `class_source` Discriminator klar definiert
- ✅ **Views**: Unified Access wie bei anderen Entitäten

**Priorität:** **KRITISCH** - Muss **VOR** allen anderen Features implementiert werden

---

### 3.2 Subclass-Zuordnung: Core Class + Custom Subclass ⭐⭐⭐⭐⭐

**Status:** **WICHTIG** - Flexibilität für Homebrew

**Problem identifiziert:** ✅ **KORREKT**
Custom-Subclass für Core-Class ist nicht möglich im aktuellen Konzept.

**Lösung:** ✅ **DURCHDACHT**
```sql
CREATE TABLE custom_subclasses (
    class_id TEXT NOT NULL,
    class_source TEXT CHECK(class_source IN ('core', 'custom')),
    -- Ermöglicht Custom-Subclass für Core-Class
);
```

**Beurteilung:**
- ✅ **Sehr sinnvoll**: Ermöglicht "Homebrew Path of the Dragon" für Core-Barbarian
- ✅ **Flexibel**: Custom-Subclass kann für Core ODER Custom-Class sein
- ✅ **Konsistent**: Folgt dem gleichen Pattern wie andere Entitäten

**Priorität:** **HOCH** - Wichtig für Homebrew-Support

---

### 3.3 Progression Tables: Core vs Custom ⭐⭐⭐⭐⭐

**Status:** **WICHTIG** - Homebrew-Klassen brauchen eigene Progression

**Problem identifiziert:** ✅ **KORREKT**
Konzept definiert nur `class_progression_tables` ohne Trennung.

**Lösung:** ✅ **KONSISTENT**
```sql
CREATE TABLE core_progression_tables (...);
CREATE TABLE custom_progression_tables (...);
CREATE VIEW all_progression_tables AS ...;
```

**Beurteilung:**
- ✅ **Notwendig**: Custom-Classes haben eigene Progression
- ✅ **Konsistent**: Folgt dem Pattern
- ✅ **Logisch**: Wie Features, müssen auch Progressionstabellen getrennt sein

**Priorität:** **HOCH** - Wichtig für Custom-Class-Support

---

### 3.4 Feature Loader: Query-Logik ⭐⭐⭐⭐⭐

**Status:** **KRITISCH** - Funktionalität

**Problem identifiziert:** ✅ **KORREKT**
Query muss beide Tabellen berücksichtigen und Override-Handling implementieren.

**Lösung:** ✅ **KORREKT IMPLEMENTIERT**
```typescript
// Nutze Unified View
SELECT * FROM all_class_features
WHERE class_id = ? AND level <= ?

// Deduplication: Override hat Priorität
function deduplicateFeatures(features) {
  // Override entfernt Core-Feature
}
```

**Beurteilung:**
- ✅ **Korrekt**: Nutzt `all_class_features` View
- ✅ **Override-Handling**: Deduplication ist richtig implementiert
- ✅ **Priorität**: Override > Custom > Core ist logisch

**Priorität:** **KRITISCH** - Ohne das funktioniert das System nicht

---

### 3.5 CompendiumEditor: Custom Class Features ⭐⭐⭐⭐

**Status:** **WICHTIG** - Editor-Funktionalität

**Problem identifiziert:** ✅ **KORREKT**
Editor muss zwischen Core und Custom unterscheiden können.

**Lösung:** ✅ **UI-WIREFRAMES PRESENTIERT**
- Class-Source-Selector (Core/Custom)
- Override-Checkbox für Core-Features
- Parent-Feature-Selector

**Beurteilung:**
- ✅ **Notwendig**: Ohne das kann man keine Custom-Features erstellen
- ✅ **Benutzerfreundlich**: Klare UI-Struktur
- ⚠️ **Hinweis**: Muss mit bestehendem CompendiumEditor integriert werden

**Priorität:** **HOCH** - Editor-Funktionalität ist wichtig

---

### 3.6 TypeScript-Types: Source-Tracking ⭐⭐⭐⭐⭐

**Status:** **WICHTIG** - Type-Safety

**Problem identifiziert:** ✅ **KORREKT**
Types berücksichtigen Source nicht.

**Lösung:** ✅ **GUT DURCHDACHT**
```typescript
export type EntitySource = 'core' | 'custom' | 'override';

export interface Feature extends BaseEntity {
  class_source: 'core' | 'custom';
  subclass_source?: 'core' | 'custom';
  parent_id?: string;
}
```

**Beurteilung:**
- ✅ **Type-Safety**: Verhindert Fehler zur Compile-Zeit
- ✅ **Konsistent**: Folgt dem Pattern von anderen Entitäten
- ✅ **Autocomplete**: IDE kann besser unterstützen

**Priorität:** **HOCH** - Type-Safety ist wichtig

---

### 3.7 Rust Backend: Commands für Custom Features ⭐⭐⭐⭐⭐

**Status:** **KRITISCH** - Backend-Funktionalität

**Problem identifiziert:** ✅ **KORREKT**
Keine Tauri-Commands für Custom-Class-Features vorhanden.

**Lösung:** ✅ **VOLLSTÄNDIGE COMMANDS**
- `create_custom_class_feature`
- `get_class_features` (nutzt Unified View)

**Beurteilung:**
- ✅ **Notwendig**: Frontend braucht diese Commands
- ✅ **Korrekt**: Nutzt Unified Views
- ✅ **Validierung**: Source-Validierung implementiert

**Priorität:** **KRITISCH** - Ohne Commands keine Funktionalität

---

### 3.8 Migration: Core vs Custom unterscheiden ⭐⭐⭐⭐⭐

**Status:** **WICHTIG** - Migrations-Robustheit

**Problem identifiziert:** ✅ **KORREKT**
Migration unterscheidet nicht zwischen Core und Custom.

**Lösung:** ✅ **CONFIG-BASIERT**
```typescript
const MIGRATION_CONFIGS: Record<string, ClassMigrationConfig> = {
  'barbar': { source: 'phb', targetTable: 'core_classes', ... },
  // Custom-Klassen würden custom_classes nutzen
};
```

**Beurteilung:**
- ✅ **Flexibel**: Config-basiert, einfach erweiterbar
- ✅ **Explizit**: Jede Klasse explizit konfiguriert
- ✅ **Sicher**: Verhindert versehentliche Custom-Migration

**Priorität:** **HOCH** - Migration muss korrekt sein

---

## 4. Gesamtbeurteilung

### 4.1 Kritische Lücken im ursprünglichen Konzept

| Problem | Schwere | Dokument | Status |
|---------|---------|----------|--------|
| Keine `core_*` / `custom_*` Trennung für Features | 🔴 **KRITISCH** | `custom_classes verbesserung.md` | Muss sofort gefixt werden |
| Keine `core_*` / `custom_*` Trennung für Subclasses | 🔴 **KRITISCH** | `custom_classes verbesserung.md` | Muss sofort gefixt werden |
| Keine `core_*` / `custom_*` Trennung für Progression | 🟠 **HOCH** | `custom_classes verbesserung.md` | Sollte gefixt werden |
| Feature Loader berücksichtigt keine Overrides | 🔴 **KRITISCH** | `custom_classes verbesserung.md` | Muss gefixt werden |
| Keine Feature-Effekt-Validierung | 🟠 **HOCH** | `verbesserungen_konzept.md` | Sollte implementiert werden |
| Bulk-Migration ohne Checkpoints | 🟠 **HOCH** | `verbesserungen_konzept.md` | Sollte implementiert werden |

### 4.2 Priorisierte Empfehlungen

#### Phase 0: Schema-Korrekturen (VOR Implementierung) 🔴

1. **Schema anpassen**: `class_features` → `core_class_features` + `custom_class_features`
2. **Schema anpassen**: `class_subclasses` → `core_subclasses` + `custom_subclasses`
3. **Schema anpassen**: `class_progression_tables` → `core_progression_tables` + `custom_progression_tables`
4. **Views erstellen**: `all_class_features`, `all_subclasses`, `all_progression_tables`
5. **TypeScript-Types**: Source-Tracking hinzufügen

**Zeitaufwand:** 2-4 Stunden
**Auswirkung:** Verhindert Architektur-Fehler, die später teuer zu fixen sind

#### Phase 1: Kritische Backend-Funktionalität 🟠

1. **Feature Loader**: Query-Logik mit Override-Handling
2. **Rust Commands**: `create_custom_class_feature`, `get_class_features`
3. **Validierung**: Feature-Effekt-Validierung (DB-Trigger + Zod)
4. **Migration**: Inkrementelle Migration mit Checkpoints

**Zeitaufwand:** 1-2 Tage
**Auswirkung:** System funktioniert grundsätzlich

#### Phase 2: Frontend-Integration 🟡

1. **Feature-Tracking-Struktur**: Einheitliche Types Frontend/Backend
2. **ValueTrace-Komponente**: Für Transparenz
3. **Optimistische Updates**: Mit Rollback-Mechanismus
4. **Feature-Filter**: Gruppierung und Filter

**Zeitaufwand:** 2-3 Tage
**Auswirkung:** Gute UX und Transparenz

#### Phase 3: Erweiterte Features 🟢

1. **Progressive Disclosure**: Feature-Card-Erweiterung
2. **Feature-Prerequisites**: Dependency-System
3. **Rollback-Mechanismus**: Für Feature-Choices
4. **Virtuelle Listen**: Performance-Optimierung (nur wenn nötig)

**Zeitaufwand:** 3-5 Tage
**Auswirkung:** Polierte UX und erweiterte Funktionalität

---

## 5. Zusammenfassung

### 5.1 Stärken der Verbesserungsdokumente

**`custom_classes verbesserung.md`:**
- ✅ **Kritische Architektur-Lücke identifiziert**: Core/Custom-Trennung fehlt
- ✅ **Lösung ist durchdacht**: Folgt etabliertem Pattern
- ✅ **Vollständig**: Deckt alle betroffenen Bereiche ab
- ✅ **Implementierungs-ready**: Code-Beispiele sind korrekt

**`verbesserungen_konzept.md`:**
- ✅ **Performance-Bewusstsein**: Caching, Virtualisierung
- ✅ **UX-Verbesserungen**: Progressive Disclosure, Filter
- ✅ **Robustheit**: Validierung, Rollback, Checkpoints
- ✅ **Best Practices**: Optimistische Updates, Dependency-Tracking

### 5.2 Schwächen / Offene Fragen

**`custom_classes verbesserung.md`:**
- ⚠️ **Migration-Strategie**: Wie werden bestehende Features migriert, wenn Schema geändert wird?
- ⚠️ **ID-Konflikte**: Was passiert, wenn Custom-Feature-ID mit Core-Feature-ID kollidiert?
- ❓ **Editor-Integration**: Wie genau wird das in bestehenden CompendiumEditor integriert?

**`verbesserungen_konzept.md`:**
- ⚠️ **Performance vorzeitig optimiert**: Virtuelle Listen möglicherweise nicht nötig
- ⚠️ **Rollback-Komplexität**: Ist verkettete Liste wirklich nötig oder reicht Historie?
- ❓ **Feature-Prerequisites**: Wie häufig werden diese tatsächlich benötigt?

### 5.3 Empfehlung für Implementierung

**Sofort umsetzen (Phase 0):**
1. ✅ Schema-Korrekturen aus `custom_classes verbesserung.md` (KRITISCH)
2. ✅ Feature-Effekt-Validierung (HOCH)
3. ✅ Inkrementelle Migration (HOCH)

**Nach Schema-Korrektur (Phase 1):**
1. ✅ Feature Loader mit Override-Handling
2. ✅ Rust Commands für Custom Features
3. ✅ Einheitliche Types Frontend/Backend

**Nach MVP (Phase 2+):**
- UX-Verbesserungen
- Performance-Optimierungen
- Erweiterte Features

---

## 6. Fazit

### 6.1 Bewertung der Dokumente

| Aspekt | `verbesserungen_konzept.md` | `custom_classes verbesserung.md` |
|--------|----------------------------|----------------------------------|
| **Wichtigkeit** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Durchdachtheit** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Kritikalität** | Mittel-Hoch | **KRITISCH** |
| **Implementierungs-Ready** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### 6.2 Entscheidung

**`custom_classes verbesserung.md` ist PRIORITÄR:**
- Identifiziert **kritische Architektur-Lücke**
- Verhindert **inkonsistentes Schema**
- Muss **vor Implementierung** korrigiert werden
- Folgt **etabliertem Projekt-Pattern**

**`verbesserungen_konzept.md` ist WERTVOLL:**
- Enthält viele **gute Ideen**
- Fokus auf **Robustheit und UX**
- Kann **schrittweise** implementiert werden
- Erfordert **keine Schema-Änderungen**

### 6.3 Finale Empfehlung

1. **SOFORT**: Schema-Korrekturen aus `custom_classes verbesserung.md` umsetzen
2. **DANACH**: Kritische Backend-Funktionalität implementieren
3. **DANN**: Best Practices aus `verbesserungen_konzept.md` integrieren
4. **SPÄTER**: UX-Verbesserungen und Performance-Optimierungen

**Die Verbesserungsvorschläge sind insgesamt sehr gut und sollten alle umgesetzt werden, aber in der richtigen Reihenfolge.**

---

*Diese Analyse bestätigt, dass beide Konzepte wertvolle Verbesserungen enthalten, aber `custom_classes verbesserung.md` eine kritische Lücke identifiziert, die zuerst behoben werden muss.*
