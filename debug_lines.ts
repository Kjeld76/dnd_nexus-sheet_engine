
import { parseDOCX } from './tools/parser/extract.ts';

async function main() {
  const text = await parseDOCX('D&D Spielerhandbuch (2024).docx');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const idx = lines.findIndex(l => l === 'ALARM');
  if (idx !== -1) {
    console.log('--- LINES AROUND ALARM ---');
    for (let i = idx - 20; i < idx + 40; i++) {
      if (lines[i]) console.log(`${i}: ${lines[i]}`);
    }
  }

  const idx2 = lines.findIndex(l => l.includes('ANSTECKUNG'));
  if (idx2 !== -1) {
    console.log('\n--- LINES AROUND ANSTECKUNG ---');
    for (let i = idx2 - 5; i < idx2 + 40; i++) {
       if (lines[i]) console.log(`${i}: ${lines[i]}`);
    }
  }
}

main();


