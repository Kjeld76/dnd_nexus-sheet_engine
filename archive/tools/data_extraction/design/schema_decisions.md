# Database Schema Decisions: Weapons (PHB 2024)

## Design Goal
Balance between SQL query efficiency (for filtering/sorting) and JSON flexibility (for rule-heavy or polymorphic data).

| Field | Location | Type | Reasoning |
| :--- | :--- | :--- | :--- |
| `id` | Top-level | TEXT (PK) | Primary identifier, used for relationships. |
| `name` | Top-level | TEXT | Display name, primary search field. |
| `category` | Top-level | TEXT | "Einfache Waffen" vs "Kriegswaffen". Key filter. |
| `weapon_type` | Top-level | TEXT | "Nahkampf" vs "Fernkampf". Key filter. |
| `damage_dice` | Top-level | TEXT | Essential for damage calculations (e.g., "1W8"). |
| `damage_type` | Top-level | TEXT | Essential for resistance/vulnerability checks (e.g., "Hieb"). |
| `weight_kg` | Top-level | REAL | Used for encumbrance calculations. |
| `cost_gp` | Top-level | REAL | Used for economy calculations (stored in GP equivalent). |
| `data` | JSON | TEXT | Stores all polymorphic and rule-heavy properties. |

## JSON Structure (`data` column)
```json
{
  "properties": ["finesse", "light"],
  "mastery": "sap",
  "range": { "normal": 6, "max": 18 },
  "versatile_damage": "1W10",
  "property_details": { ... },
  "mastery_details": { ... },
  "source_page": 213
}
```

## Lookup Tables
We use separate tables for `weapon_properties` and `weapon_masteries` to allow the UI to show tooltips and details without duplicating large text blocks in every weapon row, although "enrichment" can still embed them for offline performance.






