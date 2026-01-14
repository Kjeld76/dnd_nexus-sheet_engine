import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

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

async function analyzeEquipmentStructure() {
  const docxPath = path.resolve('resources/books/D&D Spielerhandbuch (2024).docx');
  console.log('📖 Extrahiere Text aus DOCX...');
  const result = await mammoth.extractRawText({ path: docxPath });
  const text = fixEncoding(result.value);
  console.log(`✅ Text extrahiert (${text.length} Zeichen)\n`);

  // Finde Bereich für Items/Equipment
  const ausruestungMarker = text.indexOf('ABENTEUERAUSRÜSTUNG');
  const kapitel7Marker = text.indexOf('KAPITEL 7');
  
  if (ausruestungMarker === -1) {
    console.error('❌ ABENTEUERAUSRÜSTUNG nicht gefunden');
    return;
  }

  const endIndex = kapitel7Marker !== -1 ? kapitel7Marker : text.length;
  const itemsSection = text.substring(ausruestungMarker, endIndex);
  console.log(`📋 Items/Equipment-Bereich: ${itemsSection.length} Zeichen\n`);

  // Bekannte Equipment-Paket-Namen
  const equipmentPackageNames = [
    'BÜRGERAUSRÜSTUNG',
    'KRIEGERAUSRÜSTUNG',
    'KUNDSCHAFTERAUSRÜSTUNG',
    'GELEHRTENAUSRÜSTUNG',
    'GEWÖLBEFORSCHERAUSRÜSTUNG',
    'EINBRECHERAUSRÜSTUNG',
    'ENTDECKERAUSRÜSTUNG',
    'PRIESTERAUSRÜSTUNG',
    'DIPLOMATENAUSRÜSTUNG'
  ];

  console.log('🔍 Suche nach Equipment-Paketen...\n');

  for (const pkgName of equipmentPackageNames) {
    // Suche nach verschiedenen Varianten
    const variants = [
      pkgName,
      pkgName.replace('AUSRÜSTUNG', ' AUSRÜSTUNG'),
      pkgName.toLowerCase(),
      pkgName.toLowerCase().replace('ausrüstung', ' ausrüstung')
    ];

    for (const variant of variants) {
      const index = itemsSection.indexOf(variant);
      if (index !== -1) {
        console.log(`\n📦 ${pkgName}:`);
        console.log(`   Gefunden bei Position ${index} (Variante: "${variant}")`);
        
        // Extrahiere Text um dieses Paket (5000 Zeichen nach dem Fund)
        const startIdx = index;
        const endIdx = Math.min(startIdx + 5000, itemsSection.length);
        const packageText = itemsSection.substring(startIdx, endIdx);
        
        // Zeige die ersten 2000 Zeichen
        console.log(`\n   Text-Kontext (erste 2000 Zeichen):`);
        console.log('   ' + '─'.repeat(80));
        const lines = packageText.split('\n');
        for (let i = 0; i < Math.min(100, lines.length); i++) {
          const line = lines[i];
          if (line.trim().length > 0) {
            console.log(`   ${i.toString().padStart(3, ' ')}: ${line.substring(0, 100)}`);
          } else {
            console.log(`   ${i.toString().padStart(3, ' ')}: (leere Zeile)`);
          }
        }
        console.log('   ' + '─'.repeat(80));
        
        // Analysiere Struktur
        console.log(`\n   Struktur-Analyse:`);
        
        // Suche nach "enthält" oder ähnlichen Markern
        const enthaeltIndex = packageText.toLowerCase().indexOf('enthält');
        if (enthaeltIndex !== -1) {
          console.log(`   ✅ "enthält" gefunden bei Position ${enthaeltIndex} (relativ zum Paket-Start)`);
          const enthaeltText = packageText.substring(enthaeltIndex, Math.min(enthaeltIndex + 500, packageText.length));
          console.log(`   Kontext: ${enthaeltText.substring(0, 200)}...`);
        } else {
          console.log(`   ⚠️  "enthält" nicht gefunden`);
        }
        
        // Suche nach Bullet Points / Aufzählungen
        const bulletLines = lines.filter((line, idx) => 
          idx < 100 && (line.match(/^[-•·]\s+/) || line.match(/^\d+\.\s+/))
        );
        if (bulletLines.length > 0) {
          console.log(`   ✅ ${bulletLines.length} Zeilen mit Bullet Points gefunden:`);
          bulletLines.slice(0, 10).forEach((line, idx) => {
            console.log(`      ${idx + 1}. ${line.substring(0, 80)}`);
          });
        } else {
          console.log(`   ⚠️  Keine Bullet Points gefunden`);
        }
        
        // Suche nach Item-Namen (bekannte Items aus dem Regelwerk)
        const knownItems = ['Laterne', 'Seil', 'Rucksack', 'Kleidung', 'Gürteltasche', 'Fackel', 'Rationen'];
        const foundItems: Array<{ name: string; line: number }> = [];
        lines.slice(0, 100).forEach((line, idx) => {
          for (const item of knownItems) {
            if (line.includes(item) && !foundItems.some(f => f.name === item)) {
              foundItems.push({ name: item, line: idx });
            }
          }
        });
        if (foundItems.length > 0) {
          console.log(`   ✅ ${foundItems.length} bekannte Items gefunden:`);
          foundItems.forEach(item => {
            console.log(`      - ${item.name} (Zeile ${item.line})`);
          });
        }
        
        break; // Nur erste Variante verwenden
      }
    }
  }

  // Speichere Beispiel-Text für manuelle Inspektion
  console.log('\n\n💾 Speichere Beispiel-Text für manuelle Inspektion...');
  const examplePackages: Record<string, string> = {};
  
  for (const pkgName of equipmentPackageNames.slice(0, 3)) {
    const index = itemsSection.indexOf(pkgName);
    if (index !== -1) {
      const startIdx = index;
      const endIdx = Math.min(startIdx + 3000, itemsSection.length);
      examplePackages[pkgName] = itemsSection.substring(startIdx, endIdx);
    }
  }
  
  await fs.writeFile(
    'scripts/equipment-structure-examples.json',
    JSON.stringify(examplePackages, null, 2)
  );
  console.log('✅ Beispiel-Text gespeichert: scripts/equipment-structure-examples.json\n');
}

analyzeEquipmentStructure().catch(console.error);
