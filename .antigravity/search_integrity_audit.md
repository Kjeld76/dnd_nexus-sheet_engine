# SAS v3.1 Search Integrity Audit

## Root Cause Analysis
- **Duplicates**: The `all_compendium_search` view used `UNION ALL` across multiple tables (`core_items`, `core_gear`, etc.) which, combined with overlapping data sources or identical entity names, caused duplicates.
- **Race Conditions**: The frontend lacked request cancellation logic. Rapid typing sent multiple `invoke` calls; if a previous slow request finished after a newer fast request, it overwrote the results with stale data.
- **Precision**: Search used simple substring matching without ranking, leading to "Seil" being hidden behind "Seile" or unrelated items.

## Technical Solution

### 1. Database (DIO)
- Refactored `all_compendium_search` to use `UNION` instead of `UNION ALL`.
- Implemented **ID Prefixing Strategy** (`GEAR-`, `ITEM-`, `WEAP-`, etc.) to guarantee unique IDs across the unioned set.
- Added strict `WHERE source = 'core'` filtering to separate Core vs Custom items.

### 2. Backend (Rust)
- Implemented **Relevance Ranking**:
    1. Exact Match (`=`)
    2. Prefix Match (`LIKE 'term%'`)
    3. Contains (`LIKE '%term%'`)
- Used `prepare_cached` (via `conn.prepare` for now, optimized query) logic.

### 3. Frontend (React)
- **RequestId Pattern**: Implemented `searchRequestId.current` to ignore stale responses.
- **Optimistic Clearing**: `setSearchResults([])` happens immediately on input change.
- **Debouncing**: Added 300ms debounce to reduce server load.
- **Prefix Stripping**: `handleAddItem` strips the `GEAR-` prefix before sending the ID to the backend, ensuring compatibility with existing logic.

## Verification
- **Rust Compilation**: Passed.
- **TypeScript Check**: Passed.
- **Manual Verification**: (Pending User Confirmation).
