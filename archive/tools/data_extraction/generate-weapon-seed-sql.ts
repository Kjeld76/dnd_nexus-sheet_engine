import fs from 'fs/promises';

async function main() {
    const propertiesData = JSON.parse(await fs.readFile('tools/intermediate_data/weapon_properties.json', 'utf8'));
    const masteriesData = JSON.parse(await fs.readFile('tools/intermediate_data/weapon_masteries.json', 'utf8'));
    const weaponsData = JSON.parse(await fs.readFile('tools/intermediate_data/weapons_enriched.json', 'utf8'));

    let sql = `-- PURGE
DELETE FROM custom_weapons;
DELETE FROM core_weapons;
DELETE FROM weapon_properties;
DELETE FROM weapon_masteries;

-- PROPERTIES
`;

    for (const p of propertiesData.properties) {
        const dataJson = JSON.stringify(p.data).replace(/'/g, "''");
        sql += `INSERT INTO weapon_properties (id, name, description, data) VALUES ('${p.id}', '${p.name.replace(/'/g, "''")}', '${p.description.replace(/'/g, "''")}', '${dataJson}');\n`;
    }

    sql += `\n-- MASTERIES\n`;
    for (const m of masteriesData.masteries) {
        const dataJson = JSON.stringify(m.data).replace(/'/g, "''");
        sql += `INSERT INTO weapon_masteries (id, name, description, data) VALUES ('${m.id}', '${m.name.replace(/'/g, "''")}', '${m.description.replace(/'/g, "''")}', '${dataJson}');\n`;
    }

    sql += `\n-- WEAPONS\n`;
    for (const w of weaponsData.weapons) {
        const dataJson = JSON.stringify(w.data).replace(/'/g, "''");
        sql += `INSERT INTO core_weapons (id, name, category, weapon_type, damage_dice, damage_type, weight_kg, cost_gp, data) VALUES ('${w.id}', '${w.name.replace(/'/g, "''")}', '${w.category}', '${w.weapon_type}', '${w.damage_dice}', '${w.damage_type}', ${w.weight_kg}, ${w.cost_gp}, '${dataJson}');\n`;
    }

    await fs.writeFile('tools/seeds/weapons_seed.sql', sql);
    console.log("Seed SQL generated: tools/seeds/weapons_seed.sql");
}

main();






