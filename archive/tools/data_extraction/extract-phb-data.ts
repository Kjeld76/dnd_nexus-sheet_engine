import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

const ENCODING_FIXES: Record<string, string> = {
    'Ã¤': 'ä', 'Ã¶': 'ö', 'Ã¼': 'ü', 'Ã„': 'Ä', 'Ã–': 'Ö', 'Ãœ': 'Ü', 'ÃŸ': 'ß', 
    'Ã©': 'é', 'Ã¨': 'è', 'Â': '', 'â€“': '–', 'â€”': '—', 'â€™': "'", 'â€ž': '"', 'â€œ': '"'
};
function fixEncoding(text: string): string {
  let fixed = text;
  for (const [bad, good] of Object.entries(ENCODING_FIXES)) { fixed = fixed.replace(new RegExp(bad, 'g'), good); }
  fixed = fixed.replace(/\u00AD/g, '');
  return fixed;
}
function slugify(text: string): string { return text.toLowerCase().replace(/[^a-zäöüß0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

const FEAT_NAMES = [
    "ABFANGEN", "ARMBRUSTEXPERTE", "ATHLET", "ATTRIBUTSWERTERHÖHUNG", "AUFMERKSAM", "AUSGEBILDET", 
    "BELASTBAR", "BERITTENER KÄMPFER", "BLINDER KAMPF", "BOGENSCHIESSEN", "DEFENSIVER DUELLANT", 
    "DUELLIEREN", "EINGEWEIHTER DER MAGIE", "ELEMENTAR-ADEPT", "FEENBERÜHRT", "FERTIGKEITSEXPERTE", 
    "FLINK", "GABE DER BEGABUNG", "GABE DES DIMENSIONSREISENS", "GABE DER ENERGIERESISTENZ", 
    "GABE DER ERHOLUNG", "GABE DER GESCHWINDIGKEIT", "GABE DER KAMPFFERTIGKEIT", "GABE DES NACHTGEISTS", 
    "GABE DES SCHICKSALS", "GABE DER STANDHAFTIGKEIT", "GABE DES UNWIDERSTEHLICHEN ANGRIFFS", 
    "GABE DES WAHREN BLICKS", "GABE DER ZAUBERERINNERUNG", "GIFTMISCHER", "GLÜCKSPILZ", 
    "HANDWERKER", "AUFSCHLITZER (HAUER)", "HEILER", "INSPIRIERENDER ANFÜHRER", "KAMPF MIT GROSSEN WAFFEN", 
    "KAMPFERPROBTER ZAUBERWIRKER", "KNEIPENSCHLÄGER", "KOCH", "KRIEGSWAFFENVERTRAUTHEIT", 
    "LEIBWACHE", "LEICHT GERÜSTET", "MAGIERTÖTER", "MEISTER DER GROSSEN WAFFEN", 
    "MEISTER DER MITTELSCHWEREN RÜSTUNGEN", "MEISTER DER SCHWEREN RÜSTUNGEN", "MESSERSTECHER", 
    "MITTELSCHWER GERÜSTET", "MUSIKER", "RINGER", "RITUALWIRKER", "SCHARFER VERSTAND", 
    "SCHARFSCHÜTZE", "SCHATTENBERÜHRT", "SCHAUSPIELER", "SCHILDMEISTER", "SCHLEICHER", 
    "SCHWER GERÜSTET", "STANGENWAFFENMEISTER", "STÜRMER", "TELEKINETIKER", "TELEPATH", 
    "UNBEWAFFNETER KAMPF", "VERTEIDIGUNG", "WACHSAM", "WÄCHTER", "WAFFENMEISTER", 
    "WIDERSTANDSFÄHIG", "WILDER ANGREIFER", "WURFWAFFENKAMPF", "ZÄH", "ZERMALMER", 
    "ZIELGENAUER ZAUBERSCHÜTZE", "ZWEI-WAFFEN-KAMPF", "ZWEI-WAFFEN-KÄMPFER"
];

const FEAT_CATEGORIES: Record<string, string> = {
    "ABFANGEN": "Kampfstil", "ARMBRUSTEXPERTE": "Allgemein", "ATHLET": "Allgemein", "ATTRIBUTSWERTERHÖHUNG": "Allgemein", 
    "AUFMERKSAM": "Allgemein", "AUSGEBILDET": "Herkunft", "BELASTBAR": "Allgemein", "BERITTENER KÄMPFER": "Allgemein", 
    "BLINDER KAMPF": "Kampfstil", "BOGENSCHIESSEN": "Kampfstil", "DEFENSIVER DUELLANT": "Allgemein", 
    "DUELLIEREN": "Kampfstil", "EINGEWEIHTER DER MAGIE": "Herkunft", "ELEMENTAR-ADEPT": "Allgemein", 
    "FEENBERÜHRT": "Allgemein", "FERTIGKEITSEXPERTE": "Allgemein", "FLINK": "Allgemein", 
    "GABE DER BEGABUNG": "Epische Gabe", "GABE DES DIMENSIONSREISENS": "Epische Gabe", "GABE DER ENERGIERESISTENZ": "Epische Gabe", 
    "GABE DER ERHOLUNG": "Epische Gabe", "GABE DER GESCHWINDIGKEIT": "Epische Gabe", "GABE DER KAMPFFERTIGKEIT": "Epische Gabe", 
    "GABE DES NACHTGEISTS": "Epische Gabe", "GABE DES SCHICKSALS": "Epische Gabe", "GABE DER STANDHAFTIGKEIT": "Epische Gabe", 
    "GABE DES UNWIDERSTEHLICHEN ANGRIFFS": "Epische Gabe", "GABE DES WAHREN BLICKS": "Epische Gabe", 
    "GABE DER ZAUBERERINNERUNG": "Epische Gabe", "GIFTMISCHER": "Allgemein", "GLÜCKSPILZ": "Herkunft", 
    "HANDWERKER": "Herkunft", "AUFSCHLITZER (HAUER)": "Allgemein", "HEILER": "Herkunft", "INSPIRIERENDER ANFÜHRER": "Allgemein", 
    "KAMPF MIT GROSSEN WAFFEN": "Kampfstil", "KAMPFERPROBTER ZAUBERWIRKER": "Allgemein", "KNEIPENSCHLÄGER": "Herkunft", 
    "KOCH": "Allgemein", "KRIEGSWAFFENVERTRAUTHEIT": "Allgemein", "LEIBWACHE": "Kampfstil", "LEICHT GERÜSTET": "Allgemein", 
    "MAGIERTÖTER": "Allgemein", "MEISTER DER GROSSEN WAFFEN": "Allgemein", "MEISTER DER MITTELSCHWEREN RÜSTUNGEN": "Allgemein", 
    "MEISTER DER SCHWEREN RÜSTUNGEN": "Allgemein", "MESSERSTECHER": "Allgemein", "MITTELSCHWER GERÜSTET": "Allgemein", 
    "MUSIKER": "Herkunft", "RINGER": "Allgemein", "RITUALWIRKER": "Allgemein", "SCHARFER VERSTAND": "Allgemein", 
    "SCHARFSCHÜTZE": "Allgemein", "SCHATTENBERÜHRT": "Allgemein", "SCHAUSPIELER": "Allgemein", "SCHILDMEISTER": "Allgemein", 
    "SCHLEICHER": "Allgemein", "SCHWER GERÜSTET": "Allgemein", "STANGENWAFFENMEISTER": "Allgemein", 
    "STÜRMER": "Allgemein", "TELEKINETIKER": "Allgemein", "TELEPATH": "Allgemein", "UNBEWAFFNETER KAMPF": "Kampfstil", 
    "VERTEIDIGUNG": "Kampfstil", "WACHSAM": "Herkunft", "WÄCHTER": "Allgemein", "WAFFENMEISTER": "Allgemein", 
    "WIDERSTANDSFÄHIG": "Allgemein", "WILDER ANGREIFER": "Herkunft", "WURFWAFFENKAMPF": "Kampfstil", "ZÄH": "Herkunft", 
    "ZERMALMER": "Allgemein", "ZIELGENAUER ZAUBERSCHÜTZE": "Allgemein", "ZWEI-WAFFEN-KAMPF": "Kampfstil", "ZWEI-WAFFEN-KÄMPFER": "Allgemein"
};

const MANUAL_FEATS_DATA: Record<string, { prerequisite: string | null, description: string }> = {
    "AUFSCHLITZER (HAUER)": {
        prerequisite: "min. 4. Stufe, min. Stärke oder Geschicklichkeit 13",
        description: "Du erhältst folgende Vorzüge: Attributswerterhöhung: Dein Stärke- oder dein Geschicklichkeitswert wird um 1 Punkt erhöht (auf höchstens 20). Schenkelschlag: Einmal pro Zug kannst du, wenn du eine Kreatur mit einem Angriff triffst, der Hiebschaden bewirkt, die Bewegungsrate der Kreatur bis zum Beginn deines nächsten Zugs um drei Meter verringern. Verstärkter kritischer Treffer: Wenn du einen kritischen Treffer erzielst, der einer Kreatur Hiebschaden zufügt, so ist diese Kreatur bis zum Beginn deines nächsten Zugs bei Angriffswürfen im Nachteil."
    },
    "FLINK": {
        prerequisite: "min. 4. Stufe, min. Geschicklichkeit oder Konstitution 13",
        description: "Du erhältst folgende Vorzüge: Attributswerterhöhung: Dein Geschicklichkeitsoder dein Konstitutionswert wird um 1 Punkt erhöht (auf höchstens 20). Erhöhte Bewegungsrate: Deine Bewegungsrate ist um drei Meter erhöht. Spurt über schwieriges Gelände: Wenn du in deinem Zug die Spurt-Aktion ausführst, kostet schwieriges Gelände dich für den Rest dieses Zugs keine zusätzliche Bewegung. Flinke Bewegung: Gelegenheitsangriffe auf dich sind im Nachteil."
    }
};

const BLACKLIST_PHRASES = [
    /Dies sind die Talente der Kategorie (Allgemein|Herkunft|Kampfstil|Epische Gabe):/gi,
    /Talent\s+Kampferprobter Zauberwirker[\s\S]*/g, 
    /Kategorie\s+Allgemein\s+Herkunft[\s\S]*/g, 
    /Handwerkszeug\s+Holzschnitzer-werkzeug[\s\S]*/g,
    /Hergestellte Ausrüstung\s+Kampfstab[\s\S]*/g,
    /•\s+IN DEN HIMMELN VON EBERRON.*/gi,
    /KAPITEL \d+ I? TALENTE\s+\d+I?I?/gi,
    /PLAYER'S HANDBOOK/gi,
    /SPIELERHANDBUCH/gi,
    /LOK$/g,
    /gib eee$/g,
    /\b(Allgemein|Herkunft|Kampfstil|Epische Gabe)(\s+(Allgemein|Herkunft|Kampfstil|Epische Gabe)){3,}.*$/g
];

async function main() {
  const docxPath = path.resolve('resources/books/D&D Spielerhandbuch (2024).docx');
  try {
    const result = await mammoth.extractRawText({ path: docxPath });
    let text = fixEncoding(result.value.replace(/\r\n/g, '\n'));
    
    const feats = extractFeatsFinal(text);
    const skills = extractSkillsImproved(text);
    const items = extractItemsGlobal(text);
    
    await fs.writeFile('tools/intermediate_data/extracted_feats.json', JSON.stringify(feats, null, 2));
    await fs.writeFile('tools/intermediate_data/extracted_skills.json', JSON.stringify(skills, null, 2));
    await fs.writeFile('tools/intermediate_data/extracted_items.json', JSON.stringify(items, null, 2));
    
    console.log(`Extraction complete: ${feats.length} feats, ${skills.length} skills, ${items.length} items.`);
  } catch (error) { console.error('Extraction failed:', error); process.exit(1); }
}

function extractFeatsFinal(text: string): any[] {
  const feats: any[] = [];
  const chapterStart = text.indexOf('HERKUNFTSTALENTE');
  const chapterEnd = text.indexOf('KAPITEL 6');
  const searchSection = text.substring(chapterStart, chapterEnd !== -1 ? chapterEnd : text.length);

  const headers: { name: string, startIdx: number }[] = [];
  for (const name of FEAT_NAMES) {
    if (MANUAL_FEATS_DATA[name]) continue;

    const regex = new RegExp(`(^|\\n)(${name})`, 'g');
    let match;
    while ((match = regex.exec(searchSection)) !== null) {
        const fullMatchIdx = chapterStart + match.index + match[1].length;
        const postText = searchSection.substring(match.index + match[0].length, match.index + match[0].length + 100);
        
        const postLower = postText.toLowerCase();
        if (postLower.includes('talent') || postLower.includes('gabe') || postLower.includes('voraussetzung') || postText.startsWith('\n')) {
            headers.push({ name, startIdx: fullMatchIdx });
            break; 
        }
    }
  }

  headers.sort((a, b) => a.startIdx - b.startIdx);

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    const nextH = headers[i+1];
    const endIdx = nextH ? nextH.startIdx : (chapterEnd !== -1 ? chapterEnd : text.length);
    
    let rawChunk = text.substring(h.startIdx, endIdx);
    let lines = rawChunk.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let cleanedLines = lines.filter(line => {
        if (line.match(/^KAPITEL \d+/i)) return false;
        if (line.match(/^\d+$/)) return false; 
        if (line.match(/^PITEL \d+/)) return false;
        if (line.includes('TALENTE') && line.length < 20) return false;
        return true;
    });

    const feat: any = { 
        id: slugify(h.name), 
        name: h.name, 
        category: FEAT_CATEGORIES[h.name], 
        data: { prerequisite: null, description: "" } 
    };

    let fullCleanedText = cleanedLines.join('\n');
    const prereqMatch = fullCleanedText.match(/\(Voraussetzung:\s*([^\)]+)\)/i);
    if (prereqMatch) {
        feat.data.prerequisite = prereqMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        const prereqEndIdx = fullCleanedText.indexOf(prereqMatch[0]) + prereqMatch[0].length;
        feat.data.description = fullCleanedText.substring(prereqEndIdx).trim();
    } else {
        if (feat.category === "Kampfstil") feat.data.prerequisite = "Kampfstil-Merkmal";
        else if (feat.category === "Epische Gabe") feat.data.prerequisite = "min. 19. Stufe";
        else if (h.name === "ATTRIBUTSWERTERHÖHUNG") feat.data.prerequisite = "min. 4. Stufe";
        feat.data.description = cleanedLines.slice(1).join('\n').trim();
    }
    
    let finalDesc = feat.data.description;
    for (const regex of BLACKLIST_PHRASES) { finalDesc = finalDesc.replace(regex, ''); }
    
    finalDesc = finalDesc.replace(/^(Allgemeines|Herkunft|Epische-Gabe|Kampfstil)-Talent\s*/i, '');
    finalDesc = finalDesc.replace(/^Talent\s*/i, '');
    finalDesc = finalDesc.replace(/^\)\s*/, '');

    finalDesc = finalDesc.replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(/•/g, '\n•').trim();
    feat.data.description = finalDesc;
    feats.push(feat);
  }

  for (const [name, data] of Object.entries(MANUAL_FEATS_DATA)) {
    feats.push({
        id: slugify(name),
        name,
        category: FEAT_CATEGORIES[name],
        data: { prerequisite: data.prerequisite, description: data.description }
    });
  }

  for (const name of FEAT_NAMES) {
    if (!feats.find(f => f.name === name)) {
        feats.push({ 
            id: slugify(name), 
            name, 
            category: FEAT_CATEGORIES[name], 
            data: { prerequisite: null, description: "Manuelle Extraktion erforderlich." } 
        });
    }
  }

  return feats;
}

function extractSkillsImproved(text: string): any[] {
  const skillNames = [ 'Akrobatik', 'Arkane Kunde', 'Athletik', 'Auftreten', 'Einschüchterung', 'Fingerfertigkeit', 'Geschichte', 'Heilkunde', 'Heimlichkeit', 'Mit Tieren umgehen', 'Motiv erkennen', 'Nachforschungen', 'Naturkunde', 'Religion', 'Täuschen', 'Überlebenskunst', 'Überzeugen', 'Wahrnehmung' ];
  const attributes = [ 'DEX', 'INT', 'STR', 'CHA', 'CHA', 'DEX', 'INT', 'WIS', 'DEX', 'WIS', 'WIS', 'INT', 'INT', 'INT', 'CHA', 'WIS', 'CHA', 'WIS' ];
  const descriptions = [ "In einer heiklen Situation auf den Füßen bleiben oder ein akrobatisches Kunststück vollführen", "Dir Wissen über Zauber, magische Gegenstände und die Existenzebenen ins Gedächtnis rufen", "Weiter springen als gewöhnlich, in rauer See über Wasser bleiben oder etwas zerstören", "Schauspielern, eine Geschichte erzählen, Musik spielen oder tanzen", "Jemanden so beeindrucken oder bedrohen, dass er tut, was du von ihm willst", "Jemanden bestehlen, einen Gegenstand in der Hand verbergen oder Taschenspielertricks ausführen", "Dir Wissen über historische Ereignisse und Persönlichkeiten, Nationen und Kulturen ins Gedächtnis rufen", "Eine Krankheit diagnostizieren oder feststellen, woran ein Toter gestorben ist", "Unbemerkt bleiben, indem du dich leise bewegst und hinter Dingen versteckst", "Ein Tier beruhigen, trainieren oder zu einem bestimmten Verhalten bewegen", "Stimmung und Absichten einer Person erfassen", "Obskure Informationen in Büchern finden oder erschließen, wie etwas funktioniert", "Dir Wissen über Gelände, Pflanzen, Tiere und Wetter ins Gedächtnis rufen", "Dir Wissen über Götter, religiöse Rituale und heilige Symbole ins Gedächtnis rufen", "Überzeugend eine Lüge vortragen oder dich verkleiden", "Spuren folgen, Nahrung suchen, Pfade finden oder natürliche Gefahren vermeiden", "Jemanden ehrlich und geschickt von etwas überzeugen", "Durch Kombinieren von Sinneseindrücken etwas bemerken, was einem eigentlich leicht entgeht" ];
  return skillNames.map((name, i) => ({ id: slugify(name), name, ability: attributes[i], description: descriptions[i] }));
}

function extractItemsGlobal(text: string): any[] {
  const items: any[] = [];
  const seenIds = new Set<string>();
  const pP = (s: string) => { const m = s.match(/(\d+(?:[.,]\d+)?)\s*(GM|SM|KM|EM)/i); if (!m) return 0; const v = parseFloat(m[1].replace(',', '.')), u = m[2].toUpperCase(); return Math.round(u === 'GM' ? v * 100 : u === 'SM' ? v * 10 : u === 'EM' ? v * 50 : v); };
  const pW = (s: string) => { const m = s.match(/(\d+(?:[.,]\d+)?)\s*kg/i); return m ? parseFloat(m[1].replace(',', '.')) : 0; };
  const rawLines = text.split('\n');
  for (const line of rawLines) {
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length >= 3) {
      const name = parts[0], id = slugify(name);
      if (name.length < 50 && !seenIds.has(id)) {
        const dmgM = parts.find(p => p.match(/(\d+W\d+)/i));
        if (dmgM) { const pStr = parts.find(p => p.includes('GM') || p.includes('SM')); const wStr = parts.find(p => p.includes('kg')); items.push({ id, name, category: 'Waffe', data: { damage: dmgM, type: "", weight: pW(wStr || ""), price: pP(pStr || ""), properties: "" } }); seenIds.add(id); continue; }
        const acM = parts.find(p => p.match(/^\d{2}(?:\s*\+\s*GES)?$/));
        if (acM) { const pStr = parts.find(p => p.includes('GM') || p.includes('SM')); const wStr = parts.find(p => p.includes('kg')); items.push({ id, name, category: 'Rüstung', data: { ac: acM, weight: pW(wStr || ""), price: pP(pStr || ""), strength_req: 0, stealth_disadvantage: line.toLowerCase().includes('nachteil') } }); seenIds.add(id); continue; }
        const pStr = parts.find(p => p.includes('GM') || p.includes('SM') || p.includes('KM'));
        if (pStr) { const wStr = parts.find(p => p.includes('kg')); items.push({ id, name, category: 'Ausrüstung', data: { price: pP(pStr), weight: pW(wStr || "") } }); seenIds.add(id); }
      }
    }
  }
  return items;
}
main();
