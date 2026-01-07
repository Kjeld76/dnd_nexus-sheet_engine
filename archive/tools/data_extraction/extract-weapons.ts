import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

function slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-zäöüß0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const WEAPONS_DATA = [
    // Einfache Nahkampf
    { name: "Beil", damage: "1W6 Hieb", props: "Leicht, Wurfwaffe (Reichweite 6/18)", mastery: "Plagen", weight: "1 kg", cost: "5 GM", category: "Einfache Waffen", type: "Nahkampf" },
    { name: "Dolch", damage: "1W4 Stich", props: "Finesse, Leicht, Wurfwaffe (Reichweite 6/18)", mastery: "Einkerben", weight: "0,5 kg", cost: "2 GM", category: "Einfache Waffen", type: "Nahkampf" },
    { name: "Kampfstab", damage: "1W6 Wucht", props: "Vielseitig (1W8)", mastery: "Umstoßen", weight: "2 kg", cost: "2 SM", category: "Einfache Waffen", type: "Nahkampf" },
    { name: "Knüppel", damage: "1W4 Wucht", props: "Leicht", mastery: "Verlangsamen", weight: "1 kg", cost: "1 SM", category: "Einfache Waffen", type: "Nahkampf" },
    { name: "Leichter Hammer", damage: "1W4 Wucht", props: "Leicht, Wurfwaffe (Reichweite 6/18)", mastery: "Einkerben", weight: "1 kg", cost: "2 GM", category: "Einfache Waffen", type: "Nahkampf" },
    { name: "Sichel", damage: "1W4 Hieb", props: "Leicht", mastery: "Einkerben", weight: "1 kg", cost: "1 GM", category: "Einfache Waffen", type: "Nahkampf" },
    { name: "Speer", damage: "1W6 Stich", props: "Vielseitig (1W8), Wurfwaffe (Reichweite 6/18)", mastery: "Auslaugen", weight: "1,5 kg", cost: "1 GM", category: "Einfache Waffen", type: "Nahkampf" },
    { name: "Streitkolben", damage: "1W6 Wucht", props: "", mastery: "Auslaugen", weight: "2 kg", cost: "5 GM", category: "Einfache Waffen", type: "Nahkampf" },
    { name: "Wurfspeer", damage: "1W6 Stich", props: "Wurfwaffe (Reichweite 9/36)", mastery: "Verlangsamen", weight: "1 kg", cost: "5 SM", category: "Einfache Waffen", type: "Nahkampf" },
    { name: "Zweihandknüppel", damage: "1W8 Wucht", props: "Zweihändig", mastery: "Stoßen", weight: "5 kg", cost: "2 SM", category: "Einfache Waffen", type: "Nahkampf" },
    
    // Einfache Fernkampf
    { name: "Kurzbogen", damage: "1W6 Stich", props: "Geschosse (Reichweite 24/96, Pfeil), Zweihändig", mastery: "Plagen", weight: "1 kg", cost: "25 GM", category: "Einfache Waffen", type: "Fernkampf" },
    { name: "Leichte Armbrust", damage: "1W8 Stich", props: "Geschosse (Reichweite 24/96, Bolzen), Laden, Zweihändig", mastery: "Verlangsamen", weight: "2,5 kg", cost: "25 GM", category: "Einfache Waffen", type: "Fernkampf" },
    { name: "Schleuder", damage: "1W4 Wucht", props: "Geschosse (Reichweite 9/36, Kugel)", mastery: "Verlangsamen", weight: "0 kg", cost: "1 SM", category: "Einfache Waffen", type: "Fernkampf" },
    { name: "Wurfpfeil", damage: "1W4 Stich", props: "Finesse, Wurfwaffe (Reichweite 6/18)", mastery: "Plagen", weight: "0,125 kg", cost: "5 KM", category: "Einfache Waffen", type: "Fernkampf" },

    // Kriegswaffen Nahkampf
    { name: "Dreizack", damage: "1W8 Stich", props: "Vielseitig (1W10), Wurfwaffe (Reichweite 6/18)", mastery: "Umstoßen", weight: "2 kg", cost: "5 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Flegel", damage: "1W8 Wucht", props: "", mastery: "Auslaugen", weight: "1 kg", cost: "10 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Glefe", damage: "1W10 Hieb", props: "Schwer, Weitreichend, Zweihändig", mastery: "Streifen", weight: "3 kg", cost: "20 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Hellebarde", damage: "1W10 Hieb", props: "Schwer, Weitreichend, Zweihändig", mastery: "Spalten", weight: "3 kg", cost: "20 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Kriegshammer", damage: "1W8 Wucht", props: "Vielseitig (1W10)", mastery: "Stoßen", weight: "2,5 kg", cost: "15 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Kriegspicke", damage: "1W8 Stich", props: "Vielseitig (1W10)", mastery: "Auslaugen", weight: "1 kg", cost: "5 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Krummsäbel", damage: "1W6 Hieb", props: "Finesse, Leicht", mastery: "Einkerben", weight: "1,5 kg", cost: "25 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Kurzschwert", damage: "1W6 Stich", props: "Finesse, Leicht", mastery: "Plagen", weight: "1 kg", cost: "10 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Langschwert", damage: "1W8 Hieb", props: "Vielseitig (1W10)", mastery: "Auslaugen", weight: "1,5 kg", cost: "15 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Lanze", damage: "1W10 Stich", props: "Schwer, Weitreichend, Zweihändig (sofern nicht beritten)", mastery: "Umstoßen", weight: "3 kg", cost: "10 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Morgenstern", damage: "1W8 Stich", props: "", mastery: "Auslaugen", weight: "2 kg", cost: "15 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Peitsche", damage: "1W4 Hieb", props: "Finesse, Weitreichend", mastery: "Verlangsamen", weight: "1,5 kg", cost: "2 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Pike", damage: "1W10 Stich", props: "Schwer, Weitreichend, Zweihändig", mastery: "Stoßen", weight: "9 kg", cost: "5 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Rapier", damage: "1W8 Stich", props: "Finesse", mastery: "Plagen", weight: "1 kg", cost: "25 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Streitaxt", damage: "1W8 Hieb", props: "Vielseitig (1W10)", mastery: "Umstoßen", weight: "2 kg", cost: "10 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Zweihandaxt", damage: "1W12 Hieb", props: "Schwer, Zweihändig", mastery: "Spalten", weight: "3,5 kg", cost: "30 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Zweihandhammer", damage: "2W6 Wucht", props: "Schwer, Zweihändig", mastery: "Umstoßen", weight: "5 kg", cost: "10 GM", category: "Kriegswaffen", type: "Nahkampf" },
    { name: "Zweihandschwert", damage: "2W6 Hieb", props: "Schwer, Zweihändig", mastery: "Streifen", weight: "3 kg", cost: "50 GM", category: "Kriegswaffen", type: "Nahkampf" },

    // Kriegswaffen Fernkampf
    { name: "Blasrohr", damage: "1 Stich", props: "Geschosse (Reichweite 7,5/30, Blasrohrpfeil), Laden", mastery: "Plagen", weight: "0,5 kg", cost: "10 GM", category: "Kriegswaffen", type: "Fernkampf" },
    { name: "Handarmbrust", damage: "1W6 Stich", props: "Geschosse (Reichweite 9/36, Bolzen), Leicht, Laden", mastery: "Plagen", weight: "1,5 kg", cost: "75 GM", category: "Kriegswaffen", type: "Fernkampf" },
    { name: "Langbogen", damage: "1W8 Stich", props: "Geschosse (Reichweite 45/180, Pfeil), Schwer, Zweihändig", mastery: "Verlangsamen", weight: "1 kg", cost: "50 GM", category: "Kriegswaffen", type: "Fernkampf" },
    { name: "Muskete", damage: "1W12 Stich", props: "Geschosse (Reichweite 12/36, Kugel), Laden, Zweihändig", mastery: "Verlangsamen", weight: "5 kg", cost: "500 GM", category: "Kriegswaffen", type: "Fernkampf" },
    { name: "Pistole", damage: "1W10 Stich", props: "Geschosse (Reichweite 9/27, Kugel), Laden", mastery: "Plagen", weight: "1,5 kg", cost: "250 GM", category: "Kriegswaffen", type: "Fernkampf" },
    { name: "Schwere Armbrust", damage: "1W10 Stich", props: "Geschosse (Reichweite 30/120, Bolzen), Laden, Schwer, Zweihändig", mastery: "Stoßen", weight: "9 kg", cost: "50 GM", category: "Kriegswaffen", type: "Fernkampf" },
];

function parseCost(costStr: string): number {
    const match = costStr.match(/(\d+(?:,\d+)?)\s*(GM|SM|KM|EM|PM)/i);
    if (!match) return 0;
    const value = parseFloat(match[1].replace(',', '.'));
    const unit = match[2].toUpperCase();
    switch (unit) {
        case 'GM': return value;
        case 'SM': return value / 10;
        case 'KM': return value / 100;
        case 'EM': return value / 2;
        case 'PM': return value * 10;
        default: return value;
    }
}

function parseWeight(weightStr: string): number {
    const match = weightStr.match(/(\d+(?:,\d+)?)\s*(kg|g)/i);
    if (!match) return 0;
    const value = parseFloat(match[1].replace(',', '.'));
    const unit = match[2].toLowerCase();
    return unit === 'g' ? value / 1000 : value;
}

const MASTERY_MAP: Record<string, string> = {
    "Plagen": "vex",
    "Einkerben": "nick",
    "Umstoßen": "topple",
    "Verlangsamen": "slow",
    "Auslaugen": "sap",
    "Stoßen": "push",
    "Streifen": "graze",
    "Spalten": "cleave"
};

const PROP_MAP: Record<string, string> = {
    "Finesse": "finesse",
    "Leicht": "light",
    "Schwer": "heavy",
    "Weitreichend": "reach",
    "Zweihändig": "two-handed",
    "Laden": "loading",
    "Vielseitig": "versatile",
    "Geschosse": "ammunition",
    "Wurfwaffe": "thrown"
};

async function main() {
    const weapons = WEAPONS_DATA.map(w => {
        const id = slugify(w.name);
        const damageMatch = w.damage.match(/(\d+W\d+|\d+)\s*(.*)/);
        const damage_dice = damageMatch ? damageMatch[1] : w.damage;
        const damage_type = damageMatch ? damageMatch[2].trim() : "";
        
        const data: any = {
            properties: [] as string[],
            mastery: MASTERY_MAP[w.mastery] || w.mastery.toLowerCase(),
            source_page: 213
        };

        // Split properties by comma, but handle nested parentheses
        const propParts: string[] = [];
        let current = "";
        let depth = 0;
        for (let char of w.props) {
            if (char === '(') depth++;
            else if (char === ')') depth--;
            
            if (char === ',' && depth === 0) {
                propParts.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        if (current) propParts.push(current.trim());

        for (const part of propParts) {
            if (!part) continue;
            
            // Check for range/thrown range
            const rangeMatch = part.match(/(Reichweite|Wurfwaffe)\s*\(Reichweite\s*(\d+(?:,\d+)?)\/(\d+(?:,\d+)?)\)/i);
            if (rangeMatch) {
                const normal = parseFloat(rangeMatch[2].replace(',', '.'));
                const max = parseFloat(rangeMatch[3].replace(',', '.'));
                if (rangeMatch[1].toLowerCase() === 'wurfwaffe') {
                    data.thrown_range = { normal, max };
                    data.properties.push('thrown');
                } else {
                    data.range = { normal, max };
                }
                continue;
            }

            // Check for versatile damage
            const versatileMatch = part.match(/Vielseitig\s*\((\d+W\d+)\)/i);
            if (versatileMatch) {
                data.versatile_damage = versatileMatch[1];
                data.properties.push('versatile');
                continue;
            }

            // Check for ammo with range - UPDATED regex to be less strict about inner parentheses
            const ammoMatch = part.match(/Geschosse\s*\(Reichweite\s*(\d+(?:,\d+)?)\/(\d+(?:,\d+)?)(?:,\s*([^)]+))?\)/i);
            if (ammoMatch) {
                data.range = { 
                    normal: parseFloat(ammoMatch[1].replace(',', '.')), 
                    max: parseFloat(ammoMatch[2].replace(',', '.')) 
                };
                if (ammoMatch[3]) data.ammunition_type = ammoMatch[3].trim();
                data.properties.push('ammunition');
                continue;
            }

            // Simple properties
            for (const [de, en] of Object.entries(PROP_MAP)) {
                if (part.startsWith(de)) {
                    if (!data.properties.includes(en)) data.properties.push(en);
                    break;
                }
            }
        }

        return {
            id,
            name: w.name,
            category: w.category,
            weapon_type: w.type,
            damage_dice,
            damage_type,
            weight_kg: parseWeight(w.weight),
            cost_gp: parseCost(w.cost),
            data
        };
    });

    await fs.writeFile('tools/intermediate_data/weapons.json', JSON.stringify({ weapons }, null, 2));
    console.log(`Extracted ${weapons.length} weapons.`);
}

main();
