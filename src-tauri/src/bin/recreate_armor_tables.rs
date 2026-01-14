use rusqlite::Connection;
use std::path::Path;

fn main() {
    let possible_paths = [
        "dnd-nexus.db",
        "../dnd-nexus.db",
        "../../dnd-nexus.db",
    ];

    let mut db_path = None;
    for path in possible_paths {
        if Path::new(path).exists() {
            db_path = Some(path.to_string());
            break;
        }
    }

    let db_path = match db_path {
        Some(p) => p,
        None => {
            eprintln!("FEHLER: Datenbank existiert nicht!");
            return;
        }
    };

    println!("Nutze Datenbank: {}", db_path);
    let conn = Connection::open(db_path).expect("Konnte Datenbank nicht öffnen");

    // Prüfe ob base_ac NOT NULL ist
    let mut stmt = conn.prepare("PRAGMA table_info(core_armors)").unwrap();
    let mut base_ac_not_null = false;
    stmt.query_map([], |row| {
        let col_name: String = row.get(1)?;
        let not_null: i32 = row.get(3)?;
        if col_name == "base_ac" && not_null != 0 {
            base_ac_not_null = true;
        }
        Ok(())
    }).unwrap().collect::<Result<Vec<_>, _>>().unwrap();

    if base_ac_not_null {
        println!("⚠️  base_ac ist noch NOT NULL. Erstelle Tabelle neu...");
        
        // Lösche View zuerst (verweist auf core_armors)
        conn.execute("DROP VIEW IF EXISTS all_armors", []).ok();
        
        // Lösche temporäre Tabelle falls vorhanden
        conn.execute("DROP TABLE IF EXISTS core_armors_new", []).ok();
        
        // Lösche alte Daten zuerst
        println!("⚠️  Lösche alte Daten...");
        conn.execute("DELETE FROM armor_property_mappings WHERE armor_id IN (SELECT id FROM core_armors)", []).ok();
        conn.execute("DELETE FROM core_armors", []).ok();
        
        // Temporäre Tabelle erstellen
        conn.execute(
            "CREATE TABLE core_armors_new (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL CHECK(category IN ('leichte_ruestung', 'mittelschwere_ruestung', 'schwere_ruestung', 'schild')),
                base_ac INTEGER,
                ac_bonus INTEGER DEFAULT 0,
                ac_formula TEXT,
                strength_requirement INTEGER,
                stealth_disadvantage BOOLEAN NOT NULL DEFAULT 0,
                don_time_minutes INTEGER,
                doff_time_minutes INTEGER,
                weight_kg REAL NOT NULL,
                cost_gp REAL NOT NULL,
                data JSON NOT NULL,
                created_at INTEGER DEFAULT (unixepoch())
            )",
            [],
        ).expect("Fehler beim Erstellen der neuen Tabelle");

        // Daten migrieren (falls vorhanden) - nur wenn category gültig ist
        // Da die alten Daten wahrscheinlich ungültige Kategorien haben, löschen wir sie
        println!("⚠️  Lösche alte Daten mit ungültigen Kategorien...");
        conn.execute("DELETE FROM armor_property_mappings WHERE armor_id IN (SELECT id FROM core_armors)", []).ok();
        conn.execute("DELETE FROM core_armors", []).expect("Fehler beim Löschen der alten Daten");

        // Alte Tabelle löschen
        conn.execute("DROP TABLE core_armors", []).expect("Fehler beim Löschen der alten Tabelle");

        // Neue Tabelle umbenennen
        conn.execute("ALTER TABLE core_armors_new RENAME TO core_armors", []).expect("Fehler beim Umbenennen der Tabelle");

        // View neu erstellen
        conn.execute(
            "CREATE VIEW all_armors AS 
            SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.category, core.category) as category, 
                   COALESCE(c.base_ac, core.base_ac) as base_ac, COALESCE(c.ac_bonus, core.ac_bonus) as ac_bonus, 
                   COALESCE(c.ac_formula, core.ac_formula) as ac_formula, COALESCE(c.strength_requirement, core.strength_requirement) as strength_requirement, 
                   COALESCE(c.stealth_disadvantage, core.stealth_disadvantage) as stealth_disadvantage, 
                   COALESCE(c.don_time_minutes, core.don_time_minutes) as don_time_minutes, 
                   COALESCE(c.doff_time_minutes, core.doff_time_minutes) as doff_time_minutes, 
                   COALESCE(c.weight_kg, core.weight_kg) as weight_kg, 
                   COALESCE(c.cost_gp, core.cost_gp) as cost_gp, COALESCE(c.data, core.data) as data, 
                   CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
            FROM core_armors core LEFT JOIN custom_armors c ON c.parent_id = core.id 
            UNION 
            SELECT id, name, category, base_ac, ac_bonus, ac_formula, strength_requirement, stealth_disadvantage, 
                   don_time_minutes, doff_time_minutes, weight_kg, cost_gp, data, 
                   CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
            FROM custom_armors WHERE parent_id IS NULL",
            [],
        ).expect("Fehler beim Neuerstellen der View");

        println!("✅ Tabelle core_armors neu erstellt mit base_ac NULL erlaubt");
    } else {
        println!("✅ base_ac erlaubt bereits NULL");
    }

    // Gleiches für custom_armors
    let mut stmt2 = conn.prepare("PRAGMA table_info(custom_armors)").unwrap();
    let mut base_ac_not_null2 = false;
    stmt2.query_map([], |row| {
        let col_name: String = row.get(1)?;
        let not_null: i32 = row.get(3)?;
        if col_name == "base_ac" && not_null != 0 {
            base_ac_not_null2 = true;
        }
        Ok(())
    }).unwrap().collect::<Result<Vec<_>, _>>().unwrap();

    if base_ac_not_null2 {
        println!("⚠️  base_ac in custom_armors ist noch NOT NULL. Erstelle Tabelle neu...");
        
        // Lösche View zuerst (verweist auf custom_armors)
        conn.execute("DROP VIEW IF EXISTS all_armors", []).ok();
        
        // Lösche temporäre Tabelle falls vorhanden
        conn.execute("DROP TABLE IF EXISTS custom_armors_new", []).ok();
        
        // Lösche alte Daten
        conn.execute("DELETE FROM armor_property_mappings WHERE armor_id IN (SELECT id FROM custom_armors)", []).ok();
        conn.execute("DELETE FROM custom_armors", []).ok();
        
        conn.execute(
            "CREATE TABLE custom_armors_new (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL CHECK(category IN ('leichte_ruestung', 'mittelschwere_ruestung', 'schwere_ruestung', 'schild')),
                base_ac INTEGER,
                ac_bonus INTEGER DEFAULT 0,
                ac_formula TEXT,
                strength_requirement INTEGER,
                stealth_disadvantage BOOLEAN NOT NULL DEFAULT 0,
                don_time_minutes INTEGER,
                doff_time_minutes INTEGER,
                weight_kg REAL NOT NULL,
                cost_gp REAL NOT NULL,
                data JSON NOT NULL,
                parent_id TEXT,
                is_homebrew BOOLEAN DEFAULT 1,
                created_at INTEGER DEFAULT (unixepoch()),
                updated_at INTEGER DEFAULT (unixepoch()),
                FOREIGN KEY (parent_id) REFERENCES core_armors(id) ON DELETE CASCADE
            )",
            [],
        ).expect("Fehler beim Erstellen der neuen custom_armors Tabelle");

        conn.execute(
            "INSERT INTO custom_armors_new SELECT id, name, category, base_ac, COALESCE(ac_bonus, 0), ac_formula, strength_requirement, stealth_disadvantage, don_time_minutes, doff_time_minutes, weight_kg, cost_gp, data, parent_id, is_homebrew, created_at, updated_at FROM custom_armors",
            [],
        ).expect("Fehler beim Migrieren der custom_armors Daten");

        conn.execute("DROP TABLE custom_armors", []).expect("Fehler beim Löschen der alten custom_armors Tabelle");
        conn.execute("ALTER TABLE custom_armors_new RENAME TO custom_armors", []).expect("Fehler beim Umbenennen der custom_armors Tabelle");

        // View neu erstellen
        conn.execute(
            "CREATE VIEW all_armors AS 
            SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.category, core.category) as category, 
                   COALESCE(c.base_ac, core.base_ac) as base_ac, COALESCE(c.ac_bonus, core.ac_bonus) as ac_bonus, 
                   COALESCE(c.ac_formula, core.ac_formula) as ac_formula, COALESCE(c.strength_requirement, core.strength_requirement) as strength_requirement, 
                   COALESCE(c.stealth_disadvantage, core.stealth_disadvantage) as stealth_disadvantage, 
                   COALESCE(c.don_time_minutes, core.don_time_minutes) as don_time_minutes, 
                   COALESCE(c.doff_time_minutes, core.doff_time_minutes) as doff_time_minutes, 
                   COALESCE(c.weight_kg, core.weight_kg) as weight_kg, 
                   COALESCE(c.cost_gp, core.cost_gp) as cost_gp, COALESCE(c.data, core.data) as data, 
                   CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
            FROM core_armors core LEFT JOIN custom_armors c ON c.parent_id = core.id 
            UNION 
            SELECT id, name, category, base_ac, ac_bonus, ac_formula, strength_requirement, stealth_disadvantage, 
                   don_time_minutes, doff_time_minutes, weight_kg, cost_gp, data, 
                   CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
            FROM custom_armors WHERE parent_id IS NULL",
            [],
        ).expect("Fehler beim Neuerstellen der View");

        println!("✅ Tabelle custom_armors neu erstellt mit base_ac NULL erlaubt");
    } else {
        println!("✅ base_ac in custom_armors erlaubt bereits NULL");
    }

    println!("\n✅ Migration abgeschlossen!");
}
