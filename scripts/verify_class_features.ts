#!/usr/bin/env tsx
/**
 * Prüfskript für Klassen-Features
 * 
 * Vergleicht die Progressionstabellen mit den tatsächlichen Features
 * in export_classes.md und erstellt einen Prüfbericht.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



interface SubclassData {
  name: string;
  features: Map<number, string[]>; // Level -> Features
}

interface ClassData {
  name: string;
  id: string;
  progressionTable: Map<number, string[]>; // Level -> Features aus Tabelle
  actualFeatures: Map<number, string[]>; // Level -> Features aus Text
  missingFeatures: Map<number, string[]>; // Level -> Fehlende Features
  extraFeatures: Map<number, string[]>; // Level -> Zusätzliche Features (nicht in Tabelle)
  missingLevels: number[];
  duplicateLevels: number[];
  subclasses: SubclassData[]; // Alle Unterklassen
  missingSubclassFeatures: Map<number, string[]>; // Level -> Unterklassen ohne Feature
}

/**
 * Extrahiert Features aus einer Progressionstabelle-Zeile
 */
function parseProgressionTableRow(row: string): { level: number; features: string[] } | null {
  const match = row.match(/^\|\s*(\d+)\s*\|/);
  if (!match) return null;

  const level = parseInt(match[1], 10);

  // Extrahiere "Klassenmerkmale" Spalte (meist 3. Spalte)
  const columns = row.split('|').map(c => c.trim()).filter(c => c);
  if (columns.length < 3) return null;

  // Spalte 3 ist "Klassenmerkmale"
  const featuresText = columns[2];
  if (!featuresText || featuresText === '—' || featuresText === '-') {
    return { level, features: [] };
  }

  // Features durch Komma trennen
  const features = featuresText
    .split(',')
    .map(f => f.trim())
    .filter(f => f.length > 0)
    .map(f => f.toUpperCase());

  return { level, features };
}

/**
 * Extrahiert Features aus einem Level-Abschnitt
 */
function parseLevelSection(content: string, level: number): string[] {
  const levelHeader = `#### Level ${level}`;
  const nextLevelHeader = `#### Level ${level + 1}`;

  const startIdx = content.indexOf(levelHeader);
  if (startIdx === -1) return [];

  const endIdx = content.indexOf(nextLevelHeader, startIdx);
  const section = endIdx === -1
    ? content.substring(startIdx)
    : content.substring(startIdx, endIdx);

  // Finde alle Feature-Namen (Format: - **FEATURENAME**)
  const featureRegex = /-\s*\*\*([A-ZÄÖÜ][A-ZÄÖÜ\s]+)\*\*/g;
  const features: string[] = [];
  let match;

  while ((match = featureRegex.exec(section)) !== null) {
    const featureName = match[1].trim().toUpperCase();
    features.push(featureName);
  }

  return features;
}

/**
 * Normalisiert Feature-Namen für Vergleich
 */
function normalizeFeatureName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prüft, ob zwei Feature-Namen übereinstimmen
 */
function featuresMatch(tableFeature: string, actualFeature: string): boolean {
  const normalizedTable = normalizeFeatureName(tableFeature);
  const normalizedActual = normalizeFeatureName(actualFeature);

  // Exakte Übereinstimmung
  if (normalizedTable === normalizedActual) return true;

  // Teilübereinstimmung (z.B. "UNTERKLASSENMERKMAL" vs "Unterklassenmerkmal")
  if (normalizedActual.includes(normalizedTable) || normalizedTable.includes(normalizedActual)) {
    return true;
  }

  // Spezielle Fälle
  if (normalizedTable === 'ATTRIBUTSWERTERHÖHUNG' && normalizedActual.includes('ATTRIBUTSWERTERHÖHUNG')) {
    return true;
  }

  if (normalizedTable === 'UNTERKLASSENMERKMAL' && normalizedActual.includes('UNTERKLASSENMERKMAL')) {
    return true;
  }

  return false;
}

/**
 * Extrahiert Unterklassen aus einem Klassen-Abschnitt
 */
function parseSubclasses(classSection: string): SubclassData[] {
  const subclasses: SubclassData[] = [];

  // Finde "### Unterklassen" Abschnitt
  // Suche nach "### Unterklassen" und extrahiere alles bis zum nächsten "## " (nächste Klasse)
  const subclassStartIdx = classSection.indexOf('### Unterklassen');
  if (subclassStartIdx === -1) return subclasses;

  // Finde das Ende: Nächster "## " Header oder Ende des Abschnitts
  const nextClassMatch = classSection.substring(subclassStartIdx).match(/\n## /);
  const subclassEndIdx = nextClassMatch
    ? subclassStartIdx + nextClassMatch.index
    : classSection.length;

  const subclassSection = classSection.substring(subclassStartIdx, subclassEndIdx);

  // Finde alle Unterklassen-Header (#### UNTERKLASSENNAME)
  // Verwende Regex, um alle #### Header zu finden
  const lines = subclassSection.split('\n');
  const subclassHeaders: Array<{ name: string; lineIndex: number }> = [];

  // Suche nach allen Zeilen, die mit "#### " beginnen (4 # gefolgt von Leerzeichen)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Prüfe, ob die Zeile mit "#### " beginnt (nicht "### " oder "##### ")
    if (line.startsWith('#### ') && !line.startsWith('##### ')) {
      // Extrahiere den Namen nach "#### "
      const name = line.substring(5).trim();
      // Prüfe, ob der Name nur Großbuchstaben enthält (Unterklassen-Name)
      if (name.length > 0 && /^[A-ZÄÖÜ\s]+$/.test(name)) {
        subclassHeaders.push({
          name: name,
          lineIndex: i
        });
      }
    }
  }

  // Parse jede Unterklasse
  for (let i = 0; i < subclassHeaders.length; i++) {
    const header = subclassHeaders[i];
    const nextHeader = subclassHeaders[i + 1];

    // Extrahiere den Inhalt dieser Unterklasse
    const startLine = header.lineIndex + 1; // Nach dem Header
    const endLine = nextHeader ? nextHeader.lineIndex : lines.length;
    const subclassLines = lines.slice(startLine, endLine);
    const subclassContent = subclassLines.join('\n');

    // Parse Features nach Level
    const features = new Map<number, string[]>();

    // Finde "**Level X:**" Einträge
    const levelRegex = /\*\*Level (\d+):\*\*/g;
    let levelMatch;
    const levelMatches: Array<{ level: number; startIdx: number; endIdx: number }> = [];

    // Sammle alle Level-Matches
    while ((levelMatch = levelRegex.exec(subclassContent)) !== null) {
      const level = parseInt(levelMatch[1], 10);
      const startIdx = levelMatch.index + levelMatch[0].length;

      // Finde nächsten Level-Eintrag oder Ende
      const nextLevelMatch = subclassContent.substring(startIdx).match(/\*\*Level \d+:\*\*/);
      const endIdx = nextLevelMatch
        ? startIdx + nextLevelMatch.index
        : subclassContent.length;

      levelMatches.push({ level, startIdx, endIdx });
    }

    // Parse Features für jedes Level
    for (const levelMatch of levelMatches) {
      const levelSection = subclassContent.substring(levelMatch.startIdx, levelMatch.endIdx);

      // Extrahiere Feature-Namen
      const featureRegex = /-\s*\*\*([A-ZÄÖÜ][A-ZÄÖÜ\s]+)\*\*/g;
      const levelFeatures: string[] = [];
      let featureMatch;

      while ((featureMatch = featureRegex.exec(levelSection)) !== null) {
        levelFeatures.push(featureMatch[1].trim().toUpperCase());
      }

      if (levelFeatures.length > 0) {
        features.set(levelMatch.level, levelFeatures);
      }
    }

    subclasses.push({
      name: header.name,
      features
    });
  }

  return subclasses;
}

/**
 * Parst eine Klasse aus export_classes.md
 */
function parseClass(content: string, className: string): ClassData | null {
  const classHeader = `## ${className.toUpperCase()}`;
  const nextClassMatch = content.indexOf('\n## ', content.indexOf(classHeader) + 1);
  const classSection = nextClassMatch === -1
    ? content.substring(content.indexOf(classHeader))
    : content.substring(content.indexOf(classHeader), nextClassMatch);

  // Extrahiere ID
  const idMatch = classSection.match(/\*\*ID:\*\*\s*`([^`]+)`/);
  if (!idMatch) return null;

  const id = idMatch[1];

  // Parse Progressionstabelle
  const progressionTable = new Map<number, string[]>();
  const tableMatch = classSection.match(/### Progressionstabelle:[\s\S]*?\n\n([\s\S]*?)(?=\n###|\n##|$)/);

  if (tableMatch) {
    const tableContent = tableMatch[1];
    const rows = tableContent.split('\n').filter(row => row.trim().startsWith('|') && !row.includes('---'));

    for (const row of rows) {
      const parsed = parseProgressionTableRow(row);
      if (parsed) {
        progressionTable.set(parsed.level, parsed.features);
      }
    }
  }

  // Parse tatsächliche Features
  const actualFeatures = new Map<number, string[]>();
  for (let level = 1; level <= 20; level++) {
    const features = parseLevelSection(classSection, level);
    if (features.length > 0) {
      actualFeatures.set(level, features);
    }
  }

  // Vergleiche und finde Unterschiede
  const missingFeatures = new Map<number, string[]>();
  const extraFeatures = new Map<number, string[]>();
  const missingLevels: number[] = [];

  // Prüfe alle Level aus der Tabelle
  for (let level = 1; level <= 20; level++) {
    const tableFeatures = progressionTable.get(level) || [];
    const actual = actualFeatures.get(level) || [];

    if (tableFeatures.length > 0 && actual.length === 0) {
      missingLevels.push(level);
    }

    // Finde fehlende Features
    const missing: string[] = [];
    for (const tableFeature of tableFeatures) {
      const found = actual.some(actualFeature => featuresMatch(tableFeature, actualFeature));
      if (!found) {
        missing.push(tableFeature);
      }
    }
    if (missing.length > 0) {
      missingFeatures.set(level, missing);
    }

    // Finde zusätzliche Features (nicht in Tabelle, aber vorhanden)
    const extra: string[] = [];
    for (const actualFeature of actual) {
      // Überspringe generische Features
      if (actualFeature.includes('UNTERKLASSENMERKMAL')) continue;

      const found = tableFeatures.some(tableFeature => featuresMatch(tableFeature, actualFeature));
      if (!found) {
        extra.push(actualFeature);
      }
    }
    if (extra.length > 0) {
      extraFeatures.set(level, extra);
    }
  }

  // Finde doppelte Level
  const duplicateLevels: number[] = [];
  const levelMatches = Array.from(classSection.matchAll(/#### Level (\d+)/g));
  const levelCounts = new Map<number, number>();
  for (const match of levelMatches) {
    const level = parseInt(match[1], 10);
    levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
  }
  for (const [level, count] of Array.from(levelCounts.entries())) {
    if (count > 1) {
      duplicateLevels.push(level);
    }
  }

  // Parse Unterklassen
  const subclasses = parseSubclasses(classSection);

  // Prüfe Unterklassenmerkmale: Für jedes "Unterklassenmerkmal" in der Tabelle
  // muss JEDE Unterklasse ein Feature auf diesem Level haben
  const missingSubclassFeatures = new Map<number, string[]>();

  for (const [level, tableFeatures] of Array.from(progressionTable.entries())) {
    // Prüfe, ob "Unterklassenmerkmal" in der Tabelle steht
    const hasSubclassFeature = tableFeatures.some(f =>
      f.includes('UNTERKLASSENMERKMAL') || f.includes('UNTERKLASSE')
    );

    if (hasSubclassFeature && subclasses.length > 0) {
      // Prüfe, ob ALLE Unterklassen ein Feature auf diesem Level haben
      const missingSubclasses: string[] = [];

      for (const subclass of subclasses) {
        const subclassHasFeature = subclass.features.has(level);
        if (!subclassHasFeature) {
          missingSubclasses.push(subclass.name);
        }
      }

      if (missingSubclasses.length > 0) {
        missingSubclassFeatures.set(level, missingSubclasses);
      }
    }
  }

  return {
    name: className,
    id,
    progressionTable,
    actualFeatures,
    missingFeatures,
    extraFeatures,
    missingLevels,
    duplicateLevels,
    subclasses,
    missingSubclassFeatures,
  };
}

/**
 * Hauptfunktion
 */
function main() {
  const exportPath = path.join(__dirname, '..', 'export_classes.md');

  if (!fs.existsSync(exportPath)) {
    console.error(`Datei nicht gefunden: ${exportPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(exportPath, 'utf-8');

  const classes = [
    'BARBAR', 'BARDE', 'DRUIDE', 'HEXENMEISTER', 'KLERIKER',
    'KÄMPFER', 'MAGIER', 'MÖNCH', 'PALADIN', 'SCHURKE',
    'WALDLÄUFER', 'ZAUBERER'
  ];

  const results: ClassData[] = [];
  let totalErrors = 0;

  console.log('🔍 Prüfe Klassen-Features...\n');

  for (const className of classes) {
    const classData = parseClass(content, className);
    if (!classData) {
      console.error(`⚠️  Konnte Klasse ${className} nicht parsen`);
      continue;
    }

    results.push(classData);

    // Zähle Fehler
    const errors =
      classData.missingFeatures.size +
      classData.missingLevels.length +
      classData.duplicateLevels.length +
      classData.missingSubclassFeatures.size;

    totalErrors += errors;

    if (errors === 0) {
      console.log(`✅ ${className}: Keine Fehler gefunden`);
    } else {
      console.log(`❌ ${className}: ${errors} Fehler gefunden`);
    }
  }

  console.log(`\n📊 Zusammenfassung: ${totalErrors} Fehler insgesamt\n`);

  // Erstelle Berichtsdatei
  const reportPath = path.join(__dirname, '..', 'CLASS_FEATURES_VERIFICATION_REPORT.md');
  const reportLines: string[] = [];

  reportLines.push('# Klassen-Features Prüfbericht');
  reportLines.push('');
  reportLines.push(`**Erstellt am:** ${new Date().toLocaleString('de-DE')}`);
  reportLines.push(`**Gesamtfehler:** ${totalErrors}`);
  reportLines.push('');
  reportLines.push('---');
  reportLines.push('');

  // Detaillierter Bericht
  console.log('='.repeat(80));
  console.log('DETAILLIERTER PRÜFBERICHT');
  console.log('='.repeat(80));
  console.log();

  for (const classData of results) {
    if (classData.missingFeatures.size === 0 &&
      classData.missingLevels.length === 0 &&
      classData.duplicateLevels.length === 0 &&
      classData.extraFeatures.size === 0 &&
      classData.missingSubclassFeatures.size === 0) {
      continue; // Überspringe Klassen ohne Fehler
    }

    const className = classData.name.toUpperCase();
    console.log(`\n## ${className} (${classData.id})`);
    console.log('-'.repeat(80));

    reportLines.push(`## ${className} (${classData.id})`);
    reportLines.push('');

    // Unterklassen-Info
    if (classData.subclasses.length > 0) {
      console.log(`\n📋 Unterklassen gefunden: ${classData.subclasses.length}`);
      reportLines.push(`### Unterklassen`);
      reportLines.push(`**Anzahl:** ${classData.subclasses.length}`);
      reportLines.push('');
      for (const subclass of classData.subclasses) {
        const levels = Array.from(subclass.features.keys()).sort((a, b) => a - b);
        console.log(`   - ${subclass.name} (Level: ${levels.join(', ')})`);
        reportLines.push(`- **${subclass.name}**: Level ${levels.join(', ')}`);
      }
      reportLines.push('');
    } else {
      console.log(`\n⚠️  Keine Unterklassen gefunden`);
      reportLines.push(`### ⚠️ Keine Unterklassen gefunden`);
      reportLines.push('');
    }

    // Fehlende Level
    if (classData.missingLevels.length > 0) {
      console.log(`\n⚠️  FEHLENDE LEVEL:`);
      reportLines.push(`### ⚠️ Fehlende Level`);
      reportLines.push('');
      for (const level of classData.missingLevels) {
        const tableFeatures = classData.progressionTable.get(level) || [];
        console.log(`   Level ${level}: Erwartet ${tableFeatures.join(', ')}`);
        reportLines.push(`**Level ${level}:**`);
        reportLines.push(`- Erwartet: ${tableFeatures.join(', ')}`);
        reportLines.push(`- **Aktion:** Füge \`#### Level ${level}\` Abschnitt hinzu mit folgenden Features:`);
        for (const feature of tableFeatures) {
          reportLines.push(`  - \`- **${feature}**\``);
        }
        reportLines.push('');
      }
    }

    // Fehlende Features
    if (classData.missingFeatures.size > 0) {
      console.log(`\n❌ FEHLENDE FEATURES:`);
      reportLines.push(`### ❌ Fehlende Features`);
      reportLines.push('');
      for (const [level, features] of Array.from(classData.missingFeatures.entries())) {
        console.log(`   Level ${level}:`);
        reportLines.push(`**Level ${level}:**`);
        for (const feature of features) {
          console.log(`     - ${feature}`);
          reportLines.push(`- Fehlt: \`${feature}\``);
        }
        reportLines.push(`- **Aktion:** Füge unter \`#### Level ${level}\` hinzu:`);
        for (const feature of features) {
          reportLines.push(`  \`\`\``);
          reportLines.push(`  - **${feature}**`);
          reportLines.push(`    [Beschreibung hier einfügen]`);
          reportLines.push(`  \`\`\``);
        }
        reportLines.push('');
      }
    }

    // Zusätzliche Features
    if (classData.extraFeatures.size > 0) {
      console.log(`\nℹ️  ZUSÄTZLICHE FEATURES (nicht in Tabelle):`);
      reportLines.push(`### ℹ️ Zusätzliche Features (nicht in Progressionstabelle)`);
      reportLines.push('');
      for (const [level, features] of Array.from(classData.extraFeatures.entries())) {
        console.log(`   Level ${level}:`);
        reportLines.push(`**Level ${level}:**`);
        for (const feature of features) {
          console.log(`     - ${feature}`);
          reportLines.push(`- ${feature}`);
        }
        reportLines.push(`- **Hinweis:** Diese Features sind vorhanden, aber nicht in der Progressionstabelle aufgeführt.`);
        reportLines.push(`  Prüfe, ob sie zur Tabelle hinzugefügt oder entfernt werden sollten.`);
        reportLines.push('');
      }
    }

    // Doppelte Level
    if (classData.duplicateLevels.length > 0) {
      console.log(`\n⚠️  DOPPELTE LEVEL:`);
      reportLines.push(`### ⚠️ Doppelte Level`);
      reportLines.push('');
      for (const level of classData.duplicateLevels) {
        console.log(`   Level ${level} ist mehrfach vorhanden`);
        reportLines.push(`- **Level ${level}:** Ist mehrfach vorhanden`);
        reportLines.push(`- **Aktion:** Entferne doppelte \`#### Level ${level}\` Abschnitte`);
        reportLines.push('');
      }
    }

    // Fehlende Unterklassenmerkmale
    if (classData.missingSubclassFeatures.size > 0) {
      console.log(`\n❌ FEHLENDE UNTERKLASSENMERKMALE (nicht in allen Unterklassen):`);
      reportLines.push(`### ❌ Fehlende Unterklassenmerkmale`);
      reportLines.push('');
      for (const [level, missingSubclasses] of Array.from(classData.missingSubclassFeatures.entries())) {
        console.log(`   Level ${level}:`);
        console.log(`     Progressionstabelle zeigt "Unterklassenmerkmal", aber fehlt in:`);
        reportLines.push(`**Level ${level}:**`);
        reportLines.push(`- Progressionstabelle zeigt: "Unterklassenmerkmal"`);
        reportLines.push(`- **Fehlt in folgenden Unterklassen:**`);
        for (const subclassName of missingSubclasses) {
          console.log(`       - ${subclassName}`);
          reportLines.push(`  - ${subclassName}`);
        }
        // Zeige welche Unterklassen das Feature haben
        const hasFeature = classData.subclasses
          .filter(s => !missingSubclasses.includes(s.name))
          .map(s => s.name);
        if (hasFeature.length > 0) {
          console.log(`     Vorhanden in: ${hasFeature.join(', ')}`);
          reportLines.push(`- **Vorhanden in:** ${hasFeature.join(', ')}`);
        }
        reportLines.push(`- **Aktion:** Füge für jede fehlende Unterklasse unter \`#### ${missingSubclasses[0]}\` hinzu:`);
        reportLines.push(`  \`\`\``);
        reportLines.push(`  **Level ${level}:**`);
        reportLines.push(`  `);
        reportLines.push(`  - **[FEATURENAME]**`);
        reportLines.push(`    [Beschreibung hier einfügen]`);
        reportLines.push(`  \`\`\``);
        reportLines.push('');
      }
    }

    // Statistiken
    console.log(`\n📈 Statistiken:`);
    console.log(`   Progressionstabelle: ${classData.progressionTable.size} Level mit Features`);
    console.log(`   Tatsächliche Features: ${classData.actualFeatures.size} Level mit Features`);

    reportLines.push(`### Statistiken`);
    reportLines.push(`- Progressionstabelle: ${classData.progressionTable.size} Level mit Features`);
    reportLines.push(`- Tatsächliche Features: ${classData.actualFeatures.size} Level mit Features`);
    reportLines.push(`- Unterklassen: ${classData.subclasses.length}`);
    reportLines.push('');
    reportLines.push('---');
    reportLines.push('');
  }

  // Gesamtstatistik
  console.log('\n' + '='.repeat(80));
  console.log('GESAMTSTATISTIK');
  console.log('='.repeat(80));
  console.log();

  let totalMissingFeatures = 0;
  let totalMissingLevels = 0;
  let totalDuplicates = 0;
  let totalExtraFeatures = 0;
  let totalMissingSubclassFeatures = 0;

  for (const classData of results) {
    totalMissingFeatures += classData.missingFeatures.size;
    totalMissingLevels += classData.missingLevels.length;
    totalDuplicates += classData.duplicateLevels.length;
    totalExtraFeatures += classData.extraFeatures.size;
    totalMissingSubclassFeatures += classData.missingSubclassFeatures.size;
  }

  console.log(`Fehlende Features: ${totalMissingFeatures}`);
  console.log(`Fehlende Level: ${totalMissingLevels}`);
  console.log(`Doppelte Level: ${totalDuplicates}`);
  console.log(`Zusätzliche Features: ${totalExtraFeatures}`);
  console.log(`Fehlende Unterklassenmerkmale: ${totalMissingSubclassFeatures}`);
  console.log(`\nGesamtfehler: ${totalMissingFeatures + totalMissingLevels + totalDuplicates + totalMissingSubclassFeatures}`);

  // Zusammenfassung im Bericht
  reportLines.push('## Zusammenfassung');
  reportLines.push('');
  reportLines.push('| Fehlertyp | Anzahl |');
  reportLines.push('|-----------|--------|');
  reportLines.push(`| Fehlende Features | ${totalMissingFeatures} |`);
  reportLines.push(`| Fehlende Level | ${totalMissingLevels} |`);
  reportLines.push(`| Doppelte Level | ${totalDuplicates} |`);
  reportLines.push(`| Zusätzliche Features | ${totalExtraFeatures} |`);
  reportLines.push(`| Fehlende Unterklassenmerkmale | ${totalMissingSubclassFeatures} |`);
  const totalErrorsCount = totalMissingFeatures + totalMissingLevels + totalDuplicates + totalMissingSubclassFeatures;
  reportLines.push(`| **Gesamtfehler** | **${totalErrorsCount}** |`);
  reportLines.push('');
  reportLines.push('---');
  reportLines.push('');
  reportLines.push('## Nächste Schritte');
  reportLines.push('');
  reportLines.push('1. Gehe durch jeden Fehler in diesem Bericht');
  reportLines.push('2. Befolge die angegebenen Aktionen für jeden Fehler');
  reportLines.push('3. Führe das Prüfskript erneut aus: `npm run verify:classes`');
  reportLines.push('4. Wiederhole bis alle Fehler behoben sind');
  reportLines.push('');

  // Schreibe Bericht in Datei
  fs.writeFileSync(reportPath, reportLines.join('\n'), 'utf-8');
  console.log(`\n📄 Detaillierter Bericht gespeichert: ${reportPath}`);

  // Exit-Code basierend auf Fehlern
  if (totalErrors > 0) {
    process.exit(1);
  }
}

// ES Module: Prüfe ob Skript direkt ausgeführt wird
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('verify_class_features.ts')) {
  main();
}

export { parseClass, parseProgressionTableRow, parseLevelSection };
