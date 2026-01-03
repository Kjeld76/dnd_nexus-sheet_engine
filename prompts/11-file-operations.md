# Prompt 11: File Operations

```
Implement file operations in src-tauri/src/commands/files.rs:

1. backup_database(app: AppHandle) -> Result<String, String>
   - Get database path from app data dir
   - Show save dialog
   - Copy database file to selected location
   - Return backup path

2. import_character(app: AppHandle) -> Result<Character, String>
   - Show open dialog (filter: .json)
   - Read file content
   - Parse JSON to Character
   - Validate structure
   - Return character (don't save yet)

3. export_character(character: Character) -> Result<String, String>
   - Show save dialog
   - Serialize character to JSON
   - Write to file
   - Return file path

4. Register commands and add to File menu
```




