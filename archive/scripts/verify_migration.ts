import fs from 'fs/promises';

async function verify() {
  const oldSpellsText = await fs.readFile('old_spells.txt', 'utf-8');
  const oldNames = new Set(oldSpellsText.split('\n').map(s => s.trim().toUpperCase()).filter(s => s.length > 0));

  const spellsJson = JSON.parse(await fs.readFile('tools/output/spells.json', 'utf-8'));
  const newNames = new Set(spellsJson.map((s: any) => s.name.toUpperCase()));

  console.log(`Original DB spells: ${oldNames.size}`);
  console.log(`Parsed JSON spells: ${newNames.size}`);

  const missing = [...oldNames].filter(name => !newNames.has(name));
  console.log(`\nMissing spells from original DB (${missing.length}):`);
  console.log(missing.sort().join(', '));

  const emptyInfo = spellsJson.filter((s: any) => !s.school || s.school === 'Unbekannt' || !s.data.classes || s.data.classes.length === 0);
  console.log(`\nSpells with missing info (school/classes) in JSON (${emptyInfo.length}):`);
  emptyInfo.slice(0, 20).forEach((s: any) => console.log(`- ${s.name} (School: ${s.school}, Classes: ${s.data.classes?.length || 0})`));
}

verify().catch(console.error);
