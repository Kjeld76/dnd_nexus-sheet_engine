import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('dnd-nexus.db');
const db = new Database(dbPath);

const coreBackgrounds = db.prepare('SELECT id, name, data FROM core_backgrounds WHERE name IN (?, ?, ?, ?, ?, ?)').all(
  'Händler', 'Handwerker', 'Krimineller', 'Reisender', 'Akolyth', 'Einsiedler'
) as Array<{
  id: string;
  name: string;
  data: string;
}>;

const customBackgrounds = db.prepare('SELECT id, name, data FROM custom_backgrounds').all() as Array<{
  id: string;
  name: string;
  data: string;
}>;

const backgrounds = [
  ...coreBackgrounds.map(bg => ({ ...bg, table: 'core_backgrounds' })),
  ...customBackgrounds.map(bg => ({ ...bg, table: 'custom_backgrounds' }))
];

console.log('Prüfe Background Equipment:\n');

for (const bg of backgrounds) {
  const data = JSON.parse(bg.data);
  if (data.starting_equipment?.options) {
    console.log(`\n📌 ${bg.name} (${bg.table}):`);
    data.starting_equipment.options.forEach((opt: any, idx: number) => {
      if (opt.items && Array.isArray(opt.items)) {
        console.log(`  Option ${opt.label || idx + 1}:`);
        opt.items.forEach((item: any) => {
          if (typeof item === 'string') {
            console.log(`    - "${item}" (String)`);
          } else {
            console.log(`    - ${JSON.stringify(item)}`);
          }
        });
      }
    });
  }
}

db.close();
