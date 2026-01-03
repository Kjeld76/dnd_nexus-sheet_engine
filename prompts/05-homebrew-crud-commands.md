# Prompt 5: Homebrew CRUD Commands

```
Implement Homebrew Tauri commands in src-tauri/src/commands/homebrew.rs:

1. CustomSpell struct (id, name, level, school, data, parent_spell_id)

2. create_custom_spell(db: State<Database>, spell: CustomSpell) -> Result<CustomSpell, String>
   - Generate UUID if id is None
   - Insert into custom_spells
   - Set is_homebrew based on parent_spell_id

3. update_custom_spell(db: State<Database>, id: String, spell: CustomSpell) -> Result<(), String>

4. delete_custom_spell(db: State<Database>, id: String) -> Result<(), String>

5. get_all_spells(db: State<Database>) -> Result<Vec<Spell>, String>
   - Query all_spells view
   - Include source field (core/override/homebrew)

6. restore_core_spell(db: State<Database>, spell_id: String) -> Result<(), String>
   - Delete custom_spell where parent_spell_id = spell_id

7. Register commands in main.rs
```




