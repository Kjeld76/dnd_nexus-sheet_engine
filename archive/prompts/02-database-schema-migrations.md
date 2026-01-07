# Prompt 2: Database Schema & Migrations

```
Implement SQLite database layer in src-tauri/src/db/:

1. Create db/mod.rs:
   - Database struct with Mutex<Connection>
   - init_database() function
   - Migration runner

2. Create db/migrations.rs with schema:
   - core_spells table (id, name, level, school, data, timestamps)
   - custom_spells table (id, name, level, school, data, parent_id, is_homebrew, timestamps)
   - core_species table
   - custom_species table
   - core_classes table
   - custom_classes table
   - characters table (id, data, timestamps)
   - Indexes: level, name (NOCASE), parent_id
   - Views: all_spells, all_species, all_classes (combine core + custom with override logic)

3. Create db/queries.rs with prepared statement helpers

4. Add migration execution in main.rs setup
```






