import fs from 'fs/promises';

async function main() {
    const propertiesData = JSON.parse(await fs.readFile('tools/intermediate_data/weapon_properties.json', 'utf8'));
    const masteriesData = JSON.parse(await fs.readFile('tools/intermediate_data/weapon_masteries.json', 'utf8'));
    const weaponsData = JSON.parse(await fs.readFile('tools/intermediate_data/weapons.json', 'utf8'));

    const propMap = new Map(propertiesData.properties.map((p: any) => [p.id, p]));
    const masteryMap = new Map(masteriesData.masteries.map((m: any) => [m.id, m]));

    const enrichedWeapons = weaponsData.weapons.map((w: any) => {
        const enriched = { ...w };
        enriched.data.property_details = {};
        for (const propId of w.data.properties) {
            if (propMap.has(propId)) {
                enriched.data.property_details[propId] = propMap.get(propId);
            }
        }
        
        if (masteryMap.has(w.data.mastery)) {
            enriched.data.mastery_details = masteryMap.get(w.data.mastery);
        }
        
        return enriched;
    });

    await fs.writeFile('tools/intermediate_data/weapons_enriched.json', JSON.stringify({ weapons: enrichedWeapons }, null, 2));
    console.log(`Enriched ${enrichedWeapons.length} weapons.`);
}

main();






