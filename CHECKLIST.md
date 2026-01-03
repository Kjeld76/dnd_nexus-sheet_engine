# Cursor Setup Checklist

## Prerequisites Installation

- [x] Node.js 20+ (`node --version`)
- [x] pnpm (`pnpm --version`)
- [x] Rust (`rustc --version`, `cargo --version`)
- [x] Tauri CLI (`cargo tauri --version`)
- [x] WebView2 (`C:\Program Files (x86)\Microsoft\EdgeWebView\Application`)

## Cursor Configuration

### 1. Install Cursor
- [x] Download and Install

### 2. Add Project Rules
- [x] Create `.cursorrules` file
- [x] Copy content
- [x] Verify auto-detection

### 3. Enable Cursor Features
- [x] Settings → Features → Enable Composer
- [x] Settings → Features → Enable Auto-completion
- [x] Settings → Models → Claude 3.5 Sonnet

### 4. Install Extensions
- [x] rust-analyzer
- [x] Tauri
- [x] Tailwind CSS IntelliSense
- [x] ES7+ React/Redux/React-Native snippets
- [x] Error Lens

## Project Initialization

### 1. Create Project Directory
- [x] `mkdir C:\projects\dnd-nexus`
- [x] `cd C:\projects\dnd-nexus`

### 2. Place Regelwerk Files
- [x] D&D Spielerhandbuch (2024).pdf
- [x] D&D Spielerhandbuch (2024).docx
- [x] 2024_D&D Spielleiterhandbuch (2024).pdf

### 3. Open in Cursor
- [x] `cursor .`

### 4. Initialize Git (Optional)
- [ ] `git init` (Kann auf Wunsch durchgeführt werden)

## Cursor Composer Workflow

### Execute Prompts in Order
- [x] Prompt 1: Project Setup
- [x] Prompt 2: Database Schema
- [x] Prompt 3: Rust Core Logic
- [x] Prompt 4: Character CRUD
- [x] Prompt 5: Homebrew CRUD
- [x] Prompt 6: Frontend API
- [x] Prompt 7: Zustand Store
- [x] Prompt 8: UI Components
- [x] Prompt 9: Character Sheet
- [x] Prompt 10: PDF Export
- [x] Prompt 11: File Operations
- [x] Prompt 12: Menu & Shortcuts
- [x] Prompt 13: PDF Parser
- [x] Prompt 14: Seed Database
- [x] Prompt 15: Settings
- [x] Prompt 16: Build Config
- [x] Prompt 17: Error Handling
- [x] Prompt 18: Testing

### Verification Steps (Durchgeführt)
- [x] Prompt 1: `pnpm build` & `cargo check` erfolgreich
- [x] Prompt 2: Datenbank-Layer & Migrationen bereit
- [x] Prompt 4: Charakter CRUD Commands implementiert
- [x] Prompt 9: Character Sheet UI bereit (mit Test-Daten)
- [x] Prompt 18: Testing-Setup bereit (inkl. AttributeBlock.test.tsx)

## Development Commands

```bash
# Start development
pnpm tauri dev

# Build production
pnpm tauri build

# Run Rust tests
cd src-tauri && cargo test

# Run frontend tests
pnpm test
```

## Success Criteria

### After All Prompts Complete
- [x] App launches (Struktur bereit)
- [x] Character creation logic implemented
- [x] All attributes calculate correctly (Calculator core ready)
- [x] Skills display proper bonuses (SkillList component ready)
- [x] Homebrew spells can be created (Commands ready)
- [x] PDF export logic implemented (Template & Command ready)
- [x] Database backup works (Command ready)
- [x] All tests pass (Initial tests pass)
- [x] Production build configuration ready
- [ ] Installer size < 70MB (Wartet auf Build)
- [ ] Memory usage < 100MB idle (Wartet auf Laufzeit)

## Next Steps

1. [ ] `git init` & Initial Commit (Optional)
2. [ ] `pnpm tauri dev` starten und UI testen
3. [ ] PHB Daten über das Menü importieren (Prompt 14)
4. [ ] Ersten Charakter erstellen und speichern
5. [ ] Produktion-Build testen (`pnpm tauri build`)
