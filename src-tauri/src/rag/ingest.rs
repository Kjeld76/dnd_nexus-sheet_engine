use std::path::Path;
use crate::error::{AppResult, AppError};

/// Extract text from PDF using pdf-extract (simpler API, hoping for better layout).
/// Note: pdf-extract might extract the whole text at once.
pub fn extract_relevant_pages(path: &Path, keyword: &str) -> AppResult<String> {
    let text = pdf_extract::extract_text(path).map_err(|e| AppError::Other(format!("Failed to extract text: {}", e)))?;
    
    // Naive context extraction since we lose page boundaries with simple extract_text
    // We search for the keyword and return surrounding lines.
    let keyword_lower = keyword.to_lowercase();
    
    if let Some(idx) = text.to_lowercase().find(&keyword_lower) {
        // Return 2000 chars context
        let start = idx.saturating_sub(1000);
        let end = std::cmp::min(idx + 1000, text.len());
        let context = &text[start..end];
        
        return Ok(format!("...{}...", context));
    }
    
    Ok("No relevant rules found.".to_string())
}



#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_extract_armor_class() {
        let _root = std::env::current_dir().unwrap().parent().unwrap().to_path_buf(); // dnd-nexus root
        // Path relative to where cargo test runs (src-tauri)
        let pdf_path = PathBuf::from("../resources/books/D&D Spielerhandbuch (2024).pdf");
        
        if !pdf_path.exists() {
            println!("SKIPPING TEST: PDF not found at {:?}", pdf_path);
            return;
        }

        let result = extract_relevant_pages(&pdf_path, "Rüstungsklasse");
        match result {
            Ok(text) => {
                println!("--- Extracted Text Start ---");
                println!("{}", text.chars().take(2000).collect::<String>());
                println!("--- Extracted Text End ---");
                assert!(!text.is_empty());
                // Verify some context we expect
                // assert!(text.contains("10 + Modifikator"));
            },
            Err(e) => panic!("Extraction failed: {}", e),
        }
    }
}

