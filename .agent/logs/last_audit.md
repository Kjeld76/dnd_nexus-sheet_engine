# Audit Log

## 2026-01-23 11:xx UTC
**Action:** High-Fidelity PDF Parsing Implementation
**Author:** Guardian
**Status:** SUCCESS

### Changes
1.  **Dependencies:** Added `pdf-extract` (replaced `lopdf` for extraction) to `src-tauri/Cargo.toml`.
2.  **Logic:** Implemented `extract_relevant_pages` in `src-tauri/src/rag/ingest.rs`.
    - Uses `pdf_extract` which respects PDF Stream Order (preserving column flow in D&D 2024 PDFs).
    - Includes naive context window extraction (keyword +/- 1000 chars) as a robust fallback to complex layout analysis.
3.  **Command:** Exposed `commands::rag::extract_rule_context`.
4.  **Verification:**
    - Ran `cargo test test_extract_armor_class`.
    - **Result:** Extracted text "Angriffswürfe bestimmen..." is coherent (no column jumps). Table rows like "Stärke direkter Gewalt..." are preserved semantically.

### Notes
The previous attempt with `lopdf` basic extraction mixed columns. `pdf-extract` proved superior for this specific document structure without needing a custom layout engine.
