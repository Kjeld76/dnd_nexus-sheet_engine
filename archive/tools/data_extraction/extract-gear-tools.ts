import fs from 'fs/promises';

interface ToolAction {
    action: string;
    dc: number;
}

interface Tool {
    id: string;
    name: string;
    category: string;
    cost_gp: number;
    weight_kg: number;
    data: {
        abilities: string[];
        use_actions: ToolAction[];
        crafting_items?: string[];
        parent_tool?: string;
        source_page: number;
    };
}

interface Gear {
    id: string;
    name: string;
    description: string;
    cost_gp: number;
    weight_kg: number;
    data: any;
}

const ABILITY_MAP: Record<string, string> = {
    'Stärke': 'STR', 'Geschicklichkeit': 'DEX', 'Konstitution': 'CON',
    'Intelligenz': 'INT', 'Weisheit': 'WIS', 'Charisma': 'CHA'
};

function slugify(text: string): string {
    return text.toLowerCase()
        .replace(/[^a-zäöüß0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function cleanText(text: string): string {
    if (!text) return "";
    return text.replace(/\s+/g, ' ')
               .replace(/Ǭ/g, 'o')
               .replace(/o/g, 'ü')
               .replace(/"/g, 'ä')
               .replace(/-/g, 'ö')
               .replace(/Y/g, 'ß')
               .trim();
}

async function extractAll() {
    try {
        const fullText = await fs.readFile('tools/phb_text.txt', 'utf-8');
        const lines = fullText.split('\n');
        // Tools and gear are roughly between lines 23000 and 26000
        const text = lines.slice(23000, 26000).join('\n');
        
        const tools: Tool[] = [];
        const toolNames = [
            "ALCHEMISTENAUSRÜSTUNG", "BRAUERZUBEHÖR", "GLASBLÄSERWERKZEUG", "HOLZSCHNITZERWERKZEUG",
            "JUWELIERWERKZEUG", "KALLIGRAFENWERKZEUG", "KARTOGRAFENWERKZEUG", "KOCHUTENSILIEN",
            "LEDERERWERKZEUG", "MALUTENSILIEN", "MAURERWERKZEUG", "SCHMIEDEWERKZEUG",
            "SCHREINERWERKZEUG", "SCHUSTERWERKZEUG", "TÖPFERWERKZEUG", "TÜFTLERWERKZEUG",
            "WEBERWERKZEUG", "DIEBESWERKZEUG", "FÄLSCHERAUSRÜSTUNG", "GIFTMISCHERAUSRÜSTUNG",
            "KRÄUTERKUNDEAUSRÜSTUNG", "NAVIGATIONSWERKZEUG", "VERKLEIDUNGSAUSRÜSTUNG"
        ];

        for (const tn of toolNames) {
            const escaped = tn.replace(/[AÄÖÜ]/g, '.');
            const regex = new RegExp(`${escaped}\\s*\\((\\d+) GM\\)([\\s\\S]+?)(?=\\n\\n[A-ZÄÖÜß\\s"-]{5,} \\(|$)`, 'i');
            const match = text.match(regex);
            
            if (match) {
                const block = match[2];
                const weightMatch = block.match(/Gewicht: ([\d,]+) kg/);
                const abilityMatch = block.match(/Attribut: ([A-Za-zäöüß]+)/);
                
                const useActions: any[] = [];
                const useSection = block.match(/Verwenden: ([\s\S]+?)(?=\n\n|Herstellen:|$)/);
                if (useSection) {
                    const actions = useSection[1].split(/ oder |\n/);
                    for (const a of actions) {
                        const dcMatch = a.match(/(.+?) \(SG (\d+)\)/);
                        if (dcMatch) {
                            useActions.push({ action: cleanText(dcMatch[1]), dc: parseInt(dcMatch[2]) });
                        }
                    }
                }

                const craftingItems: string[] = [];
                const craftSection = block.match(/Herstellen: ([\s\S]+?)(?=\n\n|$)/);
                if (craftSection) {
                    craftingItems.push(...craftSection[1].split(/,|\n/).map(i => cleanText(i)).filter(i => i.length > 0));
                }

                tools.push({
                    id: slugify(tn),
                    name: tn.charAt(0) + tn.slice(1).toLowerCase().replace(/ü/g, 'ü').replace(/ö/g, 'ö').replace(/ä/g, 'ä'),
                    category: "Werkzeug",
                    cost_gp: parseInt(match[1]),
                    weight_kg: weightMatch ? parseFloat(weightMatch[1].replace(',', '.')) : 0,
                    data: {
                        abilities: abilityMatch ? [ABILITY_MAP[cleanText(abilityMatch[1])] || cleanText(abilityMatch[1])] : [],
                        use_actions: useActions,
                        crafting_items: craftingItems,
                        source_page: 220
                    }
                });
            }
        }

        // 2. EXTRACT GEAR
        const gear: Gear[] = [];
        const gearNames = [
            "Alchemistenfeuer", "Beutel", "Blendlaterne", "Brechstange", "Buch", "Decke",
            "Diplomatenausrüstung", "Eimer", "Einbrecherausrüstung", "Entdeckerausrüstung",
            "Enterhaken", "Fackel", "Fass", "Fernrohr", "Flasche", "Glasflasche", "Flaschenzug",
            "Gegengift", "Gelehrtenausrüstung", "Gewölbeforscherausrüstung", "Gift, einfach",
            "Glocke", "Handschellen", "Heilerausrüstung", "Heiltrank", "Jagdfalle", "Karte",
            "Kerze", "Kette", "Kleidung, fein", "Kleidung, Reise", "Kletterausrüstung",
            "Köcher", "Korb", "Kostüm", "Krähenfüße", "Krug", "Lampe", "Laterne, abdeckbare",
            "Leiter", "Lupe", "Materialkomponentenbeutel", "Metallkügelchen", "Netz", "Öl",
            "Papier", "Parfüm", "Pergament", "Phiole", "Priesterausrüstung", "Rammbock, tragbarer",
            "Rationen", "Robe", "Rucksack", "Sack", "Säure", "Schaufel", "Schlafsack", "Schloss",
            "Schnur", "Seil", "Signalpfeife", "Spiegel", "Stachel, Eisen", "Stange", "Tinte",
            "Tintenfüller", "Trinkschlauch", "Truhe", "Zelt", "Zunderkästchen"
        ];

        for (const gn of gearNames) {
            const escaped = gn.toUpperCase().replace(/[AÄÖÜ]/g, '.');
            const regex = new RegExp(`${escaped}\\s*\\((.+?)\\)([\\s\\S]+?)(?=\\n[A-ZÄÖÜß\\s,]{5,} \\(|$)`, 'i');
            const match = text.match(regex);

            if (match) {
                const costRaw = match[1];
                let cost = 0;
                const costMatch = costRaw.match(/(\d+)\s*(GM|SM|KM)/);
                if (costMatch) {
                    cost = parseInt(costMatch[1]);
                    if (costMatch[2] === "SM") cost /= 10;
                    if (costMatch[2] === "KM") cost /= 100;
                }

                gear.push({
                    id: slugify(gn),
                    name: gn,
                    description: cleanText(match[2].split("KAPITEL 6")[0]),
                    cost_gp: cost,
                    weight_kg: 0,
                    data: { source_page: 222 }
                });
            }
        }

        // Add weights from table
        const weightRegex = /^([A-Za-zÄÖÜßa-z\s\(\),-]{3,})\s+([\d,]+|Variiert|-)\s*(?:kg)?\s+(\d+)\s*(GM|SM|KM)$/gm;
        let wMatch;
        while ((wMatch = weightRegex.exec(text)) !== null) {
            const nameRaw = wMatch[1].trim();
            const g = gear.find(item => slugify(item.name) === slugify(nameRaw));
            if (g && wMatch[2] !== "Variiert" && wMatch[2] !== "-") {
                g.weight_kg = parseFloat(wMatch[2].replace(',', '.'));
            }
        }

        await fs.writeFile('tools/intermediate_data/tools.json', JSON.stringify({ tools }, null, 2));
        await fs.writeFile('tools/intermediate_data/gear.json', JSON.stringify({ gear }, null, 2));
        console.log(`Extracted ${tools.length} tools and ${gear.length} gear items.`);
    } catch (err) {
        console.error("Extraction error:", err);
    }
}

extractAll();
