# Prompt 3: Rust Core Logic

```
Implement D&D 5e 2024 calculation engine in src-tauri/src/core/:

1. Create core/types.rs:
   - Character struct (Serialize, Deserialize, Clone)
   - Attributes struct (str, dex, con, int, wis, cha)
   - Modifier struct (id, source, target, type, value)
   - ModifierType enum (Override, Add, Multiply)

2. Create core/calculator.rs:
   - calculate_attribute_modifier(score: i32) -> i32
   - calculate_proficiency_bonus(level: i32) -> i32
   - calculate_skill_bonus(attr_mod, prof_bonus, is_proficient, has_expertise) -> i32
   - calculate_armor_class(base_ac, dex_mod, armor_type, shield_bonus) -> i32
   - calculate_encumbrance(str_score: i32) -> (i32, i32)

3. Create core/modifiers.rs:
   - apply_modifiers(base: i32, modifiers: &[Modifier]) -> i32
   - Sort by priority: Override → Add → Multiply
   - Unit tests for all functions

4. Create core/units.rs:
   - convert_to_metric(value: f32, unit: &str) -> f32
   - Support: ft → m, lbs → kg
```






