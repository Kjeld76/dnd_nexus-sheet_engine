use rusqlite::Connection;
use std::path::Path;

pub mod db {
    use std::sync::Mutex;
    use rusqlite::Connection;
    pub struct Database(pub Mutex<Connection>);
}

#[path = "../tools/data_validator.rs"]
mod data_validator;

fn main() {
    println!("--- PHB 2024 Data Validator CLI ---");
    
    let actual_path = "C:\\Users\\mario\\.cursor\\projects\\dnd_nexus\\dnd-nexus.db";
    println!("Nutze Datenbank: {}", actual_path);

    if !Path::new(actual_path).exists() {
        println!("FEHLER: Datenbank existiert nicht!");
        return;
    }

    let conn = Connection::open(actual_path).expect("Konnte Datenbank nicht öffnen");
    
    match data_validator::validate_core_data(&conn) {
        Ok(report) => {
            println!("\nVALIDIERUNG ABGESCHLOSSEN!");
            println!("--------------------------");
            println!("Zauber:       {}", report.total_spells);
            println!("Spezies:      {}", report.total_species);
            println!("Klassen:      {}", report.total_classes);
            println!("Ausrüstung:   {}", report.total_gear);
            println!("Waffen:       {}", report.total_weapons);
            println!("Rüstungen:    {}", report.total_armor);
            println!("Talente:      {}", report.total_feats);
            println!("--------------------------");
            println!("Encoding Errors: {}", report.encoding_errors);
            println!("Invalid JSON:    {}", report.invalid_json);
            println!("--------------------------");
            println!("Status: {}", if report.passed { "PASS ✅" } else { "FAIL ❌" });
            if !report.passed {
                println!("Issues: {:#?}", report.issues);
            }
        },
        Err(e) => println!("KRITISCHER FEHLER: {}", e),
    }
}
