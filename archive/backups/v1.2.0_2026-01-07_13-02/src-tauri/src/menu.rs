use tauri::{
    menu::{Menu, MenuItem, Submenu},
    AppHandle, Emitter, Wry,
};

pub fn build_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    // File Menu
    let file_menu = Submenu::with_id(
        app,
        "file",
        "Datei",
        true,
    )?;
    
    file_menu.append(&MenuItem::with_id(app, "new", "Neu", true, Some("Control+N"))?)?;
    file_menu.append(&MenuItem::with_id(app, "open", "Öffnen", true, Some("Control+O"))?)?;
    file_menu.append(&MenuItem::with_id(app, "save", "Speichern", true, Some("Control+S"))?)?;
    file_menu.append(&tauri::menu::PredefinedMenuItem::separator(app)?)?;
    file_menu.append(&MenuItem::with_id(app, "export_pdf", "Export PDF", true, Some("Control+P"))?)?;
    file_menu.append(&MenuItem::with_id(app, "backup", "Datenbank-Backup", true, Some("Control+B"))?)?;
    file_menu.append(&tauri::menu::PredefinedMenuItem::separator(app)?)?;
    file_menu.append(&tauri::menu::PredefinedMenuItem::quit(app, Some("Beenden"))?)?;

    // Edit Menu
    let edit_menu = Submenu::with_id(
        app,
        "edit",
        "Bearbeiten",
        true,
    )?;
    edit_menu.append(&tauri::menu::PredefinedMenuItem::undo(app, Some("Rückgängig"))?)?;
    edit_menu.append(&tauri::menu::PredefinedMenuItem::redo(app, Some("Wiederholen"))?)?;
    edit_menu.append(&tauri::menu::PredefinedMenuItem::separator(app)?)?;
    edit_menu.append(&tauri::menu::PredefinedMenuItem::cut(app, Some("Ausschneiden"))?)?;
    edit_menu.append(&tauri::menu::PredefinedMenuItem::copy(app, Some("Kopieren"))?)?;
    edit_menu.append(&tauri::menu::PredefinedMenuItem::paste(app, Some("Einfügen"))?)?;

    // Database Menu
    let db_menu = Submenu::with_id(
        app,
        "database",
        "Datenbank",
        true,
    )?;
    db_menu.append(&MenuItem::with_id(app, "import_phb", "PHB Daten importieren", true, None::<&str>)?)?;
    db_menu.append(&MenuItem::with_id(app, "reset_db", "Auf Werkseinstellungen zurücksetzen", true, None::<&str>)?)?;

    let menu = Menu::with_id(app, "main")?;
    menu.append(&file_menu)?;
    menu.append(&edit_menu)?;
    menu.append(&db_menu)?;

    Ok(menu)
}

pub fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    match event.id.as_ref() {
        "new" => { let _ = app.emit("menu-new", ()); }
        "open" => { let _ = app.emit("menu-open", ()); }
        "save" => { let _ = app.emit("menu-save", ()); }
        "export_pdf" => { let _ = app.emit("menu-export-pdf", ()); }
        "backup" => { let _ = app.emit("menu-backup", ()); }
        "import_phb" => { let _ = app.emit("menu-import-phb", ()); }
        "reset_db" => { let _ = app.emit("menu-reset-db", ()); }
        _ => {}
    }
}
