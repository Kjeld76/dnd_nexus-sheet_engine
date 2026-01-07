import fs from 'fs/promises';

const ENCODING_FIXES: Record<string, string> = {
    'Ã¤': 'ä', 'Ã¶': 'ö', 'Ã¼': 'ü', 'Ã„': 'Ä', 'Ã–': 'Ö', 'Ãœ': 'Ü', 'ÃŸ': 'ß', 
    'Ã©': 'é', 'Ã¨': 'è', 'Â': '', 'â€“': '–', 'â€”': '—', 'â€™': "'", 'â€ž': '"', 'â€œ': '"',
    'Ǭ': 'ü', '-': 'ö', 'o': 'ü', '"': 'ä', 'Y': 'ß'
};

function fixEncoding(text: string): string {
  let fixed = text;
  for (const [bad, good] of Object.entries(ENCODING_FIXES)) {
      fixed = fixed.replace(new RegExp(bad, 'g'), good);
  }
  return fixed;
}

async function debugText() {
    let text = await fs.readFile('tools/phb_text.txt', 'utf-8');
    text = fixEncoding(text);
    await fs.writeFile('tools/phb_text_fixed.txt', text);
    console.log("Fixed text written to tools/phb_text_fixed.txt");
}

debugText().catch(console.error);






