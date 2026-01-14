// Hilfsskript: Zeigt alle "Unbekannt" Hintergründe mit ihren Merkmalen
// Damit kannst du sie manuell den richtigen Namen zuordnen

import fs from 'fs/promises';
import path from 'path';

interface Background {
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
}

async function identifyUnknown() {
  const extractedPath = path.resolve('archive/tools/data_extraction/intermediate_data/extracted_backgrounds_complete.json');
  const data = JSON.parse(await fs.readFile(extractedPath, 'utf-8')) as Background[];

  console.log('🔍 Unbekannte Hintergründe:\n');
  console.log('='.repeat(80));

  const unknown = data.filter(bg => 
    bg.name === 'Unbekannt' && 
    bg.ability_scores && 
    bg.ability_scores.length === 3
  );

  unknown.forEach((bg, idx) => {
    console.log(`\n📋 Unbekannt #${idx + 1}:`);
    console.log(`   Attributswerte: ${bg.ability_scores?.sort().join(', ')}`);
    console.log(`   Talent: ${bg.feat || 'N/A'}`);
    console.log(`   Fertigkeiten: ${bg.skills?.join(', ') || 'N/A'}`);
    console.log(`   Werkzeug: ${bg.tool || 'N/A'}`);
    
    if (bg.starting_equipment?.options) {
      bg.starting_equipment.options.forEach(opt => {
        const itemsStr = opt.items ? opt.items.slice(0, 5).join(', ') : 'keine';
        const goldStr = opt.gold ? `${opt.gold} GM` : 'kein Gold';
        console.log(`   Option ${opt.label}: ${itemsStr}${opt.items && opt.items.length > 5 ? '...' : ''} + ${goldStr}`);
      });
    }
    
    // Generiere Lookup-Key für manuelle Zuordnung
    const key = [
      bg.ability_scores?.sort().join(','),
      bg.feat,
      bg.skills?.[0]
    ].filter(Boolean).join('|');
    console.log(`   Lookup-Key: ${key}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ ${unknown.length} unbekannte Hintergründe gefunden`);
  console.log('\n💡 Kopiere die Lookup-Keys und füge sie in background-lookup.ts ein!');
}

identifyUnknown().catch(console.error);
