import fs from 'fs';

const phbText = fs.readFileSync('tools/phb_text.txt', 'utf8');
const lines = phbText.split('\n').map(l => l.trim());
const dbIdsText = fs.readFileSync('tools/spell_ids.txt', 'utf8');
const dbIds = dbIdsText.split('\n').map(id => id.trim()).filter(id => id);

interface SpellData {
    id: string;
    name: string;
    description: string;
    higher_levels: string;
    level: number;
    school: string;
    casting_time: string;
    range: string;
    components: string;
    material_components: string | null;
    duration: string;
    concentration: boolean;
    ritual: boolean;
    classes: string;
    data: any;
}

const spellList: SpellData[] = [];
const leveledRegex = /^([a-zA-Zäöüß]+zauber)\s+(\d+|I+)\.\s+Grades\s*\(([^)]+)/i;
const cantripRegex = /^Zaubertrick\s+der\s+([a-zA-Zäöüß]+)\s*\(([^)]+)/i;

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^_|_$)/g, '');

const startIndex = lines.findIndex(l => l.includes('BESCHREIBUNGEN DER ZAUBER'));

for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    let match = line.match(leveledRegex) || line.match(cantripRegex);
    let isCantrip = line.toLowerCase().startsWith('zaubertrick');

    if (match) {
        let nameIndex = i - 1;
        while (nameIndex >= 0 && (lines[nameIndex] === '' || lines[nameIndex].match(/^KAPITEL \d+/i) || lines[nameIndex].match(/^\d+$/))) {
            nameIndex--;
        }

        if (nameIndex >= 0) {
            const name = lines[nameIndex].replace(/^(I+)\s+/, '').trim();
            const id = slugify(name);
            
            const spell: SpellData = {
                id: id,
                name: name,
                school: isCantrip ? match[1] : match[1],
                level: isCantrip ? 0 : (match[2].includes('I') ? 1 : parseInt(match[2])),
                classes: match[isCantrip ? 2 : 3],
                casting_time: '',
                range: '',
                components: '',
                material_components: null,
                duration: '',
                description: '',
                higher_levels: '',
                concentration: false,
                ritual: false,
                data: {}
            };

            let classIdx = i;
            let classStr = spell.classes;
            while (!classStr.includes(')') && lines[classIdx + 1] && !lines[classIdx + 1].includes(':')) {
                classIdx++;
                classStr += ' ' + lines[classIdx];
            }
            spell.classes = classStr.replace(/\)$/, '').trim();

            let j = classIdx + 1;
            while (j < classIdx + 30 && j < lines.length) {
                const metaLine = lines[j];
                if (metaLine.startsWith('Zeitaufwand:')) {
                    spell.casting_time = metaLine.replace('Zeitaufwand:', '').trim();
                    if (spell.casting_time.toLowerCase().includes('ritual')) spell.ritual = true;
                } else if (metaLine.startsWith('Reichweite:')) {
                    spell.range = metaLine.replace('Reichweite:', '').trim();
                } else if (metaLine.startsWith('Komponenten:')) {
                    let comp = metaLine.replace('Komponenten:', '').trim();
                    while (lines[j+1] && !lines[j+1].startsWith('Wirkungsdauer:') && !lines[j+1].includes(':')) {
                        j++;
                        comp += ' ' + lines[j].trim();
                    }
                    spell.components = comp;
                    const materialMatch = comp.match(/M\s*\(([^)]+)\)/);
                    if (materialMatch) spell.material_components = materialMatch[1];
                } else if (metaLine.startsWith('Wirkungsdauer:')) {
                    spell.duration = metaLine.replace('Wirkungsdauer:', '').trim();
                    if (spell.duration.toLowerCase().includes('konzentration')) spell.concentration = true;
                    break;
                }
                j++;
            }

            let k = j + 1;
            let currentDesc = '';
            let scalingText = '';
            let inScaling = false;
            let stopCollecting = false;

            while (k < lines.length && !stopCollecting) {
                const contentLine = lines[k];
                if (lines[k+1] && (lines[k+1].match(leveledRegex) || lines[k+1].match(cantripRegex))) break;
                if (lines[k+2] && (lines[k+2].match(leveledRegex) || lines[k+2].match(cantripRegex)) && lines[k+1] === '') break;

                if (contentLine.match(/^KAPITEL \d+ \| ZAUBER$/i) || contentLine.match(/^\d+$/) || contentLine.match(/^[A-Z]$/)) {
                    k++; continue;
                }

                if (contentLine.startsWith('Verwenden von Zauberplätzen höheren Grades:') || contentLine.startsWith('Zaubertrick-Aufwertung:')) {
                    inScaling = true;
                    scalingText = contentLine.replace('Verwenden von Zauberplätzen höheren Grades:', '').replace('Zaubertrick-Aufwertung:', '').trim();
                } else if (contentLine === 'MERKMALE' || contentLine === 'AKTIONEN' || (contentLine === contentLine.toUpperCase() && contentLine.length > 3 && !contentLine.includes(' ') && !inScaling)) {
                    // Possible next header or section
                    stopCollecting = true;
                } else if (inScaling) {
                    // Scaling usually only a few sentences. If it gets too long, it's probably leaking.
                    if (scalingText.length > 500) { inScaling = false; stopCollecting = true; }
                    else { scalingText += ' ' + contentLine; }
                } else {
                    currentDesc += contentLine + ' ';
                }
                k++;
            }

            const cleanup = (text: string) => text
                .replace(/([a-zäöüß])-\s+([a-zäöüß])/gi, '$1$2')
                .replace(/\s+/g, ' ')
                .trim();

            spell.description = cleanup(currentDesc);
            spell.higher_levels = cleanup(scalingText);

            if (spell.higher_levels) {
                const scaling: any = { text: spell.higher_levels };
                const diceMatch = spell.higher_levels.match(/(\d+W\d+)/i);
                if (diceMatch) {
                    scaling.type = isCantrip ? "cantrip_scaling" : "damage";
                    scaling.dice = diceMatch[1];
                }
                if (spell.higher_levels.toLowerCase().includes('wertekasten') || spell.higher_levels.toLowerCase().includes('zaubergrad')) {
                    scaling.type = "spell_level_ref";
                    scaling.target = "creature_statblock";
                }
                spell.data.scaling = scaling;
            }

            if (spell.id.includes('herbeirufen') || spell.description.includes('Wertekasten')) {
                const fullText = spell.description + ' ' + spell.higher_levels;
                const acMatch = fullText.match(/RK\s*(\d+\s*\+\s*Zaubergrad)/i);
                const hpMatch = fullText.match(/TP\s*(\d+\s*\+\s*\d+\s*für\s*jeden\s*Grad\s*ab\s*\d+)/i);
                if (acMatch || hpMatch) {
                    spell.data.summon = {
                        ac: acMatch ? acMatch[1] : null,
                        hp: hpMatch ? hpMatch[1] : null
                    };
                }
            }
            
            spell.data.source_page = 239;
            spellList.push(spell);
            i = k - 1;
        }
    }
}

fs.writeFileSync('tools/intermediate_data/cleaned_spells.json', JSON.stringify(spellList, null, 2));
console.log(`Successfully cleaned ${spellList.length} spells.`);
