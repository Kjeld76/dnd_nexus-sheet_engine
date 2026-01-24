// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod core;
mod commands;
mod menu;
mod tools;
mod types;
mod error;
mod rag;


use tauri::Manager;

fn main() {
    let result = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app: &mut tauri::App| {
            // 1. Logging initialisieren (so früh wie möglich)
            if let Err(e) = commands::logging::init_logging(app.handle()) {
                eprintln!("Konnte Logging nicht initialisieren: {}", e);
            }

            // Menü initialisieren
            let menu = menu::build_menu(app.handle())?;
            app.set_menu(menu)?;
            
            app.on_menu_event(move |app, event| {
                menu::handle_menu_event(app, event);
            });

            // ... (menu setup)

            // Datenbank initialisieren
            match db::init_database(app.handle()) {
                Ok(database) => {
                    app.manage(database);
                }
                Err(e) => {
                    let err_msg = format!("Datenbank-Fehler: {}\n\nDie Anwendung muss beendet werden.", e);
                    eprintln!("{}", err_msg);
                    
                    // Zeige nativen Fehler-Dialog
                    use tauri_plugin_dialog::DialogExt;
                    app.dialog()
                        .message(&err_msg)
                        .title("D&D Nexus - Startfehler")
                        .kind(tauri_plugin_dialog::MessageDialogKind::Error)
                        .show(|_| {
                            std::process::exit(1);
                        });
                    
                    // Sicherheitshalber (falls Dialog nicht blockiert oder asynchron ist)
                    // In Tauri 2 ist .show() asynchron für Mobile, aber auf Desktop oft blockierend oder via Callback.
                }
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![


            commands::character::create_character,
            commands::character::get_character,
            commands::character::update_character,
            commands::character::delete_character,
            commands::character::list_characters,
            commands::character::get_character_inventory,
            commands::character::update_inventory_item,
            commands::character::get_character_spells,
            commands::character::update_spell_preparation,
            commands::character::get_class_starting_equipment_options,
            commands::character::get_starting_equipment,
            commands::character::clear_starting_equipment,
            commands::character::apply_background_starting_equipment,
            commands::homebrew::upsert_custom_spell,
            commands::homebrew::upsert_custom_weapon,
            commands::homebrew::upsert_custom_armor,
            commands::homebrew::upsert_custom_item,
            commands::homebrew::upsert_custom_magic_item,
            commands::homebrew::upsert_custom_species,
            commands::homebrew::upsert_custom_class,
            commands::homebrew::upsert_custom_feat,
            commands::homebrew::upsert_custom_background,
            commands::homebrew::delete_custom_entry,
            commands::features::get_class_features,
            commands::features::create_custom_class_feature,
            commands::subclasses::get_subclasses,
            commands::pdf::export_character_pdf,
            commands::pdf::save_pdf_bytes,
            commands::files::backup_database,
            commands::files::import_character,
            commands::files::export_character,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::compendium::get_all_spells,
            commands::compendium::get_all_species,
            commands::compendium::get_all_classes,
            commands::compendium::get_all_gear,
            commands::compendium::get_all_tools,
            commands::compendium::get_all_weapons,
            commands::compendium::get_all_armor,
            commands::compendium::get_all_feats,
            commands::compendium::get_all_skills,
            commands::compendium::get_all_backgrounds,
            commands::compendium::get_all_items,
            commands::compendium::get_feature_options,
            commands::compendium::get_all_feature_options,
            commands::compendium::get_all_equipment,
            commands::compendium::get_all_magic_items,
            commands::compendium::get_weapons_minimal,
            commands::compendium::get_items_minimal,
            commands::compendium::get_spells_minimal,
            commands::logging::write_log,
            commands::logging::export_logs,
            commands::logging::read_logs,
            db::seed::import_phb_data,
            commands::rag::extract_rule_context,

            db::validation::run_schema_validation,
            tools::data_validator::validate_core_compendium,
        ])
        .run(tauri::generate_context!());

    if let Err(e) = result {
        eprintln!("Error while running tauri application: {}", e);
        std::process::exit(1);
    }
}

