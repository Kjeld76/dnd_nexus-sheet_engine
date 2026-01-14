use rusqlite::{Connection, params};
use serde_json::{json, Value};
use std::path::Path;

fn normalize_id(name: &str) -> String {
    name.to_lowercase()
        .replace("ä", "ae")
        .replace("ö", "oe")
        .replace("ü", "ue")
        .replace("ß", "ss")
        .replace(" ", "_")
        .replace("-", "_")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_')
        .collect()
}

fn parse_tool(tool_text: &str) -> Value {
    if tool_text.starts_with("Wähle eine Art von") {
        // Extrahiere Kategorie (z.B. "Spielset", "Handwerkszeug", "Musikinstrument")
        let category = if tool_text.contains("Spielset") {
            "spielset"
        } else if tool_text.contains("Handwerkszeug") {
            "handwerkszeug"
        } else if tool_text.contains("Musikinstrument") {
            "musikinstrument"
        } else {
            "unknown"
        };
        json!({
            "type": "choice",
            "category": category,
            "description": tool_text
        })
    } else {
        json!({
            "type": "fixed",
            "name": tool_text
        })
    }
}

struct Background {
    id: String,
    name: String,
    description: String,
    ability_scores: Vec<String>,
    feat: String,
    skills: Vec<String>,
    tool: Value,
    starting_equipment: Value,
}

fn import_backgrounds(conn: &mut Connection) -> Result<(), String> {
    let backgrounds = vec![
        Background {
            id: normalize_id("Adeliger"),
            name: "Adeliger".to_string(),
            description: "Du bist in einer Burg aufgewachsen, umgeben von Reichtum, Macht und Privilegien. Deine Familie ist von niederem Adel und hat dir erstklassige Bildung angedeihen lassen, die du zum Teil genossen und zum Teil verabscheut hast. Deine Zeit in der Burg - vor allem die vielen Stunden, die du deine Familie am Hof beobachtet hast - hat dich vieles über das Herrschen gelehrt.".to_string(),
            ability_scores: vec!["Stärke".to_string(), "Intelligenz".to_string(), "Charisma".to_string()],
            feat: "Begabt".to_string(),
            skills: vec!["Geschichte".to_string(), "Überzeugen".to_string()],
            tool: parse_tool("Wähle eine Art von Spielset aus (siehe Kapitel 6)"),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["feine Kleidung", "Parfüm"],
                        "gold": 29.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Akolyth"),
            name: "Akolyth".to_string(),
            description: "Du hast dich dem Dienst in einem Tempel verschrieben, der sich in einer Stadt oder verborgen in einem heiligen Hain befinden kann. Dort hast du Riten zu Ehren eines Gottes oder eines Pantheons ausgeführt. Du hast unter einem Priester gedient und Religion studiert. Dank der Unterweisung des Priesters und deines eigenen Einsatzes hast du außerdem gelernt, im Dienst an deinem Ort der Anbetung und an den Gläubigen dort ein gewisses Maß an göttlichen Energien zu kanalisieren.".to_string(),
            ability_scores: vec!["Intelligenz".to_string(), "Weisheit".to_string(), "Charisma".to_string()],
            feat: "Eingeweihter der Magie (Kleriker)".to_string(),
            skills: vec!["Motiv erkennen".to_string(), "Religion".to_string()],
            tool: json!({
                "type": "fixed",
                "name": "Kalligrafenwerkzeug"
            }),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["Buch (Gebete)", "Heiliges Symbol", "Pergament (10 Blätter)", "Robe"],
                        "gold": 8.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Bauer"),
            name: "Bauer".to_string(),
            description: "Du bist auf dem Land aufgewachsen. Jahrelang hast du Tiere versorgt und den Boden kultiviert, und dafür bist du mit Geduld und guter Gesundheit belohnt worden. Du schätzt die Gaben der Natur und hast zugleich gesunden Respekt vor ihrem Zorn.".to_string(),
            ability_scores: vec!["Stärke".to_string(), "Konstitution".to_string(), "Weisheit".to_string()],
            feat: "Zäh".to_string(),
            skills: vec!["Mit Tieren umgehen".to_string(), "Naturkunde".to_string()],
            tool: json!({
                "type": "fixed",
                "name": "Schreinerwerkzeug"
            }),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["Sichel", "Heilerausrüstung", "Eisentopf", "Schaufel", "Reisekleidung"],
                        "gold": 30.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Einsiedler"),
            name: "Einsiedler".to_string(),
            description: "Du hast deine jungen Jahre abgeschieden in einer Hütte oder einem Kloster fern aller Ansiedlungen verbracht. Deine einzige Gesellschaft bestand aus den Kreaturen des Waldes und gelegentlichen Besuchern, die Vorräte und Nachrichten brachten. In deiner Abgeschiedenheit hast du zahllose Stunden damit verbracht, über die Mysterien der Schöpfung nachzusinnen.".to_string(),
            ability_scores: vec!["Konstitution".to_string(), "Weisheit".to_string(), "Charisma".to_string()],
            feat: "Heiler".to_string(),
            skills: vec!["Heilkunde".to_string(), "Religion".to_string()],
            tool: json!({
                "type": "fixed",
                "name": "Kräuterkundeausrüstung"
            }),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["Kampfstab", "Schlafsack", "Buch (Philosophie)", "Lampe", "Öl (drei Flaschen)", "Reisekleidung"],
                        "gold": 16.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Händler"),
            name: "Händler".to_string(),
            description: "Du warst bei einem Händler, einem Karawanenmeister oder Ladenbesitzer in der Lehre und hast die Grundlagen des Handels erlernt. Du bist viel gereist und hast dir deinen Lebensunterhalt mit dem An- und Verkauf von Rohstoffen für Handwerker sowie von deren fertigen Werken verdient. Vielleicht hast du Waren transportiert (per Schiff, Wagen oder Karawane) oder bei fahrenden Händlern erworben und in deinem eigenen Laden verkauft.".to_string(),
            ability_scores: vec!["Konstitution".to_string(), "Intelligenz".to_string(), "Charisma".to_string()],
            feat: "Glückspilz".to_string(),
            skills: vec!["Mit Tieren umgehen".to_string(), "Überzeugen".to_string()],
            tool: json!({
                "type": "fixed",
                "name": "Navigationswerkzeug"
            }),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["zwei Beutel", "Reisekleidung"],
                        "gold": 22.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Handwerker"),
            name: "Handwerker".to_string(),
            description: "Du hast in einem Handwerksbetrieb für ein paar Kupferstücke am Tag Böden gewischt und Tische geschrubbt, sowie du groß genug warst, um einen Eimer zu tragen. In deiner Lehre hast du gelernt, grundlegende handwerkliche Arbeiten auszuführen und schwierige Kunden zu besänftigen. Außerdem hast du ein gutes Auge fürs Detail entwickelt.".to_string(),
            ability_scores: vec!["Stärke".to_string(), "Geschicklichkeit".to_string(), "Intelligenz".to_string()],
            feat: "Handwerker".to_string(),
            skills: vec!["Nachforschungen".to_string(), "Überzeugen".to_string()],
            tool: parse_tool("Wähle eine Art von Handwerkszeug aus (siehe Kapitel 6)"),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["zwei Beutel", "Reisekleidung"],
                        "gold": 32.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Krimineller"),
            name: "Krimineller".to_string(),
            description: "Du hast dich in dunklen Gassen durchgeschlagen und mit Taschendiebstählen und Einbrüchen über Wasser gehalten. Vielleicht hat du einer kleinen Bande von gleichgesinnten Halunken angehört, die aufeinander aufpassten. Oder vielleicht warst du ein Einzelgänger und hast dich gegen die örtliche Diebesgilde oder noch fürchterlichere Gesetzesbrecher behauptet.".to_string(),
            ability_scores: vec!["Geschicklichkeit".to_string(), "Konstitution".to_string(), "Intelligenz".to_string()],
            feat: "Wachsam".to_string(),
            skills: vec!["Fingerfertigkeit".to_string(), "Heimlichkeit".to_string()],
            tool: json!({
                "type": "fixed",
                "name": "Diebeswerkzeug"
            }),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["zwei Dolche", "Brechstange", "zwei Beutel", "Reisekleidung"],
                        "gold": 16.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Reisender"),
            name: "Reisender".to_string(),
            description: "Du bist auf der Straße in Gesellschaft ähnlich glückloser Außenseiter aufgewachsen, manche von ihnen Freunde, manche von ihnen Rivalen. Du hast geschlafen, wo es sich angeboten hat, und so manche merkwürdige Arbeit getan, um etwas zu Essen zu kriegen. Wenn der Hunger unerträglich wurde, blieb dir nur Diebstahl. Dennoch hast du weder deinen Stolz noch die Hoffnung verloren. Das Schicksal ist noch nicht fertig mit dir.".to_string(),
            ability_scores: vec!["Geschicklichkeit".to_string(), "Weisheit".to_string(), "Charisma".to_string()],
            feat: "Glückspilz".to_string(),
            skills: vec!["Motiv erkennen".to_string(), "Heimlichkeit".to_string()],
            tool: json!({
                "type": "fixed",
                "name": "Diebeswerkzeug"
            }),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["zwei Dolche", "Schlafsack", "zwei Beutel", "Reisekleidung"],
                        "gold": 16.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Scharlatan"),
            name: "Scharlatan".to_string(),
            description: "Sowie du alt genug warst, um ein Bier zu bestellen, hattest du im Nu in jeder Taverne in Reichweite deinen Lieblingsplatz. Während deiner Tavernentouren hast du gelernt, jene Pechvögel auszunehmen, die auf der Suche nach einer schönen Lüge waren - vielleicht hast du ihnen mit gefälschten Zaubertränken oder Stammbäumen das Geld aus der Tasche gezogen.".to_string(),
            ability_scores: vec!["Geschicklichkeit".to_string(), "Konstitution".to_string(), "Charisma".to_string()],
            feat: "Begabt".to_string(),
            skills: vec!["Fingerfertigkeit".to_string(), "Täuschen".to_string()],
            tool: json!({
                "type": "fixed",
                "name": "Fälscherausrüstung"
            }),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["Kostüm", "feine Kleidung"],
                        "gold": 15.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Schreiber"),
            name: "Schreiber".to_string(),
            description: "Du hast deine prägenden Jahre in einem Skriptorium verbracht, einem Kloster zur Bewahrung von Wissen oder einer staatlichen Behörde, wo du gelernt hast, in klarer Schrift fügliche Texte zu verfassen. Vielleicht hast du Regierungsdokumente geschrieben oder viele Wälzer an Literatur kopiert. Möglicherweise hast du Erfahrung als Autor von Gedichten, Prosa oder wissenschaftlichen Arbeiten. Du achtest auf Details, damit du keine Fehler in die Dokumente einschleppst, die du erstellst oder kopierst.".to_string(),
            ability_scores: vec!["Geschicklichkeit".to_string(), "Intelligenz".to_string(), "Weisheit".to_string()],
            feat: "Begabt".to_string(),
            skills: vec!["Nachforschungen".to_string(), "Wahrnehmung".to_string()],
            tool: json!({
                "type": "fixed",
                "name": "Kalligrafenwerkzeug"
            }),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["feine Kleidung", "Lampe", "Öl (drei Flaschen)", "Pergament (12 Blätter)"],
                        "gold": 23.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Seemann"),
            name: "Seemann".to_string(),
            description: "Du hast als Seefahrer gelebt, den Wind im Rücken und das Deck schwankend unter deinen Füßen. In zahllosen Häfen hast du an Tavernentheken gehockt. Du hast mächtige Stürme überstanden und Geschichten mit Leuten ausgetauscht, die unter den Wellen wohnen.".to_string(),
            ability_scores: vec!["Stärke".to_string(), "Geschicklichkeit".to_string(), "Weisheit".to_string()],
            feat: "Kneipenschläger".to_string(),
            skills: vec!["Akrobatik".to_string(), "Wahrnehmung".to_string()],
            tool: json!({
                "type": "fixed",
                "name": "Navigationswerkzeug"
            }),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["Dolch", "Seil", "Reisekleidung"],
                        "gold": 20.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Soldat"),
            name: "Soldat".to_string(),
            description: "Du hast deine Ausbildung für den Krieg begonnen, sowie du erwachsen warst. Erinnerungen an dein Leben vor den Waffen sind rar. Der Kampf liegt dir im Blut. Manchmal ertappst du dich dabei, wie du reflexhaft die Kampfübungen deiner Grundausbildung wiederholst. Schließlich hast du deine Ausbildung auf dem Schlachtfeld genutzt und das Reich beschützt, indem du Krieg geführt hast.".to_string(),
            ability_scores: vec!["Stärke".to_string(), "Geschicklichkeit".to_string(), "Konstitution".to_string()],
            feat: "Wilder Angreifer".to_string(),
            skills: vec!["Athletik".to_string(), "Einschüchtern".to_string()],
            tool: parse_tool("Wähle eine Art von Spielset aus (siehe Kapitel 6)"),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["Speer", "Kurzbogen", "20 Pfeile", "Heilerausrüstung", "Köcher", "Reisekleidung"],
                        "gold": 14.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Unterhaltungskünstler"),
            name: "Unterhaltungskünstler".to_string(),
            description: "Du hast einen Großteil deiner Jugend auf Jahrmärkten und in Zirkussen verbracht, warst als Gelegenheitsarbeiter für Musiker und Akrobaten tätig und hast dafür Unterricht erhalten. Vielleicht hast du Seiltanz gelernt, oder wie man in bestimmter Weise Laute spielt oder in tadelloser Diktion Gedichte vorträgt. Bis heute liebst du den Applaus und stehst gerne auf der Bühne.".to_string(),
            ability_scores: vec!["Stärke".to_string(), "Geschicklichkeit".to_string(), "Charisma".to_string()],
            feat: "Musiker".to_string(),
            skills: vec!["Akrobatik".to_string(), "Auftreten".to_string()],
            tool: parse_tool("Wähle eine Art von Musikinstrument aus (siehe Kapitel 6)"),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["zwei Kostüme", "Spiegel", "Parfüm", "Reisekleidung"],
                        "gold": 11.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Wache"),
            name: "Wache".to_string(),
            description: "Deine Füße schmerzen, wenn du nur an die zahllosen Stunden denkst, die du auf deinem Posten im Wachturm verbracht hast. Du hast gelernt, mit dem einem Auge nach Plünderern außerhalb der Mauern Ausschau zu halten, die womöglich aus dem nahen Wald hervorbrechen, und mit dem anderen nach Beutelschneidern und Tunichtguten innerhalb der Festung zu suchen.".to_string(),
            ability_scores: vec!["Stärke".to_string(), "Intelligenz".to_string(), "Weisheit".to_string()],
            feat: "Wachsam".to_string(),
            skills: vec!["Athletik".to_string(), "Wahrnehmung".to_string()],
            tool: parse_tool("Wähle eine Art von Spielset aus (siehe Kapitel 6)"),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["Speer", "leichte Armbrust", "20 Bolzen", "abdeckbare Laterne", "Handschellen", "Köcher", "Reisekleidung"],
                        "gold": 12.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Wegfinder"),
            name: "Wegfinder".to_string(),
            description: "Du bist in der freien Natur aufgewachsen, weit weg von besiedelten Gebieten. Dein Zuhause war stets dort, wo du deinen Schlafsack ausgerollt hast. Es gibt viele Wunder in der Wildnis: merkwürdige Monster, unberührte Wälder und Flüsse, überwucherte Ruinen und gigantischer Hallen, in denen einst die Riesen wandelten. Bei deinen Erkundungen hast du gelernt, auf dich aufzupassen. Bisweilen hast du freundlichen Naturpriestern den Weg gewiesen, die dir im Gegenzug beigebracht haben, wie man die Magie der Wildnis kanalisiert.".to_string(),
            ability_scores: vec!["Geschicklichkeit".to_string(), "Konstitution".to_string(), "Weisheit".to_string()],
            feat: "Eingeweihter der Magie (Druide)".to_string(),
            skills: vec!["Heimlichkeit".to_string(), "Überlebenskunst".to_string()],
            tool: json!({
                "type": "fixed",
                "name": "Kartografenwerkzeug"
            }),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["Kurzbogen", "20 Pfeile", "Schlafsack", "Köcher", "Zelt", "Reisekleidung"],
                        "gold": 3.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
        Background {
            id: normalize_id("Weiser"),
            name: "Weiser".to_string(),
            description: "Du hast deine jungen Jahre damit verbracht, zu Herrenhäusern und Klöstern zu reisen und dir mit verschiedenen Gelegenheitsarbeiten und Dienstleistungen Zugang zu den Bibliotheken zu erarbeiten. Lange Abende hast du mit dem Studium von Büchern und Schriftrollen verbracht und dir Wissen über das Multiversum und die Grundlagen der Magie angeeignet. Und dein Geist verlangt nach mehr.".to_string(),
            ability_scores: vec!["Konstitution".to_string(), "Intelligenz".to_string(), "Weisheit".to_string()],
            feat: "Eingeweihter der Magie (Magier)".to_string(),
            skills: vec!["Arkane Kunde".to_string(), "Geschichte".to_string()],
            tool: json!({
                "type": "fixed",
                "name": "Kalligrafenwerkzeug"
            }),
            starting_equipment: json!({
                "options": [
                    {
                        "label": "A",
                        "items": ["Kampfstab", "Buch (Geschichte)", "Pergament (8 Blätter)", "Robe"],
                        "gold": 8.0
                    },
                    {
                        "label": "B",
                        "items": null,
                        "gold": 50.0
                    }
                ]
            }),
        },
    ];

    println!("🗑️  Lösche alle bestehenden Hintergründe...");
    conn.execute("DELETE FROM core_backgrounds", []).map_err(|e| e.to_string())?;

    let bg_count = backgrounds.len();
    println!("📝 Importiere {} Hintergründe...", bg_count);

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for bg in backgrounds {
        let data = json!({
            "description": bg.description,
            "ability_scores": bg.ability_scores,
            "feat": bg.feat,
            "skills": bg.skills,
            "tool": bg.tool,
            "starting_equipment": bg.starting_equipment
        });

        tx.execute(
            "INSERT INTO core_backgrounds (id, name, data) VALUES (?, ?, ?)",
            params![bg.id, bg.name, data.to_string()],
        ).map_err(|e| e.to_string())?;

        println!("  ✅ {} ({})", bg.name, bg.id);
        
        // Zeige Startausrüstung
        if let Some(options) = data["starting_equipment"]["options"].as_array() {
            for opt in options {
                let label = opt["label"].as_str().unwrap_or("?");
                let items = opt["items"].as_array();
                let gold = opt["gold"].as_f64();
                let items_str = if let Some(items) = items {
                    if items.is_empty() || items.iter().all(|i| i.is_null()) {
                        "keine".to_string()
                    } else {
                        items.iter()
                            .filter_map(|i| i.as_str())
                            .collect::<Vec<_>>()
                            .join(", ")
                    }
                } else {
                    "keine".to_string()
                };
                let gold_str = gold.map(|g| format!("{} GM", g as i32)).unwrap_or_else(|| "kein Gold".to_string());
                println!("     Option {}: {} + {}", label, items_str, gold_str);
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    println!("\n✅ Import abgeschlossen: {} Hintergründe", bg_count);

    Ok(())
}

fn main() {
    // Try multiple possible paths
    let possible_paths = [Path::new("dnd-nexus.db"),
        Path::new("../dnd-nexus.db"),
        Path::new("../../dnd-nexus.db")];
    
    let db_path = possible_paths.iter()
        .find(|p| p.exists())
        .map(|p| p.to_path_buf())
        .or_else(|| {
            // If none found, try to find it in parent directories
            let mut current = std::env::current_dir().ok()?;
            loop {
                let test_path = current.join("dnd-nexus.db");
                if test_path.exists() {
                    return Some(test_path);
                }
                if !current.pop() {
                    break;
                }
            }
            None
        });
    
    let db_path = match db_path {
        Some(p) => p,
        None => {
            eprintln!("❌ Datenbank nicht gefunden");
            eprintln!("💡 Suche in: {:?}", std::env::current_dir().unwrap_or_default());
            std::process::exit(1);
        }
    };

    println!("🔌 Verbinde mit Datenbank: {:?}", db_path);
    let mut conn = Connection::open(&db_path).expect("Konnte Datenbank nicht öffnen");

    match import_backgrounds(&mut conn) {
        Ok(()) => println!("\n✅ Erfolgreich abgeschlossen!"),
        Err(e) => {
            eprintln!("\n❌ Fehler: {}", e);
            std::process::exit(1);
        }
    }
}
