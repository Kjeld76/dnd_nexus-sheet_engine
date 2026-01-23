# Konzept: Klassen-Progressionstabellen und fehlende Merkmale

## Ziel
1. Alle fehlenden stufenabhängigen Merkmale bei Klassen und Unterklassen ergänzen
2. Tabellen mit Stufe, Übungsbonus, Klassenmerkmalen und klassenspezifischen Einträgen exportieren und sinnvoll einfügen
3. **Klassenbeschreibungen hinzufügen** - Diese befinden sich zwischen den Basis-Daten und den Features nach Level
4. Systematische und vollständige Prüfung aller 12 Klassen

## Struktur der Progressionstabellen (D&D 2024)

### Standard-Spalten (alle Klassen)
- **Stufe**: 1-20
- **Übungsbonus**: +2 bis +6
- **Klassenmerkmale**: Liste der Features pro Level

### Klassenspezifische Spalten (je nach Klasse unterschiedlich)

#### BARBAR
- **Kampfrausch**: Anzahl der Anwendungen
- **Kampfrausch-Schaden**: Bonus-Schaden (1W2, 1W4, etc.)
- **Waffenmeisterung**: Anzahl der Waffen

#### BARDE
- **Bardenwürfel**: Größe des Inspiration-Würfels (W6, W8, W10, W12)
- **Zaubertricks**: Anzahl der Zaubertricks
- **Zauberplätze**: Anzahl pro Grad
- **Vorbereitete Zauber**: Anzahl der vorbereiteten Zauber

#### DRUIDE
- **Zaubertricks**: Anzahl
- **Zauberplätze**: Anzahl pro Grad
- **Vorbereitete Zauber**: Anzahl
- **Wilde Gestalt**: CR/Schwelle

#### HEXENMEISTER
- **Hexpunkt-Maximum**: Max. Hexpunkte
- **Zaubertricks**: Anzahl
- **Zauberplätze**: Anzahl pro Grad
- **Bekannte Zauber**: Anzahl
- **Invocations bekannt**: Anzahl

#### KLERIKER
- **Zaubertricks**: Anzahl
- **Zauberplätze**: Anzahl pro Grad
- **Vorbereitete Zauber**: Anzahl
- **Kanalisierung der Göttlichkeit**: Anzahl

#### KÄMPFER
- **Waffenmeisterung**: Anzahl
- **Kampfstil**: Anzahl

#### MAGIER
- **Zaubertricks**: Anzahl
- **Zauberplätze**: Anzahl pro Grad
- **Vorbereitete Zauber**: Anzahl
- **Magische Wiederherstellung**: Anzahl
- **Arkanes Wissen**: Anzahl

#### MÖNCH
- **Kipunten-Maximum**: Max. Kipunkte
- **Ki-Punkte**: Anzahl pro Level
- **Kampfkunstwürfel**: Größe (W4, W6, W8, W10, W12)

#### PALADIN
- **Zaubertricks**: Anzahl
- **Zauberplätze**: Anzahl pro Grad
- **Vorbereitete Zauber**: Anzahl
- **Kanalisierung der Göttlichkeit**: Anzahl

#### SCHURKE
- **Schurkentricks**: Anzahl

#### WALDLÄUFER
- **Zaubertricks**: Anzahl
- **Zauberplätze**: Anzahl pro Grad
- **Vorbereitete Zauber**: Anzahl
- **Favored Enemy / Natural Explorer**: Variiert

#### ZAUBERER
- **Zaubertricks**: Anzahl
- **Zauberplätze**: Anzahl pro Grad
- **Vorbereitete Zauber**: Anzahl
- **Zauberpunkte**: Anzahl
- **Metamagie**: Anzahl der Optionen

## Vorgehen

### Phase 1: Tabellen-Erstellung für alle Klassen
1. Für jede der 12 Klassen:
   - Tabelle mit Standard-Spalten (Stufe, Übungsbonus, Klassenmerkmale)
   - Klassenspezifische Spalten hinzufügen
   - Tabelle direkt nach "Basis-Daten" einfügen

### Phase 1.5: Klassenbeschreibungen hinzufügen
1. Für jede der 12 Klassen:
   - Klassenbeschreibung aus dem Regelwerk extrahieren
   - Beschreibung zwischen "Progressionstabelle" und "Features nach Level" einfügen
   - Format: `### Klassenbeschreibung` mit Fließtext

### Phase 2: Fehlende Features identifizieren
1. Für jede Klasse Level 1-20 durchgehen:
   - Prüfen ob alle Features aus der Tabelle vorhanden sind
   - Prüfen ob Features den richtigen Levels zugeordnet sind
   - Fehlende Features ergänzen

### Phase 3: Unterklassen-Features prüfen
1. Für jede Unterklasse:
   - Level 3, 6, 10, 14 (und weitere je nach Klasse) prüfen
   - Alle Features des Regelwerks sicherstellen
   - Fehlende Features ergänzen

### Phase 4: Formatierung und Konsistenz
1. Tabellen konsistent formatieren (Markdown-Tabellen)
2. Feature-Listen konsistent strukturieren
3. Alle Referenzen auf Tabellen überprüfen

## Tabellenformat (Markdown)

```markdown
### Progressionstabelle

| Stufe | Übungsbonus | Klassenmerkmale | Klassenspezifisch 1 | Klassenspezifisch 2 |
|-------|-------------|-----------------|---------------------|---------------------|
| 1     | +2          | Feature 1       | Wert 1              | Wert 2              |
| 2     | +2          | Feature 2       | Wert 2              | Wert 2              |
...
```

## Bekannte Probleme aus der Analyse

1. **BARBAR**: Level 6 leer, Level 10 leer, Level 14 leer
2. **BARDE**: Level 6 leer
3. **DRUIDE**: Keine erkennbaren Leer-Levels, aber Tabellen fehlen
4. **HEXENMEISTER**: Duplikate Level 12-20
5. **KLERIKER**: Level 9 Text statt Feature
6. **KÄMPFER**: Möglicherweise fehlende Features
7. **MAGIER**: Duplikate bei verschiedenen Leveln
8. **PALADIN**: Duplikate Level 6
9. **WALDLÄUFER**: Duplikate Level 11-20
10. **ZAUBERER**: Möglicherweise fehlende Features

## Reihenfolge der Bearbeitung

1. BARBAR (einfachste Struktur, viele Leer-Levels)
2. BARDE (Zauberwirken-Tabelle wichtig)
3. DRUIDE (Wilde Gestalt-Tabelle wichtig)
4. KLERIKER (Zauberwirken-Tabelle wichtig)
5. KÄMPFER (einfache Struktur)
6. MÖNCH (Ki-Punkte-Tabelle wichtig)
7. SCHURKE (einfache Struktur)
8. PALADIN (Zauberwirken-Tabelle wichtig)
9. WALDLÄUFER (Zauberwirken-Tabelle wichtig)
10. HEXENMEISTER (Hexpunkte-Tabelle wichtig)
11. MAGIER (Komplexe Zauberwirken-Tabelle)
12. ZAUBERER (Komplexe Zauberpunkte-Tabelle)

## Referenz: Übungsbonus-Progression

| Stufe | Übungsbonus |
|-------|-------------|
| 1-4   | +2          |
| 5-8   | +3          |
| 9-12  | +4          |
| 13-16 | +5          |
| 17-20 | +6          |

## Validierung

Nach jeder Klasse:
- Alle Level 1-20 haben mindestens "Unterklasse" oder ein Feature
- Alle Tabellen-Referenzen im Text haben entsprechende Tabellen
- Alle Features der Tabelle sind im Text beschrieben
- Keine Duplikate oder widersprüchliche Informationen
