use rusqlite::Connection;

fn main() {
    let db_path = "/home/entwickler/.local/share/com.dndnexus.app/dnd-nexus.db";
    let conn = Connection::open(db_path).expect("Could not open DB");
    
    println!("Fixing Custom Schema Mismatches...");

    // 1. Custom Species
    // Try adding columns. Use ADD COLUMN IF NOT EXISTS logic by catching error? 
    // SQLite doesn't support IF NOT EXISTS for ADD COLUMN natively in one go easily, 
    // but running ADD COLUMN on existing column gives error. We can use unwrap_or_default or check pragma.
    // simpler: just run it, ignore specific error.

    let _ = conn.execute("ALTER TABLE custom_species ADD COLUMN size TEXT", []).map_err(|e| println!("Warning (species size): {}", e));
    let _ = conn.execute("ALTER TABLE custom_species ADD COLUMN speed INTEGER", []).map_err(|e| println!("Warning (species speed): {}", e));
    let _ = conn.execute("ALTER TABLE custom_species ADD COLUMN darkvision INTEGER", []).map_err(|e| println!("Warning (species darkvision): {}", e));
    
    // 2. Custom Feats
    let _ = conn.execute("ALTER TABLE custom_feats ADD COLUMN description TEXT", []).map_err(|e| println!("Warning (feats description): {}", e));
    let _ = conn.execute("ALTER TABLE custom_feats ADD COLUMN prerequisite TEXT", []).map_err(|e| println!("Warning (feats prerequisite): {}", e));

    // 3. Custom Backgrounds
    let _ = conn.execute("ALTER TABLE custom_backgrounds ADD COLUMN description TEXT", []).map_err(|e| println!("Warning (backgrounds description): {}", e));

    println!("Custom tables altered (if check warnings above, existing columns were skipped).");
}
