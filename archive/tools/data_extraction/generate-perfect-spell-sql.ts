import fs from 'fs';

const spells = JSON.parse(fs.readFileSync('tools/intermediate_data/perfect_spells.json', 'utf8'));

let sql = `-- Perfect PHB 2024 Spell Seed
DELETE FROM custom_spells;
DELETE FROM core_spells;

`;

for (const s of spells) {
    const material_components = s.material_components ? `'${s.material_components.replace(/'/g, "''")}'` : 'NULL';
    const data = JSON.stringify(s.data).replace(/'/g, "''");
    const description = s.description.replace(/'/g, "''");
    const higher_levels = s.higher_levels.replace(/'/g, "''");
    const classes = s.classes.replace(/'/g, "''");
    const name = s.name.replace(/'/g, "''");
    const school = s.school.replace(/'/g, "''");
    const casting_time = s.casting_time.replace(/'/g, "''");
    const range = s.range.replace(/'/g, "''");
    const components = s.components.replace(/'/g, "''");
    const duration = s.duration.replace(/'/g, "''");

    sql += `INSERT INTO core_spells (id, name, level, school, casting_time, range, components, material_components, duration, concentration, ritual, description, higher_levels, classes, data)
VALUES ('${s.id}', '${name}', ${s.level}, '${school}', '${casting_time}', '${range}', '${components}', ${material_components}, '${duration}', ${s.concentration ? 1 : 0}, ${s.ritual ? 1 : 0}, '${description}', '${higher_levels}', '${classes}', '${data}');\n`;
}

fs.writeFileSync('tools/seeds/perfect_spells_seed.sql', sql);
console.log(`Generated SQL seed for ${spells.length} spells.`);
