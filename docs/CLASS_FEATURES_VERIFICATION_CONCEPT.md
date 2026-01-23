# Konzept: Überprüfung der Klassen-Features

## Ziel
Systematische Überprüfung, ob alle in den Progressionstabellen aufgeführten Klassenmerkmale auch tatsächlich als Features in den Level-Beschreibungen vorhanden sind.

## Schnellstart

```bash
# Prüfskript ausführen
npm run verify:classes

# Oder direkt mit tsx
tsx scripts/verify_class_features.ts
```

Das Skript erstellt einen detaillierten Prüfbericht, der zeigt:
- Welche Features fehlen
- Welche Level fehlen
- Welche Features zusätzlich vorhanden sind (nicht in Tabelle)
- Doppelte Level-Einträge

## Prüfmethodik

### Phase 1: Progressionstabelle als Referenz
Für jede der 12 Klassen:
1. Progressionstabelle extrahieren
2. Spalte "Klassenmerkmale" für jede Stufe (1-20) analysieren
3. Jedes aufgeführte Merkmal als Prüfpunkt markieren

### Phase 2: Feature-Abgleich
Für jede Stufe jeder Klasse:
1. **Prüfen, ob alle Tabellen-Merkmale vorhanden sind:**
   - Jedes Merkmal aus der Tabelle muss als Feature unter dem entsprechenden Level existieren
   - Format: `#### Level X` mit `- **MERKMALNAME**` darunter

2. **Prüfen auf Vollständigkeit:**
   - Alle Level 1-20 müssen existieren
   - Keine Level dürfen leer sein (außer wenn in Tabelle "—" steht)
   - **Unterklassenmerkmale müssen in ALLEN Unterklassen vorhanden sein:**
     - Wenn die Tabelle auf Level X "Unterklassenmerkmal" zeigt, muss JEDE Unterklasse ein Feature auf Level X haben
     - Beispiel: Level 6 "Unterklassenmerkmal" → Alle 4 Barbaren-Unterklassen müssen ein Level 6 Feature haben

3. **Prüfen auf Duplikate:**
   - Kein Feature darf doppelt aufgeführt sein
   - Keine Level dürfen doppelt existieren

### Phase 3: Strukturprüfung
1. **Format-Konsistenz:**
   - Alle Features müssen mit `- **MERKMALNAME**` beginnen
   - Beschreibung muss darunter folgen
   - Keine Zauberlisten oder Tabellen in Feature-Beschreibungen

2. **Klassenbeschreibung:**
   - Muss zwischen Progressionstabelle und "Features nach Level" stehen
   - Format: `### Klassenbeschreibung`

3. **Unterklassen:**
   - Müssen nach allen Level-Features kommen
   - Format: `### Unterklassen` → `#### UNTERKLASSENNAME`

## Prüfcheckliste pro Klasse

### Basis-Struktur
- [ ] Basis-Daten vorhanden
- [ ] Progressionstabelle vorhanden
- [ ] Klassenbeschreibung vorhanden
- [ ] "Features nach Level" Abschnitt vorhanden

### Level-Prüfung (für jede Stufe 1-20)
- [ ] Level-Abschnitt existiert (`#### Level X`)
- [ ] Alle Merkmale aus Tabelle vorhanden
- [ ] Keine zusätzlichen Merkmale, die nicht in Tabelle stehen
- [ ] Feature-Format korrekt
- [ ] Keine Zauberlisten/Tabellen in Feature-Text

### Spezielle Prüfungen
- [ ] Attributswerterhöhung auf korrekten Leveln (4, 8, 12, 16, 19)
- [ ] Unterklassenmerkmale auf korrekten Leveln
- [ ] Epische Gabe auf Level 19
- [ ] Level 20 Feature vorhanden

## Beispiel-Prüfung: BARBAR

### Progressionstabelle (Auszug)
| Stufe | Klassenmerkmale |
|-------|-----------------|
| 1     | Kampfrausch, Ungerüstete Verteidigung, Waffenmeisterung |
| 2     | Gefahrengespür, Rücksichtsloser Angriff |
| 3     | Barbaren-Unterklasse, Urwissen |
| 4     | Attributswerterhöhung |
| 5     | Zusätzlicher Angriff |
| 6     | Unterklassenmerkmal |
| ...   | ... |

### Prüfung Level 1
- [ ] `#### Level 1` existiert
- [ ] `- **KAMPFRAUSCH**` vorhanden
- [ ] `- **UNGERÜSTETE VERTEIDIGUNG**` vorhanden
- [ ] `- **WAFFENMEISTERUNG**` vorhanden
- [ ] Keine zusätzlichen Features, die nicht in Tabelle stehen

### Prüfung Level 2
- [ ] `#### Level 2` existiert
- [ ] `- **GEFAHRENGESPÜR` vorhanden
- [ ] `- **RÜCKSICHTSLOSER ANGRIFF` vorhanden

### Prüfung Level 3
- [ ] `#### Level 3` existiert
- [ ] `- **BARBAREN-UNTERKLASSE` vorhanden
- [ ] `- **URWISSEN` vorhanden

### Prüfung Level 4
- [ ] `#### Level 4` existiert
- [ ] `- **ATTRIBUTSWERTERHÖHUNG` vorhanden

### Prüfung Level 6
- [ ] `#### Level 6` existiert
- [ ] `- **UNTERKLASSENMERKMAL` vorhanden

## Automatisierbare Prüfungen

### 1. Regex-basierte Prüfung
```regex
^#### Level (\d+)$
```
- Findet alle Level-Abschnitte
- Prüft, ob Level 1-20 vollständig vorhanden

### 2. Feature-Format-Prüfung
```regex
^- \*\*[A-ZÄÖÜ][A-ZÄÖÜ\s]+\*\*
```
- Findet alle Feature-Namen
- Prüft Format-Konsistenz

### 3. Duplikat-Prüfung
- Alle `#### Level X` Einträge zählen
- Sollte genau 20 pro Klasse sein

## Manuelle Prüfungen

### 1. Inhaltliche Korrektheit
- Feature-Beschreibungen müssen vollständig sein
- Keine Platzhalter oder unvollständige Texte
- Keine falsch platzierten Zauberlisten

### 2. Unterklassen-Features
- **KRITISCH:** Prüfen, ob "Unterklassenmerkmale" in ALLEN Unterklassen vorhanden sind
- Wenn Progressionstabelle Level X "Unterklassenmerkmal" zeigt:
  - JEDE Unterklasse muss ein Feature auf Level X haben
  - Beispiel: Barbaren Level 6 → Alle 4 Unterklassen (Berserker, Eiferer, Weltenbaum, Wildes Herz) müssen Level 6 Features haben
- Prüfen, ob Unterklassen-Features auf korrekten Leveln sind
- Level variieren je nach Klasse (z.B. 3, 6, 10, 14 für Barbaren)

## Fehlerkategorien

### Kritische Fehler
1. **Fehlende Features:** Merkmal in Tabelle, aber nicht als Feature vorhanden
2. **Fehlende Unterklassenmerkmale:** "Unterklassenmerkmal" in Tabelle, aber nicht in ALLEN Unterklassen vorhanden
3. **Falsche Level-Zuordnung:** Feature auf falschem Level
4. **Leere Level:** Level existiert, aber hat keine Features (wenn Tabelle Merkmale zeigt)

### Mittlere Fehler
1. **Format-Fehler:** Feature nicht korrekt formatiert
2. **Duplikate:** Feature oder Level doppelt vorhanden
3. **Fehlende Klassenbeschreibung**

### Leichte Fehler
1. **Inkonsistente Formatierung:** Unterschiedliche Groß-/Kleinschreibung
2. **Unvollständige Beschreibungen:** Feature vorhanden, aber Beschreibung fehlt

## Durchführungsplan

### Schritt 1: Automatisierte Prüfung
**Tool:** `npm run verify:classes` oder `tsx scripts/verify_class_features.ts`

Das Prüfskript führt automatisch folgende Prüfungen durch:
1. Alle Level-Abschnitte extrahieren
2. Alle Feature-Namen extrahieren
3. Progressionstabellen parsen
4. Tabellen-Features mit tatsächlichen Features abgleichen
5. **Unterklassen identifizieren und prüfen:**
   - Findet alle Unterklassen einer Klasse
   - Prüft für jedes "Unterklassenmerkmal" in der Tabelle, ob es in ALLEN Unterklassen vorhanden ist
6. Duplikate identifizieren
7. Fehlende Level identifizieren
8. Detaillierten Prüfbericht generieren

**Ausgabe:**
- ✅ Klassen ohne Fehler
- ❌ Klassen mit Fehlern (Anzahl)
- Detaillierter Bericht mit:
  - Fehlende Level
  - Fehlende Features (in Tabelle, aber nicht vorhanden)
  - **Fehlende Unterklassenmerkmale (nicht in allen Unterklassen vorhanden)**
  - Zusätzliche Features (vorhanden, aber nicht in Tabelle)
  - Doppelte Level
  - Statistiken

### Schritt 2: Manuelle Prüfung
Nach automatischer Prüfung:
1. Feature-Beschreibungen auf Vollständigkeit prüfen
2. Zauberlisten/Tabellen in Features entfernen
3. Klassenbeschreibungen prüfen
4. Unterklassen-Features prüfen

### Schritt 3: Korrektur
Basierend auf Prüfbericht:
1. Fehlende Features hinzufügen
2. Falsch zugeordnete Features korrigieren
3. Duplikate entfernen
4. Format korrigieren

### Schritt 4: Erneute Prüfung
Nach Korrekturen erneut `npm run verify:classes` ausführen, bis alle Fehler behoben sind.

## Erwartetes Ergebnis

Nach vollständiger Prüfung und Korrektur:
- ✅ Alle 12 Klassen haben vollständige Progressionstabellen
- ✅ Alle Level 1-20 haben korrekte Features
- ✅ Alle Tabellen-Merkmale sind als Features vorhanden
- ✅ **Alle "Unterklassenmerkmale" sind in ALLEN Unterklassen vorhanden**
- ✅ Keine Duplikate oder leeren Level
- ✅ Konsistente Formatierung
- ✅ Vollständige Klassenbeschreibungen

## Beispiel: Unterklassenmerkmal-Prüfung

### Barbaren Level 6
**Progressionstabelle zeigt:** "Unterklassenmerkmal"

**Erwartete Unterklassen:**
- PFAD DES BERSERKERS → Level 6 Feature vorhanden ✅
- PFAD DES EIFERERS → Level 6 Feature vorhanden ✅
- PFAD DES WELTENBAUMS → Level 6 Feature vorhanden ✅
- PFAD DES WILDEN HERZENS → Level 6 Feature vorhanden ✅

**Fehlerbeispiel:**
- PFAD DES BERSERKERS → Level 6 Feature vorhanden ✅
- PFAD DES EIFERERS → Level 6 Feature fehlt ❌
- PFAD DES WELTENBAUMS → Level 6 Feature vorhanden ✅
- PFAD DES WILDEN HERZENS → Level 6 Feature vorhanden ✅

→ **Fehler:** Eiferer-Unterklasse fehlt Level 6 Feature
