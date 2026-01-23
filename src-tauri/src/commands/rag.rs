use crate::rag::ingest::extract_relevant_pages;
use std::path::Path;


#[tauri::command]
pub async fn extract_rule_context(topic: String) -> Result<String, String> {
    // For now, hardcode the path or make it configurable. 
    // The user rules say: "/daten/projects/dnd_nexus-sheet_engine/resources/books/D&D Spielerhandbuch (2024).pdf"
    let pdf_path = Path::new("resources/books/D&D Spielerhandbuch (2024).pdf");
    
    if !pdf_path.exists() {
        return Err(format!("Rulebook not found at {:?}", pdf_path));
    }

    // This is a blocking operation (parsing 300 pages). 
    // In production, we'd want this async with progress or indexed.
    // For this 'Sage' tool usage, we spawn blocking.
    let topic_clone = topic.clone();
    let pdf_path_buf = pdf_path.to_path_buf();
    
    // Using simple extraction
    let result = tauri::async_runtime::spawn_blocking(move || {
        extract_relevant_pages(&pdf_path_buf, &topic_clone)
    }).await
      .map_err(|e| e.to_string())?  // JoinError -> String
      .map_err(|e| e.to_string())?; // AppError -> String

    Ok(result)
}
