import mammoth from 'mammoth';
import path from 'path';

async function main() {
  const docxPath = path.resolve('resources/books/D&D Spielerhandbuch (2024).docx');
  const result = await mammoth.extractRawText({ path: docxPath });
  const text = result.value;

  const markers = ['AUSRÜSTUNG', 'WAFFEN', 'RÜSTUNGEN', 'ABENTEUERAUSRÜSTUNG', 'MAGISCHE GEGENSTÄNDE'];
  
  for (const m of markers) {
    const idx = text.indexOf('\n' + m + '\n');
    console.log(`${m}: ${idx}`);
    if (idx !== -1) {
        console.log(`Context: ${JSON.stringify(text.substring(idx, idx + 200))}`);
    }
  }
}

main();

