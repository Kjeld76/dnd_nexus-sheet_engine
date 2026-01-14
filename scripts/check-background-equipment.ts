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
  const data = JSON.parse(bg.data) as unknown;
  if (
    typeof data === 'object' &&
    data !== null &&
    (data as { starting_equipment?: unknown }).starting_equipment &&
    typeof (data as { starting_equipment?: unknown }).starting_equipment === 'object' &&
    (data as { starting_equipment?: { options?: unknown } }).starting_equipment?.options
  ) {
    console.log(`\n📌 ${bg.name} (${bg.table}):`);
    const options = (data as { starting_equipment?: { options?: unknown } })
      .starting_equipment?.options;
    if (!Array.isArray(options)) continue;
    options.forEach((opt: unknown, idx: number) => {
      const optObj =
        typeof opt === 'object' && opt !== null
          ? (opt as { label?: unknown; items?: unknown })
          : {};
      const items = optObj.items;
      if (Array.isArray(items)) {
        const label =
          typeof optObj.label === 'string' ? optObj.label : String(idx + 1);
        console.log(`  Option ${label}:`);
        items.forEach((item: unknown) => {
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
