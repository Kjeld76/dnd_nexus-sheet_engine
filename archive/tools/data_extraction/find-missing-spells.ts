import fs from 'fs';

const spellIds = fs.readFileSync('tools/spell_ids.txt', 'utf8').split('\n').map(id => id.trim()).filter(id => id);
const cleanedSpells = JSON.parse(fs.readFileSync('tools/intermediate_data/cleaned_spells.json', 'utf8'));
const extractedIds = cleanedSpells.map((s: any) => s.id);

const missingIds = spellIds.filter(id => !extractedIds.includes(id));

console.log("Missing IDs:", missingIds);





