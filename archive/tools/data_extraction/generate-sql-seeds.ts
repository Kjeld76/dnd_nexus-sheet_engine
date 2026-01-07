import fs from 'fs';
import path from 'path';

async function main() {
    const spells = JSON.parse(fs.readFileSync('tools/intermediate_data/extracted_spells.json', 'utf8'));
    const species = JSON.parse(fs.readFileSync('tools/intermediate_data/extracted_species.json', 'utf8'));
    const classes = JSON.parse(fs.readFileSync('tools/intermediate_data/extracted_classes.json', 'utf8'));
    const items = JSON.parse(fs.readFileSync('tools/intermediate_data/extracted_items.json', 'utf8'));
    const feats = JSON.parse(fs.readFileSync('tools/intermediate_data/extracted_feats.json', 'utf8'));
    const skills = JSON.parse(fs.readFileSync('tools/intermediate_data/extracted_skills.json', 'utf8'));

    let sql = `-- PHB 2024 Core Data Seed\n`;
    sql += `DELETE FROM core_spells;\n`;
    sql += `DELETE FROM core_species;\n`;
    sql += `DELETE FROM core_classes;\n`;
    sql += `DELETE FROM core_feats;\n`;
    sql += `DELETE FROM core_skills;\n`;

    // Spells
    for (const s of spells) {
        const classesStr = Array.isArray(s.classes) ? s.classes.join(', ') : (s.classes || 'Universal');
        sql += `INSERT INTO core_spells (id, name, level, school, casting_time, range, components, duration, concentration, ritual, description, classes, data) VALUES ('${s.id}', '${s.name.replace(/'/g, "''")}', ${s.level}, '${s.school}', '${s.casting_time}', '${s.range}', '${s.components}', '${s.duration}', ${s.concentration ? 1 : 0}, ${s.ritual ? 1 : 0}, '${s.description.replace(/'/g, "''")}', '${classesStr.replace(/'/g, "''")}', '${JSON.stringify(s.data).replace(/'/g, "''")}');\n`;
    }

    // Species
    for (const s of species) {
        sql += `INSERT INTO core_species (id, name, data) VALUES ('${s.id}', '${s.name.replace(/'/g, "''")}', '${JSON.stringify(s).replace(/'/g, "''")}');\n`;
    }

    // Classes
    for (const c of classes) {
        sql += `INSERT INTO core_classes (id, name, data) VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', '${JSON.stringify(c).replace(/'/g, "''")}');\n`;
    }

    // Feats
    for (const f of feats) {
        sql += `INSERT INTO core_feats (id, name, category, data) VALUES ('${f.id}', '${f.name.replace(/'/g, "''")}', '${f.category}', '${JSON.stringify(f.data).replace(/'/g, "''")}');\n`;
    }

    // Skills
    for (const s of skills) {
        sql += `INSERT INTO core_skills (id, name, ability, description) VALUES ('${s.id}', '${s.name.replace(/'/g, "''")}', '${s.ability}', '${s.description.replace(/'/g, "''")}');\n`;
    }

    fs.writeFileSync('tools/seeds/purge_and_seed.sql', sql);
    console.log('SQL seed generated: tools/seeds/purge_and_seed.sql');
}

main();
