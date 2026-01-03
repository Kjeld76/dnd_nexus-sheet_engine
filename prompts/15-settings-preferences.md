# Prompt 15: Settings & Preferences

```
Create Settings screen in src/screens/Settings.tsx:

1. Settings categories:
   - Appearance: Theme, Font size
   - Units: Metric toggle
   - Database: Backup location, Import/Export
   - About: Version, Credits, License

2. Store settings in SQLite:
   - CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT)

3. Tauri commands:
   - get_setting(key: String) -> Result<String, String>
   - set_setting(key: String, value: String) -> Result<(), String>

4. React state management:
   - useSettings hook
   - Auto-save on change
   - Debounce updates (300ms)

5. Add Settings menu item and route
```



