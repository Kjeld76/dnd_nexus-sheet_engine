# 🐛 Fehleranalyse & Fix: Doppelte Waffen-Eigenschaften

## Problem
Waffen-Eigenschaften werden doppelt angezeigt (z.B. "Leicht, Leicht" oder "Vielseitig, Vielseitig") in der UI.

## Fehlersuche-Konzept

### 1. Analyse: Woher kommen die Duplikate?

**Mögliche Ursachen:**
- ✅ **Backend (Rust)**: `get_all_weapons` prüft nur auf ID-Duplikate (Zeile 325), aber nicht auf Name-Duplikate
- ✅ **Datenbank**: `weapon_property_mappings` könnte Duplikate enthalten (trotz Migration)
- ✅ **Frontend (characterLogic)**: Keine zusätzliche Deduplizierung in `calculateDerivedStats`

**Hypothese:** Die Deduplizierung in `get_all_weapons` (Zeile 323-325) prüft nur auf `prop_id`, nicht auf `prop_name`. Wenn eine Waffe dieselbe Property mehrfach in der DB hat (z.B. durch verschiedene IDs oder fehlerhafte Migration), werden Duplikate durchgelassen.

### 2. Fehlerbehebung-Strategie

**Option A: Backend-Fix (Empfohlen)**
- Deduplizierung erweitern: Prüfe sowohl auf `prop_id` als auch auf `prop_name`
- Oder: Deduplizierung in `characterLogic.ts` hinzufügen als Fallback

**Option B: Frontend-Fix (Quick-Win)**
- In `characterLogic.ts` Zeile 386: `.map()` → `.map().filter((v, i, arr) => arr.indexOf(v) === i)` (Deduplizierung nach Name)

**Option C: DB-Check**
- Prüfen, ob `weapon_property_mappings` Duplikate hat
- Migration erneut ausführen oder manuell bereinigen

### 3. Implementierung

**Schritt 1:** Backend-Deduplizierung erweitern (Zeile 323-325)
```rust
// Prüfe sowohl auf ID als auch auf Name (normalisiert)
let prop_name_lower = prop_name.to_lowercase().trim().to_string();
let is_duplicate = weapon.properties.iter().any(|p| {
    p.id == prop_id || 
    p.name.to_lowercase().trim() == prop_name_lower
});
```

**Schritt 2:** Frontend-Fallback in `characterLogic.ts` (Zeile 386)
```typescript
const baseProperties = Array.from(
  new Set(
    weapon.properties?.map((p) => p.name || p.id) || []
  )
);
```

**Schritt 3:** DB-Check & Migration
```sql
-- Prüfe Duplikate
SELECT weapon_id, property_id, COUNT(*) as cnt
FROM weapon_property_mappings
GROUP BY weapon_id, property_id
HAVING cnt > 1;
```

### 4. Test-Plan

**Vor Fix:**
1. ✅ Alle Waffen in DB auflisten: `SELECT id, name FROM all_weapons_unified`
2. ✅ Prüfe Properties pro Waffe: `SELECT w.name, wp.name FROM weapon_property_mappings wpm JOIN all_weapons_unified w ON w.id = wpm.weapon_id JOIN weapon_properties wp ON wp.id = wpm.property_id WHERE w.id = 'WAFE-ID'`
3. ✅ Visuelle Prüfung in UI: Öffne CharacterSheet, gehe zu "Kampf" → "Waffen", prüfe alle ausgerüsteten Waffen

**Nach Fix:**
1. ✅ Backend: Prüfe Rust-Log auf "WARNING: Duplicate property" (sollten nicht mehr erscheinen)
2. ✅ Frontend: Typecheck + Lint
3. ✅ Visuelle Validierung: Alle Waffen erneut prüfen (keine Duplikate mehr in UI)
4. ✅ Edge Cases: Waffen mit vielen Properties, Waffen ohne Properties, Homebrew-Waffen

## Implementierung

### Phase 1: Backend-Fix (Priorität: Hoch)
- [ ] Erweitere `get_all_weapons` Deduplizierung (Zeile 323-325)
- [ ] Teste mit SQL-Query auf Duplikate

### Phase 2: Frontend-Fallback (Priorität: Mittel)
- [ ] Füge `Array.from(new Set(...))` in `characterLogic.ts` hinzu
- [ ] Teste Typecheck + Lint

### Phase 3: DB-Validierung (Priorität: Niedrig)
- [ ] Prüfe `weapon_property_mappings` auf Duplikate
- [ ] Falls nötig: Migration erneut ausführen

## Erfolgskriterien
- ✅ Keine doppelten Properties mehr in der UI angezeigt
- ✅ Backend-Log zeigt keine "WARNING: Duplicate property" Meldungen
- ✅ Alle Waffen (Core + Custom) zeigen korrekte Properties ohne Duplikate