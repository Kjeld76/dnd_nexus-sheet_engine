import fs from 'fs/promises';

function slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-zäöüß0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const ARMORS_DATA = [
    // Leichte Rüstung
    {
        name: "Gepolsterte Rüstung",
        category: "Leichte Rüstung",
        ac_text: "11 + GES-Modifikator",
        strength: null,
        stealth: true,
        weight: 4,
        cost: 5
    },
    {
        name: "Lederrüstung",
        category: "Leichte Rüstung",
        ac_text: "11 + GES-Modifikator",
        strength: null,
        stealth: false,
        weight: 5,
        cost: 10
    },
    {
        name: "Beschlagene Lederrüstung",
        category: "Leichte Rüstung",
        ac_text: "12 + GES-Modifikator",
        strength: null,
        stealth: false,
        weight: 6.5,
        cost: 45
    },
    // Mittelschwere Rüstung
    {
        name: "Fellrüstung",
        category: "Mittelschwere Rüstung",
        ac_text: "12 + GES-Modifikator (max. 2)",
        strength: null,
        stealth: false,
        weight: 6,
        cost: 10
    },
    {
        name: "Kettenhemd",
        category: "Mittelschwere Rüstung",
        ac_text: "13 + GES-Modifikator (max. 2)",
        strength: null,
        stealth: false,
        weight: 10,
        cost: 50
    },
    {
        name: "Schuppenpanzer",
        category: "Mittelschwere Rüstung",
        ac_text: "14 + GES-Modifikator (max. 2)",
        strength: null,
        stealth: true,
        weight: 22.5,
        cost: 50
    },
    {
        name: "Brustplatte",
        category: "Mittelschwere Rüstung",
        ac_text: "14 + GES-Modifikator (max. 2)",
        strength: null,
        stealth: false,
        weight: 10,
        cost: 400
    },
    {
        name: "Plattenpanzer",
        category: "Mittelschwere Rüstung",
        ac_text: "15 + GES-Modifikator (max. 2)",
        strength: null,
        stealth: true,
        weight: 20,
        cost: 750
    },
    // Schwere Rüstung
    {
        name: "Ringpanzer",
        category: "Schwere Rüstung",
        ac_text: "14",
        strength: null,
        stealth: true,
        weight: 20,
        cost: 30
    },
    {
        name: "Kettenpanzer",
        category: "Schwere Rüstung",
        ac_text: "16",
        strength: 13,
        stealth: true,
        weight: 27.5,
        cost: 75
    },
    {
        name: "Schienenpanzer",
        category: "Schwere Rüstung",
        ac_text: "17",
        strength: 15,
        stealth: true,
        weight: 30,
        cost: 200
    },
    {
        name: "Ritterrüstung",
        category: "Schwere Rüstung",
        ac_text: "18",
        strength: 15,
        stealth: true,
        weight: 32.5,
        cost: 1500
    },
    // Schilde
    {
        name: "Schild",
        category: "Schild",
        ac_text: "+2",
        strength: null,
        stealth: false,
        weight: 3,
        cost: 10
    }
];

async function main() {
    const armors = ARMORS_DATA.map(a => {
        const base_ac = parseInt(a.ac_text.replace('+', '')) || 0;
        const dex_bonus = {
            apply: a.ac_text.includes("GES-Modifikator"),
            max: a.ac_text.includes("max. 2") ? 2 : null
        };

        return {
            id: slugify(a.name),
            name: a.name,
            category: a.category,
            base_ac,
            strength_requirement: a.strength,
            stealth_disadvantage: a.stealth,
            weight_kg: a.weight,
            cost_gp: a.cost,
            data: {
                dex_bonus,
                ac_formula: a.ac_text,
                source_page: 219
            }
        };
    });

    await fs.writeFile('tools/intermediate_data/armors.json', JSON.stringify({ armors }, null, 2));
    console.log(`Extracted ${armors.length} armors.`);
}

main();






