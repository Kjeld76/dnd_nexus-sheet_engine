# Custom Backgrounds - Datenstruktur

## Überblick

Custom Backgrounds (`custom_backgrounds` Tabelle) verwenden die gleiche Datenstruktur wie Core Backgrounds (`core_backgrounds`). Die `starting_equipment` Items müssen im strukturierten Format gespeichert werden.

## Strukturierte Items Format

Alle Items in `starting_equipment.options[].items` müssen als strukturierte Objekte gespeichert werden:

```typescript
interface StructuredItem {
  name: string;        // Item-Name (z.B. "Pergament", "Buch")
  quantity: number;    // Menge (z.B. 10, 3, 2, 1)
  unit: string | null; // Einheit (z.B. "Blätter", "Flaschen", "Beutel")
  variant: string | null; // Variante/Thema (z.B. "Gebete", "Philosophie")
}
```

## Beispiel: Custom Background erstellen

```json
{
  "id": "custom_bg_001",
  "name": "Mein Custom Background",
  "data": {
    "description": "Beschreibung des Backgrounds...",
    "ability_scores": ["Stärke", "Konstitution"],
    "feat": "Zäh",
    "skills": ["Athletik", "Überleben"],
    "tool": {
      "name": "Schmiedewerkzeug",
      "type": "fixed"
    },
    "starting_equipment": {
      "options": [
        {
          "label": "A",
          "items": [
            {
              "name": "Pergament",
              "quantity": 10,
              "unit": "Blätter",
              "variant": null
            },
            {
              "name": "Buch",
              "quantity": 1,
              "unit": null,
              "variant": "Gebete"
            },
            {
              "name": "Öl",
              "quantity": 3,
              "unit": "Flaschen",
              "variant": null
            },
            {
              "name": "Dolch",
              "quantity": 2,
              "unit": null,
              "variant": null
            }
          ],
          "gold": 15
        },
        {
          "label": "B",
          "items": null,
          "gold": 50
        }
      ]
    }
  },
  "parent_id": null,
  "is_homebrew": true
}
```

## Wichtige Regeln

1. **Keine String-Items mehr**: Items müssen immer als strukturierte Objekte gespeichert werden
2. **Mengenangaben**: Verwende `quantity` für die Anzahl (z.B. `2` für "zwei Dolche")
3. **Einheiten**: Verwende `unit` für Einheiten (z.B. `"Blätter"` für "10 Blätter Pergament")
4. **Varianten**: Verwende `variant` für Themen/Varianten (z.B. `"Gebete"` für "Buch (Gebete)")
5. **Null-Werte**: `unit` und `variant` können `null` sein, wenn nicht vorhanden

## Automatische Optimierung

Das Skript `scripts/optimize-background-equipment.ts` verarbeitet automatisch:
- ✅ `core_backgrounds` 
- ✅ `custom_backgrounds`

Führe es aus, wenn du bestehende Custom Backgrounds aktualisieren musst:

```bash
pnpm exec tsx scripts/optimize-background-equipment.ts
```

## Validierung

Stelle sicher, dass alle Custom Backgrounds die korrekte Struktur haben:

```typescript
// ❌ FALSCH - String-Format
items: ["Pergament (10 Blätter)", "Buch (Gebete)"]

// ✅ RICHTIG - Strukturiertes Format
items: [
  { name: "Pergament", quantity: 10, unit: "Blätter", variant: null },
  { name: "Buch", quantity: 1, unit: null, variant: "Gebete" }
]
```

## Integration in Code

Wenn du Custom Backgrounds programmatisch erstellst, verwende die `parseItemString` Funktion aus `scripts/optimize-background-equipment.ts` oder erstelle die Items direkt im strukturierten Format.
