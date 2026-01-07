# Weapon Properties Analysis (PHB 2024)

## Overview
Extracted from Chapter 6: Equipment, Section "EIGENSCHAFTEN".

| Eigenschaft (DE) | ID | Beschreibung | Mechanischer Effekt (Formalisiert) |
| :--- | :--- | :--- | :--- |
| Finesse | `finesse` | Wahl zwischen STR/DEX für Angriff & Schaden. | `choice(STR, DEX)` |
| Geschosse | `ammunition` | Erfordert Munition, Reichweite (normal/max). | `requires_ammo`, `range_type` |
| Laden | `loading` | Nur ein Schuss pro Aktion/Bonus/Reaktion. | `limit: 1/action` |
| Leicht | `light` | Ermöglicht Bonus-Angriff mit anderer leichter Waffe. | `bonus_attack_eligible` |
| Reichweite | `range` | Grund- und Maximalreichweite in Metern. | `range: {normal, max}` |
| Schwer | `heavy` | Nachteil bei Angriff ohne Mindestattribut (13). | `min_attr: 13 (STR/DEX)` |
| Vielseitig | `versatile` | Höherer Schaden bei zweihändiger Führung. | `two_handed_dmg: string` |
| Weitreichend | `reach` | Erhöht Reichweite um 1,5 Meter. | `reach_bonus: 1.5m` |
| Wurfwaffe | `thrown` | Kann geworfen werden, nutzt Nahkampf-Modifikator. | `thrown_range: {normal, max}` |
| Zweihändig | `two-handed` | Muss mit zwei Händen geführt werden. | `require_two_hands: true` |

## JSON Design Notes:
- `versatile` will store the damage dice in `data.versatile_damage`.
- `range` and `thrown` will store `normal` and `max` in `data.range`.
- `ammunition` will store `ammunition_type` if specified.






