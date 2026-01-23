#!/usr/bin/env tsx
/**
 * Prüft den CLASS_FEATURES_VERIFICATION_REPORT gegen das PHB 2024
 * Extrahiert relevante Klassen-Informationen aus der DOCX-Datei
 */

import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function parsePHB() {
  const docxPath = path.join(__dirname, '..', 'resources', 'books', 'D&D Spielerhandbuch (2024).docx');
  
  if (!fs.existsSync(docxPath)) {
    throw new Error(`DOCX-Datei nicht gefunden: ${docxPath}`);
  }

  console.log('Lese PHB 2024 DOCX...');
  const result = await mammoth.extractRawText({ path: docxPath });
  return result.value;
}

async function main() {
  try {
    const text = await parsePHB();
    
    // Suche nach Barbaren-Abschnitt
    const barbarMatch = text.match(/BARBAR[EN]?[\s\S]{0,5000}Level 3[\s\S]{0,2000}Unterklasse/i);
    if (barbarMatch) {
      console.log('Barbaren-Abschnitt gefunden:');
      console.log(barbarMatch[0].substring(0, 500));
    }
    
    // Speichere extrahierten Text für weitere Analyse
    const outputPath = path.join(__dirname, '..', 'phb_extracted_text.txt');
    fs.writeFileSync(outputPath, text, 'utf-8');
    console.log(`\nExtrahierten Text gespeichert: ${outputPath}`);
    console.log(`Textlänge: ${text.length} Zeichen`);
    
  } catch (error) {
    console.error('Fehler beim Parsen:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('verify_against_phb.ts')) {
  main();
}
