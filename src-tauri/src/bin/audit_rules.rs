#[path = "../rag/ingest.rs"]
mod ingest;
#[path = "../error.rs"]
mod error;

use ingest::extract_relevant_pages;
use std::path::Path;

fn main() {
    println!("--- AUDIT START ---");
    
    // Path resolution might be tricky relative to where we run. 
    // Assuming we run from src-tauri or root.
    // resources/books is in project root.
    // If running from src-tauri: ../resources/books
    let pdf_path = Path::new("../resources/books/D&D Spielerhandbuch (2024).pdf");
    
    if !pdf_path.exists() {
        eprintln!("PDF not found at {:?}", pdf_path.canonicalize());
        return;
    }

    println!(">>> TOPIC: Rüstungsklasse");
    match extract_relevant_pages(pdf_path, "Rüstungsklasse") {
        Ok(text) => println!("{}", text),
        Err(e) => eprintln!("Error: {}", e),
    }

    println!("\n>>> TOPIC: Attributsmodifikator");
    match extract_relevant_pages(pdf_path, "Attributsmodifikator") {
        Ok(text) => println!("{}", text),
        Err(e) => eprintln!("Error: {}", e),
    }
    
    println!("--- AUDIT END ---");
}
