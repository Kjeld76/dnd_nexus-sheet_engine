use rusqlite::Connection;
use std::path::Path;
use std::env;

#[path = "../db/migrations.rs"]
mod migrations;

fn main() {
    let cwd = env::current_dir().unwrap();
    println!("Current working directory: {:?}", cwd);

    let possible_paths = [
        "dnd-nexus.db",
        "../dnd-nexus.db",
        "../../dnd-nexus.db",
        "sync.db",
        "../sync.db",
        "C:/Users/mario/.cursor/projects/dnd_nexus/dnd-nexus.db",
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
            eprintln!("Database not found in any expected location.");
            return;
        }
    };

    println!("Using database at: {}", db_path);
    let conn = Connection::open(db_path).expect("Failed to open database");
    
    match migrations::run_migrations(&conn) {
        Ok(_) => println!("Migrations applied successfully!"),
        Err(e) => eprintln!("Migration error: {}", e),
    }
}
