#!/usr/bin/env tsx
/**
 * Generiert PHB-Verifikations-Korrekturen basierend auf CLASS_FEATURES_VERIFICATION_REPORT.md
 * und dem extrahierten PHB-Text
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ReportIssue {
  class: string;
  level: number;
  type: 'missing' | 'extra' | 'duplicate' | 'missing_subclass';
  feature?: string;
  subclass?: string;
  description?: string;
}

async function main() {
  const phbText = fs.readFileSync(
    path.join(__dirname, '..', 'phb_extracted_text.txt'),
    'utf-8'
  );

  const reportPath = path.join(__dirname, '..', 'CLASS_FEATURES_VERIFICATION_REPORT.md');
  const report = fs.readFileSync(reportPath, 'utf-8');

  const corrections: string[] = [];
  corrections.push('# PHB 2024 Verifikations-Korrekturen');
  corrections.push('');
  corrections.push('**Erstellt:** Basierend auf Abgleich zwischen CLASS_FEATURES_VERIFICATION_REPORT.md und D&D Spielerhandbuch 2024');
  corrections.push('');
  corrections.push('---');
  corrections.push('');

  // Parse report für jede Klasse
  const classes = [
    'BARBAR', 'BARDE', 'DRUIDE', 'HEXENMEISTER', 'KLERIKER',
    'KÄMPFER', 'MAGIER', 'MÖNCH', 'PALADIN', 'SCHURKE',
    'WALDLÄUFER', 'ZAUBERER'
  ];

  for (const className of classes) {
    const classSection = report.match(new RegExp(`## ${className}[\\s\\S]*?(?=##|$)`));
    if (!classSection) continue;

    corrections.push(`## ${className}`);
    corrections.push('');

    // Suche nach fehlenden Features
    const missingFeatures = Array.from(classSection[0].matchAll(/### ❌ Fehlende Features[\s\S]*?(\*\*Level \d+:\*\*[\s\S]*?)(?=###|$)/g));
    for (const match of missingFeatures) {
      const levelMatch = match[1].match(/\*\*Level (\d+):\*\*/);
      if (!levelMatch) continue;

      const level = parseInt(levelMatch[1], 10);
      const features = Array.from(match[1].matchAll(/- Fehlt: `([^`]+)`/g));

      for (const featureMatch of features) {
        const featureName = featureMatch[1];

        // Suche im PHB nach diesem Feature
        const phbPattern = new RegExp(
          `(${level}\\. STUFE|Stufe ${level}|Level ${level}).*?${featureName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,1000}`,
          'i'
        );
        const phbMatch = phbText.match(phbPattern);

        corrections.push(`### ${className} – Level ${level}`);
        corrections.push('');
        corrections.push(`**Status im Report:**`);
        corrections.push(`- Fehlend: \`${featureName}\``);
        corrections.push('');
        corrections.push(`**Korrekte PHB-Quelle:**`);
        corrections.push(`- Kapitel 3: Charakterklassen → ${className}merkmale → Stufe ${level}`);
        corrections.push('');

        if (phbMatch) {
          // Extrahiere Beschreibung
          const descMatch = phbMatch[0].match(new RegExp(`${featureName}[\\s\\S]{0,500}`, 'i'));
          corrections.push(`**Korrektes Feature:**`);
          corrections.push(`- **${featureName}**`);
          if (descMatch) {
            const description = descMatch[0]
              .replace(new RegExp(featureName, 'gi'), '')
              .trim()
              .substring(0, 500);
            corrections.push(`  - ${description}`);
          } else {
            corrections.push(`  - [Beschreibung aus PHB extrahieren]`);
          }
          corrections.push('');
          corrections.push(`**Hinweise:**`);
          corrections.push(`- Bestätigt fehlend. Das Feature muss unter Level ${level} hinzugefügt werden.`);
        } else {
          corrections.push(`**Korrektes Feature:**`);
          corrections.push(`- **${featureName}**`);
          corrections.push(`  - [PHB-Text für dieses Feature suchen]`);
          corrections.push('');
          corrections.push(`**Hinweise:**`);
          corrections.push(`- Feature-Name im PHB verifizieren.`);
        }

        corrections.push('');
        corrections.push('---');
        corrections.push('');
      }
    }
  }

  const outputPath = path.join(__dirname, '..', 'PHB_VERIFICATION_CORRECTIONS.md');
  fs.writeFileSync(outputPath, corrections.join('\n'), 'utf-8');
  console.log(`Korrekturbericht gespeichert: ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('generate_phb_corrections.ts')) {
  main();
}
