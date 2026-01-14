# Konzept: Hintergrund-Startausrüstung mit Optionen

## Problem
Hintergründe haben normalerweise zwei Optionen für die Startausrüstung:
- **Option A**: Bestimmte Ausrüstungsgegenstände (z.B. "Sichel, Heilerausrüstung, Eisenkessel, Schaufel, Reisekleidung")
- **Option B**: Nur Gold (z.B. "50 GM")

Die aktuelle Datenbank-Struktur unterstützt dies nicht.

## Datenstruktur

### Aktuelle Struktur (unvollständig):
```json
{
  "equipment_id": null,
  "gold": 50
}
```

### Vorgeschlagene Struktur:
```json
{
  "starting_equipment": {
    "option_a": {
      "items": ["Sichel", "Heilerausrüstung", "Eisenkessel", "Schaufel", "Reisekleidung"],
      "gold": null
    },
    "option_b": {
      "items": null,
      "gold": 50
    }
  }
}
```

Oder alternativ (kompakter):
```json
{
  "starting_equipment": {
    "options": [
      {
        "label": "A",
        "items": ["Sichel", "Heilerausrüstung", "Eisenkessel", "Schaufel", "Reisekleidung"],
        "gold": null
      },
      {
        "label": "B",
        "items": null,
        "gold": 50
      }
    ]
  }
}
```

## Frontend-Implementierung

### Dialog für Ausrüstungsauswahl
Wenn ein Hintergrund gesetzt wird und `starting_equipment.options` vorhanden ist:
1. Dialog anzeigen mit beiden Optionen
2. Spieler wählt Option A oder B
3. Gewählte Option wird ins Inventar übernommen
4. Auswahl wird in `character.meta.background_equipment_choice` gespeichert (z.B. "a" oder "b")

### Fallback
Wenn keine Optionen vorhanden sind (Legacy-Daten):
- Wenn `gold` vorhanden: Gold hinzufügen
- Wenn `equipment_id` vorhanden: Equipment-Paket hinzufügen

## Migration

### Bestehende Daten aktualisieren
Für Hintergründe mit nur `gold`:
- Konvertiere zu `starting_equipment.options[0]` mit `gold` und `items: null`

Für Hintergründe mit `equipment_id`:
- Konvertiere zu `starting_equipment.options[0]` mit Equipment-Paket

## Beispiel: Bauer

**Aktuell:**
```json
{
  "equipment_id": null,
  "gold": 50
}
```

**Sollte sein:**
```json
{
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
  }
}
```

**Hinweis:** Das Werkzeug (Schreinerwerkzeug) wird immer hinzugefügt, unabhängig von der Option.
