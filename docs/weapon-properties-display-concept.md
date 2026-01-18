# Konzept: Waffeneigenschaften-Anzeige mit Reichweiten und Geschoss-Typen

## Problemstellung
Aktuell werden Reichweiten und Geschoss-Typen nicht optimal in den Waffeneigenschaften angezeigt. Der Benutzer möchte:
- Reichweiten in Metern direkt im Eigenschaftenfeld sehen
- Geschoss-Typen (Bolzen, Pfeil, Kugel) als eigenes Attribut im Eigenschaftenfeld
- Klare Trennung zwischen Wurfwaffen und Fernkampfwaffen mit Geschossen

## Regelwerk-Referenz (PHB 2024)

### Geschosse (Ammunition)
- **Regel**: "Die Art der erforderlichen Geschosse ist jeweils bei der Reichweite der Waffe angegeben."
- **Mechanik**: 
  - Jeder Angriff verbraucht ein Geschoss
  - Nach Kampf: 1 Minute = Hälfte der Geschosse (abgerundet) bergen
  - Rest geht verloren

### Reichweite
- **Nahkampf**: Höchstens 1,5 Meter entfernt
- **Fernkampf**: Weiter entfernte Ziele
- **Format**: Grundreichweite/Maximalreichweite in Metern

## Datenstruktur

### Aktuelle Speicherung
- `weapon.data.range`: {normal: X, max: Y} für Fernkampfwaffen
- `weapon.data.thrown_range`: {normal: X, max: Y} für Wurfwaffen
- `weapon.data.ammunition_type`: "Pfeil", "Bolzen", "Kugel"
- `weapon_property_mappings.parameter_value`: JSON mit Reichweiten/Geschoss-Typen

### Geschoss-Typen (aus PHB)
- **Pfeil** (Arrow): Für Bögen (Kurzbogen, Langbogen)
- **Bolzen** (Bolt): Für Armbrüste (Leichte Armbrust, Schwere Armbrust, Handarmbrust)
- **Kugel** (Bullet): Für Schleudern (Schleuder)

## Anzeige-Konzept

### 1. Wurfwaffen (thrown)
**Anzeige**: `Wurfwaffe (6/18 m)`
- Reichweite wird direkt nach dem Namen angezeigt
- Format: `normal/max m`

### 2. Fernkampfwaffen mit Geschossen (ammunition)
**Anzeige**: `Geschosse (Pfeil, 24/96 m)`
- Geschoss-Typ wird zuerst angezeigt
- Dann die Reichweite
- Format: `Geschoss-Typ, normal/max m`

### 3. Fernkampfwaffen ohne Geschosse (range, aber keine ammunition)
**Anzeige**: `Reichweite (24/96 m)`
- Nur Reichweite, kein Geschoss-Typ

### 4. Kombinationen
- Wenn Waffe sowohl `ammunition` als auch `range` hat:
  - `Geschosse` zeigt: Geschoss-Typ + Reichweite
  - `Reichweite` wird nicht separat angezeigt (redundant)

## Implementierung

### Frontend-Änderungen
1. **Formatierungsfunktion erweitern**:
   - Für `ammunition`: Geschoss-Typ + Reichweite kombinieren
   - Für `range`: Nur Reichweite (wenn nicht bereits bei ammunition)
   - Für `thrown`: Reichweite anzeigen

2. **Datenquellen priorisieren**:
   - `weapon_property_mappings.parameter_value` (höchste Priorität)
   - `weapon.data.ammunition_type` für Geschoss-Typ
   - `weapon.data.range` für Fernkampf-Reichweite
   - `weapon.data.thrown_range` für Wurf-Reichweite

### Datenbank-Änderungen (optional)
- Sicherstellen, dass `parameter_value` in `weapon_property_mappings` korrekt gefüllt ist
- Format: `{"ammunition_type": "Pfeil", "range": {"normal": 24, "max": 96}}`

## Beispiel-Anzeigen

### Kurzbogen
- Eigenschaften:
  - `Geschosse (Pfeil, 24/96 m)`
  - `Zweihändig`

### Langbogen
- Eigenschaften:
  - `Geschosse (Pfeil, 45/180 m)`
  - `Schwer`
  - `Zweihändig`

### Leichte Armbrust
- Eigenschaften:
  - `Geschosse (Bolzen, 24/96 m)`
  - `Laden`
  - `Zweihändig`

### Wurfspeer
- Eigenschaften:
  - `Wurfwaffe (9/36 m)`

### Dolch
- Eigenschaften:
  - `Finesse`
  - `Leicht`
  - `Wurfwaffe (6/18 m)`
