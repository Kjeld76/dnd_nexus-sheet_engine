// Wendet manuelle Korrekturen auf extrahierte Hintergründe an

import fs from 'fs/promises';
import path from 'path';
import { identifyBackground } from './background-lookup';

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

async function applyCorrections() {
  const extractedPath = path.resolve('archive/tools/data_extraction/intermediate_data/extracted_backgrounds_complete.json');
  const correctionsPath = path.resolve('scripts/background-name-corrections.json');
  
  const data = JSON.parse(await fs.readFile(extractedPath, 'utf-8')) as Background[];
  let corrections: Record<string, string> = {};
  
  try {
    const correctionsData = JSON.parse(await fs.readFile(correctionsPath, 'utf-8'));
    corrections = correctionsData.corrections || {};
  } catch (e) {
    console.log('⚠️  Keine Korrekturen-Datei gefunden, erstelle sie...');
  }

  console.log('🔧 Wende Korrekturen an...\n');

  let corrected = 0;
  
  for (const bg of data) {
    if (!bg.ability_scores || bg.ability_scores.length !== 3 || !bg.feat) continue;
    
    const key = [
      [...bg.ability_scores].sort().join(','),
      bg.feat,
      bg.skills?.[0] || ''
    ].filter(Boolean).join('|');
    
    // Prüfe manuelle Korrekturen
    if (corrections[key]) {
      const correctName = corrections[key];
      if (bg.name !== correctName && correctName !== 'TODO: Welcher Hintergrund?') {
        console.log(`✅ Korrigiere: ${bg.name} → ${correctName}`);
        bg.name = correctName;
        bg.id = correctName.toLowerCase().replace(/[äöüß]/g, (m: string) => {
          const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
          return map[m] || m;
        }).replace(/[^a-z0-9]+/g, '-');
        corrected++;
      }
    } else {
      // Versuche automatische Identifikation
      const identified = identifyBackground(bg.ability_scores, bg.feat, bg.skills?.[0]);
      if (identified && bg.name !== identified) {
        console.log(`✅ Auto-Korrigiere: ${bg.name} → ${identified}`);
        bg.name = identified;
        bg.id = identified.toLowerCase().replace(/[äöüß]/g, (m: string) => {
          const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
          return map[m] || m;
        }).replace(/[^a-z0-9]+/g, '-');
        corrected++;
      }
    }
  }

  // Speichere korrigierte Daten
  await fs.writeFile(extractedPath, JSON.stringify(data, null, 2), 'utf-8');
  
  console.log(`\n✅ ${corrected} Hintergründe korrigiert`);
  console.log(`💾 Gespeichert in: ${extractedPath}`);
}

applyCorrections().catch(console.error);
