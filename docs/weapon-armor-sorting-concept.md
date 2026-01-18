# Konzept: Sortierung von Waffen und Rüstungen nach PHB 2024

## Analyse der Spielerhandbuch-Tabellen

### Waffentabellen im PHB 2024

Die Waffen sind im Spielerhandbuch in Tabellen organisiert, die nach folgenden Kriterien sortiert sind:

#### 1. **Primäre Sortierung: Waffentyp**
- **Einfache Waffen** (Nahkampf)
- **Einfache Waffen** (Fernkampf)
- **Kriegswaffen** (Nahkampf)
- **Kriegswaffen** (Fernkampf)

#### 2. **Sekundäre Sortierung: Kategorie/Untergruppe**
Innerhalb jedes Waffentyps werden die Waffen nach Kategorien gruppiert:
- **Nahkampfwaffen**: Nach Schadensart oder Eigenschaften
- **Fernkampfwaffen**: Nach Reichweite oder Eigenschaften

#### 3. **Tertiäre Sortierung: Alphabetisch**
Innerhalb jeder Kategorie werden die Waffen alphabetisch sortiert.

### Rüstungstabellen im PHB 2024

Die Rüstungen sind nach folgenden Kriterien sortiert:

#### 1. **Primäre Sortierung: Rüstungskategorie**
- **Leichte Rüstung**
- **Mittelschwere Rüstung**
- **Schwere Rüstung**
- **Schilde**

#### 2. **Sekundäre Sortierung: Rüstungsklasse (AC)**
Innerhalb jeder Kategorie werden Rüstungen nach aufsteigender Rüstungsklasse sortiert.

#### 3. **Tertiäre Sortierung: Alphabetisch**
Bei gleicher AC werden Rüstungen alphabetisch sortiert.

## Implementierungsvorschlag

### Frontend-Navigation (ähnlich wie bei Zaubern/Talenten)

#### Für Waffen:
```
Hauptnavigation: Arsenal > Waffen
├── Sidebar-Navigation (links):
│   ├── Sortierung nach:
│   │   ├── [Typ] Einfache Waffen
│   │   │   ├── Nahkampf
│   │   │   └── Fernkampf
│   │   └── [Typ] Kriegswaffen
│   │       ├── Nahkampf
│   │       └── Fernkampf
│   └── Filter-Chips:
│       └── Aktive Filter (z.B. "Einfache Waffen > Nahkampf")
└── Hauptliste (Mitte):
    └── Sortiert nach: Typ > Kategorie > Alphabetisch
```

#### Für Rüstungen:
```
Hauptnavigation: Arsenal > Rüstungen
├── Sidebar-Navigation (links):
│   ├── Sortierung nach:
│   │   ├── [Kategorie] Leichte Rüstung
│   │   ├── [Kategorie] Mittelschwere Rüstung
│   │   ├── [Kategorie] Schwere Rüstung
│   │   └── [Kategorie] Schilde
│   └── Filter-Chips:
│       └── Aktive Filter (z.B. "Leichte Rüstung")
└── Hauptliste (Mitte):
    └── Sortiert nach: Kategorie > AC (aufsteigend) > Alphabetisch
```

### Datenbank-Felder

#### Waffen:
- `category`: Hauptkategorie (z.B. "Einfache Waffen", "Kriegswaffen")
- `weapon_type`: Unterkategorie (z.B. "Nahkampf", "Fernkampf") - DEPRECATED, sollte durch `category` ersetzt werden
- `damage_type`: Schadensart (für weitere Gruppierung)
- `properties`: Waffeneigenschaften (für Filterung)

#### Rüstungen:
- `category`: Hauptkategorie (z.B. "Leichte Rüstung", "Mittelschwere Rüstung", "Schwere Rüstung", "Schilde")
- `base_ac`: Rüstungsklasse (für Sortierung)
- `ac_formula`: AC-Formel (falls `base_ac` NULL)

### Sortierlogik (TypeScript)

```typescript
// Waffen-Sortierung
function sortWeapons(weapons: Weapon[]): Weapon[] {
  return weapons.sort((a, b) => {
    // 1. Primär: Kategorie (Einfache Waffen < Kriegswaffen)
    const categoryOrder = {
      "Einfache Waffen": 1,
      "Kriegswaffen": 2,
    };
    const catDiff = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
    if (catDiff !== 0) return catDiff;
    
    // 2. Sekundär: Typ (Nahkampf < Fernkampf)
    const typeOrder = { "Nahkampf": 1, "Fernkampf": 2 };
    const typeDiff = (typeOrder[a.weapon_type] || 99) - (typeOrder[b.weapon_type] || 99);
    if (typeDiff !== 0) return typeDiff;
    
    // 3. Tertiär: Alphabetisch
    return a.name.localeCompare(b.name, "de");
  });
}

// Rüstungen-Sortierung
function sortArmors(armors: Armor[]): Armor[] {
  return armors.sort((a, b) => {
    // 1. Primär: Kategorie
    const categoryOrder = {
      "Leichte Rüstung": 1,
      "Mittelschwere Rüstung": 2,
      "Schwere Rüstung": 3,
      "Schilde": 4,
    };
    const catDiff = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
    if (catDiff !== 0) return catDiff;
    
    // 2. Sekundär: AC (aufsteigend)
    const acA = a.base_ac ?? (a.ac_formula ? parseAC(a.ac_formula) : 0);
    const acB = b.base_ac ?? (b.ac_formula ? parseAC(b.ac_formula) : 0);
    if (acA !== acB) return acA - acB;
    
    // 3. Tertiär: Alphabetisch
    return a.name.localeCompare(b.name, "de");
  });
}
```

### UI-Komponenten

#### Waffen-Navigation:
- **Sidebar links**: Dropdown/Buttons für Kategorie-Auswahl
  - "Einfache Waffen" (mit Unterkategorien: Nahkampf, Fernkampf)
  - "Kriegswaffen" (mit Unterkategorien: Nahkampf, Fernkampf)
- **Filter-Chips**: Zeigen aktive Filter an
- **Hauptliste**: Sortiert nach obiger Logik

#### Rüstungen-Navigation:
- **Sidebar links**: Buttons für Kategorie-Auswahl
  - "Leichte Rüstung"
  - "Mittelschwere Rüstung"
  - "Schwere Rüstung"
  - "Schilde"
- **Filter-Chips**: Zeigen aktive Kategorie an
- **Hauptliste**: Sortiert nach Kategorie > AC > Alphabetisch

## Vorteile dieser Lösung

1. **Konsistenz**: Gleiche Navigation wie bei Zaubern/Talenten/Magischen Gegenständen
2. **Benutzerfreundlichkeit**: Intuitive Gruppierung nach PHB-Struktur
3. **Erweiterbarkeit**: Einfach weitere Filter hinzufügbar (z.B. nach Schadensart, Eigenschaften)
4. **Performance**: Sortierung erfolgt clientseitig, keine zusätzlichen DB-Queries nötig

## Nächste Schritte

1. ✅ Analyse der Datenbank-Struktur
2. ⏳ Implementierung der Sortierlogik
3. ⏳ UI-Komponenten für Navigation
4. ⏳ Filter-Chips Integration
5. ⏳ Breadcrumb-Integration
6. ⏳ Testing mit echten Daten
