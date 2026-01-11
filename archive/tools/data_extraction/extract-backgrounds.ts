import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

interface Background {
  id: string;
  name: string;
  description: string;
  skill_proficiencies: string[];
  language_proficiencies?: string[];
  tool_proficiencies?: string[];
  feat_id?: string;
  starting_equipment?: {
    gold?: number;
    items?: string[];
  };
  feature?: {
    name: string;
    description: string;
  };
  personality_traits?: string[];
  ideals?: string[];
  bonds?: string[];
  flaws?: string[];
  data: any;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (match) => {
      const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
      return map[match] || match;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function fixEncoding(text: string): string {
  return text
    .replace(/Ã¤/g, 'ä')
    .replace(/Ã¶/g, 'ö')
    .replace(/Ã¼/g, 'ü')
    .replace(/ÃŸ/g, 'ß')
    .replace(/Ã„/g, 'Ä')
    .replace(/Ã–/g, 'Ö')
    .replace(/Ãœ/g, 'Ü');
}

async function extractBackgrounds() {
  const docxPath = path.resolve('resources/books/D&D Spielerhandbuch (2024).docx');
  const result = await mammoth.extractRawText({ path: docxPath });
  const text = result.value;

  // Finde Kapitel 4: Charakterherkunft / Backgrounds
  const backgroundSection = text.indexOf('KAPITEL 4: CHARAKTERHERKUNFT');
  if (backgroundSection === -1) {
    console.error('Background section not found in PHB');
    return;
  }

  // Finde den Start der Background-Liste (nach "EINEN HINTERGRUND WÄHLEN")
  const startMarker = text.indexOf('EINEN HINTERGRUND WÄHLEN', backgroundSection);
  const endMarker = text.indexOf('KAPITEL 5:', startMarker);
  
  const backgroundText = endMarker !== -1 
    ? text.substring(startMarker, endMarker)
    : text.substring(startMarker);

  const backgrounds: Background[] = [];
  const lines = backgroundText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Bekannte Backgrounds aus PHB 2024 (Platzhalter - wird durch Parsing gefüllt)
  const knownBackgrounds = [
    'AKOLYTH',
    'AUSGEWANDERTER',
    'HANDWERKER',
    'KRIEGER',
    'KUNDSCHAFTER',
    'NOMADE',
    'SOLDAT',
    'WÄCHTER'
  ];

  let currentBackground: Partial<Background> | null = null;
  let currentSection = '';
  let descriptionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();

    // Neue Background-Erkennung: Große Überschriften
    if (upperLine.match(/^[A-ZÄÖÜß\s-]+$/) && line.length > 5 && line.length < 50) {
      const isKnownBackground = knownBackgrounds.some(bg => 
        upperLine.includes(bg) || upperLine === bg
      );

      if (isKnownBackground || (line.length > 8 && line.length < 40 && !line.includes(':'))) {
        // Speichere vorherigen Background
        if (currentBackground && currentBackground.name) {
          currentBackground.description = descriptionLines.join('\n\n').trim();
          backgrounds.push(currentBackground as Background);
        }

        // Starte neuen Background
        currentBackground = {
          id: slugify(line),
          name: fixEncoding(line),
          description: '',
          skill_proficiencies: [],
          data: {}
        };
        descriptionLines = [];
        currentSection = '';
        continue;
      }
    }

    // Beschreibung sammeln
    if (currentBackground) {
      // Fertigkeiten
      if (upperLine.includes('FERTIGKEITEN') || upperLine.includes('FERTIGKEIT')) {
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        const skillMatch = nextLine.match(/([A-ZÄÖÜßa-zäöüß\s,]+)/);
        if (skillMatch) {
          const skills = skillMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
          currentBackground.skill_proficiencies = skills.map(fixEncoding);
          i++;
          continue;
        }
      }

      // Sprachen
      if (upperLine.includes('SPRACHEN')) {
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        const langMatch = nextLine.match(/([A-ZÄÖÜßa-zäöüß\s,]+)/);
        if (langMatch) {
          const languages = langMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
          currentBackground.language_proficiencies = languages.map(fixEncoding);
          i++;
          continue;
        }
      }

      // Werkzeuge
      if (upperLine.includes('WERKZEUG') || upperLine.includes('WERKZEUGPROFICIENCY')) {
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        const toolMatch = nextLine.match(/([A-ZÄÖÜßa-zäöüß\s,]+)/);
        if (toolMatch) {
          const tools = toolMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
          currentBackground.tool_proficiencies = tools.map(fixEncoding);
          i++;
          continue;
        }
      }

      // Talent (Feat)
      if (upperLine.includes('TALENT') && !upperLine.includes('HERKUNFT')) {
        const featMatch = line.match(/TALENT:?\s*(.+)/i);
        if (featMatch) {
          currentBackground.feat_id = slugify(featMatch[1].trim());
        }
      }

      // Startausrüstung
      if (upperLine.includes('STAUSRÜSTUNG') || upperLine.includes('START') && upperLine.includes('AUSRÜSTUNG')) {
        // Parse equipment
        const goldMatch = line.match(/(\d+)\s*GM/i);
        if (goldMatch) {
          currentBackground.starting_equipment = {
            gold: parseInt(goldMatch[1]),
            items: []
          };
        }
      }

      // Beschreibung sammeln (alles andere)
      if (!upperLine.includes('FERTIGKEIT') && 
          !upperLine.includes('SPRACHE') && 
          !upperLine.includes('WERKZEUG') &&
          !upperLine.includes('TALENT') &&
          !upperLine.includes('AUSRÜSTUNG') &&
          line.length > 10) {
        descriptionLines.push(fixEncoding(line));
      }
    }
  }

  // Letzten Background speichern
  if (currentBackground && currentBackground.name) {
    currentBackground.description = descriptionLines.join('\n\n').trim();
    backgrounds.push(currentBackground as Background);
  }

  // Validierung und Bereinigung
  const validBackgrounds = backgrounds.filter(bg => 
    bg.name && bg.name.length > 2 && bg.skill_proficiencies.length > 0
  );

  console.log(`Extracted ${validBackgrounds.length} backgrounds`);
  
  // Speichere JSON
  const outputPath = path.resolve('archive/tools/data_extraction/intermediate_data/extracted_backgrounds.json');
  await fs.writeFile(outputPath, JSON.stringify(validBackgrounds, null, 2), 'utf-8');
  console.log(`Saved to ${outputPath}`);

  return validBackgrounds;
}

extractBackgrounds().catch(console.error);
