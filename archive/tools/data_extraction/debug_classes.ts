import mammoth from 'mammoth';
import path from 'path';

async function main() {
  const docxPath = path.resolve('resources/books/D&D Spielerhandbuch (2024).docx');
  const result = await mammoth.extractRawText({ path: docxPath });
  const text = result.value;

  const markers = [
    'WALDLÄUFER-UNTERKLASSEN',
    'PALADIN-UNTERKLASSEN',
    'SCHURKEN-UNTERKLASSEN',
    'MÖNCH-UNTERKLASSEN',
    'MAGIER-UNTERKLASSEN'
  ];
  
  for (const m of markers) {
    const idx = text.indexOf(m);
    console.log(`\n=== ${m} (Pos: ${idx}) ===`);
    if (idx !== -1) {
        // Zeige die nächsten 2000 Zeichen, um Unterklassen-Header zu finden
        console.log(text.substring(idx, idx + 2000));
    } else {
        // Falls der Marker nicht exakt gefunden wurde, suche nach Teilstrings
        const partial = m.split('-')[0];
        const pIdx = text.indexOf(partial);
        console.log(`Partial match for ${partial} at: ${pIdx}`);
    }
  }
}

main();
