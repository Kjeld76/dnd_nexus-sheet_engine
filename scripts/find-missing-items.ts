import fs from 'node:fs/promises';
import path from 'node:path';
import pdf from 'pdf-parse';

async function findMissingItems() {
  const pdfPath = path.resolve('resources/books/2024_D&D Spielleiterhandbuch (2024).pdf');

  const missing = [
    { name: 'FIGUR DER WUNDERSAMEN KRAFT', page: 247 },
    { name: 'MYSTERIENSCHLÜSSEL', page: 276 },
    { name: 'PFEIFE DER RAUCHMONSTER', page: 278 },
    { name: 'SCHILD DES KAVALIERS', page: 290 },
    { name: 'SCHWERT VON KAS', page: 293 },
  ];

  console.log('📖 Lade PDF...\n');
  const dataBuffer = await fs.readFile(pdfPath);
  const pdfData = await pdf(dataBuffer);
  const text = pdfData.text;

  console.log('=== SUCHE IN PDF ===\n');

  for (const item of missing) {
    console.log(`🔍 ${item.name} (S.${item.page}):`);

    // Varianten
    const variants = [
      item.name,
      item.name.replace(/-/g, ' '),
      item.name.replace(/-/g, ''),
      item.name.split(' ').slice(-2).join(' '),
      item.name.split(' ').slice(-3).join(' '),
    ];

    let found = false;
    for (const variant of variants) {
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const match = text.match(regex);

      if (match) {
        const pos = match.index || 0;
        const context = text.substring(
          Math.max(0, pos - 200),
          Math.min(text.length, pos + 1000)
        );
        console.log(`  ✅ Gefunden: "${variant}"`);
        console.log(`     Position: ${pos}`);
        console.log(`     Kontext: ${context.substring(0, 300)}...\n`);
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`  ❌ Nicht gefunden\n`);
    }
  }
}

findMissingItems().catch(console.error);
