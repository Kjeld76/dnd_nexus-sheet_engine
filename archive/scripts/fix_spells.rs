use rusqlite::Connection;
use std::path::Path;

pub mod db {
    use std::sync::Mutex;
    use rusqlite::Connection;
    pub struct Database(pub Mutex<Connection>);
}

pub mod tauri {
    pub struct State<'a, T>(pub &'a T);
}

#[path = "../tools/spell_validator.rs"]
mod spell_validator;

fn main() {
    println!("--- Zauber-Validator CLI ---");
    
    let actual_path = "C:\\Users\\mario\\.cursor\\projects\\dnd_nexus\\dnd-nexus.db";
    println!("Nutze Datenbank: {}", actual_path);

    if !Path::new(actual_path).exists() {
        println!("FEHLER: Datenbank existiert nicht!");
        return;
    }

    let conn = Connection::open(actual_path).expect("Konnte Datenbank nicht öffnen");
    
    // DELETE for clean test
    conn.execute("DELETE FROM core_spells", []).ok();

    match spell_validator::validate_and_update(&conn) {
        Ok(report) => {
            println!("\nERFOLG!");
            println!("Gesamt verarbeitet: {}", report.total_spells);
            println!("Rituale gefunden: {}", report.added_rituals);
            
            let count: i32 = conn.query_row("SELECT count(*) FROM core_spells", [], |r| r.get(0)).unwrap();
            println!("Anzahl Zauber in DB: {}", count);
        },
        Err(e) => println!("KRITISCHER FEHLER: {}", e),
    }
}
