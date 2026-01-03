import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import fs from 'fs/promises';

export async function parseDOCX(filePath: string) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

export async function parsePDF(filePath: string) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

export function extractSpells(text: string) {
  const spells: any[] = [];
  const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    
    // Improved spell header detection:
    // 1. ALL CAPS name or name followed by "zauber ... Grades"
    const isNameCandidate = (line === line.toUpperCase() && 
                           line.length > 2 && 
                           !line.match(/[0-9:]/) &&
                           !line.includes('KAPITEL') &&
                           !['SCHADEN', 'AUSSEHEN', 'ZAUBERWIRKEN', 'KOMPONENTEN', 'REICHWEITE', 'ZEITAUFWAND', 'WIRKUNGSDAUER', 'ZAUBERLISTE', 'ZAUBERTRICKS', 'AKTIONEN', 'REAKTIONEN'].includes(line)) ||
                           (line.match(/^[A-ZÄÖÜ\s\/\-]{3,}/) && line.match(/(?:zauber|zaubertrick)/i));

    if (isNameCandidate) {
      // Look ahead for the type line (e.g., "Hervorrufungszauber 3. Grades")
      let typeLine = "";
      let typeLineIdx = -1;
      
      // If the header line itself already contains the type info
      // Check for name (all caps) followed by the type (starts with a word and contains zauber/zaubertrick)
      const combinedMatch = line.match(/^([A-ZÄÖÜ\s\/\-\(\)]{3,})\s+([A-ZÄÖÜa-zäöü]*zauber(?:trick)?.*?\d+\..*)$/i);
      if (combinedMatch) {
          typeLine = combinedMatch[2].trim();
          typeLineIdx = i;
      }

      if (typeLineIdx === -1) {
        for (let j = i + 1; j < Math.min(i + 10, rawLines.length); j++) {
          const candidate = rawLines[j];
          const isType = (candidate.toLowerCase().includes('zauber') || candidate.toLowerCase().includes('zaubertrick')) &&
                         (candidate.match(/\d+\./) || candidate.toLowerCase().includes('zaubertrick'));
          if (isType) {
            typeLine = candidate;
            typeLineIdx = j;
            break;
          }
        }
      }

      if (typeLineIdx !== -1) {
        // Now check if it's a real spell description by looking for Zeitaufwand etc.
        let structuredBlock = "";
        let fieldsFound = 0;
        let k = typeLineIdx + (typeLineIdx === i ? 0 : 1);
        
        // If they are on the same line, we might need to be careful, but usually fields start on next line
        if (typeLineIdx === i) k = i + 1;

        while (k < Math.min(typeLineIdx + 25, rawLines.length)) {
          const sLine = rawLines[k];
          structuredBlock += " " + sLine;
          if (sLine.toLowerCase().includes('zeitaufwand:')) fieldsFound++;
          if (sLine.toLowerCase().includes('reichweite:')) fieldsFound++;
          if (sLine.toLowerCase().includes('komponenten:')) fieldsFound++;
          if (sLine.toLowerCase().includes('wirkungsdauer:')) fieldsFound++;
          
          if (sLine.toLowerCase().includes('wirkungsdauer:')) {
            // Collect until end of duration line
            k++;
            break;
          }
          k++;
        }

        // Only proceed if it's a real spell description block (at least 2 fields must exist if we have a type line)
        if (fieldsFound >= 2) {
          const namePart = combinedMatch ? combinedMatch[1].trim() : line;
          
          const extractField = (label: string, endLabels: string[]) => {
            const pattern = new RegExp(`${label}:\\s*(.*?)(?:\\s+(?:${endLabels.join('|')}):|$)`, 'i');
            const match = structured_block_clean(structuredBlock).match(pattern);
            return match ? match[1].trim() : "";
          };

          function structured_block_clean(block: string) {
            return block.replace(/\s+/g, ' ');
          }

          let time = extractField('Zeitaufwand', ['Reichweite', 'Komponenten', 'Wirkungsdauer']);
          let range = extractField('Reichweite', ['Komponenten', 'Wirkungsdauer']);
          let compRaw = extractField('Komponenten', ['Wirkungsdauer']);
          let duration = extractField('Wirkungsdauer', ['']);

          // Clean components: Only V, G, M allowed.
          // Map OCR errors: S/5/8 -> G
          let components = compRaw.replace(/\(.*\)/, '').replace(/[^VGM S58,]/gi, '').trim();
          components = components.toUpperCase()
            .replace(/[S58]/g, 'G')
            .split(/[, ]+/)
            .map(v => v.trim())
            .filter((v, idx, a) => ['V', 'G', 'M'].includes(v) && a.indexOf(v) === idx)
            .sort((a, b) => {
               const order = { 'V': 0, 'G': 1, 'M': 2 };
               return order[a as keyof typeof order] - order[b as keyof typeof order];
            })
            .join(', ');
          
          // If components is empty but we had compRaw, check if V,G,M are hidden in text
          if (!components && compRaw) {
            const found = [];
            if (compRaw.match(/V/i)) found.push('V');
            if (compRaw.match(/[SG58]/i)) found.push('G');
            if (compRaw.match(/M/i)) found.push('M');
            components = found.join(', ');
          }
          
          // Materials extraction
          let materials = "";
          const matMatch = compRaw.match(/\((.*)\)/);
          if (matMatch) {
            materials = matMatch[1].trim();
          }

          // Description extraction
          let description = "";
          while (k < rawLines.length) {
            const descLine = rawLines[k];
            
            // Skip page headers/footers
            if (descLine.match(/KAPITEL.*?\d+/i) || descLine.match(/^\d+$/) || descLine.match(/^\d+\s+KAPITEL/i)) {
              k++;
              continue;
            }

            // Stop at next potential spell
            const isNextSpellHeader = (descLine === descLine.toUpperCase() && descLine.length > 3 && !descLine.match(/[0-9:]/)) ||
                                     (descLine.match(/^[A-ZÄÖÜ\s\/\-]{3,}/) && descLine.match(/(?:zauber|zaubertrick)/i));
            
            if (isNextSpellHeader) {
              // console.log(`Stopping description for ${namePart} at line: ${descLine}`);
              break;
            }
            
            description += descLine + "\n";
            k++;
          }

          const typeLower = typeLine.toLowerCase();
          const levelMatch = typeLine.match(/(\d+)\./);
          const level = levelMatch ? parseInt(levelMatch[1]) : (typeLower.includes('zaubertrick') ? 0 : 0);
          
          let school = "";
          if (typeLower.includes('zaubertrick')) {
            school = typeLine.split(/der|von/i)[1]?.split('(')[0].trim() || "";
          } else {
            school = typeLine.split(/zauber/i)[0].trim();
          }
          
          // Clean school names
          const schoolMap: Record<string, string> = {
            'Hervorrufungs': 'Hervorrufung',
            'Bann': 'Bannmagie',
            'Verwandlungs': 'Verwandlung',
            'Illusions': 'Illusion',
            'Beschwörungs': 'Beschwörung',
            'Erkenntnis': 'Erkenntnismagie',
            'Nekromantie': 'Nekromantie',
            'Verzauberungs': 'Verzauberung',
            'Abwehr': 'Abwehrmagie'
          };
          school = schoolMap[school] || school;

          const classesMatch = typeLine.match(/\((.*)\)/);
          const classes = classesMatch ? classesMatch[1].split(',').map(c => c.trim()) : [];

          // Final name cleanup
          const cleanName = namePart.replace(/^[^A-ZÄÖÜ]+/, '').replace(/[^A-ZÄÖÜ ]+$/, '').trim();
          if (cleanName.length < 3 || cleanName.length > 50 || ['AKTIONEN', 'KOMPONENTEN', 'REICHWEITE', 'ZEITAUFWAND', 'WIRKUNGSDAUER'].includes(cleanName) || cleanName.includes('ENTFESSELT')) {
            i++;
            continue;
          }

          spells.push({
            name: clean_spell_name(cleanName),
            level,
            school,
            data: {
              time,
              range,
              duration,
              components,
              materials,
              description: description.trim(),
              concentration: duration.toLowerCase().includes('konzentration'),
              ritual: typeLine.toLowerCase().includes('ritual') || time.toLowerCase().includes('ritual'),
              classes
            }
          });
          
          function clean_spell_name(n: string) {
            // Remove common OCR artifacts like ^ or small chars at start
            return n.replace(/^[^A-ZÄÖÜ]+/, '').trim();
          }
          
          i = k; // Jump to end of spell
          continue;
        }
      }
    }
    i++;
  }
  
  return spells;
}


