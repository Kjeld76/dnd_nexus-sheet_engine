import fs from 'fs/promises';

async function verify() {
    const content = await fs.readFile('tools/output/spells.json', 'utf8');
    const spells = JSON.parse(content);
    
    console.log(`Total spells: ${spells.length}`);
    
    const sampleSize = 10;
    const samples = spells.slice(100, 100 + sampleSize);
    
    samples.forEach(s => {
        console.log(`- ${s.name}: Components="${s.data.components}", Materials="${s.data.materials}"`);
    });

    const missing = spells.filter(s => !s.data.components || s.data.components === "");
    console.log(`\nSpells missing components: ${missing.length}`);
    if (missing.length > 0) {
        console.log("First 5 missing:");
        missing.slice(0, 5).forEach(m => console.log(`  - ${m.name}`));
    }
}

verify().catch(console.error);


