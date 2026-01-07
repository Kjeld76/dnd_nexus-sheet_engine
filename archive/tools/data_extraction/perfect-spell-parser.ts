import fs from 'fs';

const phbText = fs.readFileSync('tools/phb_text.txt', 'utf8');
const lines = phbText.split('\n').map(l => l.trim());

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

// Improved Regex for school/level/classes - fixed grades and levels
const leveledRegex = /^([a-zA-Zäöüß]+zauber)\s+(\d+|I+)\.\s+Grades?\s*\((.*)$/i;
const cantripRegex = /^Zaubertrick\s+der\s+(Bann|Beschwörung|Erkenntnis|Verzauberung|Hervorrufung|Illusion|Nekromantie|Verwandlung)(?:smagie)?\s*\((.*)$/i;

const isArtifact = (line: string) => {
    if (!line) return false; 
    if (line.match(/^KAPITEL \d+/i)) return true;
    if (line.match(/^\d+$/)) return true; 
    if (line.length === 1 && line.match(/[A-Z]/)) return true;
    if (line.match(/^EINE? .*SETZT|BENUTZT|WIRKT|DEMONSTRIERT|HILFT|ZEIGT|ERLÄUTERT/)) return true;
    return false;
};

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const startIndex = lines.findIndex(l => l.includes('BESCHREIBUNGEN DER ZAUBER'));

let i = startIndex + 1;
let currentSpell: SpellData | null = null;
let state: 'NAME' | 'TYPE' | 'STATS' | 'DESC' | 'SCALING' | 'SUMMON' = 'NAME';

while (i < lines.length) {
    const line = lines[i];
    if (isArtifact(line)) { i++; continue; }

    // DETECT NEW SPELL HEADER
    let isNewSpell = false;
    // Header is ALL CAPS, at least 3 chars, no colon, no parens
    if (line === line.toUpperCase() && line.length > 2 && !line.includes(':') && !line.includes('(') && !line.match(/^\d+$/)) {
        let nextIdx = i + 1;
        while (nextIdx < lines.length && (lines[nextIdx] === '' || isArtifact(lines[nextIdx]))) nextIdx++;
        const nextLine = lines[nextIdx] || '';
        // Check if next line matches the type pattern (School X. Grad)
        if (nextLine.match(leveledRegex) || nextLine.match(cantripRegex)) {
            isNewSpell = true;
        }
    }

    if (isNewSpell) {
        if (currentSpell) spellList.push(currentSpell);
        currentSpell = { id: slugify(line), name: line, description: '', higher_levels: '', level: 0, school: '', casting_time: '', range: '', components: '', material_components: null, duration: '', concentration: false, ritual: false, classes: '', data: {} };
        state = 'TYPE';
        i++;
        continue;
    }

    if (currentSpell) {
        if (state === 'TYPE') {
            const match = line.match(leveledRegex) || line.match(cantripRegex);
            if (match) {
                const isCantrip = line.toLowerCase().startsWith('zaubertrick');
                currentSpell.school = match[1].endsWith('zauber') ? match[1] : match[1] + 'zauber';
                const levelStr = isCantrip ? '0' : match[2];
                if (levelStr === 'I') currentSpell.level = 1;
                else currentSpell.level = parseInt(levelStr);
                
                let classesText = match[isCantrip ? 2 : 3];
                while (!classesText.includes(')') && i + 1 < lines.length) { i++; if (!isArtifact(lines[i])) classesText += ' ' + lines[i]; }
                currentSpell.classes = classesText.replace(/\).*$/, '').trim();
                state = 'STATS';
            }
        } else if (state === 'STATS') {
            const parts = line.split(/(?=Zeitaufwand:|Reichweite:|Komponenten:|Wirkungsdauer:)/g);
            let foundField = false;
            for (const part of parts) {
                const p = part.trim();
                if (p.startsWith('Zeitaufwand:')) { currentSpell.casting_time = p.replace('Zeitaufwand:', '').trim(); foundField = true; if (currentSpell.casting_time.toLowerCase().includes('ritual')) currentSpell.ritual = true; }
                else if (p.startsWith('Reichweite:')) { currentSpell.range = p.replace('Reichweite:', '').trim(); foundField = true; }
                else if (p.startsWith('Komponenten:')) { currentSpell.components = p.replace('Komponenten:', '').trim(); foundField = true; }
                else if (p.startsWith('Wirkungsdauer:')) { const dur = p.replace('Wirkungsdauer:', '').trim(); if (dur.toLowerCase().includes('konzentration')) currentSpell.concentration = true; currentSpell.duration = dur; state = 'DESC'; foundField = true; }
            }
            if (!foundField && line !== '') {
                if (currentSpell.components && !currentSpell.duration) currentSpell.components += ' ' + line;
                else { state = 'DESC'; currentSpell.description += (currentSpell.description ? ' ' : '') + line; }
            }
        } else if (state === 'DESC' || state === 'SCALING' || state === 'SUMMON') {
            if (line.startsWith('Verwenden von Zauberplätzen höheren Grades:') || line.startsWith('Verwenden von Zauberslots höheren Grades:') || line.startsWith('Zaubertrick-Aufwertung:')) {
                state = 'SCALING';
                currentSpell.higher_levels = line.replace(/^.*:/, '').trim();
            } else if (line === 'MERKMALE' || line === 'AKTIONEN' || line.match(/^WERTEKASTEN/)) {
                state = 'SUMMON';
                currentSpell.data.summon_raw = (currentSpell.data.summon_raw || '') + line + '\n';
            } else if (state === 'DESC') {
                if (line.match(/^RK\s*\d+|^TP\s*\d+|^MOD|^RW|^STÄ\s*\d+|^GES\s*\d+|^KON\s*\d+|^INT\s*\d+|^WEI\s*\d+|^CHA\s*\d+|^Sinne\s|^Sprachen\s/)) {
                    state = 'SUMMON';
                    currentSpell.data.summon_raw = (currentSpell.data.summon_raw || '') + line + '\n';
                } else if (line !== '') {
                    currentSpell.description += (currentSpell.description ? ' ' : '') + line;
                }
            } else if (state === 'SCALING') {
                if (line !== '') currentSpell.higher_levels += (currentSpell.higher_levels ? ' ' : '') + line;
            } else if (state === 'SUMMON') {
                if (line !== '') currentSpell.data.summon_raw += line + '\n';
            }
        }
    }
    i++;
}
if (currentSpell) spellList.push(currentSpell);

const spellNames = spellList.map(x => x.name);

const finalSpells = spellList.map(s => {
    const clean = (text: string) => text.replace(/([a-zäöüß])-\s+([a-zäöüß])/gi, '$1$2').replace(/\s+/g, ' ').trim();
    s.description = clean(s.description); s.higher_levels = clean(s.higher_levels); s.casting_time = clean(s.casting_time); s.range = clean(s.range); s.components = clean(s.components); s.duration = clean(s.duration); s.classes = clean(s.classes);

    if (s.casting_time.includes('Reichweite:')) { const p = s.casting_time.split('Reichweite:'); s.casting_time = p[0].trim(); s.range = p[1].trim() + ' ' + s.range; }
    if (s.range.includes('Komponenten:')) { const p = s.range.split('Komponenten:'); s.range = p[0].trim(); s.components = p[1].trim() + ' ' + s.components; }
    if (s.components.includes('Wirkungsdauer:')) { const p = s.components.split('Wirkungsdauer:'); s.components = p[0].trim(); s.duration = p[1].trim() + ' ' + s.duration; }
    if (s.description.startsWith('Wert von mindestens')) { const p = s.description.split(')'); s.components += ' ' + p[0] + ')'; s.description = p.slice(1).join(')').trim(); }

    // LEAK CLEANUP - CRITICAL FOR BRENNENDE HÄNDE ETC
    for (const name of spellNames) {
        if (name === s.name || name.length < 5) continue;
        const marker = name;
        if (s.higher_levels.includes(marker)) s.higher_levels = s.higher_levels.split(marker)[0].trim();
        if (s.description.includes(marker)) {
            const idx = s.description.lastIndexOf(marker);
            let after = s.description.substring(idx + marker.length).trim();
            if (after.match(/^(?:Bann|Beschwörung|Erkenntnis|Verzauberung|Hervorrufung|Illusion|Nekromantie|Verwandlungs|Zaubertrick|.*Grades)/i)) {
                s.description = s.description.substring(0, idx).trim();
            }
        }
    }

    if (s.higher_levels) {
        const scaling: any = { text: s.higher_levels };
        const diceMatch = s.higher_levels.match(/(\d+W\d+)/i);
        if (diceMatch) { scaling.type = s.level === 0 ? "cantrip_scaling" : "damage"; scaling.dice = diceMatch[1]; }
        if (s.higher_levels.toLowerCase().includes('wertekasten') || s.higher_levels.toLowerCase().includes('zaubergrad')) { scaling.type = "spell_level_ref"; scaling.target = "creature_statblock"; }
        s.data.scaling = scaling;
    }
    if (s.data.summon_raw) {
        let raw = s.data.summon_raw;
        for (const name of spellNames) if (name !== s.name && raw.includes(name)) raw = raw.split(name)[0];
        const acMatch = raw.match(/RK\s*(\d+\s*\+\s*Zaubergrad)/i);
        const hpMatch = raw.match(/TP\s*(\d+\s*\+\s*\d+\s*für\s*jeden\s*Grad\s*ab\s*\d+)/i);
        s.data.summon = { ac: acMatch ? acMatch[1] : null, hp: hpMatch ? hpMatch[1] : null };
        s.data.summon_text = raw.trim();
        delete s.data.summon_raw;
    }
    s.data.source_page = 239;
    return s;
});

// Aberration/Alarm correction
const aberration = finalSpells.find(s => s.id === 'aberration-herbeirufen');
const alarm = finalSpells.find(s => s.id === 'alarm');
if (aberration && alarm) {
    const alarmStart = "Du erschaffst einen Alarm gegen Eindringen.";
    const totalAlarm = alarm.description + ' ' + (alarm.data.summon_text || '');
    if (totalAlarm.includes(alarmStart)) {
        const parts = totalAlarm.split(alarmStart);
        aberration.data.summon_text = (aberration.data.summon_text || '') + '\n' + parts[0].trim();
        alarm.description = alarmStart + parts.slice(1).join(alarmStart);
        delete alarm.data.summon; delete alarm.data.summon_text;
    }
}

fs.writeFileSync('tools/intermediate_data/perfect_spells.json', JSON.stringify(finalSpells, null, 2));
console.log(`Extracted ${finalSpells.length} spells.`);
