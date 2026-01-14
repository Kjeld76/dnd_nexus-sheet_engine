import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { identifyBackground } from './background-lookup';

interface BackgroundOption {
  label: string;
  items: string[] | null;
  gold: number | null;
}

interface Background {
  id: string;
  name: string;
  description: string;
  ability_scores?: string[];
  feat?: string;
  skills: string[];
  tool?: string;
  starting_equipment?: {
    options: BackgroundOption[];
  };
  feature?: {
    name: string;
    description: string;
  };
  data: Record<string, unknown>;
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
    .replace(/Ãœ/g, 'Ü')
    .replace(/â€™/g, "'")
    .replace(/â€"/g, '"')
    .replace(/â€"/g, '"');
}

function parseItemsList(text: string): string[] {
  // Entferne "und X GM" am Ende
  const cleaned = text.replace(/\s+und\s+\d+\s*GM/gi, '').trim();
  
  return cleaned
    .split(/[,;]/)
    .map(item => item.trim())
    .filter(item => item.length > 0 && !item.match(/^\d+\s*GM$/i))
    .map(fixEncoding);
}

function parseGold(text: string): number | null {
  const match = text.match(/(\d+)\s*GM/i);
  return match ? parseInt(match[1]) : null;
}

async function extractBackgrounds() {
  const docxPath = path.resolve('resources/books/D&D Spielerhandbuch (2024).docx');
  
  if (!await fs.access(docxPath).then(() => true).catch(() => false)) {
    console.error(`❌ Datei nicht gefunden: ${docxPath}`);
    console.log('💡 Stelle sicher, dass die DOCX-Datei im resources/books/ Verzeichnis liegt');
    return;
  }

  console.log('📖 Lese DOCX-Datei...');
  const result = await mammoth.extractRawText({ path: docxPath });
  const text = result.value;

  // Finde Kapitel 4: Charakterherkunft (verschiedene Varianten)
  const kapitel4Idx = text.indexOf('KAPITEL 4');
  const charakterherkunftIdx = text.indexOf('CHARAKTERHERKUNFT');
  const hintergrundWaehlenIdx = text.indexOf('EINEN HINTERGRUND');
  
  let backgroundSection = -1;
  let startMarker = -1;
  
  // Bestimme Start-Position
  if (kapitel4Idx !== -1 && charakterherkunftIdx !== -1) {
    // Beide gefunden, verwende den früheren als Start
    backgroundSection = Math.min(kapitel4Idx, charakterherkunftIdx);
  } else if (kapitel4Idx !== -1) {
    backgroundSection = kapitel4Idx;
  } else if (charakterherkunftIdx !== -1) {
    backgroundSection = charakterherkunftIdx;
  } else if (hintergrundWaehlenIdx !== -1) {
    backgroundSection = hintergrundWaehlenIdx;
  }
  
  if (backgroundSection === -1) {
    console.error('❌ Background-Sektion nicht gefunden');
    return;
  }
  
  console.log(`📍 Background-Sektion gefunden bei Position ${backgroundSection}`);

  // Finde den Start der Background-Liste
  if (hintergrundWaehlenIdx !== -1 && hintergrundWaehlenIdx > backgroundSection) {
    startMarker = hintergrundWaehlenIdx;
  } else {
    startMarker = backgroundSection;
  }
  
  // Finde Ende (Kapitel 5) - aber suche spezifisch nach "KAPITEL 5" mit Leerzeichen davor
  // um nicht zu früh zu stoppen (z.B. bei "STUFE 5" oder ähnlichem)
  let endMarker = text.indexOf(' KAPITEL 5', startMarker);
  if (endMarker === -1) {
    endMarker = text.indexOf('\nKAPITEL 5', startMarker);
  }
  if (endMarker === -1) {
    endMarker = text.indexOf('KAPITEL 5:', startMarker);
  }
  if (endMarker === -1) {
    endMarker = text.indexOf('KAPITEL 5 ', startMarker);
  }
  if (endMarker === -1) {
    endMarker = text.length; // Fallback: bis zum Ende
  }
  
  console.log(`📍 Hintergrund-Bereich: Position ${startMarker} bis ${endMarker} (${endMarker - startMarker} Zeichen)`);
  
  const backgroundText = endMarker !== -1 
    ? text.substring(startMarker, endMarker)
    : text.substring(startMarker);

  const backgrounds: Background[] = [];
  const lines = backgroundText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Bekannte Hintergründe (PHB 2024) - alphabetisch sortiert, wie im Buch
  const knownBackgrounds = [
    'ADELIGER', 'AKOLYTH', 'BAUER', 'EINSIEDLER', 'HÄNDLER',
    'HANDWERKER', 'KRIMINELLER', 'REISENDER', 'SCHARLATAN', 'SCHREIBER',
    'SEEMANN', 'SOLDAT', 'UNTERHALTUNGSKÜNSTLER', 'WACHE', 'WEGFINDER', 'WEISER'
  ];

  let currentBackground: Partial<Background> | null = null;
  let descriptionLines: string[] = [];
  let inStartingEquipment = false;
  let currentOption: Partial<BackgroundOption> | null = null;
  let options: BackgroundOption[] = [];
  let currentSection: 'attributes' | 'feat' | 'skills' | 'tool' | 'equipment' | 'description' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();
    const fixedLine = fixEncoding(line);

    // Neue Background-Erkennung: Suche nach "Attributswerte:" als Marker
    // Das ist der zuverlässigste Marker, da Überschriften in Grafiken eingebettet sind
    if (upperLine.includes('ATTRIBUTSWERTE:') || upperLine.startsWith('ATTRIBUTSWERTE')) {
      // Speichere vorherigen Background
      if (currentBackground && currentBackground.name) {
        currentBackground.description = descriptionLines.join(' ').trim();
        if (options.length > 0) {
          currentBackground.starting_equipment = { options };
        }
        backgrounds.push(currentBackground as Background);
      }

      // Starte neuen Background
      // Versuche Hintergrund-Namen aus dem Kontext zu erkennen
      // Suche rückwärts nach einem bekannten Hintergrund-Namen
      let backgroundName = 'Unbekannt';
      for (let j = Math.max(0, i - 30); j < i; j++) {
        const checkLine = lines[j].toUpperCase().trim();
        const foundBg = knownBackgrounds.find(bg => 
          checkLine === bg.toUpperCase() || 
          checkLine.includes(bg.toUpperCase()) ||
          bg.toUpperCase().includes(checkLine)
        );
        if (foundBg) {
          backgroundName = foundBg;
          break;
        }
      }
      
      // Temporäre Variablen für Lookup werden im currentBackground gespeichert
      currentBackground = {
        id: slugify(backgroundName),
        name: backgroundName,
        description: '',
        skills: [],
        data: {}
      };
      descriptionLines = [];
      inStartingEquipment = false;
      options = [];
      currentOption = null;
      currentSection = 'attributes';
      
      // Parse Attributswerte direkt
      let attributesText = line.replace(/Attributswerte:\s*/i, '').trim();
      if (!attributesText || attributesText.length < 3) {
        // Versuche nächste Zeile
        if (i + 1 < lines.length) {
          attributesText = lines[i + 1].trim();
          i++;
        }
      }
      
      // Trenne Talent von Attributswerten (falls in derselben Zeile)
      const talentMatch = attributesText.match(/\s+Talent:\s*(.+)/i);
      if (talentMatch) {
        attributesText = attributesText.split(/Talent:/i)[0].trim();
        currentBackground.feat = fixEncoding(talentMatch[1].replace(/\(siehe.*?\)/i, '').trim());
      }
      
      if (attributesText.length > 0) {
        const attributes = parseItemsList(attributesText);
        currentBackground.ability_scores = attributes;
        
        // Versuche Identifikation über Lookup-Tabelle (falls Talent und Skills bereits vorhanden)
        if (backgroundName === 'Unbekannt' && 
            currentBackground.feat && 
            currentBackground.skills?.[0]) {
          const identified = identifyBackground(
            currentBackground.ability_scores,
            currentBackground.feat,
            currentBackground.skills[0]
          );
          if (identified) {
            backgroundName = identified;
            currentBackground.name = identified;
            currentBackground.id = slugify(identified);
          }
        }
      }
      continue;
    }

    if (!currentBackground) continue;

    // Fertigkeiten
    if (upperLine.includes('FERTIGKEITEN') && !upperLine.includes('START')) {
      currentSection = 'skills';
      // Fertigkeiten können über mehrere Zeilen gehen (z.B. "Geschichte und\nÜberzeugen")
      let skillsText = line.replace(/Fertigkeiten[^:]*:\s*/i, '').trim();
      
      // Sammle weitere Zeilen, bis "Werkzeug" oder "Ausrüstung" kommt
      let j = i + 1;
      while (j < lines.length && 
             !lines[j].toUpperCase().includes('WERKZEUG') && 
             !lines[j].toUpperCase().includes('AUSRÜSTUNG') &&
             !lines[j].toUpperCase().includes('ATTRIBUTSWERTE')) {
        skillsText += ' ' + lines[j];
        j++;
      }
      
      const skills = parseItemsList(skillsText.replace(/\s+und\s+/gi, ', '));
      if (skills.length > 0) {
        currentBackground.skills = skills;
        
        // Versuche Identifikation über Lookup-Tabelle
        if (currentBackground.name === 'Unbekannt' && 
            currentBackground.ability_scores && 
            currentBackground.feat) {
          const identified = identifyBackground(
            currentBackground.ability_scores,
            currentBackground.feat,
            skills[0]
          );
          if (identified) {
            currentBackground.name = identified;
            currentBackground.id = slugify(identified);
          }
        }
      }
      i = j - 1; // -1 weil die Schleife i++ macht
      continue;
    }

    // Werkzeug
    if (upperLine.includes('WERKZEUG') && !upperLine.includes('PROFICIENCY') && !upperLine.includes('AUSRÜSTUNG')) {
      currentSection = 'tool';
      let toolText = line.replace(/Werkzeug[^:]*:\s*/i, '').trim();
      
      // Sammle weitere Zeilen bis "Ausrüstung" oder nächster Hintergrund
      let j = i + 1;
      while (j < lines.length && 
             !lines[j].toUpperCase().includes('AUSRÜSTUNG') &&
             !lines[j].toUpperCase().includes('ATTRIBUTSWERTE') &&
             lines[j].length < 200) { // Beschreibungen sind länger
        toolText += ' ' + lines[j];
        j++;
        if (toolText.length > 200) break; // Sicherheitsabschaltung
      }
      
      // Entferne "aus (siehe Kapitel 6)" etc.
      toolText = toolText.replace(/\s*\(siehe\s+Kapitel\s+\d+\)/gi, '')
                        .replace(/\s*aus\s*\(siehe\s+Kapitel\s+\d+\)/gi, '')
                        .replace(/Wähle\s+eine\s+Art\s+von\s+/gi, '')
                        .trim();
      
      if (toolText.length > 0 && toolText.length < 100) {
        currentBackground.tool = fixEncoding(toolText);
      }
      i = j - 1;
      continue;
    }

    // Talent (Feat)
    if (upperLine.includes('TALENT:') || (upperLine.includes('TALENT') && !upperLine.includes('HERKUNFT'))) {
      currentSection = 'feat';
      const featMatch = line.match(/Talent:?\s*(.+?)(?:\s*\(siehe|$)/i);
      if (featMatch) {
        const featName = fixEncoding(featMatch[1].trim());
        currentBackground.feat = featName;
        
        // Versuche Identifikation über Lookup-Tabelle
        if (currentBackground.name === 'Unbekannt' && 
            currentBackground.ability_scores && 
            currentBackground.skills?.[0]) {
          const identified = identifyBackground(
            currentBackground.ability_scores,
            featName,
            currentBackground.skills[0]
          );
          if (identified) {
            currentBackground.name = identified;
            currentBackground.id = slugify(identified);
          }
        }
        continue;
      }
    }

    // Attributswerte (Ability Scores)
    if (upperLine.includes('ATTRIBUTSWERTE') || upperLine.includes('ATTRIBUTE')) {
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const abilities = parseItemsList(nextLine);
      if (abilities.length > 0) {
        currentBackground.ability_scores = abilities;
        i++;
        continue;
      }
    }

    // Startausrüstung / Ausrüstung
    if (upperLine.includes('AUSRÜSTUNG') && !upperLine.includes('ANFANGS')) {
      inStartingEquipment = true;
      options = [];
      currentOption = null;
      
      // Prüfe, ob "(A)" bereits in dieser Zeile steht
      if (line.includes('(A)')) {
        // Starte Option A direkt
        currentOption = { label: 'A', items: null, gold: null };
        const afterA = line.split('(A)')[1] || '';
        if (afterA.trim().length > 0 && !afterA.includes('(B)')) {
          const items = parseItemsList(afterA);
          if (items.length > 0) {
            currentOption.items = items;
          }
        }
      }
      continue;
    }

    // Option A oder B erkennen
    if (inStartingEquipment) {
      // Suche nach "(A) ... oder (B) ..." Pattern - kann über mehrere Zeilen gehen
      const combinedLine = line + (i + 1 < lines.length ? ' ' + lines[i + 1] : '') + (i + 2 < lines.length ? ' ' + lines[i + 2] : '');
      
      // Pattern: (A) Items... [und X GM] oder (B) Y GM
      // Beispiel: "(A) Handwerkszeug, zwei Beutel, Reisekleidung und 32 GM oder (B) 50 GM"
      const optionPattern = /\(A\)\s*([^(]+?)(?:\s+und\s+(\d+)\s*GM)?\s+oder\s+\(B\)\s*(\d+)\s*GM/i;
      const match = combinedLine.match(optionPattern);
      
      if (match) {
        // Option A: Items (und optional Gold)
        const itemsText = match[1].trim();
        const items = parseItemsList(itemsText);
        const optionAGold = match[2] ? parseInt(match[2]) : null;
        options.push({ label: 'A', items: items.length > 0 ? items : null, gold: optionAGold });
        
        // Option B: Gold
        const gold = parseInt(match[3]);
        options.push({ label: 'B', items: null, gold });
        
        // Überspringe verwendete Zeilen
        if (i + 1 < lines.length && (lines[i + 1].includes('oder') || lines[i + 1].includes('(B)'))) {
          i++;
        }
        if (i + 1 < lines.length && lines[i].includes('(B)') && lines[i + 1].includes('GM')) {
          i++;
        }
        inStartingEquipment = false;
        continue;
      }
      
      // Option A: (a) oder Option A:
      if (upperLine.match(/^\(?[Aa]\)?\s*:/) || upperLine.startsWith('OPTION A') || upperLine.match(/^\(A\)/)) {
        if (currentOption) {
          options.push(currentOption as BackgroundOption);
        }
        currentOption = { label: 'A', items: null, gold: null };
        
        // Items direkt in derselben Zeile
        const itemsText = line.replace(/^\(?[Aa]\)?\s*:?\s*/, '').replace(/^Option A:?\s*/i, '').replace(/^\(A\)\s*/, '');
        if (itemsText && itemsText.length > 0 && !itemsText.match(/\d+\s*GM/i)) {
          currentOption.items = parseItemsList(itemsText);
        }
        continue;
      }

      // Option B: (b) oder Option B:
      if (upperLine.match(/^\(?[Bb]\)?\s*:/) || upperLine.startsWith('OPTION B') || upperLine.match(/^\(B\)/)) {
        if (currentOption) {
          options.push(currentOption as BackgroundOption);
        }
        currentOption = { label: 'B', items: null, gold: null };
        
        // Gold direkt in derselben Zeile
        const gold = parseGold(line);
        if (gold !== null) {
          currentOption.gold = gold;
        }
        continue;
      }

      // Items in nächster Zeile (nach Option A) - sammle bis "oder" oder "(B)"
      if (currentOption && currentOption.label === 'A' && !line.includes('(B)')) {
        // Wenn "oder" in der Zeile, teile sie
        if (line.includes('oder')) {
          const beforeOr = line.split(/oder/i)[0].trim();
          const afterOr = line.split(/oder/i)[1] || '';
          
          // Füge Items vor "oder" hinzu
          if (beforeOr.length > 0) {
            // Entferne Gold aus Items-Text
            const itemsText = beforeOr.replace(/\s+und\s+(\d+)\s*GM/gi, '').trim();
            const items = parseItemsList(itemsText);
            if (currentOption.items === null) {
              currentOption.items = items;
            } else {
              currentOption.items = [...currentOption.items, ...items];
            }
            
            // Prüfe Gold in Option A (vor "oder")
            const goldMatch = beforeOr.match(/\s+und\s+(\d+)\s*GM/i);
            if (goldMatch) {
              currentOption.gold = parseInt(goldMatch[1]);
            }
          }
          
          // Starte Option B
          options.push(currentOption as BackgroundOption);
          const gold = parseGold(afterOr);
          if (gold !== null) {
            options.push({ label: 'B', items: null, gold });
            inStartingEquipment = false;
            continue;
          } else {
            currentOption = { label: 'B', items: null, gold: null };
          }
        } else {
          // Normale Zeile mit Items
          const items = parseItemsList(line);
          if (items.length > 0) {
            if (currentOption.items === null) {
              currentOption.items = items;
            } else {
              currentOption.items = [...currentOption.items, ...items];
            }
          }
          
          // Prüfe auf Gold in dieser Zeile
          const goldMatch = line.match(/(\d+)\s*GM/i);
          if (goldMatch && !line.includes('(B)')) {
            currentOption.gold = parseInt(goldMatch[1]);
          }
        }
        continue;
      }
      
      // "(B)" erkannt - schließe Option A ab und starte Option B
      if (line.includes('(B)')) {
        if (currentOption && currentOption.label === 'A') {
          options.push(currentOption as BackgroundOption);
        }
        const gold = parseGold(line);
        if (gold !== null) {
          options.push({ label: 'B', items: null, gold });
          inStartingEquipment = false;
          continue;
        }
      }

      // Gold in nächster Zeile (nach Option B)
      if (currentOption && currentOption.label === 'B' && currentOption.gold === null) {
        const gold = parseGold(line);
        if (gold !== null) {
          currentOption.gold = gold;
          inStartingEquipment = false; // Beende Parsing nach Option B
          continue;
        }
      }
      
      // Wenn wir "oder" oder "GM" sehen und bereits Optionen haben, beende das Parsing
      if (options.length > 0 && (line.includes('GM') || upperLine.includes('ODER'))) {
        if (currentOption) {
          options.push(currentOption as BackgroundOption);
        }
        inStartingEquipment = false;
        continue;
      }
    }

    // Beschreibung sammeln (alles andere, außer bekannten Feldern)
    // Beschreibung kommt NACH den technischen Daten (Ausrüstung)
    if (!upperLine.includes('FERTIGKEIT') && 
        !upperLine.includes('WERKZEUG') &&
        !upperLine.includes('TALENT') &&
        !upperLine.includes('AUSRÜSTUNG') &&
        !upperLine.includes('ATTRIBUTSWERTE') &&
        !upperLine.includes('KAPITEL') &&
        !inStartingEquipment &&
        line.length > 20 &&
        !line.match(/^\d+\s*$/)) { // Keine Seitennummern
      // Beschreibung beginnt normalerweise nach der Ausrüstung
      if (options.length > 0 || currentSection === 'description') {
        currentSection = 'description';
        descriptionLines.push(fixedLine);
      }
    }
  }

  // Letzten Background speichern
  if (currentBackground && currentBackground.name) {
    currentBackground.description = descriptionLines.join('\n\n').trim();
    if (currentOption) {
      options.push(currentOption as BackgroundOption);
    }
    if (options.length > 0) {
      currentBackground.starting_equipment = { options };
    }
    backgrounds.push(currentBackground as Background);
  }

  // Duplikat-Bereinigung: Behalte nur den vollständigsten Eintrag
  const deduplicated = new Map<string, Background>();
  for (const bg of backgrounds) {
    if (!bg.ability_scores || bg.ability_scores.length !== 3 || !bg.feat) continue;
    
    const key = [
      [...bg.ability_scores].sort().join(','),
      bg.feat,
      bg.skills?.[0] || ''
    ].filter(Boolean).join('|');
    
    const existing = deduplicated.get(key);
    if (!existing) {
      deduplicated.set(key, bg);
    } else {
      // Behalte den vollständigeren Eintrag
      const existingCompleteness = (existing.starting_equipment?.options?.length || 0) + 
                                   (existing.description?.length || 0) + 
                                   (existing.skills?.length || 0);
      const bgCompleteness = (bg.starting_equipment?.options?.length || 0) + 
                            (bg.description?.length || 0) + 
                            (bg.skills?.length || 0);
      
      if (bgCompleteness > existingCompleteness) {
        deduplicated.set(key, bg);
      }
    }
  }
  
  // Validierung
  const validBackgrounds = Array.from(deduplicated.values()).filter(bg => 
    bg.name && bg.name.length > 2 && bg.name !== 'Unbekannt' && bg.skills && bg.skills.length > 0
  );

  console.log(`\n✅ ${validBackgrounds.length} Hintergründe extrahiert:`);
  validBackgrounds.forEach(bg => {
    const optionsCount = bg.starting_equipment?.options?.length || 0;
    console.log(`   - ${bg.name} (${bg.skills.length} Skills, ${optionsCount} Ausrüstungs-Optionen)`);
  });

  // Speichere JSON
  const outputDir = path.resolve('archive/tools/data_extraction/intermediate_data');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'extracted_backgrounds_complete.json');
  await fs.writeFile(outputPath, JSON.stringify(validBackgrounds, null, 2), 'utf-8');
  console.log(`\n💾 Gespeichert in: ${outputPath}`);

  return validBackgrounds;
}

extractBackgrounds().catch(console.error);
