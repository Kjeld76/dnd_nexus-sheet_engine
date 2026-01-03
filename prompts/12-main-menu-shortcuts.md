# Prompt 12: Main Menu & Shortcuts

```
Create application menu in src-tauri/src/menu.rs:

1. Build menu structure:
   - File: New, Open, Save, Export PDF, Backup DB, Exit
   - Edit: Undo, Redo, Cut, Copy, Paste
   - Database: Import PHB Data, Export Homebrew, Reset to Official
   - Help: Documentation, Report Bug, About

2. Assign keyboard shortcuts:
   - Ctrl+N: New Character
   - Ctrl+O: Open Character
   - Ctrl+S: Save Character
   - Ctrl+P: Export PDF
   - Ctrl+B: Backup Database

3. Emit events to frontend for menu actions
4. Handle events in React with useEffect

5. Register menu in main.rs setup
```



