# Konzept: Klassen-Submenü im Kompendium

## Zusammenfassung

**Referenz-Implementierung:** **Waffen-Navigation** (Zeilen 1188-1346 in `Compendium.tsx`)

Die Klassen-Navigation soll **identisch** zur Waffen-Navigation implementiert werden:
- **Hauptnavigation**: Klassen als Kategorien (wie `Einfache Waffen`, `Kriegswaffen`)
- **Untermenüs**: Subklassen werden automatisch eingeblendet wenn Klasse aktiv (`isActive`)
- **Code-Pattern**: `isActive && (...)` Block (wie bei Waffen-Unterkategorien)
- **Visuelles Design**: Exakt wie Waffen (`ml-4` Einrückung, `bg-primary/20` für aktive Subklasse)

**Vorteil:** Kein neues Pattern, bewährtes Design, konsistente UX

## Problemstellung

Aktuell werden Klassen im Kompendium als flache Liste dargestellt. Jede Klasse hat 3-4 Subklassen, die erst nach Auswahl der Klasse sichtbar werden. Dies ist wenig übersichtlich und erschwert das Navigieren zwischen Klassen und Subklassen.

## Ziel

Eine übersichtliche Navigation **identisch zur Waffen-Navigation**:
- **Sidebar-Links**: Liste aller Klassen als Hauptnavigation (wie Waffen-Kategorien)
- **Submenüs**: Automatisch erweiterbar wenn Klasse aktiv (`isActive &&`) - wie Waffen-Unterkategorien
- **Hierarchische Struktur**: Klare visuelle Trennung mit `ml-4` Einrückung

## UI-Struktur - Vergleich mit bestehenden Navigationsstrukturen

### Bestehende Strukturen im Projekt

#### 1. Magic Items (Kategorien - Flach)
```
┌──────────────────────────┐
│  Kategorien              │
│  ✓ Waffe         (34)    │  ← Aktive Kategorie (Filter)
│    Rüstung       (24)    │
│    Ring          (20)    │
│    ...                   │
└──────────────────────────┘
→ Zeigt nur Items der ausgewählten Kategorie
→ Keine Hierarchie
```

#### 2. Waffen (Kategorien - Hierarchisch, ERWEITERT)
```
┌──────────────────────────────┐
│  Kategorien                  │
│                              │
│  ▼ Einfache Waffen   (10)    │  ← ERWEITERT wenn aktiv
│    ┌──────────────────┐      │
│    │ Typ              │      │
│    │ ✓ Nahkampf       │      │  ← Unterkategorie
│    │   Fernkampf      │      │
│    └──────────────────┘      │
│    ┌──────────────────┐      │
│    │ Unterkategorie   │      │
│    │   Stangenwaffen  │      │  ← Weitere Unterkategorie
│    │   ...            │      │
│    └──────────────────┘      │
│                              │
│  ▷ Kriegswaffen       (18)   │  ← Zusammengeklappt
│                              │
└──────────────────────────────┘
→ ERWEITERT zeigt Unterkategorien nur wenn aktiv
→ Klare visuelle Hierarchie (ml-4 Einrückung)
→ Ähnlich zu gewünschter Klassen-Struktur!
```

#### 3. Rüstungen (Kategorien - Flach)
```
┌──────────────────────────┐
│  Kategorien              │
│  ✓ Leichte Rüstung  (3)  │  ← Aktive Kategorie
│    Mittelschwere R.(5)   │
│    ...                   │
└──────────────────────────┘
→ Flache Struktur wie Magic Items
```

#### 4. Spells (Sortierung - Mehrstufig)
```
┌──────────────────────────┐
│  Sortierung              │
│  [Grad][Schule][Klasse]  │  ← Modus-Auswahl
│                          │
│  Zaubergrad              │
│  ✓ Grad 0        (14)    │  ← Filter nach Modus
│    Grad 1        (23)    │
└──────────────────────────┘
→ Sortierungs-Modus bestimmt Filter-Optionen
```

### Vorgeschlagene Struktur für Klassen (Analog zu Waffen)

**Struktur:** Exakt wie **Waffen** - ERWEITERT mit Untermenüs

```
┌─────────────────────────────────────────┐
│  Kategorien                             │
│  [Alphabetisch] [Hit Die]  ← Optional  │
│                                         │
│  ▼ BARBAR                       (4)     │  ← ERWEITERT wenn aktiv
│    ┌──────────────────────────┐         │
│    │ Unterklassen             │         │
│    │ • Pfad des Berserkers    │         │  ← Subklasse (ml-4)
│    │ • Pfad des Eiferers      │         │
│    │ • Pfad des Weltenbaums   │         │
│    │ • Pfad des Wilden Herzens│         │
│    └──────────────────────────┘         │
│                                         │
│  ▷ BARDE                         (3)    │  ← Zusammengeklappt
│                                         │
│  ▼ DRUIDE                        (4)    │  ← ERWEITERT wenn aktiv
│    ┌──────────────────────────┐         │
│    │ Unterklassen             │         │
│    │ • Kreis der Magie        │         │
│    │ • ...                    │         │
│    └──────────────────────────┘         │
│                                         │
└─────────────────────────────────────────┘
```

**Implementierung:** Exakt wie Waffen (`isActive && (...)` Block)

## Implementierungs-Details

### 1. State Management

**Änderung:** KEIN zusätzlicher State nötig!

**Verhalten (wie Waffen):**
- `isActive = selectedId === cls.id` bestimmt, ob erweitert wird
- Beim Klick auf Klasse: `setSelectedId(cls.id)` → automatisch erweitert
- Beim Klick auf Subklasse: `setSelectedSubclass(subclass)` → bleibt erweitert
- Standard: Keine Klasse ausgewählt → alle zugeklappt

**Optional (für Sortierung):**
```typescript
const [classSortMode, setClassSortMode] = useState<'alphabetical' | 'hit_die'>('alphabetical');
```

**Vorteil:** Weniger State, konsistent mit Waffen-Navigation

### 2. Datenstruktur

**Klassen-Liste:**
```typescript
interface ClassNavigationItem {
  id: string;
  name: string;
  hitDie: number;
  subclasses: Array<{
    name: string;
    levelFeatures: Record<string, Array<Feature>>;
  }>;
}
```

### 3. Sidebar-Komponente (EXAKT wie Waffen - ERWEITERT)

**Struktur:** Identisch zu Waffen-Navigation (Zeilen 1188-1346)

```tsx
{activeTab === "classes" && classes.length > 0 && (() => {
  // Sortierte Klassen-Liste
  const sortedClasses = classSortMode === 'alphabetical'
    ? [...classes].sort((a, b) => a.name.localeCompare(b.name, "de"))
    : [...classes].sort((a, b) => (b.data?.hit_die || 0) - (a.data?.hit_die || 0));

  return (
    <aside className="w-56 border-r border-border flex flex-col bg-muted/20 overflow-hidden">
      {/* Optional: Sortierung (nur wenn mehrere Modi) */}
      {false && (  // Deaktiviert - nur eine Sortierung nötig
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-3">
            Sortierung
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setClassSortMode('alphabetical')}>
              Alphabetisch
            </button>
            <button onClick={() => setClassSortMode('hit_die')}>
              Hit Die
            </button>
          </div>
        </div>
      )}

      <div className="p-4 border-b border-border">
        <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-3">
          Klassen
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {sortedClasses.map((cls) => {
          const subclasses = getSubclasses(cls.data?.subclasses);
          const isActive = selectedId === cls.id;

          return (
            <div key={cls.id} className="mb-2">
              {/* Basisklasse-Button (wie Waffen-Kategorie) */}
              <button
                onClick={() => {
                  setSelectedId(cls.id);
                  setSelectedSubclass(null);
                }}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium",
                  isActive && !selectedSubclass
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted/30 hover:bg-muted/50 text-foreground",
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{cls.name}</span>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full",
                      isActive && !selectedSubclass
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {subclasses.length}
                  </span>
                </div>
              </button>

              {/* Subklassen (nur wenn aktiv - wie Waffen-Unterkategorien) */}
              {isActive && subclasses.length > 0 && (
                <div className="mt-2 ml-4 space-y-1">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-3">
                    Unterklassen
                  </div>
                  {subclasses.map((subclass) => (
                    <button
                      key={subclass.name}
                      onClick={() => {
                        setSelectedSubclass(subclass);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-all text-xs font-medium",
                        selectedSubclass?.name === subclass.name
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-muted/20 hover:bg-muted/30 text-foreground",
                      )}
                    >
                      {subclass.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
})()}
```

**Wichtig:**
- **EXAKT wie Waffen-Struktur** (Zeilen 1248-1340)
- ERWEITERT nur wenn `isActive` (Klasse ist ausgewählt)
- Visuelle Hierarchie: `ml-4` Einrückung für Subklassen
- Styling: `bg-primary/20 text-primary border border-primary/30` für aktive Subklasse

### Vergleich: Strukturen im Projekt

| Feature | Magic Items | Waffen | Rüstungen | **Klassen (Vorschlag)** |
|---------|-------------|--------|-----------|-------------------------|
| **Hauptnavigation** | Kategorien (Ring, Waffe, etc.) | Kategorien (Einfache Waffen, Kriegswaffen) | Kategorien (Leichte Rüstung, etc.) | **Klassen (Barbar, Barde, etc.)** |
| **Untermenüs** | ❌ Keine | ✅ **Typ & Unterkategorie** (wenn aktiv) | ❌ Keine | ✅ **Unterklassen** (wenn aktiv) |
| **Erweitert wenn** | - | `isActive` (Kategorie ausgewählt) | - | `isActive` (Klasse ausgewählt) |
| **Visuelle Hierarchie** | - | `ml-4` Einrückung | - | `ml-4` Einrückung |
| **Badge** | Anzahl Items | Anzahl Items | Anzahl Items | **Anzahl Subklassen** |
| **Styling** | `bg-primary` (aktiv) | `bg-primary` (Kategorie) + `bg-primary/20` (Unterkategorie) | `bg-primary` (aktiv) | `bg-primary` (Klasse) + `bg-primary/20` (Subklasse) |
| **Code-Struktur** | Flach (`map`) | **Hierarchisch (`isActive &&`) *** | Flach (`map`) | **Hierarchisch (`isActive &&`) *** |

*** = **Referenz-Implementierung für Klassen**

### 4. Interaktionen (wie Waffen)

**Klick auf Basisklasse:**
- Setzt `selectedId = cls.id` → automatisch `isActive = true`
- Setzt `selectedSubclass = null`
- Submenü wird automatisch eingeblendet (`isActive &&`)
- Zeigt Basisklassen-Details im Hauptbereich

**Klick auf Subklasse:**
- Setzt `selectedSubclass = subclass`
- `selectedId` bleibt gleich → `isActive` bleibt `true`
- Submenü bleibt eingeblendet
- Zeigt Subklassen-Details im Hauptbereich

**Kein zusätzlicher State nötig!** (Anders als ursprünglich vorgeschlagen)

**Vorteil:** Identisch zu Waffen-Navigation, keine neuen Patterns

### 5. Sortierung

**Alphabetisch (Standard):**
- Klassen nach Name sortiert: A-Z
- Subklassen innerhalb jeder Klasse: A-Z

**Nach Hit Die:**
- Klassen sortiert: 6 (Magier, Zauberer) → 8 → 10 → 12 (Barbar)
- Innerhalb gleicher Hit Die: alphabetisch

### 6. Visuelles Design (EXAKT wie Waffen)

**Basisklasse (Nicht-selektiert):** → Wie Waffen-Kategorie
```tsx
className="bg-muted/30 hover:bg-muted/50 text-foreground"
```

**Basisklasse (Selektiert):** → Wie aktive Waffen-Kategorie
```tsx
className="bg-primary text-primary-foreground shadow-lg"
```
- Badge: `bg-primary-foreground/20 text-primary-foreground` (wenn aktiv)
- Badge: `bg-muted text-muted-foreground` (wenn nicht aktiv)

**Subklasse (Nicht-selektiert):** → Wie Waffen-Typ/Unterkategorie
```tsx
className="bg-muted/20 hover:bg-muted/30 text-foreground"
```
- Einrückung: `ml-4` (in `<div className="mt-2 ml-4 space-y-1">`)
- Label: `<div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-3">Unterklassen</div>`

**Subklasse (Selektiert):** → Wie aktive Waffen-Unterkategorie
```tsx
className="bg-primary/20 text-primary border border-primary/30"
```

**Vergleich mit Waffen:**
- **Basisklasse** = **Waffen-Kategorie** (`Einfache Waffen`, `Kriegswaffen`)
- **Subklassen** = **Waffen-Typ/Unterkategorie** (`Nahkampf`, `Fernkampf`, `Stangenwaffen`)
- **Styling identisch** → Konsistente UX

### 7. Responsive Verhalten

**Desktop (≥1024px):**
- Sidebar sichtbar (256px breit)
- Hauptbereich daneben

**Tablet/Mobile (<1024px):**
- Sidebar ausklappbar (Drawer/Sheet)
- Oder: Sidebar oben als Horizontal-Tabs

### 8. Performance-Optimierungen

**Virtualisierung:**
- Für große Klassen-Listen: `@tanstack/react-virtual` nutzen
- Aktuell nicht kritisch (nur 12 Klassen)

**Memoization:**
```typescript
const sortedClasses = useMemo(() => {
  const sorted = [...classes];
  if (classSortMode === 'alphabetical') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted.sort((a, b) => (b.data?.hit_die || 0) - (a.data?.hit_die || 0));
}, [classes, classSortMode]);
```

## Migration

### Schritt 1: Sidebar-Komponente erstellen
- **Referenz:** Waffen-Navigation (Zeilen 1188-1346)
- Struktur: `<aside>` → Kategorien-Header → Klassen-Liste mit `isActive`-Logik
- Kein zusätzlicher State nötig (`selectedId` reicht)

### Schritt 2: Sortierungs-Logik (Optional)
- Alphabetisch (Standard): `[...classes].sort((a, b) => a.name.localeCompare(b.name, "de"))`
- Nach Hit Die: `[...classes].sort((a, b) => (b.data?.hit_die || 0) - (a.data?.hit_die || 0))`

### Schritt 3: Integration
- Sidebar einbinden (wie Magic Items/Waffen/Armor)
- Position: Vor der Sidebar-Liste (wie bei Waffen/Armor/Magic Items)
- Condition: `{activeTab === "classes" && classes.length > 0 && (...)`

### Schritt 4: Testing
- Navigation testen (Klasse → Subklasse)
- `isActive`-Logik prüfen (automatische Erweiterung)
- Styling-Konsistenz mit Waffen prüfen

## Vorteile

1. **Übersichtlichkeit**: Alle Klassen auf einen Blick, Subklassen nur bei Bedarf
2. **Konsistenz**: **Identische UX wie Waffen-Navigation** (bewährtes Pattern)
3. **Navigation**: Schneller Wechsel zwischen Klassen und Subklassen
4. **Skalierbarkeit**: Funktioniert auch mit vielen Custom-Klassen
5. **Einfachheit**: Kein zusätzlicher State (`isActive`-Logik reicht)
6. **Code-Wiederverwendung**: Struktur 1:1 von Waffen übernehmbar

## Offene Fragen

1. **Standard-Erweiterung**: Automatisch erweitert wenn `selectedId === cls.id`?
   - **Entscheidung:** ✅ Ja (wie bei Waffen - `isActive &&`)

2. **Initial State**: Alle zugeklappt oder erste Klasse erweitert?
   - **Entscheidung:** ✅ Alle zugeklappt (kein `selectedId` → keine erweitert)

3. **Sortierung**: Alphabetisch oder nach Hit Die?
   - **Entscheidung:** ✅ Alphabetisch (Standard), Hit Die optional

4. **Subklassen-Suche**: In Subklassen-Namen suchen?
   - **Offen:** Funktioniert bereits, da `data` in `getFilteredData()` enthalten

## Nächste Schritte

1. ✅ Konzept erarbeitet
2. ⏳ Implementierung planen
3. ⏳ Code-Review
4. ⏳ Testing
5. ⏳ Deployment
