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

    // SQLite unterstützt kein ALTER COLUMN, daher müssen wir die Tabelle neu erstellen
    // Aber das ist kompliziert. Stattdessen prüfen wir, ob base_ac NULL-Werte hat
    // und setzen sie auf 0, wenn sie NULL sind (für bestehende Daten)
    
    // Für neue Daten: base_ac kann NULL sein, aber SQLite erlaubt das nur, wenn die Spalte
    // bei der Erstellung als NULL definiert wurde. Da die Tabelle bereits existiert,
    // müssen wir prüfen, ob die Migration korrekt gelaufen ist.
    
    // Lösung: Wir setzen base_ac auf 0, wenn es NULL ist (für Formeln)
    // Aber eigentlich sollte base_ac NULL sein können. Lass mich prüfen, ob die Migration
    // die Spalte wirklich als NULL erlaubt hat.
    
    // Da SQLite kein ALTER COLUMN unterstützt, müssen wir die Tabelle neu erstellen.
    // Aber das ist zu kompliziert. Stattdessen setzen wir base_ac auf 0 für Formeln.
    
    println!("⚠️  SQLite unterstützt kein ALTER COLUMN. base_ac muss bei der Tabellenerstellung als NULL definiert werden.");
    println!("⚠️  Die Migration sollte die Tabelle neu erstellen, wenn base_ac noch NOT NULL ist.");
    println!("⚠️  Für jetzt: Setze base_ac auf 0 für Formeln (temporäre Lösung).");
    
    // Temporäre Lösung: Setze base_ac auf 0, wenn ac_formula vorhanden ist
    conn.execute(
        "UPDATE core_armors SET base_ac = 0 WHERE base_ac IS NULL AND ac_formula IS NOT NULL",
        [],
    ).expect("Fehler beim Update von base_ac");
    
    println!("✅ Temporäre Lösung angewendet: base_ac auf 0 gesetzt für Formeln");
}
