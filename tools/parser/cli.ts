import { parseDOCX, parsePDF, extractSpells } from './extract';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: tsx cli.ts <input-file>');
    process.exit(1);
  }

  const inputFile = args[0];
  const ext = path.extname(inputFile).toLowerCase();
  
  console.log(`Parsing ${inputFile}...`);
  
  let text = '';
  if (ext === '.docx') {
    text = await parseDOCX(inputFile);
  } else if (ext === '.pdf') {
    text = await parsePDF(inputFile);
  } else {
    console.error('Unsupported file format');
    process.exit(1);
  }

  const spells = extractSpells(text);
  console.log(`Extracted ${spells.length} potential spells.`);

  const outputDir = path.join(__dirname, '../output');
  await fs.mkdir(outputDir, { recursive: true });
  
  await fs.writeFile(
    path.join(outputDir, 'spells.json'),
    JSON.stringify(spells, null, 2)
  );
  
  console.log('Done! Output saved to tools/output/spells.json');
}

main().catch(console.error);


