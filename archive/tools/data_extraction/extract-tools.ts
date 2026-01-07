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

const ABILITY_MAP: Record<string, string> = {
    'Stärke': 'STR',
    'Geschicklichkeit': 'DEX',
    'Konstitution': 'CON',
    'Intelligenz': 'INT',
    'Weisheit': 'WIS',
    'Charisma': 'CHA'
};

function slugify(text: string): string {
    return text.toLowerCase()
        .replace(/[^a-zäöüß0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function extractTools() {
    const rawText = await fs.readFile('tools/phb_text.txt', 'utf-8');
    const tools: Tool[] = [];

    // Pattern for tools: HEADER (COST GM)
    const toolHeaderRegex = /^([A-ZÄÖÜß\s"-]+) \((\d+) GM\)/gm;
    let match;
    while ((match = toolHeaderRegex.exec(rawText)) !== null) {
        const rawName = match[1].trim();
        const cost = parseInt(match[2]);
        
        const startIndex = match.index + match[0].length;
        // Find next header or section
        const remaining = rawText.slice(startIndex);
        const nextHeaderIndex = remaining.search(/\n\n[A-ZÄÖÜß\s"-]+ \(/);
        const block = remaining.slice(0, nextHeaderIndex === -1 ? undefined : nextHeaderIndex);

        const name = fixEncoding(rawName).toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        const weightMatch = block.match(/Gewicht: ([\d,]+) kg/);
        const weight = weightMatch ? parseFloat(weightMatch[1].replace(',', '.')) : 0;
        
        const abilityMatch = block.match(/Attribut: ([A-Za-zäöüß]+)/);
        const ability = abilityMatch ? fixEncoding(abilityMatch[1]) : "";

        const useActions: ToolAction[] = [];
        const useSection = block.match(/Verwenden: ([\s\S]+?)(?=\n\n|Herstellen:|$)/);
        if (useSection) {
            const actions = useSection[1].split(/ oder |\n/);
            for (const a of actions) {
                const dcMatch = a.match(/(.+?) \(SG (\d+)\)/);
                if (dcMatch) {
                    useActions.push({ action: fixEncoding(dcMatch[1].trim().replace(/\s+/g, ' ')), dc: parseInt(dcMatch[2]) });
                }
            }
        }

        const craftingItems: string[] = [];
        const craftSection = block.match(/Herstellen: ([\s\S]+?)(?=\n\n|$)/);
        if (craftSection) {
            const items = craftSection[1].split(/,|\n/).map(i => fixEncoding(i.trim().replace(/\s+/g, ' '))).filter(i => i.length > 0);
            craftingItems.push(...items);
        }

        tools.push({
            id: slugify(name),
            name,
            category: "Werkzeug",
            cost_gp: cost,
            weight_kg: weight,
            data: {
                abilities: ability ? [ABILITY_MAP[ability] || ability] : [],
                use_actions: useActions,
                crafting_items: craftingItems,
                source_page: 220
            }
        });
    }

    // Add variants for Musikinstrumente and Spielsets
    // Musikinstrumente (PREIS VARIIERT)
    const instMatch = rawText.match(/MUSIKINSTRUMENT \(PREIS VARIIERT\)[\s\S]+?Varianten: ([\s\S]+?)(?=\n\n|$)/);
    if (instMatch) {
        const variants = instMatch[1].split(/, (?=[A-ZÄÖÜß])|,/);
        for (const v of variants) {
            const vMatch = v.match(/([A-ZÄÖÜßa-z\s]+) \((\d+) (GM|SM), ([\d,]+) kg\)/) || v.match(/([A-ZÄÖÜßa-z\s]+) \((\d+) (GM|SM)\)/);
            if (vMatch) {
                const vName = fixEncoding(vMatch[1].trim());
                let vCost = parseInt(vMatch[2]);
                if (vMatch[3] === "SM") vCost /= 10;
                const vWeight = vMatch[4] ? parseFloat(vMatch[4].replace(',', '.')) : 0;
                tools.push({
                    id: slugify("Musikinstrument " + vName),
                    name: vName,
                    category: "Musikinstrument",
                    cost_gp: vCost,
                    weight_kg: vWeight,
                    data: {
                        abilities: ["CHA"],
                        use_actions: [
                            { action: "Eine bekannte Melodie spielen", dc: 10 },
                            { action: "Eine Melodie improvisieren", dc: 15 }
                        ],
                        parent_tool: "musikinstrument",
                        source_page: 221
                    }
                });
            }
        }
    }

    // Spielsets (PREIS VARIIERT)
    const spielMatch = rawText.match(/SPIELSET \(PREIS VARIIERT\)[\s\S]+?Varianten: ([\s\S]+?)(?=\n\n|$)/);
    if (spielMatch) {
        const variants = spielMatch[1].split(/, (?=[A-ZÄÖÜß])|,/);
        for (const v of variants) {
            const vMatch = v.match(/([A-ZÄÖÜßa-z\s-]+) \((\d+) (GM|SM)\)/);
            if (vMatch) {
                const vName = fixEncoding(vMatch[1].trim());
                let vCost = parseInt(vMatch[2]);
                if (vMatch[3] === "SM") vCost /= 10;
                tools.push({
                    id: slugify("Spielset " + vName),
                    name: vName,
                    category: "Spielset",
                    cost_gp: vCost,
                    weight_kg: 0,
                    data: {
                        abilities: ["WIS"],
                        use_actions: [
                            { action: "Bestimmen, ob jemand mogelt", dc: 10 },
                            { action: "Das Spiel gewinnen", dc: 20 }
                        ],
                        parent_tool: "spielset",
                        source_page: 221
                    }
                });
            }
        }
    }

    await fs.writeFile('tools/intermediate_data/tools.json', JSON.stringify({ tools }, null, 2));
    console.log(`Extracted ${tools.length} tools to tools/intermediate_data/tools.json`);
}

extractTools().catch(console.error);
