import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

interface SectionMarker {
  name: string;
  index: number;
  context: string;
}

function fixEncoding(text: string): string {
  const ENCODING_FIXES: Record<string, string> = {
    'Ã¤': 'ä', 'Ã¶': 'ö', 'Ã¼': 'ü', 'ÃŸ': 'ß',
    'Ã„': 'Ä', 'Ã–': 'Ö', 'Ãœ': 'Ü',
    'Ã©': 'é', 'Ã¨': 'è', 'Â': '', 
    'â€"': '–', 'â€"': '—', 'â€™': "'", 
    'â€ž': '"', 'â€œ': '"'
  };
  let fixed = text;
  for (const [bad, good] of Object.entries(ENCODING_FIXES)) {
    fixed = fixed.replace(new RegExp(bad, 'g'), good);
  }
  return fixed;
}

async function analyzeStructure() {
  const docxPath = path.resolve('resources/books/D&D Spielerhandbuch (2024).docx');
  console.log('📖 Extrahiere Text aus DOCX...');
  const result = await mammoth.extractRawText({ path: docxPath });
  const text = fixEncoding(result.value);

  console.log(`✅ Text extrahiert (${text.length} Zeichen)\n`);

  // Markers für relevante Bereiche (verschiedene Varianten)
  const markerVariants = [
    { name: 'KAPITEL 6: AUSRÜSTUNG', variants: ['KAPITEL 6', 'KAPITEL 6:', 'KAPITEL 6: AUSRÜSTUNG', 'KAPITEL 6 AUSRÜSTUNG'] },
    { name: 'WERKZEUGE', variants: ['WERKZEUGE', 'WERKZEUG', 'WERKZEUGE', 'WERKZEUGPROFICIENCY'] },
    { name: 'ABENTEUERAUSRÜSTUNG', variants: ['ABENTEUERAUSRÜSTUNG', 'ABENTEURER AUSRÜSTUNG', 'ABENTEUER AUSRÜSTUNG'] },
    { name: 'STANDARD-AUSRÜSTUNG', variants: ['STANDARD-AUSRÜSTUNG', 'STANDARD AUSRÜSTUNG', 'STANDARDAUSRÜSTUNG'] },
    { name: 'AUSRÜSTUNGSPAKETE', variants: ['AUSRÜSTUNGSPAKETE', 'AUSRÜSTUNG PAKETE', 'AUSRÜSTUNGSPAKET'] },
    { name: 'BÜRGERAUSRÜSTUNG', variants: ['BÜRGERAUSRÜSTUNG', 'BÜRGER AUSRÜSTUNG'] },
    { name: 'KRIEGERAUSRÜSTUNG', variants: ['KRIEGERAUSRÜSTUNG', 'KRIEGER AUSRÜSTUNG'] },
    { name: 'KUNDSCHAFTERAUSRÜSTUNG', variants: ['KUNDSCHAFTERAUSRÜSTUNG', 'KUNDSCHAFTER AUSRÜSTUNG'] },
    { name: 'KAPITEL 7:', variants: ['KAPITEL 7:', 'KAPITEL 7', 'KAPITEL 7:'] }
  ];

  console.log('📍 Marker-Positionen (mit Varianten):\n');
  const markerPositions: SectionMarker[] = [];
  for (const markerGroup of markerVariants) {
    let found = false;
    for (const variant of markerGroup.variants) {
      // Suche mit verschiedenen Kontexten
      const patterns = [
        variant,
        `\n${variant}\n`,
        `\n${variant} `,
        ` ${variant}\n`,
        `${variant}:`,
        `\n${variant}:`
      ];
      
      for (const pattern of patterns) {
        const index = text.indexOf(pattern);
        if (index !== -1) {
          const context = text.substring(index, Math.min(index + 200, text.length));
          markerPositions.push({ name: markerGroup.name, index, context: context.split('\n').slice(0, 5).join('\n') });
          console.log(`${markerGroup.name}:`);
          console.log(`  Position: ${index} (Pattern: "${pattern}")`);
          console.log(`  Kontext: ${context.substring(0, 150)}...\n`);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      console.log(`${markerGroup.name}: NICHT GEFUNDEN (Variants: ${markerGroup.variants.join(', ')})\n`);
    }
  }

  // Finde Bereich für Werkzeuge (Seite 220-221) - suche nach bekannten Tool-Namen
  console.log('\n🔍 Analyse: Werkzeuge-Bereich (Seite 220-221)\n');
  const toolNames = ['ALCHEMISTENAUSRÜSTUNG', 'SCHMIEDEWERKZEUG', 'DIEBESWERKZEUG', 'BRAUERZUBEHÖR'];
  let werkzeugeMarker = -1;
  for (const toolName of toolNames) {
    const index = text.indexOf(toolName);
    if (index !== -1 && index > 100000 && index < 700000) { // Zwischen Anfang und Kapitel 7
      werkzeugeMarker = index;
      console.log(`  → "${toolName}" gefunden bei Position ${index}`);
      const context = text.substring(Math.max(0, index - 200), Math.min(index + 500, text.length));
      console.log(`    Kontext: ${context.substring(0, 300)}...\n`);
      break;
    }
  }
  
  if (werkzeugeMarker === -1) {
    console.log('  ⚠️  Werkzeuge-Bereich nicht eindeutig gefunden\n');
  } else {
    const werkzeugeSection = text.substring(werkzeugeMarker, werkzeugeMarker + 5000);
    console.log('Erste 2000 Zeichen:');
    console.log(werkzeugeSection.substring(0, 2000));
    console.log('\n...\n');
  }

  // Finde Bereich für Items (Seite 221+)
  const ausruestungMarker = markerPositions.find(m => m.name === 'ABENTEUERAUSRÜSTUNG')?.index || -1;
  const kapitel7Marker = markerPositions.find(m => m.name === 'KAPITEL 7:')?.index || -1;
  const kapitel6Marker = markerPositions.find(m => m.name === 'KAPITEL 6: AUSRÜSTUNG')?.index || -1;
  
  if (ausruestungMarker !== -1) {
    const endIndex = kapitel7Marker !== -1 ? kapitel7Marker : (kapitel6Marker !== -1 ? kapitel6Marker : ausruestungMarker + 50000);
    console.log('\n🔍 Analyse: Items/Equipment-Bereich (zwischen ABENTEUERAUSRÜSTUNG und KAPITEL 7)\n');
    console.log(`  Start: ${ausruestungMarker}`);
    console.log(`  Ende: ${endIndex}`);
    console.log(`  Länge: ${endIndex - ausruestungMarker} Zeichen\n`);
    
    const itemsSection = text.substring(ausruestungMarker, endIndex);
    console.log('Erste 3000 Zeichen:');
    console.log(itemsSection.substring(0, 3000));
    console.log('\n...\n');

    // Suche nach Tabellen-Struktur
    console.log('📊 Tabellen-Struktur-Analyse:\n');
    const lines = itemsSection.split('\n');
    
    // Pattern aus extract-gear.ts verwenden (globale Suche)
    console.log('Pattern 1: Name + Gewicht + Kosten (aus extract-gear.ts)\n');
    const gearLineRegex = /^([A-ZÄÖÜßa-z\s(),-]{3,})\s+([\d,]+|Variiert|-)\s*(?:kg)?\s+(\d+)\s*(GM|SM|KM)$/gm;
    let match;
    let tableRows1 = 0;
    const matches: Array<{ line: string; index: number }> = [];
    while ((match = gearLineRegex.exec(itemsSection)) !== null) {
      const line = match[0].trim();
      tableRows1++;
      if (tableRows1 <= 20) {
        matches.push({ line, index: match.index });
        console.log(`  Position ${match.index}: ${line.substring(0, 120)}`);
      }
    }
    console.log(`  → ${tableRows1} mögliche Tabellen-Zeilen gefunden\n`);
    
    // Zeige Kontext um erste Treffer
    if (matches.length > 0) {
      console.log('Kontext um erste Treffer:\n');
      for (const m of matches.slice(0, 3)) {
        const startIdx = Math.max(0, m.index - 200);
        const endIdx = Math.min(itemsSection.length, m.index + 300);
        const context = itemsSection.substring(startIdx, endIdx);
        const lines = context.split('\n');
        console.log(`  Um Position ${m.index}:`);
        console.log(`    ${lines.slice(-3, -1).join('\n    ')}`);
        console.log(`    >>> ${m.line} <<<`);
        console.log(`    ${lines[lines.length - 1]?.substring(0, 100)}...\n`);
      }
    }
    
    // Pattern 2: Name (Kosten) Format (z.B. "Alchemistenfeuer (25 GM)")
    console.log('Pattern 2: Name (Kosten) Format (z.B. "Alchemistenfeuer (25 GM)")\n');
    let tableRows2 = 0;
    const tablePattern2 = /^([A-ZÄÖÜßa-zäöüß\s(),-]{3,})\s*\((\d+)\s*(GM|SM|KM)\)/;
    for (let i = 0; i < Math.min(500, lines.length); i++) {
      const line = lines[i].trim();
      const match = line.match(tablePattern2);
      if (match) {
        tableRows2++;
        if (tableRows2 <= 10) {
          console.log(`  Zeile ${i}: ${line.substring(0, 120)}`);
        }
      }
    }
    console.log(`  → ${tableRows2} mögliche Tabellen-Zeilen gefunden\n`);
    
    // Pattern 3: Einfache Item-Zeilen (Name allein, dann Kosten/Gewicht in nächsten Zeilen)
    console.log('Pattern 3: Item-Namen (großgeschrieben, keine Zahlen)\n');
    let itemNames = 0;
    const itemNamePattern = /^[A-ZÄÖÜß][A-ZÄÖÜßa-zäöüß\s(),-]{2,}$/;
    const excludedPatterns = /^(KAPITEL|ABENTEURER|STANDARD|AUSRÜSTUNG|GEWICHT|KOSTEN|NAME|SEITE|\d+)$/i;
    for (let i = 0; i < Math.min(500, lines.length); i++) {
      const line = lines[i].trim();
      if (line.match(itemNamePattern) && !line.match(excludedPatterns) && !line.match(/\d+\s*(GM|SM|KM)$/)) {
        itemNames++;
        if (itemNames <= 15) {
          const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
          const nextNextLine = i + 2 < lines.length ? lines[i + 2].trim() : '';
          console.log(`  Zeile ${i}: "${line}"`);
          if (nextLine) console.log(`    Nächste: "${nextLine.substring(0, 80)}"`);
          if (nextNextLine) console.log(`    Übernächste: "${nextNextLine.substring(0, 80)}"`);
        }
      }
    }
    console.log(`  → ${itemNames} mögliche Item-Namen gefunden\n`);
  }

  // Finde Bereich für Equipment-Pakete
  const paketeMarker = markerPositions.find(m => m.name === 'AUSRÜSTUNGSPAKETE')?.index || -1;
  const buergerMarker = markerPositions.find(m => m.name === 'BÜRGERAUSRÜSTUNG')?.index || -1;
  
  if (paketeMarker !== -1 || buergerMarker !== -1) {
    const startIndex = paketeMarker !== -1 ? paketeMarker : buergerMarker;
    console.log('\n🔍 Analyse: Equipment-Pakete-Bereich (Seite 221+)\n');
    const equipmentSection = text.substring(startIndex, startIndex + 8000);
    console.log('Erste 3000 Zeichen:');
    console.log(equipmentSection.substring(0, 3000));
    console.log('\n...\n');

    // Suche nach Equipment-Paket-Strukturen im gesamten Items-Bereich
    console.log('📦 Equipment-Paket-Struktur-Analyse:\n');
    const equipmentLines = itemsSection.split('\n');
    let currentPackage: { name: string; start: number; items: string[]; context: string[] } | null = null;
    const packages: Array<{ name: string; start: number; items: string[]; context: string[] }> = [];
    
    // Suche nach Paket-Markern (große Überschriften, "enthält", Listen)
    for (let i = 0; i < Math.min(2000, equipmentLines.length); i++) {
      const line = equipmentLines[i].trim();
      const upperLine = line.toUpperCase();
      
      // Paket-Header erkennen (große Überschrift, z.B. "BÜRGERAUSRÜSTUNG", "KRIEGERAUSRÜSTUNG")
      const packageHeaderPattern = /^(BÜRGER|KRIEGER|KUNDSCHAFTER|GELEHRTEN|GEWÖLBE|EINBRECHER|ENTDECKER|PRIESTER|DIPLOMATEN|ABENTEURER)[A-ZÄÖÜß\s-]*AUSRÜSTUNG/i;
      if (upperLine.match(packageHeaderPattern) || (upperLine.match(/^[A-ZÄÖÜß\s-]{10,}$/) && !upperLine.includes('KAPITEL') && !upperLine.includes('ABENTEURER') && !upperLine.includes('STANDARD'))) {
        if (currentPackage) {
          packages.push(currentPackage);
        }
        currentPackage = { name: line, start: i, items: [], context: [line] };
        console.log(`Paket gefunden bei Zeile ${i}: "${line}"`);
      }
      
      // Item-Listen erkennen
      if (currentPackage) {
        // Pattern 1: Bullet Points / Aufzählungen
        if (line.match(/^[-•·]\s+[A-ZÄÖÜßa-zäöüß]/) || line.match(/^\d+\.\s+[A-ZÄÖÜßa-zäöüß]/)) {
          const itemName = line.replace(/^[-•·\d.\s]+/, '').trim();
          if (itemName.length > 2 && !itemName.match(/^[A-Z\s]{15,}$/)) {
            currentPackage.items.push(itemName);
            currentPackage.context.push(line);
          }
        }
        
        // Pattern 2: "enthält:" oder "Dieses Paket enthält:"
        if (line.toLowerCase().includes('enthält:') || line.toLowerCase().includes('enthalt:') || line.toLowerCase().includes('paket enthält')) {
          currentPackage.context.push(line);
          // Nächste Zeilen sind Items
          for (let j = i + 1; j < Math.min(i + 30, equipmentLines.length); j++) {
            const nextLine = equipmentLines[j].trim();
            if (nextLine.length === 0) continue;
            if (nextLine.match(/^[-•·\d.\s]+[A-ZÄÖÜßa-zäöüß]/)) {
              const itemName = nextLine.replace(/^[-•·\d.\s]+/, '').trim();
              if (itemName.length > 2 && !itemName.match(/^[A-Z\s]{15,}$/)) {
                currentPackage.items.push(itemName);
              }
            } else if (nextLine.match(/^[A-ZÄÖÜß\s]{10,}$/)) {
              // Neue Überschrift = Paket-Ende
              break;
            } else if (!nextLine.match(/^\d+\s*(GM|SM|KM)/)) {
              // Kein Item, aber auch keine Überschrift = möglicherweise Beschreibung
              currentPackage.context.push(nextLine);
            }
          }
        }
        
        // Paket-Ende erkennen (neue Überschrift oder leere Zeile + Überschrift)
        if (i > currentPackage.start + 30 && upperLine.match(/^[A-ZÄÖÜß\s-]{10,}$/) && !line.toLowerCase().includes('enthält')) {
          packages.push(currentPackage);
          currentPackage = null;
        }
      }
    }
    
    if (currentPackage) {
      packages.push(currentPackage);
    }
    
    console.log(`\n  → ${packages.length} Equipment-Pakete gefunden:\n`);
    for (const pkg of packages.slice(0, 10)) {
      console.log(`  ${pkg.name} (Zeile ${pkg.start}, ${pkg.items.length} Items):`);
      console.log(`    Items: ${pkg.items.slice(0, 5).join(', ')}${pkg.items.length > 5 ? '...' : ''}`);
      if (pkg.context.length > 1) {
        console.log(`    Kontext: ${pkg.context.slice(1, 3).join(' | ').substring(0, 100)}...`);
      }
      console.log('');
    }
  }

  // Potenzielle Probleme identifizieren
  console.log('\n⚠️  Potenzielle Probleme-Analyse:\n');
  
  // Seitenzahlen erkennen
  const pageNumbers = text.match(/\n\d+\n/g);
  if (pageNumbers) {
    console.log(`📄 Seitenzahlen gefunden: ${pageNumbers.length} (können Struktur unterbrechen)`);
    const pageNumbersInSection = text.substring(
      ausruestungMarker,
      Math.min(ausruestungMarker + 15000, text.length)
    ).match(/\n\d+\n/g);
    if (pageNumbersInSection) {
      console.log(`  Im Items/Equipment-Bereich: ${pageNumbersInSection.length} Seitenzahlen\n`);
    }
  }

  // Leere Zeilen-Bereiche (mögliche Bilder/Tabellen)
  const emptyLinePattern = /\n\n\n+/g;
  let emptyMatch;
  let emptyAreas = 0;
  while ((emptyMatch = emptyLinePattern.exec(text)) !== null) {
    if (emptyMatch[0].length > 10) {
      emptyAreas++;
      if (emptyAreas <= 5) {
        const pos = emptyMatch.index;
        const contextBefore = text.substring(Math.max(0, pos - 100), pos);
        const contextAfter = text.substring(pos, Math.min(pos + emptyMatch[0].length + 100, text.length));
        console.log(`⚠️  Leerer Bereich gefunden bei Position ${pos} (${emptyMatch[0].length} Zeilen)`);
        console.log(`  Davor: ${contextBefore.split('\n').pop()?.substring(0, 80)}...`);
        console.log(`  Danach: ${contextAfter.split('\n').find(l => l.trim().length > 0)?.substring(0, 80)}...\n`);
      }
    }
  }
  if (emptyAreas > 5) {
    console.log(`  → Insgesamt ${emptyAreas} leere Bereiche gefunden (mögliche Bilder/Tabellen)\n`);
  }

  // Speichere Analyse-Ergebnisse
  const analysis = {
    markers: markerPositions,
    textLength: text.length,
    hasWerkzeuge: werkzeugeMarker !== -1,
    hasAusruestung: ausruestungMarker !== -1,
    hasStandard: false,
    hasPakete: paketeMarker !== -1 || buergerMarker !== -1,
    pageNumbers: pageNumbers?.length || 0,
    emptyAreas
  };

  await fs.writeFile('scripts/debug-items-equipment-analysis.json', JSON.stringify(analysis, null, 2));
  console.log('\n✅ Analyse gespeichert: scripts/debug-items-equipment-analysis.json');

  // Extrahiere relevante Text-Abschnitte für manuelle Inspektion
  const relevantText: Record<string, string> = {};
  
  if (werkzeugeMarker !== -1) {
    relevantText['werkzeuge'] = text.substring(werkzeugeMarker, Math.min(werkzeugeMarker + 5000, text.length));
  }
  if (ausruestungMarker !== -1) {
    relevantText['items'] = text.substring(ausruestungMarker, Math.min(ausruestungMarker + 10000, text.length));
  }
  if (buergerMarker !== -1 || paketeMarker !== -1) {
    const start = paketeMarker !== -1 ? paketeMarker : buergerMarker;
    relevantText['equipment'] = text.substring(start, Math.min(start + 8000, text.length));
  }

  await fs.writeFile('scripts/debug-items-equipment-text.json', JSON.stringify(relevantText, null, 2));
  console.log('✅ Relevante Text-Abschnitte gespeichert: scripts/debug-items-equipment-text.json\n');
}

analyzeStructure().catch(console.error);
