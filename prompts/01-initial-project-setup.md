# Prompt 1: Initial Project Setup

```
Create Tauri 2.0 project structure for D&D Nexus:

1. Initialize Tauri project with React + TypeScript
2. Setup folder structure as defined in .cursorrules
3. Configure Cargo.toml with dependencies:
   - tauri 2.0
   - serde, serde_json
   - rusqlite (bundled feature)
   - uuid (v4, serde)
4. Configure package.json with dependencies:
   - react 19, react-dom
   - zustand
   - @tauri-apps/api
   - tailwind CSS
   - lucide-react
5. Setup tailwind.config.js
6. Configure tauri.conf.json:
   - productName: "D&D Nexus"
   - identifier: "com.dndnexus.app"
   - window: 1400x900, minWidth: 1200, minHeight: 800
7. Create src-tauri/src/main.rs with:
   - Database initialization
   - App data directory setup
   - Basic greet command
8. Create src/main.tsx with basic React setup
9. Add .cursorrules file to project root
```




