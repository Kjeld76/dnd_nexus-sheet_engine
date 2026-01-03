# Prompt 4: Character CRUD Commands

```
Implement Character Tauri commands in src-tauri/src/commands/character.rs:

1. create_character(db: State<Database>, character: Character) -> Result<Character, String>
   - Insert into characters table
   - Return created character

2. get_character(db: State<Database>, id: String) -> Result<Character, String>
   - Query by id
   - Parse JSON data
   - Return character or error

3. update_character(db: State<Database>, id: String, character: Character) -> Result<(), String>
   - Update data column
   - Update updated_at timestamp

4. delete_character(db: State<Database>, id: String) -> Result<(), String>
   - Delete by id

5. list_characters(db: State<Database>) -> Result<Vec<Character>, String>
   - Query all characters
   - Order by updated_at DESC
   - Return list

6. Register all commands in main.rs invoke_handler
```



