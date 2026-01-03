# Prompt 14: Seed Database

```
Create database seeding in src-tauri/src/db/seed.rs:

1. seed_core_data(conn: &Connection) -> Result<(), String>
   - Read parsed JSON files from tools/output/
   - Insert spells into core_spells
   - Insert species into core_species
   - Insert classes into core_classes
   - Use transactions for atomicity

2. clear_core_data(conn: &Connection) -> Result<(), String>
   - Delete all from core tables
   - Preserve custom tables

3. Add Tauri command: import_phb_data() -> Result<(), String>
   - Call seed_core_data
   - Return success/error

4. Create initial seed files in tools/output/:
   - spells.json (structure from parser)
   - species.json
   - classes.json

5. Run seed on first app launch or on user request
```



