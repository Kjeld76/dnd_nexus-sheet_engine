import fs from 'fs/promises';

async function check() {
    const content = await fs.readFile('tools/output/spells.json', 'utf8');
    const spells = JSON.parse(content);
    const feuerpfeil = spells.find(s => s.name === 'FEUERPFEIL');
    console.log('--- FEUERPFEIL ---');
    console.log(JSON.stringify(feuerpfeil, null, 2));
    
    const zeitstopp = spells.find(s => s.name === 'ZEITSTOPP');
    console.log('\n--- ZEITSTOPP ---');
    console.log(JSON.stringify(zeitstopp, null, 2));
}

check().catch(console.error);
