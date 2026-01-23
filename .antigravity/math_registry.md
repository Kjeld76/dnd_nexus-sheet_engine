# Math Registry & Audit Report

## summary
This document registers all mathematical formulas found in `src-tauri` (Rust) and `src/lib/` (TypeScript) related to core D&D mechanics. It serves as a single source of truth for the Guardian agent to verify compliance with D&D 5e (2024) rules.

## Rust (Backend)
**Location:** `src-tauri/src/core/calculator.rs`

### 1. Attribute Modifier
- **Formula:** `(score - 10).div_euclid(2)`
- **Rule Compliance:** GREEN. Correctly handles negative numbers (floor division).
- **Test Coverage:** Exhaustive (1-30).

### 2. Proficiency Bonus
- **Formula:** `match level { 1..=4 => 2, ..., 29..=30 => 9, _ => ... }`
- **Rule Compliance:** GREEN. Supports levels up to 30.
- **Test Coverage:** Exhaustive (1-30).

### 3. Armor Class
- **Formula:** `base + shield + dex_limit`
  - Medium Armor: `dex_mod.min(2)`
  - Heavy Armor: `0` (ignores Dex)
- **Rule Compliance:** GREEN.
- **Test Coverage:** Standard cases (Light, Medium, Heavy, Shields, Negative Dex).

### 4. Spell Save DC
- **Formula:** `8 + prof_bonus + attr_mod`
- **Rule Compliance:** GREEN.
- **Test Coverage:** Unit tests with various combinations.

### 5. Encumbrance (Metric Project Standard)
- **Formula:** 
  - `Capacity = Str * 7.5`
  - `Max Lift = Str * 15.0`
  - `Encumbered` if > Capacity
  - `HeavilyEncumbered` if > Max Lift
- **Rule Compliance:** GREEN (Internal Metric Standard). Matches project `units.rs` constants.
- **Test Coverage:** Exhaustive (1-30) for scaling; threshold checks.

## TypeScript (Frontend)
**Location:** `src/lib/math.ts`

### 1. Attribute Modifier
- **Formula:** `Math.floor((score - 10) / 2)`
- **Rule Compliance:** GREEN.
- **Test Coverage:** Unit tests exist.

### 2. Proficiency Bonus
- **Formula:** `if (level >= 29) return 9; ...`
- **Rule Compliance:** GREEN.

## Discrepancies
- **Resolved:** Rust backend now supports levels > 20 for proficiency, matching Frontend.
- **Code Duplication:** `PDFExportService.ts` still manually calculates modifiers. (Frontend task).

## Action Plan
1. [x] Fix Rust `calculate_proficiency_bonus`.
2. [ ] Refactor `PDFExportService.ts` to use `calculateModifier` (Frontend).
3. [x] Implement exhaustive Rust tests in `src-tauri/src/core/calculator.rs`.
4. [x] Implement Spell Save DC in Rust.
