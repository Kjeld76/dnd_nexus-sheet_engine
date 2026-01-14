use rusqlite::{params, Connection};
use std::path::Path;

fn main() {
    println!("--- Waffen-Daten Import ---");

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

    match import_weapon_properties(&conn) {
        Ok(_) => println!("✅ Eigenschaften importiert"),
        Err(e) => eprintln!("❌ Fehler beim Import der Eigenschaften: {}", e),
    }

    match import_weapon_masteries(&conn) {
        Ok(_) => println!("✅ Meisterschaften importiert"),
        Err(e) => eprintln!("❌ Fehler beim Import der Meisterschaften: {}", e),
    }

    println!("\n✅ Import abgeschlossen!");
}

fn import_weapon_properties(conn: &Connection) -> Result<(), rusqlite::Error> {
    println!("\n📦 Importiere Waffen-Eigenschaften...");

    let properties = vec![
        (
            "finesse",
            "Finesse",
            "Wenn du mit Finesse-Waffen angreifst, hast du bei Angriffs- und Schadenswürfen die Wahl zwischen deinem Stärke- und deinem Geschicklichkeitsmodifikator. Du musst allerdings bei beiden Würfen denselben Modifikator verwenden.",
            false,
            None::<String>,
            false,
        ),
        (
            "geschosse",
            "Geschosse",
            "Du kannst Waffen mit der Eigenschaft Geschosse nur für Fernkampfangriffe verwenden, wenn du über entsprechende Geschosse verfügst. Die Art der erforderlichen Geschosse ist jeweils bei der Reichweite der Waffe angegeben. Jeder Angriff verbraucht ein Geschoss.",
            true,
            Some("range+ammo".to_string()),
            true,
        ),
        (
            "laden",
            "Laden",
            "Du kannst mit einer Aktion, Bonusaktion oder Reaktion immer nur ein Geschoss aus einer Waffe mit der Eigenschaft Laden abfeuern, egal, wie viele Angriffe dir zur Verfügung stehen.",
            false,
            None::<String>,
            false,
        ),
        (
            "leicht",
            "Leicht",
            "Wenn du in deinem Zug die Angriffsaktion ausführst und mit einer leichten Waffe angreifst, kannst du später im selben Zug als Bonusaktion einen zusätzlichen Angriff ausführen, wenn du eine andere leichte Waffe in der anderen Hand hältst.",
            false,
            None::<String>,
            false,
        ),
        (
            "schwer",
            "Schwer",
            "Du bist bei Angriffswürfen mit schweren Waffen im Nachteil, wenn du bei Nahkampfwaffen einen Stärkewert von weniger als 13 und bei Fernkampfwaffen einen Geschicklichkeitswert von weniger als 13 hast.",
            false,
            None::<String>,
            false,
        ),
        (
            "vielseitig",
            "Vielseitig",
            "Waffen mit der Eigenschaft Vielseitig können mit einer Hand oder mit zwei Händen geführt werden. Mit der Eigenschaft wird ein Schadenswert in Klammern genannt. Diesen Schaden bewirkt die Waffe, wenn sie mit zwei Händen geführt wird.",
            true,
            Some("damage".to_string()),
            true,
        ),
        (
            "weitreichend",
            "Weitreichend",
            "Bei Waffen mit der Eigenschaft Weitreichend ist die normale Angriffsreichweite um 1,5 Meter erhöht. Dies gilt auch bei Gelegenheitsangriffen.",
            false,
            None::<String>,
            false,
        ),
        (
            "wurfwaffe",
            "Wurfwaffe",
            "Waffen mit der Eigenschaft Wurfwaffe können geworfen werden, um Fernkampfangriffe auszuführen, und sie können als Teil des Angriffs gezogen werden. Wenn es sich um eine Nahkampfwaffe handelt, die du wirfst, verwendest du bei Angriffs- und Schadenswürfen den gleichen Attributsmodifikator wie bei Nahkampfangriffen mit der Waffe.",
            true,
            Some("range".to_string()),
            true,
        ),
        (
            "zweihaendig",
            "Zweihändig",
            "Waffen mit der Eigenschaft Zweihändig müssen mit zwei Händen geführt werden.",
            false,
            None::<String>,
            false,
        ),
        (
            "reichweite",
            "Reichweite",
            "Diese Waffe hat eine Reichweite, die in Metern angegeben ist. Die erste Zahl ist die normale Reichweite, die zweite Zahl ist die maximale Reichweite.",
            true,
            Some("range".to_string()),
            true,
        ),
        (
            "magisch",
            "Magisch",
            "Diese Waffe ist magisch und verleiht einen Bonus auf Angriffs- und Schadenswürfe. Der Bonus wird im parameter_value gespeichert.",
            true,
            Some("bonus".to_string()),
            true,
        ),
        (
            "verzaubert",
            "Verzaubert",
            "Diese Waffe ist verzaubert und hat zusätzliche magische Eigenschaften. Die Details werden im parameter_value gespeichert.",
            true,
            Some("special".to_string()),
            true,
        ),
    ];

    let mut stmt = conn.prepare(
        "INSERT OR REPLACE INTO weapon_properties (
            id, name, description, has_parameter, parameter_type, parameter_required, data
        ) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )?;

    for (id, name, description, has_param, param_type, param_required) in properties {
        stmt.execute(params![
            id,
            name,
            description,
            if has_param { 1 } else { 0 },
            param_type,
            if param_required { 1 } else { 0 },
            None::<String>
        ])?;
        println!("   • {} ({})", name, id);
    }

    Ok(())
}

fn import_weapon_masteries(conn: &Connection) -> Result<(), rusqlite::Error> {
    println!("\n📦 Importiere Waffen-Meisterschaften...");

    let masteries = vec![
        (
            "auslaugen",
            "Auslaugen",
            "Wenn du eine Kreatur mit dieser Waffe triffst, ist diese Kreatur bei ihrem nächsten Angriffswurf vor Beginn deines nächsten Zugs im Nachteil."
        ),
        (
            "einkerben",
            "Einkerben",
            "Wenn du den zusätzlichen Angriff der Eigenschaft Leicht ausführst, kannst du dies als Teil der Angriffsaktion statt als Bonusaktion tun. Du kannst diesen zusätzlichen Angriff nur einmal pro Zug ausführen."
        ),
        (
            "plagen",
            "Plagen",
            "Wenn du eine Kreatur mit dieser Waffe triffst und ihr Schaden zufügst, bist du beim nächsten Angriffswurf gegen diese Kreatur vor Ende deines nächsten Zugs im Vorteil."
        ),
        (
            "spalten",
            "Spalten",
            "Wenn du eine Kreatur mit einem Nahkampfangriffswurf triffst, den du mit dieser Waffe ausführst, kannst du mit der Waffe einen weiteren Nahkampfangriff auf eine zweite Kreatur im Abstand von bis zu 1,5 Metern von der ersten ausführen, sofern die zweite sich ebenfalls in Reichweite befindet. Bei einem Treffer erleidet die Kreatur den Waffenschaden. Du fügst dem Schaden jedoch nicht deinen Attributsmodifikator hinzu, sofern dieser Modifikator nicht negativ ist. Du kannst diesen zusätzlichen Angriff nur einmal pro Zug ausführen."
        ),
        (
            "stossen",
            "Stoßen",
            "Wenn du eine Kreatur mit dieser Waffe triffst, kannst du sie bis zu drei Meter weit in gerader Linie von dir wegstoßen, sofern sie von höchstens großer Größe ist."
        ),
        (
            "streifen",
            "Streifen",
            "Wenn dein Angriffswurf mit dieser Waffe eine Kreatur verfehlt, kannst du der Kreatur Schaden in Höhe des Attributsmodifikators zufügen, den du für den Angriffswurf verwendet hast. Die Schadensart entspricht der Waffe. Der Schaden kann nur durch Erhöhen des Attributsmodifikators erhöht werden."
        ),
        (
            "umstossen",
            "Umstoßen",
            "Wenn du eine Kreatur mit dieser Waffe triffst, kannst du sie zu einem Konstitutionsrettungswurf (SG 8 plus Attributsmodifikator für den Angriffswurf plus dein Übungsbonus) zwingen. Scheitert der Wurf, so wird die Kreatur umgestoßen."
        ),
        (
            "verlangsamen",
            "Verlangsamen",
            "Wenn du eine Kreatur mit dieser Waffe triffst und ihr Schaden zufügst, kannst du ihre Bewegungsrate bis zum Beginn deines nächsten Zugs um drei Meter verringern. Wird die Kreatur mehrfach von Waffen mit dieser Eigenschaft getroffen, so wird ihre Bewegungsrate dennoch nur um drei Meter verringert."
        ),
    ];

    let mut stmt = conn.prepare(
        "INSERT OR REPLACE INTO weapon_masteries (
            id, name, description, data
        ) VALUES (?, ?, ?, ?)"
    )?;

    for (id, name, description) in masteries {
        stmt.execute(params![id, name, description, None::<String>])?;
        println!("   • {} ({})", name, id);
    }

    Ok(())
}
