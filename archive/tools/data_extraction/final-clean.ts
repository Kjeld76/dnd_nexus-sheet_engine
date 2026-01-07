import rusqlite from 'rusqlite'; // Wait, I don't have this in node.
// I'll use the JSON file and re-import.
import fs from 'fs';

const jsonPath = 'tools/intermediate_data/cleaned_spells.json';
const spells = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const finalSpells = spells.map((s: any) => {
    const clean = (text: string) => text
        .replace(/KAPITEL \d+ [I|\|] ZAUBER/g, '')
        .replace(/\b[234]\d{2}\b/g, '') // Page numbers
        .replace(/[A-ZÄÖÜ]{4,}/g, (match) => {
            // If it's an ALL CAPS word at the very end, it's likely a leaked header
            if (text.endsWith(match)) return '';
            return match;
        })
        .replace(/\s+/g, ' ')
        .trim();

    s.description = clean(s.description);
    s.higher_levels = clean(s.higher_levels);
    if (s.data.scaling) s.data.scaling.text = clean(s.data.scaling.text);
    
    return s;
});

fs.writeFileSync(jsonPath, JSON.stringify(finalSpells, null, 2));
console.log("JSON further cleaned.");





