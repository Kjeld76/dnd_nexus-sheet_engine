use serde::Serialize;
use rusqlite::Connection;

#[derive(Debug, Serialize)]
pub struct ValidationReport {
    pub total_spells: usize,
    pub total_species: usize,
    pub total_classes: usize,
    pub total_gear: usize,
    pub total_weapons: usize,
    pub total_armor: usize,
    pub total_feats: usize,
    pub encoding_errors: usize,
    pub invalid_json: usize,
    pub passed: bool,
    pub issues: Vec<String>,
}

pub fn validate_core_data(conn: &Connection) -> Result<ValidationReport, String> {
    let mut issues = Vec::new();

    // 1. Counts
    let total_spells: usize = conn.query_row("SELECT COUNT(*) FROM core_spells", [], |row| row.get(0)).unwrap_or(0);
    let total_species: usize = conn.query_row("SELECT COUNT(*) FROM core_species", [], |row| row.get(0)).unwrap_or(0);
    let total_classes: usize = conn.query_row("SELECT COUNT(*) FROM core_classes", [], |row| row.get(0)).unwrap_or(0);
    let total_gear: usize = conn.query_row("SELECT COUNT(*) FROM core_gear", [], |row| row.get(0)).unwrap_or(0);
    let total_weapons: usize = conn.query_row("SELECT COUNT(*) FROM core_weapons", [], |row| row.get(0)).unwrap_or(0);
    let total_armor: usize = conn.query_row("SELECT COUNT(*) FROM core_armors", [], |row| row.get(0)).unwrap_or(0);
    let total_feats: usize = conn.query_row("SELECT COUNT(*) FROM core_feats", [], |row| row.get(0)).unwrap_or(0);

    // 2. Encoding Errors across all tables
    let mut encoding_errors = 0;
    let tables = ["core_spells", "core_species", "core_classes", "core_gear", "core_weapons", "core_armors", "core_feats"];
    for table in tables {
        let count: usize = conn.query_row(&format!("SELECT COUNT(*) FROM {} WHERE name GLOB '*Ã*'", table), [], |row| row.get(0)).unwrap_or(0);
        if count > 0 {
            issues.push(format!("Encoding errors found in {} entries in {}", count, table));
            encoding_errors += count;
        }
    }

    // 3. Invalid JSON (only for tables with data/JSON columns)
    let mut invalid_json = 0;
    let json_tables = ["core_spells", "core_species", "core_classes", "core_gear", "core_weapons", "core_armors", "core_feats"];
    for table in json_tables {
        let count: usize = conn.query_row(&format!("SELECT COUNT(*) FROM {} WHERE json_valid(data) = 0", table), [], |row| row.get(0)).unwrap_or(0);
        if count > 0 {
            issues.push(format!("Invalid JSON found in {} entries in {}", count, table));
            invalid_json += count;
        }
    }

    // 4. Specific Integrity Checks
    // Spell consistency
    let spell_mat_errors: usize = conn.query_row("SELECT COUNT(*) FROM core_spells WHERE components LIKE '%M%' AND (material_components IS NULL OR material_components = '')", [], |row| row.get(0)).unwrap_or(0);
    if spell_mat_errors > 0 {
        issues.push(format!("Material consistency errors in {} spells", spell_mat_errors));
    }

    Ok(ValidationReport {
        total_spells,
        total_species,
        total_classes,
        total_gear,
        total_weapons,
        total_armor,
        total_feats,
        encoding_errors,
        invalid_json,
        passed: issues.is_empty(),
        issues,
    })
}

#[tauri::command]
#[allow(dead_code)] // Used by Tauri command
pub async fn validate_core_compendium(
    db: tauri::State<'_, crate::db::Database>,
) -> Result<ValidationReport, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    validate_core_data(&conn)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_core_data_integrity() {
        // Try to find database in common locations
        let possible_paths = [
            "../sync.db",
            "../dnd-nexus.db",
            "sync.db",
            "dnd-nexus.db",
        ];
        
        let db_path = possible_paths.iter()
            .find(|p| std::path::Path::new(p).exists())
            .expect("No database found for testing");
        
        let conn = Connection::open(db_path).expect("Failed to open database");
        let report = validate_core_data(&conn).expect("Validation failed");
        
        println!("Validation Report: {:#?}", report);
        assert!(report.total_spells >= 300, "Should have at least 300 spells");
        assert!(report.total_species >= 9, "Should have at least 9 species");
        assert!(report.total_classes >= 12, "Should have 12 classes");
        assert!(report.total_gear > 100, "Should have a good amount of gear");
        assert!(report.total_weapons > 0, "Should have weapons");
        assert!(report.total_armor > 0, "Should have armor");
        assert!(report.total_feats > 0, "Should have feats");
        
        assert_eq!(report.encoding_errors, 0, "Should have 0 encoding errors: {:?}", report.issues);
        assert_eq!(report.invalid_json, 0, "Should have 0 invalid JSON entries: {:?}", report.issues);
        assert!(report.passed, "Integrity checks should pass: {:?}", report.issues);
    }
}
