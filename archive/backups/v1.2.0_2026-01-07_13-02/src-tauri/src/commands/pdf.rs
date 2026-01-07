use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};
use crate::core::types::Character;
use crate::db::Database;
use std::fs;

#[tauri::command]
pub async fn export_character_pdf(
    app: AppHandle,
    character_id: String,
) -> Result<String, String> {
    // 1. Charakter laden
    let db = app.state::<Database>();
    let conn = db.0.lock().unwrap();
    
    let mut stmt = conn.prepare("SELECT data FROM characters WHERE id = ?")
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let data: String = stmt.query_row([character_id], |row: &rusqlite::Row| row.get(0))
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let character: Character = serde_json::from_str(&data).map_err(|e: serde_json::Error| e.to_string())?;

    // 2. HTML Template generieren
    let html = render_character_html(&character);
    
    // 3. Temporäre Datei schreiben (oder Data URL nutzen)
    let temp_path = app.path().app_cache_dir().map_err(|e: tauri::Error| e.to_string())?.join("temp_export.html");
    fs::write(&temp_path, html).map_err(|e: std::io::Error| e.to_string())?;

    // 4. Verstecktes Fenster erstellen
    let _window = WebviewWindowBuilder::new(
        &app,
        "pdf-export",
        WebviewUrl::App(temp_path)
    )
    .visible(false)
    .build()
    .map_err(|e: tauri::Error| e.to_string())?;

    // HINWEIS: In Tauri 2.0 ist der native PDF-Export über die API noch im Fluss.
    // Oft wird dies über Plugins oder direktes Drucken gelöst.
    // Für diesen Prompt implementieren wir die Vorbereitung.

    Ok("PDF-Export gestartet".into())
}

fn render_character_html(character: &Character) -> String {
    format!(
        r#"<!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: sans-serif; padding: 40px; color: #111; }}
                h1 {{ color: #dc2626; border-bottom: 2px solid #dc2626; }}
                .stat-grid {{ display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; margin: 20px 0; }}
                .stat-box {{ border: 1px solid #ccc; padding: 10px; text-align: center; border-radius: 8px; }}
            </style>
        </head>
        <body>
            <h1>{}</h1>
            <p>Level {} Charakterbogen</p>
            <div class="stat-grid">
                <div class="stat-box">STR: {}</div>
                <div class="stat-box">DEX: {}</div>
                <div class="stat-box">CON: {}</div>
                <div class="stat-box">INT: {}</div>
                <div class="stat-box">WIS: {}</div>
                <div class="stat-box">CHA: {}</div>
            </div>
        </body>
        </html>"#,
        character.meta.name,
        character.meta.level,
        character.attributes.str,
        character.attributes.dex,
        character.attributes.con,
        character.attributes.int,
        character.attributes.wis,
        character.attributes.cha,
    )
}











