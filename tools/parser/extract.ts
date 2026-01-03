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
  // Sehr einfache Regex-Extraktion als Platzhalter
  const spells: any[] = [];
  const lines = text.split('\n');
  
  let currentSpell: any = null;
  
  for (const line of lines) {
    if (line.match(/^[A-Z][a-z]+ [A-Z][a-z]+/)) { // Name?
      if (currentSpell) spells.push(currentSpell);
      currentSpell = { name: line.trim(), level: 0, school: 'Unknown', description: '' };
    } else if (currentSpell) {
      currentSpell.description += line + ' ';
    }
  }
  
  if (currentSpell) spells.push(currentSpell);
  return spells;
}


