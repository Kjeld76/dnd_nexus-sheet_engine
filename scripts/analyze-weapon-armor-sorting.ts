import * as fs from "fs";
import * as pdf from "pdf-parse";

const PDF_PATH = "./resources/books/D&D Spielerhandbuch (2024).pdf";

interface TableRow {
  name: string;
  cost?: string;
  damage?: string;
  weight?: string;
  properties?: string;
  ac?: string;
  stealth?: string;
  type?: string;
}

interface AnalyzedTable {
  title: string;
  page: number;
  headers: string[];
  rows: TableRow[];
  sortOrder: string[];
}

async function analyzePDF() {
  console.log("Lade PDF...");
  const dataBuffer = fs.readFileSync(PDF_PATH);
  const pdfData = await pdf(dataBuffer);

  console.log(`PDF geladen: ${pdfData.numpages} Seiten\n`);

  // Suche nach Waffen- und Rüstungstabellen
  // Typischerweise sind diese um Seite 200-250
  const pages = pdfData.text.split(/\f/);
  
  const results: AnalyzedTable[] = [];

  // Suche nach Waffentabellen
  console.log("=== Suche nach Waffentabellen ===");
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = i + 1;
    
    // Suche nach typischen Waffen-Keywords
    if (page.match(/Waffentabelle|Nahkampfwaffen|Fernkampfwaffen|Einfache Waffen|Kriegswaffen/i)) {
      console.log(`\nSeite ${pageNum}: Potenzielle Waffentabelle gefunden`);
      
      // Extrahiere Tabellenstruktur
      const lines = page.split("\n");
      let inTable = false;
      let headers: string[] = [];
      const rows: TableRow[] = [];
      
      for (const line of lines) {
        // Erkenne Tabellenkopf
        if (line.match(/Name|Kosten|Schaden|Gewicht|Eigenschaften/i) && !inTable) {
          inTable = true;
          headers = line.split(/\s{2,}|\t/).filter(h => h.trim().length > 0);
          console.log(`  Headers: ${headers.join(" | ")}`);
          continue;
        }
        
        if (inTable) {
          // Erkenne Tabellenzeilen (haben typischerweise mehrere Spalten)
          const parts = line.split(/\s{2,}|\t/).filter(p => p.trim().length > 0);
          if (parts.length >= 3 && parts[0].length > 2) {
            // Vermutlich eine Tabellenzeile
            const row: TableRow = { name: parts[0] };
            if (parts[1]) row.cost = parts[1];
            if (parts[2]) row.damage = parts[2];
            if (parts[3]) row.weight = parts[3];
            if (parts[4]) row.properties = parts[4];
            rows.push(row);
          }
          
          // Beende Tabelle wenn Leerzeile oder neuer Abschnitt
          if (line.trim().length === 0 && rows.length > 0) {
            break;
          }
        }
      }
      
      if (rows.length > 0) {
        console.log(`  Gefundene Zeilen: ${rows.length}`);
        results.push({
          title: "Waffentabelle",
          page: pageNum,
          headers,
          rows,
          sortOrder: extractSortOrder(rows),
        });
      }
    }
  }

  // Suche nach Rüstungstabellen
  console.log("\n=== Suche nach Rüstungstabellen ===");
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = i + 1;
    
    // Suche nach typischen Rüstungs-Keywords
    if (page.match(/Rüstungstabelle|Leichte Rüstung|Mittelschwere Rüstung|Schwere Rüstung|Schilde/i)) {
      console.log(`\nSeite ${pageNum}: Potenzielle Rüstungstabelle gefunden`);
      
      const lines = page.split("\n");
      let inTable = false;
      let headers: string[] = [];
      const rows: TableRow[] = [];
      
      for (const line of lines) {
        if (line.match(/Name|Kosten|Rüstungsklasse|Gewicht|Stealth/i) && !inTable) {
          inTable = true;
          headers = line.split(/\s{2,}|\t/).filter(h => h.trim().length > 0);
          console.log(`  Headers: ${headers.join(" | ")}`);
          continue;
        }
        
        if (inTable) {
          const parts = line.split(/\s{2,}|\t/).filter(p => p.trim().length > 0);
          if (parts.length >= 3 && parts[0].length > 2) {
            const row: TableRow = { name: parts[0] };
            if (parts[1]) row.cost = parts[1];
            if (parts[2]) row.ac = parts[2];
            if (parts[3]) row.weight = parts[3];
            if (parts[4]) row.stealth = parts[4];
            rows.push(row);
          }
          
          if (line.trim().length === 0 && rows.length > 0) {
            break;
          }
        }
      }
      
      if (rows.length > 0) {
        console.log(`  Gefundene Zeilen: ${rows.length}`);
        results.push({
          title: "Rüstungstabelle",
          page: pageNum,
          headers,
          rows,
          sortOrder: extractSortOrder(rows),
        });
      }
    }
  }

  // Speichere Analyse-Ergebnisse
  fs.writeFileSync(
    "./exports/weapon-armor-sorting-analysis.json",
    JSON.stringify(results, null, 2)
  );

  console.log("\n=== Analyse-Zusammenfassung ===");
  console.log(`Gefundene Tabellen: ${results.length}`);
  results.forEach((table, idx) => {
    console.log(`\n${idx + 1}. ${table.title} (Seite ${table.page})`);
    console.log(`   Sortierreihenfolge: ${table.sortOrder.join(" > ")}`);
    console.log(`   Anzahl Einträge: ${table.rows.length}`);
  });

  return results;
}

function extractSortOrder(rows: TableRow[]): string[] {
  // Analysiere die Reihenfolge der Einträge
  // Gruppiere nach Typen oder Kategorien
  const categories: string[] = [];
  let currentCategory = "";
  
  for (const row of rows) {
    // Versuche Kategorien zu erkennen (z.B. durch Einrückung, Formatierung, etc.)
    // Dies ist eine Heuristik - könnte verfeinert werden
    if (row.name.match(/^[A-ZÄÖÜ][a-zäöüß]+$/)) {
      // Möglicherweise eine Kategorie-Überschrift
      if (currentCategory) {
        categories.push(currentCategory);
      }
      currentCategory = row.name;
    }
  }
  
  if (currentCategory) {
    categories.push(currentCategory);
  }
  
  return categories.length > 0 ? categories : ["Alphabetisch"];
}

// Hauptfunktion
analyzePDF().catch(console.error);
