import fs from 'fs/promises';

async function generateSeed() {
    const toolsData = JSON.parse(await fs.readFile('tools/intermediate_data/tools.json', 'utf-8'));
    const gearData = JSON.parse(await fs.readFile('tools/intermediate_data/gear.json', 'utf-8'));

    let sql = "-- PURGE\nDELETE FROM core_tools;\nDELETE FROM core_gear;\nVACUUM;\n\n";

    sql += "-- TOOLS\n";
    for (const tool of toolsData.tools) {
        const dataJson = JSON.stringify(tool.data).replace(/'/g, "''");
        sql += `INSERT INTO core_tools (id, name, category, cost_gp, weight_kg, data) VALUES ('${tool.id}', '${tool.name.replace(/'/g, "''")}', '${tool.category}', ${tool.cost_gp}, ${tool.weight_kg}, '${dataJson}');\n`;
    }

    sql += "\n-- GEAR\n";
    for (const item of gearData.gear) {
        const dataJson = JSON.stringify(item.data).replace(/'/g, "''");
        sql += `INSERT INTO core_gear (id, name, description, cost_gp, weight_kg, data) VALUES ('${item.id}', '${item.name.replace(/'/g, "''")}', '${item.description.replace(/'/g, "''")}', ${item.cost_gp}, ${item.weight_kg}, '${dataJson}');\n`;
    }

    await fs.writeFile('tools/seeds/gear_and_tools_seed.sql', sql);
    console.log("Seed SQL generated at tools/seeds/gear_and_tools_seed.sql");
}

generateSeed().catch(console.error);






