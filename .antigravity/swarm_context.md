# dnd-nexus: Swarm Memory & Goals

## 🎯 Master Goal
Implementation of a **Decision-Driven Character Editor**. 
The user only makes choices; the system automates all 5e (2024) rules, calculations, and table lookups.

## 🏗️ Technical Stack
- **Framework:** Tauri 2 (Rust Backend)
- **Frontend:** React 19 + TypeScript
- **Database:** SQLite (Three-Layer Architecture: Core, Custom, Unified Views)

## 📋 Rule Implementation Progress
- [x] Base Attribute Modifier Logic (Rust & TS)
- [x] Derived Stats (AC, Encumbrance, Spell DC)
- [x] Progression Table Integration (Proficiency)
- [ ] Spellcasting Automation (Full slots/preparation logic pending)

## 🔐 Sealed Frontend Fields (Read-Only)
The following fields have been verified as "Derived Values" and are locked in the UI (calculated automatically):
- **Attribute Modifiers:** `AttributeBlock.tsx` (Calculated via `math.ts`)
- **Armor Class (RK):** `CombatStats.tsx` (Calculated via `characterLogic.ts`)
- **Initiative:** `CombatStats.tsx` (Calculated via `characterLogic.ts`)
- **Movement Speed:** `CombatStats.tsx` (Calculated via `characterLogic.ts`)
- **Proficiency Bonus:** `CharacterSheetLayout.tsx` (Calculated via `math.ts`)
- **Spell Save DC:** `SpellbookTable.tsx` (Calculated via `characterLogic.ts`)
- **Spell Attack Bonus:** `SpellbookTable.tsx` (Calculated via `characterLogic.ts`)
- **Encumbrance Status:** `EncumbranceBar.tsx` (Aligned with `calculator.rs` metric standards: 7.5x/15.0x)

## ⚠️ Known Constraints
- Respect `migrations/202601201232_performance_indexes.sql`.
- Use the `all_*` views for queries to include Homebrew overrides.

[Architect] Planning Task: Math Audit & Implementation
- **Goal:** Comprehensive audit and hardening of `calculator.rs`.
- **Status:** Completed.

[Guardian] Frontend Sealing
- **Action:** Verified derived inputs are read-only.
- **Fixes:** 
  - Corrected `EncumbranceBar.tsx` to match backend logic.
  - Added Spell DC/Attack Stats.
  - **New:** Implemented consistent `UI_LOCKED_FIELD_CLASS` and `AutomatedHelper` icon (Bot) for all derived fields (Status: "Automatischer Wert basierend auf PHB 2024").
- **Status:** Completed. Visual feedback enabled.

[Guardian] PDF Export Validation
- **Action:** Dry Run & Consistency Check
- **Verification:** Executed `scripts/verify_pdf_math_consistency.ts`.
- **Result:** SUCCESS. `calculateModifier` is mathematically equivalent to the legacy formula for inputs 1-30.
- **Status:** Validated. Code cleanup in `PDFExportService.ts` approved.

[Orchestrator] Last Workflow
- **Date:** 2026-01-23
- **Command:** Seal Frontend & Reactivity Check.
- **Result:** Success.- [2026-01-23 11:06] Task completed: Mathematische Integrität gegen PHB 2024 verifiziert & Backend Cleanup
- [2026-01-23 11:24] Task completed: 
