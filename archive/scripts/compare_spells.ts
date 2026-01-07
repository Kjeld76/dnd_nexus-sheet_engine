import fs from 'fs';
import path from 'path';

const originalSpells = fs.readFileSync('original_spells_list.txt', 'utf8')
  .split('\n')
  .map(s => s.trim())
  .filter(s => s.length > 0);

const importedSpells = JSON.parse(fs.readFileSync('tools/output/spells.json', 'utf8'));
const importedNames = importedSpells.map((s: any) => s.name.toUpperCase());

const missing = originalSpells.filter(name => !importedNames.includes(name.toUpperCase()));
const withIncompleteData = importedSpells.filter((s: any) => 
  s.school === 'Unbekannt' || 
  !s.school || 
  s.data.classes.length === 0 ||
  !s.data.description ||
  s.name === 'Verwenden'
);

console.log('--- MISSING SPELLS (In Original DB but not in JSON) ---');
console.log(missing.join(', '));
console.log(`Total missing: ${missing.length}`);

console.log('\n--- SPELLS WITH INCOMPLETE DATA (In JSON) ---');
withIncompleteData.forEach((s: any) => {
  const missingFields = [];
  if (s.school === 'Unbekannt' || !s.school) missingFields.push('school');
  if (s.data.classes.length === 0) missingFields.push('classes');
  if (!s.data.description) missingFields.push('description');
  if (s.name === 'Verwenden') missingFields.push('invalid name');
  console.log(`${s.name}: ${missingFields.join(', ')}`);
});
console.log(`Total incomplete: ${withIncompleteData.length}`);
