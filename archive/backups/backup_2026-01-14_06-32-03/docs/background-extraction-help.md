# Hilfe bei der Hintergrund-Extraktion

## Problem
Die Hintergrund-Namen sind in Grafiken eingebettet und können nicht automatisch erkannt werden. Wir brauchen deine Hilfe, um alle 16 Hintergründe korrekt zuzuordnen.

## So kannst du helfen

### Schritt 1: Analysiere die extrahierten Daten
```bash
pnpm analyze:backgrounds
```

Dies zeigt dir alle gefundenen Hintergründe mit ihren Merkmalen.

### Schritt 2: Öffne das Buch (PHB 2024, Seiten 178-185)
Vergleiche die extrahierten Daten mit den Hintergründen im Buch.

### Schritt 3: Korrigiere die Zuordnungen
Öffne `scripts/background-name-corrections.json` und trage die korrekten Namen ein.

**Beispiel:**
```json
{
  "corrections": {
    "Konstitution,Stärke,Weisheit|Zäh|Mit Tieren umgehen": "Bauer",
    "Charisma,Konstitution,Weisheit|Heiler|Heilkunde": "Einsiedler",
    "Geschicklichkeit,Intelligenz,Konstitution|Wachsam|Fingerfertigkeit": "Krimineller"
  }
}
```

### Schritt 4: Wende Korrekturen an
```bash
pnpm correct:backgrounds
```

### Schritt 5: Prüfe das Ergebnis
```bash
pnpm analyze:backgrounds
```

Alle Hintergründe sollten jetzt korrekt benannt sein.

## Aktueller Stand

**Gefunden (9):**
- ✅ Adeliger
- ✅ Bauer (falsch als "ADELIGER" erkannt - muss korrigiert werden)
- ✅ Händler (4x - Duplikate)
- ✅ Handwerker (2x - Duplikate)

**Fehlend (7):**
- ❌ Akolyth
- ❌ Einsiedler (falsch als "BAUER" erkannt - muss korrigiert werden)
- ❌ Krimineller (falsch als "HÄNDLER" erkannt - muss korrigiert werden)
- ❌ Reisender
- ❌ Scharlatan
- ❌ Schreiber
- ❌ Seemann
- ❌ Soldat
- ❌ Unterhaltungskünstler
- ❌ Wache
- ❌ Wegfinder
- ❌ Weiser

## Zuordnungshilfe

Für jeden Hintergrund im Buch (Seiten 178-185):

1. **Notiere die Attributswerte** (z.B. "Stärke, Intelligenz, Charisma")
2. **Notiere das Talent** (z.B. "Begabt")
3. **Notiere die erste Fertigkeit** (z.B. "Geschichte")
4. **Erstelle den Lookup-Key**: `Attribut1,Attribut2,Attribut3|Talent|ErsteFertigkeit`
5. **Trage in `background-name-corrections.json` ein**

## Beispiel: Bauer

**Im Buch steht:**
- Attributswerte: Stärke, Konstitution, Weisheit
- Talent: Zäh
- Fertigkeiten: Mit Tieren umgehen, Naturkunde
- Werkzeug: Schreinerwerkzeug
- Option A: Schreinerwerkzeug, Sichel, Heilerausrüstung, Eisenkessel, Schaufel, Reisekleidung
- Option B: Schreinerwerkzeug + 50 GM

**Lookup-Key:**
```
Konstitution,Stärke,Weisheit|Zäh|Mit Tieren umgehen
```

**Eintrag in corrections.json:**
```json
"Konstitution,Stärke,Weisheit|Zäh|Mit Tieren umgehen": "Bauer"
```

## Tipp

Falls ein Hintergrund nicht gefunden wird, könnte es sein, dass:
1. Die Attributswerte in einer anderen Reihenfolge extrahiert wurden (werden automatisch sortiert)
2. Die erste Fertigkeit anders geschrieben ist
3. Der Hintergrund noch nicht extrahiert wurde (dann muss die Extraktion verbessert werden)

In diesem Fall: Erstelle einen Issue oder teile die Daten mit mir!
