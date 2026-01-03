# Prompt 10: PDF Export Command

```
Implement PDF export in src-tauri/src/commands/pdf.rs:

1. export_character_pdf(app: AppHandle, character_id: String) -> Result<String, String>
   - Load character from database
   - Render HTML template with character data
   - Create hidden WebView window
   - Use window.print_to_pdf()
   - Show save dialog
   - Save PDF to user-selected location
   - Return file path

2. Create HTML template function:
   - render_character_html(character: &Character) -> String
   - Professional layout with all character data
   - CSS for print media
   - A4 page size

3. Register command in main.rs
4. Add menu item: File → Export PDF
```




