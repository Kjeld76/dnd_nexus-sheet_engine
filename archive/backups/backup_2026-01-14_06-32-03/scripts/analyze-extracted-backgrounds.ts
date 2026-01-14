// Analysiert alle extrahierten Hintergründe und zeigt sie strukturiert
// Damit kannst du sie den richtigen Namen zuordnen

import fs from 'fs/promises';
import path from 'path';

interface Background {
  id: string;
  name: string;
  ability_scores?: string[];
  feat?: string;
  skills?: string[];
  tool?: string;
  starting_equipment?: {
    options: Array<{
      label: string;
      items: string[] | null;
      gold: number | null;
    }>;
  };
  description?: string;
}

async function analyzeExtracted() {
  const extractedPath = path.resolve('archive/tools/data_extraction/intermediate_data/extracted_backgrounds_complete.json');
  const data = JSON.parse(await fs.readFile(extractedPath, 'utf-8')) as Background[];

  console.log('📊 Analysiere extrahierte Hintergründe:\n');
  console.log('='.repeat(100));

  // Gruppiere nach eindeutigen Merkmalen
  const grouped = new Map<string, Background[]>();
  
  data.forEach(bg => {
    if (!bg.ability_scores || bg.ability_scores.length !== 3 || !bg.feat) return;
    
    const key = [
      [...bg.ability_scores].sort().join(','),
      bg.feat,
      bg.skills?.[0] || ''
    ].filter(Boolean).join('|');
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(bg);
  });

  console.log(`\n✅ ${grouped.size} eindeutige Hintergrund-Kombinationen gefunden\n`);

  let idx = 1;
  for (const [key, backgrounds] of grouped.entries()) {
    const bg = backgrounds[0]; // Nimm den ersten als Beispiel
    
    console.log(`\n${idx}. ${bg.name || '❓ UNBEKANNT'}`);
    console.log('   ─'.repeat(50));
    console.log(`   Attributswerte: ${bg.ability_scores?.sort().join(', ')}`);
    console.log(`   Talent: ${bg.feat}`);
    console.log(`   Fertigkeiten: ${bg.skills?.join(', ') || 'N/A'}`);
    console.log(`   Werkzeug: ${bg.tool || 'N/A'}`);
    
    if (bg.starting_equipment?.options) {
      bg.starting_equipment.options.forEach(opt => {
        const itemsStr = opt.items ? opt.items.slice(0, 4).join(', ') + (opt.items.length > 4 ? '...' : '') : 'keine';
        const goldStr = opt.gold ? `${opt.gold} GM` : 'kein Gold';
        console.log(`   Option ${opt.label}: ${itemsStr} + ${goldStr}`);
      });
    }
    
    if (backgrounds.length > 1) {
      console.log(`   ⚠️  DUPLIKAT: ${backgrounds.length}x gefunden`);
    }
    
    console.log(`   Lookup-Key: ${key}`);
    console.log(`   Vorschlag: Füge in background-lookup.ts ein:`);
    console.log(`     "${key}": "${bg.name || 'UNBEKANNT_ERKENNEN'}",`);
    
    idx++;
  }

  console.log('\n' + '='.repeat(100));
  console.log(`\n💡 Erwartete Hintergründe (alphabetisch):`);
  const expected = [
    'Adeliger', 'Akolyth', 'Bauer', 'Einsiedler', 'Händler',
    'Handwerker', 'Krimineller', 'Reisender', 'Scharlatan', 'Schreiber',
    'Seemann', 'Soldat', 'Unterhaltungskünstler', 'Wache', 'Wegfinder', 'Weiser'
  ];
  expected.forEach(name => {
    const found = Array.from(grouped.values()).some(bgs => 
      bgs.some(bg => bg.name.toLowerCase() === name.toLowerCase())
    );
    console.log(`   ${found ? '✅' : '❌'} ${name}`);
  });
}

analyzeExtracted().catch(console.error);
