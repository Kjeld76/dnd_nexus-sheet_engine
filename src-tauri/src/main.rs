// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod core;
mod commands;
mod menu;
mod tools;
mod types;
mod error;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app: &mut tauri::App| {
            // Menü initialisieren
            let menu = menu::build_menu(app.handle())?;
            app.set_menu(menu)?;
            
            app.on_menu_event(move |app, event| {
                menu::handle_menu_event(app, event);
            });

            // Datenbank initialisieren
            let database = db::init_database(app.handle())?;
            app.manage(database);
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::character::create_character,
            commands::character::get_character,
            commands::character::update_character,
            commands::character::delete_character,
            commands::character::list_characters,
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
            commands::pdf::export_character_pdf,
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
            commands::compendium::get_all_equipment,
            commands::compendium::get_all_magic_items,
            // commands::logging::write_log,
            // commands::logging::export_logs,
            // commands::logging::read_logs,
            db::seed::import_phb_data,
            tools::data_validator::validate_core_compendium,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

