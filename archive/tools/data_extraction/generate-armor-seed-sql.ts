import fs from 'fs/promises';

async function main() {
    const armorsData = JSON.parse(await fs.readFile('tools/intermediate_data/armors.json', 'utf8'));

    let sql = `-- PURGE ARMORS
DELETE FROM custom_armors;
DELETE FROM core_armors;

-- ARMORS
`;

    for (const a of armorsData.armors) {
        const dataJson = JSON.stringify(a.data).replace(/'/g, "''");
        const strReq = a.strength_requirement === null ? 'NULL' : a.strength_requirement;
        sql += `INSERT INTO core_armors (id, name, category, base_ac, strength_requirement, stealth_disadvantage, weight_kg, cost_gp, data) VALUES ('${a.id}', '${a.name.replace(/'/g, "''")}', '${a.category}', ${a.base_ac}, ${strReq}, ${a.stealth_disadvantage ? 1 : 0}, ${a.weight_kg}, ${a.cost_gp}, '${dataJson}');\n`;
    }

    await fs.writeFile('tools/seeds/armors_seed.sql', sql);
    console.log("Seed SQL generated: tools/seeds/armors_seed.sql");
}

main();






