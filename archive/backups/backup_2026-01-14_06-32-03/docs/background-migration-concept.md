# Konzept: Hintergrund-Migration mit Startausrüstungs-Optionen

## Ziel
Alle Hintergründe aus dem PHB 2024 mit vollständigen Daten extrahieren und in die Datenbank migrieren, inklusive:
- Beschreibungen
- Fertigkeiten (Skills)
- Werkzeuge (Tools)
- Talente (Feats)
- **Startausrüstung mit Optionen A und B**

## Datenstruktur

### Zielstruktur in `data` JSON:
```json
{
  "description": "Vollständige Beschreibung des Hintergrunds...",
  "ability_scores": ["Stärke", "Konstitution", "Weisheit"],
  "feat": "Zäh",
  "skills": ["Mit Tieren umgehen", "Naturkunde"],
  "tool": "Schreinerwerkzeug",
  "starting_equipment": {
    "options": [
      {
        "label": "A",
        "items": ["Schreinerwerkzeug", "Sichel", "Heilerausrüstung", "Eisenkessel", "Schaufel", "Reisekleidung"],
        "gold": null
      },
      {
        "label": "B",
        "items": ["Schreinerwerkzeug"],
        "gold": 50
      }
    ]
  },
  "feature": {
    "name": "Zäh",
    "description": "Vollständige Feature-Beschreibung..."
  }
}
```

## Extraktions-Strategie

### 1. Text-Parsing aus DOCX
- Kapitel 4: Charakterherkunft identifizieren
- Jeden Hintergrund als separaten Abschnitt erkennen
- Strukturierte Daten extrahieren

### 2. Erkennungs-Patterns

#### Hintergrund-Name
- Große Überschrift (z.B. "BAUER", "AKOLYTH")
- Nach "EINEN HINTERGRUND WÄHLEN" und vor nächstem Hintergrund

#### Beschreibung
- Text zwischen Hintergrund-Name und "Fertigkeiten"
- Kann mehrere Absätze umfassen

#### Fertigkeiten
- Pattern: `Fertigkeiten: [Skill1], [Skill2]`
- Oder: `Fertigkeiten` in Zeile, nächste Zeile enthält Skills

#### Werkzeug
- Pattern: `Werkzeug: [Tool-Name]`
- Oder: `Werkzeugproficiency: [Tool-Name]`

#### Talent (Feat)
- Pattern: `Talent: [Feat-Name]`
- Oder: `Herkunftstalent: [Feat-Name]`

#### Startausrüstung mit Optionen
- Pattern: `Startausrüstung:`
- Dann entweder:
  - `(a) [Item1], [Item2], ...` → Option A
  - `(b) [Gold] GM` → Option B
- Oder:
  - `Option A: [Item1], [Item2], ...`
  - `Option B: [Gold] GM`

### 3. Item-Name-Normalisierung
- Deutsche Namen aus Regelwerk verwenden
- Mapping zu Item/Tool-IDs im Compendium
- Fallback: Als Text-Item speichern, wenn nicht gefunden

## Migrations-Phasen

### Phase 1: Extraktion
1. DOCX → Text konvertieren
2. Hintergründe identifizieren und parsen
3. Strukturierte JSON-Daten generieren
4. Validierung: Alle Pflichtfelder vorhanden?

### Phase 2: Datenbereinigung
1. Item-Namen normalisieren
2. Referenzen zu Items/Tools auflösen
3. Fehlende Daten identifizieren
4. Manuelle Korrekturen (falls nötig)

### Phase 3: Datenbank-Migration
1. Bestehende Hintergrund-Daten lesen
2. Neue Struktur anwenden
3. `starting_equipment.options` hinzufügen
4. Legacy-Felder (`gold`, `equipment_id`) entfernen oder als Fallback behalten
5. Validierung: Alle Hintergründe migriert?

### Phase 4: Validierung
1. Alle Hintergründe haben `starting_equipment.options`?
2. Alle Item-Referenzen aufgelöst?
3. Alle Pflichtfelder vorhanden?
4. Test: Hintergrund auswählen → Optionen werden angezeigt?

## Bekannte Hintergründe (PHB 2024)

1. Akolyth
2. Adeliger
3. Ausgewanderter
4. Bauer
5. Einsiedler
6. Gelehrter
7. Handwerker
8. Künstler
9. Krieger
10. Kundschafter
11. Nomade
12. Soldat
13. Wächter
14. (weitere...)

## Herausforderungen

### 1. Optionen-Erkennung
- Verschiedene Formate im Regelwerk
- Manche Hintergründe haben nur eine Option
- Manche haben mehr als zwei Optionen

### 2. Item-Referenzen
- Deutsche Namen müssen zu Item-IDs gemappt werden
- Equipment-Pakete müssen aufgelöst werden
- Fallback für nicht gefundene Items

### 3. Werkzeug-Handling
- Werkzeug wird immer hinzugefügt (unabhängig von Option)
- Muss in Option A enthalten sein, aber nicht in Option B (nur Gold)

## Skripte

### 1. `scripts/extract-backgrounds-complete.ts`
- Extrahiert alle Hintergrund-Daten aus DOCX
- Erkennt Optionen A und B
- Generiert JSON-Output

### 2. `scripts/migrate-backgrounds.ts`
- Liest extrahierte JSON-Daten
- Aktualisiert Datenbank-Einträge
- Konvertiert Legacy-Struktur zu neuer Struktur

### 3. `scripts/validate-backgrounds.ts`
- Validiert alle Hintergrund-Daten
- Prüft Referenzen
- Generiert Validierungs-Report
