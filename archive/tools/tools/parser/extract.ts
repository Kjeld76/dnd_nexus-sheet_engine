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

function toTitleCase(s: string) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function extractSpells(text: string) {
  // Fix specific artifacts
  const cleanText = text
    .replace(/AUFL\-\s*SUNG/g, 'AUFLÖSUNG')
    .replace(/ARKANE\s+VITALIT\-\s*T/g, 'ARKANE VITALITÄT')
    .replace(/GEIS\s+rERRO55/g, 'GEISTERROSS')
    .replace(/-\n/g, ''); // Fix line-end hyphens

  const rawLines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const spells: any[] = [];

  function isPotentialHeader(line: string) {
    if (line.length < 3 || line.length > 60) return false;
    if (line.match(/[0-9]/) && !line.match(/(?:zauber|zaubertrick)/i)) return false;
    
    // Most spell headers are ALL CAPS
    if (line === line.toUpperCase()) return true;
    
    // Some combined headers are mixed
    if (line.match(/^[A-ZÄÖÜ\s\/\-]{3,}.*?(?:zauber|zaubertrick)/i)) return true;
    
    return false;
  }

  function isTypeLine(line: string) {
    const l = line.toLowerCase();
    return (l.includes('zauber') || l.includes('zaubertrick')) && (line.match(/\d+\./) || l.includes('zaubertrick'));
  }

  function isFieldLine(line: string) {
    const l = line.toLowerCase();
    return l.startsWith('zeitaufwand:') || l.startsWith('reichweite:') || l.startsWith('komponenten:') || l.startsWith('wirkungsdauer:');
  }

  function isConfirmedSpell(idx: number): any {
    if (idx >= rawLines.length) return null;
    const line = rawLines[idx];
    if (!isPotentialHeader(line)) return null;

    const blackList = ['GEIST', 'WESEN', 'KONSTRUKT', 'KREATUR', 'UNTOTER', 'MONSTROSITÄT', 'ABERRATION', 'ELEMENTAR', 'FEENWESEN', 'UNHOLD', 'DRACHE', 'KAPITEL', 'SEITE', 'ANHANG', 'SCHADEN', 'AKTIONEN', 'ZAUBERWIRKEN', 'WERTEKASTEN', 'MERKMALE', 'WIRKT', 'NUTZT', 'KLASSE', 'STUFE', 'GRAD', 'MOD', 'RW', 'STÄ', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    if (blackList.some(word => line.toUpperCase().includes(word))) return null;

    let typeLine = "";
    let typeLineIdx = -1;
    let name = line;

    // Check if combined
    const combinedMatch = line.match(/^([A-ZÄÖÜ\s\/\-\(\)]{3,})\s+([A-ZÄÖÜa-zäöü]*zauber(?:trick)?.*?\d+\..*)$/i);
    if (combinedMatch) {
      name = combinedMatch[1].trim();
      typeLine = combinedMatch[2].trim();
      typeLineIdx = idx;
    } else {
      // Look ahead for type line
      for (let j = idx + 1; j < Math.min(idx + 4, rawLines.length); j++) {
        if (isTypeLine(rawLines[j])) {
          typeLine = rawLines[j];
          typeLineIdx = j;
          break;
        }
      }
    }

    if (typeLineIdx === -1) return null;

    // Must have at least one field following very soon
    let foundField = false;
    let structuredBlock = "";
    let k = typeLineIdx + 1;
    while (k < Math.min(typeLineIdx + 10, rawLines.length)) {
      if (isFieldLine(rawLines[k])) {
        foundField = true;
        break;
      }
      k++;
    }

    if (!foundField) return null;

    // Collect all fields
    let fieldsFound = 0;
    k = typeLineIdx + 1;
    while (k < Math.min(typeLineIdx + 15, rawLines.length)) {
      const sLine = rawLines[k];
      structuredBlock += " " + sLine;
      if (isFieldLine(sLine)) {
        fieldsFound++;
        if (sLine.toLowerCase().startsWith('wirkungsdauer:')) { k++; break; }
      }
      k++;
    }

    return { name: name.replace(/[^A-ZÄÖÜ\s]/gi, '').trim(), typeLine, fieldsIdx: k, fields: structuredBlock };
  }

  let i = 0;
  while (i < rawLines.length) {
    const confirmed = isConfirmedSpell(i);
    if (confirmed) {
      const { name, typeLine, fieldsIdx, fields } = confirmed;
      
      const extractField = (label: string, endLabels: string[]) => {
        const pattern = new RegExp(`${label}:\\s*(.*?)(?:\\s+(?:${endLabels.join('|')}):|$)`, 'i');
        const match = fields.replace(/\s+/g, ' ').match(pattern);
        return match ? match[1].trim() : "";
      };

      const time = extractField('Zeitaufwand', ['Reichweite', 'Komponenten', 'Wirkungsdauer']);
      const range = extractField('Reichweite', ['Komponenten', 'Wirkungsdauer']);
      const compRaw = extractField('Komponenten', ['Wirkungsdauer']);
      const duration = extractField('Wirkungsdauer', ['']);

      let description = "";
      let next_k = fieldsIdx;
      while (next_k < rawLines.length) {
        if (isConfirmedSpell(next_k)) break;
        const descLine = rawLines[next_k];
        if (descLine.match(/KAPITEL.*?\d+/i) || descLine.match(/^\d+$/) || descLine.match(/^\d+\s+KAPITEL/i) || descLine.match(/^[A-Z\s]+\d+$/) || descLine.includes('SEITE')) {
          next_k++;
          continue;
        }
        description += descLine + "\n";
        next_k++;
      }

      // Metadata
      const typeLower = typeLine.toLowerCase();
      const schoolList = [
        { name: 'Hervorrufung', search: 'hervor' },
        { name: 'Bannmagie', search: 'bann' },
        { name: 'Verwandlung', search: 'verwand' },
        { name: 'Illusion', search: 'illus' },
        { name: 'Beschwörung', search: 'beschw' },
        { name: 'Erkenntnismagie', search: 'erkennt' },
        { name: 'Nekromantie', search: 'nekro' },
        { name: 'Verzauberung', search: 'verzaub' },
        { name: 'Abwehrmagie', search: 'abwehr' }
      ];
      let school = "Unbekannt";
      for (const s of schoolList) if (typeLower.includes(s.search)) { school = s.name; break; }

      const levelMatch = typeLine.match(/(\d+)\./);
      const level = levelMatch ? parseInt(levelMatch[1]) : (typeLower.includes('zaubertrick') ? 0 : 0);
      const classesMatch = typeLine.match(/\((.*)\)/);
      const classes = classesMatch ? classesMatch[1].split(',').map(c => toTitleCase(c.trim())) : [];

      // Components
      let components = compRaw.replace(/\(.*\)/, '').replace(/[^VGM S58,]/gi, '').trim().toUpperCase();
      components = components.replace(/[S58]/g, 'G').split(/[, ]+/).map(v => v.trim())
        .filter((v, idx, a) => ['V', 'G', 'M'].includes(v) && a.indexOf(v) === idx)
        .sort((a, b) => "VGM".indexOf(a) - "VGM".indexOf(b))
        .join(', ');
      
      if (!components && compRaw) {
        const found = [];
        if (compRaw.match(/V/i)) found.push('V');
        if (compRaw.match(/[SG58]/i)) found.push('G');
        if (compRaw.match(/M/i)) found.push('M');
        components = found.join(', ');
      }
      
      const matMatch = compRaw.match(/\((.*)\)/);
      const materials = matMatch ? matMatch[1].trim() : "";

      spells.push({
        name: toTitleCase(name), level, school,
        data: {
          time, range, duration, components, materials,
          description: description.trim(),
          concentration: duration.toLowerCase().includes('konzentration'),
          ritual: typeLine.toLowerCase().includes('ritual') || time.toLowerCase().includes('ritual'),
          classes
        }
      });
      i = next_k;
      continue;
    }
    i++;
  }
  return spells;
}
