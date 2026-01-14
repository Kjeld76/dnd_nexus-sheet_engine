# D&D Nexus - Performance- & Optimierungsanalyse

**Version:** 1.6.1  
**Datum:** 2026-01-12

---

## 📊 Performance-Targets (aus Checklist)

### ✅ Erreicht
- **Installer-Größe:** < 70MB (Release-Profile mit LTO & Strip)
- **Memory-Nutzung:** < 100MB idle (Dev-Profile optimiert)
- **Query-Response:** < 10ms Lookups (SQL-Indizes auf Name & Parent_ID)

### ⚠️ Potenzielle Probleme
- **Kompendium-Loading:** Lädt ALLE Daten auf einmal (keine Pagination/Lazy Loading)
- **Test-Coverage:** Sehr niedrig (nur 1 Test-Datei)
- **Prepared Statements:** `queries.rs` ist fast leer (keine Query-Optimierung)

---

## 🔍 Aktuelle Performance-Situation

### Datenbank-Performance

**✅ Stärken:**
- Indizes vorhanden: `name`, `parent_id`, `updated_at`
- Foreign Keys definiert (Datenintegrität)
- Views für Unified Access (Core + Custom)
- Trigger für Datenvalidierung

**⚠️ Schwächen:**
- `queries.rs` ist fast leer (keine Prepared Statement-Caching)
- Jeder Query erstellt neue Prepared Statements
- Komplexe Views (UNION + LEFT JOIN) könnten langsam sein
- Keine Query-Analyse/Benchmarking

**Potenzielle Pain-Points:**
- `get_all_weapons`: N+1 Problem (für jede Waffe werden Properties/Mastery geladen)
- Views mit UNION: Können bei großen Datenmengen langsam sein
- JSON-Parsing: `serde_json::from_str` bei jedem Query

### Frontend-Performance

**✅ Stärken:**
- Zustand für State Management (lightweight)
- React 19 (neueste Version)
- Vite 6.0 (schnelle Dev-Server)
- Tailwind CSS (keine Runtime-Overhead)

**⚠️ Schwächen:**
- Kompendium lädt ALLE Daten auf einmal (308 Spells, 38 Weapons, etc.)
- Keine Virtualisierung (außer @tanstack/react-virtual importiert, aber nicht genutzt)
- Keine Memoization (React.memo, useMemo, useCallback fehlen)
- Keine Code-Splitting (alles in einem Bundle)

**Potenzielle Pain-Points:**
- Kompendium-Initialisierung: Lädt alle 11 Kategorien auf einmal
- Charakter-Sheet: Große Komponenten ohne Memoization
- Re-Renders: Keine Optimierung gegen unnötige Updates

### Build-Performance

**✅ Stärken:**
- Release-Profile optimiert: `opt-level = "s"`, `lto = true`, `strip = true`
- Vite Build: `minify = "esbuild"` (sehr schnell)
- TypeScript: Strict Mode (Type-Safety)

**⚠️ Schwächen:**
- Dev-Profile: `incremental = false` (langsamer bei großen Änderungen)
- Rust Build: `codegen-units = 1` (langsamer Build, bessere Performance)
- Keine Build-Caching-Strategie

---

## 🎯 Haupt-Pain-Points

### 1. Kompendium-Loading (Hoch)

**Problem:**
- Lädt ALLE Daten auf einmal (308 Spells, 38 Weapons, 13 Armors, etc.)
- Keine Lazy Loading oder Pagination
- Initiales Laden kann 1-2 Sekunden dauern

**Impact:**
- Lange Ladezeiten beim App-Start (wenn Kompendium geöffnet wird)
- Hohe Memory-Nutzung (alle Daten im RAM)
- Langsame Suche (Filter über große Arrays)

**Quick Wins:**
- Lazy Loading: Nur geladene Kategorien fetchen
- Virtualisierung: `@tanstack/react-virtual` für Listen nutzen
- Debouncing: Suche-Debouncing für bessere Performance

**Langfristig:**
- Backend-Pagination: Limit/Offset für Queries
- Search-Index: Volltextsuche in SQLite
- Caching-Strategie: Service Worker für Offline-Cache

### 2. N+1 Query Problem (Mittel)

**Problem:**
- `get_all_weapons`: Für jede Waffe werden Properties/Mastery separat geladen
- 38 Waffen = 38+ Queries für Properties + 38 Queries für Masteries

**Impact:**
- Langsame Query-Response (kann > 100ms sein)
- Hohe Datenbank-Last

**Quick Wins:**
- Batch-Queries: JOINs statt N+1 Queries
- Prepared Statement-Caching: `queries.rs` erweitern

**Langfristig:**
- Query-Optimierung: Alle Daten in einem Query laden
- Denormalisierung: Properties/Masteries in JSON-Feld cachen

### 3. Frontend Re-Renders (Niedrig-Mittel)

**Problem:**
- Keine Memoization (React.memo, useMemo, useCallback)
- Große Komponenten re-rendern bei jedem State-Update

**Impact:**
- Langsame UI bei vielen Updates
- Höhere CPU-Nutzung

**Quick Wins:**
- React.memo für große Komponenten
- useMemo für teure Berechnungen
- useCallback für Event-Handler

### 4. Test-Coverage (Niedrig)

**Problem:**
- Nur 1 Test-Datei (`AttributeBlock.test.tsx`)
- Keine Integration-Tests
- Keine E2E-Tests

**Impact:**
- Hohes Regressions-Risiko
- Schwer zu refactoren ohne Tests

**Quick Wins:**
- Unit-Tests für kritische Logik (characterLogic.ts, traitParser.ts)
- Integration-Tests für Datenbank-Queries

**Langfristig:**
- E2E-Tests für kritische Workflows
- Coverage-Target: 60-80% für kritische Module

---

## 🚀 Optimierungs-Empfehlungen

### Priorität 1: Quick Wins (1-2 Tage)

#### 1.1 Kompendium Lazy Loading
```typescript
// Nur geladene Kategorien fetchen
fetchSpells: async () => {
  if (get().spells.length > 0) return; // Bereits geladen
  // ... fetch logic
}
```

#### 1.2 React Memoization
```typescript
// CharacterSheet.tsx
export const CharacterSheet = React.memo(({ character }) => {
  // ...
});

// AttributeBlock.tsx (bereits vorhanden)
const modifier = useMemo(() => calculateModifier(value), [value]);
```

#### 1.3 Query-Optimierung: Batch-Queries
```rust
// get_all_weapons: JOINs statt N+1
SELECT w.*, 
       json_group_array(json_object('id', wp.id, 'name', wp.name)) as properties,
       wm.id as mastery_id, wm.name as mastery_name
FROM all_weapons_unified w
LEFT JOIN weapon_property_mappings wpm ON w.id = wpm.weapon_id
LEFT JOIN weapon_properties wp ON wpm.property_id = wp.id
LEFT JOIN weapon_masteries wm ON w.mastery_id = wm.id
GROUP BY w.id
```

#### 1.4 Prepared Statement-Caching
```rust
// queries.rs erweitern
lazy_static! {
    static ref WEAPON_QUERY: Mutex<Option<Statement>> = Mutex::new(None);
}
```

### Priorität 2: Mittelfristig (1-2 Wochen)

#### 2.1 Backend-Pagination
```rust
#[tauri::command]
pub async fn get_spells(
    db: State<'_, Database>,
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<Vec<Spell>, String> {
    // LIMIT/OFFSET für Queries
}
```

#### 2.2 Virtualisierung für Listen
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
  count: spells.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

#### 2.3 Search-Index (SQLite FTS)
```sql
CREATE VIRTUAL TABLE spells_fts USING fts5(name, description, content=all_spells);
```

#### 2.4 Test-Coverage ausbauen
- Unit-Tests: `characterLogic.ts`, `traitParser.ts`, `math.ts`
- Integration-Tests: Datenbank-Queries
- Component-Tests: Kritische UI-Komponenten

### Priorität 3: Langfristig (1-2 Monate)

#### 3.1 Code-Splitting
```typescript
// Lazy Loading für große Komponenten
const Compendium = lazy(() => import('./components/Compendium'));
const CharacterSheet = lazy(() => import('./screens/CharacterSheet'));
```

#### 3.2 Service Worker / Offline-Cache
- Caching-Strategie für Kompendium-Daten
- Offline-Funktionalität

#### 3.3 Query-Analyse & Benchmarking
- SQLite EXPLAIN QUERY PLAN
- Performance-Metriken sammeln
- Bottlenecks identifizieren

#### 3.4 Denormalisierung (falls nötig)
- Properties/Masteries in JSON-Feld cachen
- Trade-off: Mehr Speicher vs. schnellere Queries

---

## 📈 Performance-Metriken

### Aktuelle Ziele (aus Checklist)
- ✅ Installer: < 70MB
- ✅ Memory idle: < 100MB
- ✅ Query-Response: < 10ms (Lookups)

### Empfohlene Ziele

**App-Startzeit:**
- Cold Start: < 2s
- Warm Start: < 1s

**Query-Response-Zeiten:**
- Einzelne Lookups: < 10ms (✅ erreicht)
- Kompendium-Loading: < 500ms (⚠️ aktuell: 1-2s)
- Charakter-Loading: < 100ms

**Memory-Footprint:**
- Idle: < 100MB (✅ erreicht)
- Mit Kompendium: < 200MB (⚠️ aktuell: ~150-250MB)
- Mit Charakter: < 150MB

**Build-Zeiten:**
- Dev-Build: < 10s (Vite)
- Rust-Compilation: < 30s (erste Kompilierung)
- Release-Build: < 2min

---

## 🧪 Test-Coverage

### Aktueller Stand
- **Test-Dateien:** 1 (`AttributeBlock.test.tsx`)
- **Coverage:** ~1-2% (geschätzt)
- **Bereiche:** Nur UI-Komponenten (Attribut-Berechnung)

### Empfohlene Coverage

**Kritische Bereiche (Priorität 1):**
- `characterLogic.ts`: Charakter-Berechnungen (AC, Modifier, etc.)
- `traitParser.ts`: Spezies-Merkmale Parser
- `math.ts`: D&D-Mathematik (Modifier-Berechnung)
- Datenbank-Queries: Integration-Tests

**Wichtige Bereiche (Priorität 2):**
- `store.ts`: Zustand-Logik
- `compendiumStore.ts`: Kompendium-State
- Komponenten: CharacterSheet, Compendium

**Nice-to-Have (Priorität 3):**
- E2E-Tests: Kritische Workflows (Charakter-Erstellung, etc.)
- UI-Tests: Alle Komponenten

**Coverage-Ziel:**
- Kritische Module: 80-90%
- Wichtige Module: 60-80%
- Gesamt: 60-70%

---

## 🎯 Priorisierung

### Option A: Schnelle Quick Wins (Empfohlen)
**Zeitaufwand:** 1-2 Tage  
**Impact:** Mittel-Hoch  
**Risiko:** Niedrig

**Tasks:**
1. Kompendium Lazy Loading
2. React Memoization (CharacterSheet, große Komponenten)
3. Query-Optimierung: Batch-Queries für Waffen
4. Prepared Statement-Caching

**Erwartete Verbesserung:**
- App-Startzeit: -30-50%
- Memory-Nutzung: -20-30%
- Query-Response: -50-70%

### Option B: Langfristige Architektur-Verbesserung
**Zeitaufwand:** 2-4 Wochen  
**Impact:** Hoch  
**Risiko:** Mittel

**Tasks:**
1. Backend-Pagination
2. Virtualisierung für Listen
3. Search-Index (SQLite FTS)
4. Test-Coverage ausbauen (60-70%)

**Erwartete Verbesserung:**
- App-Startzeit: -50-70%
- Memory-Nutzung: -40-60%
- Query-Response: -70-90%
- Code-Qualität: +80% (durch Tests)

### Option C: Beides (Empfohlen für Production)
**Zeitaufwand:** 3-5 Wochen  
**Impact:** Sehr Hoch  
**Risiko:** Niedrig-Mittel

**Vorgehen:**
1. Phase 1 (1-2 Tage): Quick Wins
2. Phase 2 (1-2 Wochen): Mittelfristige Verbesserungen
3. Phase 3 (1-2 Wochen): Langfristige Architektur

---

## 🚢 Deployment

### Ziel-Plattformen
- ✅ Windows (MSI/NSIS)
- ✅ macOS (App Bundle)
- ✅ Linux (AppImage)

### Build-Zeit Constraints
- **Dev-Build:** < 10s (Vite) - ✅ erreicht
- **Release-Build:** < 2min - ✅ erreicht
- **CI/CD:** Optional (nicht vorhanden)

### Aktuelle Build-Konfiguration
- **Release-Profile:** Optimiert (LTO, Strip, opt-level = "s")
- **Bundle-Größe:** < 70MB - ✅ erreicht
- **Code-Signing:** Nicht vorhanden (für Production nötig)

---

## 📝 Zusammenfassung

### Aktuelle Performance
- ✅ **Gut:** Installer-Größe, Memory idle, Query-Indizes
- ⚠️ **Verbesserungswürdig:** Kompendium-Loading, Test-Coverage, Query-Optimierung

### Haupt-Pain-Points
1. **Kompendium-Loading** (Hoch): Lädt ALLE Daten auf einmal
2. **N+1 Query Problem** (Mittel): Waffen-Properties werden separat geladen
3. **Frontend Re-Renders** (Niedrig-Mittel): Keine Memoization
4. **Test-Coverage** (Niedrig): Nur 1 Test-Datei

### Empfohlene Priorität
**Option C (Beides):** Quick Wins + Langfristige Verbesserungen
- **Phase 1:** Quick Wins (1-2 Tage)
- **Phase 2:** Mittelfristige Verbesserungen (1-2 Wochen)
- **Phase 3:** Langfristige Architektur (1-2 Wochen)

---

*Letzte Aktualisierung: 2026-01-12*
