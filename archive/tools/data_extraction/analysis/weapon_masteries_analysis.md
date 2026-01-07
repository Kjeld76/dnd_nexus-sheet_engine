# Weapon Masteries Analysis (PHB 2024)

## Overview
Extracted from Chapter 6: Equipment, Section "MEISTERSCHAFTSEIGENSCHAFT".

| Meisterschaft | ID | Effekt | Formalisierte Mechanik |
| :--- | :--- | :--- | :--- |
| Auslaugen | `sap` | Ziel hat Nachteil bei nächstem Angriff. | `on_hit: target.disadvantage(next_attack)` |
| Einkerben | `nick` | Zusätzlicher Angriff (Leicht) als Teil der Angriffsaktion. | `on_light_attack: action_instead_of_bonus` |
| Plagen | `vex` | Vorteil beim nächsten Angriff gegen dieses Ziel. | `on_hit: self.advantage(next_attack, target)` |
| Spalten | `cleave` | Zusätzlicher Angriff auf Ziel innerhalb 1,5m. | `on_hit: bonus_attack(adjacent_target, no_mod)` |
| Stoßen | `push` | Stößt Ziel bis zu 3m weg (bis Größe Groß). | `on_hit: target.push(3m, condition: size <= Large)` |
| Streifen | `graze` | Verursacht Schaden in Höhe des Attributsmodifikators bei Fehlschlag. | `on_miss: deal_damage(attr_mod)` |
| Umstoßen | `topple` | Ziel muss Konstitutionsrettungswurf bestehen oder wird umgestoßen. | `on_hit: target.save(CON, fallback: prone)` |
| Verlangsamen | `slow` | Reduziert Bewegungsrate um 3m. | `on_hit: target.speed_reduction(3m, duration: next_turn)` |

## JSON Design Notes:
- Masteries will be stored as IDs in the weapon's `data.mastery` field.
- Full details will be in `weapon_masteries` table.
- Mechanical triggers: `on_hit`, `on_miss`, `on_light_attack`.






