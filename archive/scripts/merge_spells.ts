import fs from 'fs';

interface SpellData {
  time: string;
  range: string;
  duration: string;
  components: string;
  materials: string;
  description: string;
  concentration: boolean;
  ritual: boolean;
  classes: string[];
}

interface Spell {
  name: string;
  level: number;
  school: string;
  data: SpellData;
}

function merge() {
  // 1. Load DB spells (remove BOM if present)
  let dbContent = fs.readFileSync('db_spells.json', 'utf8');
  if (dbContent.charCodeAt(0) === 0xFEFF) {
    dbContent = dbContent.slice(1);
  }
  
  const dbSpellsRaw: any[] = JSON.parse(dbContent);
  const dbSpells: Record<string, Spell> = {};

  for (const s of dbSpellsRaw) {
    dbSpells[s.name.toUpperCase()] = {
      name: s.name,
      level: s.level,
      school: s.school,
      data: {
        time: s.time,
        range: s.range,
        duration: s.duration,
        components: "",
        materials: "",
        description: s.description,
        concentration: s.is_concentration === 1,
        ritual: s.is_ritual === 1,
        classes: s.classes ? s.classes.split(',') : []
      }
    };
  }

  // 2. Load JSON spells (DOCX)
  const jsonSpells: Spell[] = JSON.parse(fs.readFileSync('tools/output/spells.json', 'utf8'));
  
  // 3. Merge
  const finalSpells: Record<string, Spell> = { ...dbSpells };

  for (const js of jsonSpells) {
    const key = js.name.toUpperCase();
    if (finalSpells[key]) {
      const existing = finalSpells[key];
      finalSpells[key] = {
        name: js.name,
        level: js.level,
        school: js.school !== 'Unbekannt' ? js.school : existing.school,
        data: {
          ...existing.data,
          time: js.data.time || existing.data.time,
          range: js.data.range || existing.data.range,
          duration: js.data.duration || existing.data.duration,
          components: js.data.components || existing.data.components,
          materials: js.data.materials || existing.data.materials,
          description: js.data.description.length > 20 ? js.data.description : existing.data.description,
          concentration: js.data.concentration,
          ritual: js.data.ritual,
          classes: js.data.classes.length > 0 ? js.data.classes : existing.data.classes
        }
      };
    } else {
      if (js.data.description.length > 20 && js.school !== 'Unbekannt') {
        finalSpells[key] = js;
      }
    }
  }

  const result = Object.values(finalSpells).sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync('tools/output/spells.json', JSON.stringify(result, null, 2));
  console.log(`Successfully merged ${result.length} spells into tools/output/spells.json`);
}

merge();
