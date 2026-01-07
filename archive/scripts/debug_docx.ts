import { parseDOCX } from './tools/parser/extract';
import fs from 'fs/promises';

async function main() {
  try {
    const text = await parseDOCX('D&D Spielerhandbuch (2024).docx');
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    // Wir schreiben mehr Zeilen, um sicherzugehen, dass wir die problematischen Stellen finden
    await fs.writeFile('debug_lines.txt', lines.join('\n'));
    console.log('debug_lines.txt wurde erstellt.');
  } catch (error) {
    console.error('Fehler beim Parsen:', error);
  }
}
main();


