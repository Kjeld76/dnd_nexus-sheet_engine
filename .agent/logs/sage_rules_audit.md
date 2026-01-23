# Sage Rules Audit: Math & Mechanics

## 2026-01-23 11:15 UTC
**Author:** Sage & Guardian
**Source:** `resources/books/D&D Spielerhandbuch (2024).pdf`
**Tool:** `audit_rules` (Custom RAG extraction)

### 1. Attribute Modifiers
**Verification:**
- **Extracted Rule:** Table "Attributsmodifikatoren" lists values identical to `floor((Score - 10) / 2)`.
    - Score 10-11: +0
    - Score 12-13: +1
    - Score 2-3: -4
    - Score 4-5: -3
- **Code:** `src-tauri/src/core/calculator.rs` uses `(score - 10).div_euclid(2)`.
- **Result:** **MATCH**. The mathematical implementation is compliant with 2024 rules.

### 2. Armor Class (AC)
**Verification:**
- **Extracted Definition:** "Ein Angriffswurf trifft, wenn das Ergebnis mindestens der Rüstungsklasse des Ziels entspricht."
- **Context:** `calculator.rs` implements standard AC calculations:
    - Light: Base + Dex
    - Medium: Base + Dex (Max 2)
    - Heavy: Base (No Dex)
- **Result:** **PLAUSIBLE**. No deviations found in general definitions. Detailed armor formulas assumed standard (verified by `math_registry.md` comparison in previous steps).

### 3. Backend Cleanup
**Action:**
- Removed unused `AppResult` import in `src-tauri/src/commands/rag.rs`.
- Suppressed `dead_code` warnings for `AppError` variants that are reserved for future use.
- **Status:** Compiler warnings reduced.

### Conclusion
The backend mathematics for core attributes and modifiers are **Integre**. The codebase is cleaner and ready for further feature development.
