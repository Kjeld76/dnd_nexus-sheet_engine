# Database Normalization Audit Report
Date: 2026-01-26

## Executive Summary
- Columns Analyzed: 37 (violations found)
- Recommendation: IMPACT ANALYSIS REQUIRED

## Detailed Violations

| Table | Column | Type | Total Rows | JSON Rows | CSV/List Rows | Priority |
|-------|--------|------|------------|-----------|---------------|----------|
| armor_property_mappings | parameter_value | TEXT | 3 | 3 | 0 | HIGH |
| character_inventory | data | JSON | 10 | 4 | 0 | HIGH |
| characters | data | TEXT | 3 | 3 | 3 | HIGH |
| core_armor_property_mappings | parameter_value | TEXT | 3 | 3 | 0 | HIGH |
| core_backgrounds | data | TEXT | 16 | 16 | 16 | HIGH |
| core_class_features | description | TEXT | 272 | 0 | 206 | MEDIUM |
| core_equipment | data | JSON | 7 | 7 | 0 | HIGH |
| core_feats | data | JSON | 75 | 75 | 75 | HIGH |
| core_feature_options | option_description | TEXT | 13 | 0 | 11 | MEDIUM |
| core_gear | data | JSON | 68 | 68 | 0 | HIGH |
| core_gear | description | TEXT | 65 | 0 | 47 | MEDIUM |
| core_gear | name | TEXT | 68 | 0 | 4 | MEDIUM |
| core_items | data | JSON | 85 | 85 | 0 | HIGH |
| core_items | description | TEXT | 83 | 0 | 56 | MEDIUM |
| core_items | name | TEXT | 85 | 0 | 4 | MEDIUM |
| core_mag_items_base | data | JSON | 240 | 240 | 240 | HIGH |
| core_mag_items_base | facts_json | TEXT | 240 | 240 | 240 | HIGH |
| core_progression_tables | class_specific_data | JSON | 240 | 240 | 200 | HIGH |
| core_progression_tables | feature_names | TEXT | 240 | 240 | 28 | HIGH |
| core_skills | description | TEXT | 18 | 0 | 14 | MEDIUM |
| core_spells | casting_time | TEXT | 308 | 0 | 8 | MEDIUM |
| core_spells | components | TEXT | 300 | 0 | 270 | MEDIUM |
| core_spells | description | TEXT | 308 | 0 | 296 | MEDIUM |
| core_spells | duration | TEXT | 300 | 0 | 122 | MEDIUM |
| core_spells | higher_levels | TEXT | 141 | 0 | 55 | MEDIUM |
| core_spells | name | TEXT | 308 | 0 | 1 | MEDIUM |
| core_spells | range | TEXT | 300 | 0 | 4 | MEDIUM |
| core_tools | data | JSON | 28 | 28 | 23 | HIGH |
| core_weapon_property_mappings | parameter_value | TEXT | 21 | 7 | 7 | HIGH |
| core_weapons | data | JSON | 41 | 41 | 0 | HIGH |
| custom_mag_items_base | data | JSON | 2 | 2 | 2 | HIGH |
| custom_mag_items_base | facts_json | TEXT | 2 | 2 | 2 | HIGH |
| weapon_masteries | data | TEXT | 8 | 8 | 8 | HIGH |
| weapon_masteries | description | TEXT | 16 | 0 | 16 | MEDIUM |
| weapon_properties | data | TEXT | 9 | 9 | 3 | HIGH |
| weapon_properties | description | TEXT | 21 | 0 | 17 | MEDIUM |
| weapon_property_mappings | parameter_value | TEXT | 14 | 14 | 7 | HIGH |
