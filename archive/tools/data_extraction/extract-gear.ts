import fs from 'fs/promises';

interface Gear {
    id: string;
    name: string;
    description: string;
    cost_gp: number;
    weight_kg: number;
    data: any;
}

const ENCODING_FIXES: Record<string, string> = {
    'Ǭ': 'o', 'o': 'ü', '-': 'ö', '"': 'ä', 'Y': 'ß', 'o': 'ü', '-': 'ö', '"': 'ä', 'Sure': 'Säure'
};

function fixEncoding(text: string): string {
    let fixed = text;
    for (const [bad, good] of Object.entries(ENCODING_FIXES)) {
        fixed = fixed.replace(new RegExp(bad, 'g'), good);
    }
    return fixed;
}

function slugify(text: string): string {
    return text.toLowerCase()
        .replace(/[^a-zäöüß0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function extractGear() {
    const text = await fs.readFile('tools/phb_text.txt', 'utf-8');
    const gearList: Gear[] = [];

    // Search for lines in the adventuring gear table
    // Header: Tier Gewicht Kosten (repeats)
    // Example: "Abdeckbare Laterne 1 kg 5 GM"
    const gearLineRegex = /^([A-ZÄÖÜßa-z\s\(\),-]{3,})\s+([\d,]+|Variiert|-)\s*(?:kg)?\s+(\d+)\s*(GM|SM|KM)$/gm;
    
    let match;
    const seenNames = new Set<string>();

    while ((match = gearLineRegex.exec(text)) !== null) {
        let nameRaw = match[1].trim();
        // Clean up: name might have noise
        if (nameRaw.includes('\n')) nameRaw = nameRaw.split('\n').pop()!.trim();
        
        if (!nameRaw || nameRaw.length < 3 || nameRaw.toUpperCase() === nameRaw) continue;
        if (nameRaw.includes("KAPITEL") || nameRaw.includes("ABENTEURERAUSRÜSTUNG") || nameRaw.includes("Gewicht") || nameRaw.includes("Kosten")) continue;
        if (nameRaw === "Symbol" || nameRaw === "Tier") continue;

        const name = fixEncoding(nameRaw);
        if (seenNames.has(name)) continue;

        let weight = 0;
        if (match[2] !== "Variiert" && match[2] !== "-") {
            weight = parseFloat(match[2].replace(',', '.'));
        }

        let cost = parseInt(match[3]);
        if (match[4] === "SM") cost /= 10;
        if (match[4] === "KM") cost /= 100;

        gearList.push({
            id: slugify(name),
            name,
            description: "",
            cost_gp: cost,
            weight_kg: weight,
            data: { source_page: 222 }
        });
        seenNames.add(name);
    }

    // Descriptions
    const descriptionsSection = text.substring(text.indexOf("ABENTEURERAUSRÜSTUNG"));
    for (const gear of gearList) {
        const escapedName = gear.name.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const descRegex = new RegExp(`${escapedName}\\s*\\([^)]+\\)\\s*([\\s\\S]+?)(?=\\n[A-ZÄÖÜß\\s,]{3,} \\(|\\n[A-ZÄÖÜß]{4,}\\s+\\d|$)`, 'i');
        const descMatch = descriptionsSection.match(descRegex);
        if (descMatch) {
            gear.description = fixEncoding(descMatch[1].trim()
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .split("KAPITEL 6")[0]
                .trim());
        }
    }

    await fs.writeFile('tools/intermediate_data/gear.json', JSON.stringify({ gear: gearList }, null, 2));
    console.log(`Extracted ${gearList.length} gear items to tools/intermediate_data/gear.json`);
}

extractGear().catch(console.error);
