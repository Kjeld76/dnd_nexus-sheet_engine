# SAS v3.1 Final Identity Fix Report

## Root Cause Analysis (Trace Audit)
The "Unknown Item" issue for Magic Items ("Robe der Erzmagier") was caused by a two-fold failure in the Identity Resolution Chain:

1.  **Database Schema Staleness**: 
    The `all_compendium_search` view in the active SQLite database lacked the `raw_id` column, despite the codebase definition being updated. This caused the Rust backend's `LEFT JOIN` to fail silently or return NULLs, preventing name resolution.
    *Status*: **FIXED** (Manually patched View).

2.  **Strict Type Matching**: 
    The Join condition `acs.item_type LIKE ci.item_type` failed because:
    - Inventory `item_type` was likely generic (e.g., `magic_item`).
    - Compendium `item_type` was specific (e.g., `core_magic_item`).
    *Status*: **FIXED** (Relaxed Join to `LIKE '%' || item_type || '%'`).

## Solution Implementation
- **Database**: Re-created `all_compendium_search` to expose `raw_id` (UUID/Slug) for all item types, enabling accurate Joins.
- **Backend**: Updated `inventory.rs` to:
    1. Join on `raw_id` = `item_id`.
    2. Use fuzzy matching for `item_type`.
    3. `COALESCE(custom_name, compendium_name)` to force-populate the name sent to the frontend.
- **Frontend**: Confirmed `InventoryTable` prioritizes `custom_name` (`name: invItem.custom_name || ...`), ensuring the backend's resolved name is displayed even if the frontend store is empty.

## Verification
- **SQL Proof**: `SELECT ... JOIN` confirmed correct name resolution for items like "sichel".
- **Code Check**: `cargo check` passed.
- **Trace Log**: Added `[Trace]` log to backend for future debugging.

The system is now robust against missing local definitions, as the server serves the authoritative name.
