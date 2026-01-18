import fs from 'node:fs/promises';
import path from 'node:path';
import pdf from 'pdf-parse';

type ItemEntry = {
  name: string;
  source?: {
    book: string;
    start_page_physical?: number;
    end_page_physical?: number;
  };
  magic?: {
    text_blocks?: Array<{ type: string; text: string }>;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

async function extractMissingDescriptions() {
  const itemsJsonPath = path.resolve('exports/items.json');
  const missingJsonPath = path.resolve('exports/items-without-description.json');
  const pdfPath = path.resolve('resources/books/2024_D&D Spielleiterhandbuch (2024).pdf');

  console.log('📖 Lade Daten...\n');

  const itemsData = JSON.parse(await fs.readFile(itemsJsonPath, 'utf-8')) as ItemEntry[];
  const missingData = JSON.parse(await fs.readFile(missingJsonPath, 'utf-8')) as {
    count: number;
    items: string[];
  };

  console.log(`📋 ${missingData.count} Items ohne Beschreibung gefunden\n`);

  // Erstelle Mapping
  const itemsByName = new Map<string, ItemEntry>();
  for (const item of itemsData) {
    itemsByName.set(item.name, item);
  }

  // Lade PDF
  console.log(`📖 Lade PDF: ${pdfPath}...`);
  const dataBuffer = await fs.readFile(pdfPath);
  const pdfData = await pdf(dataBuffer);
  const text = pdfData.text;

  console.log(`✅ PDF geladen (${text.length} Zeichen)\n`);

  let extractedCount = 0;

  for (const itemName of missingData.items) {
    const item = itemsByName.get(itemName);
    if (!item) {
      console.log(`⚠️  ${itemName}: NICHT IN items.json GEFUNDEN`);
      continue;
    }

    const page = item.source?.start_page_physical;
    if (!page) {
      console.log(`⚠️  ${itemName}: KEINE SEITEN-INFO`);
      continue;
    }

    console.log(`🔍 Suche: ${itemName} (S.${page})...`);

    // Normalisiere Item-Name für Suche
    const searchName = itemName.toUpperCase().trim();
    const searchPatterns = [
      searchName,
      searchName.replace(/-/g, ' '),
      searchName.replace(/-/g, ''),
    ];

    // Spezielle Varianten für bestimmte Items (mit OCR-Fehlern berücksichtigen)
    const specialVariants: Record<string, string[]> = {
      'AMETHYST-STIRNBAND DER INTELLIGENZ': [
        'AMETHYST-STIRNBAND DER INTELLIGENZ',
        'AMETHYST STIRNBAND DER INTELLIGENZ',
        'STIRNBAND DER INTELLIGENZ',
      ],
      'FIGUR DER WUNDERSAMEN KRAFT': [
        'FIGUR DER WUNDERSAMEN KRAF T', // OCR-Fehler: Leerzeichen in "KRAFT"
        'FIGUR DER WUNDERSAMEN KRAFT',
        'FIGUR WUNDERSAMEN KRAFT',
      ],
      'MYSTERIENSCHLÜSSEL': [
        'MYSTERIENSCHLÜSSEL',
        'MYSTERIEN SCHLÜSSEL',
        'MYSTERIEN-SCHLÜSSEL',
        'Mysterienschlüssel', // Kleinschreibung in Tabellen
      ],
      'PFEIFE DER RAUCHMONSTER': [
        'PFEIFE DER RAUCHMONSTER',
        'PFEIFE RAUCHMONSTER',
        'Pfeife der Rauchmonster', // Kleinschreibung in Tabellen
      ],
      'SCHILD DES KAVALIERS': [
        'SCHILD DES KAVALIERS',
        'SCHILD KAVALIERS',
        'Schild des Kavaliers', // Kleinschreibung in Tabellen
      ],
      'SCHWERT VON KAS': [
        'SCHWERT VON KAS',
        'SCHWERT KAS',
        'Schwert von Kas', // Kleinschreibung
      ],
    };

    if (specialVariants[itemName]) {
      searchPatterns.push(...specialVariants[itemName]);
    }

    // Regex-Pattern für Item-Name gefolgt von Kategorie/Seltenheit
    const categoryPattern =
      '(Waffe|Wundersamer Gegenstand|Rüstung|Ring|Schriftrolle|Zauberstab|Stab|Zepter|Trank|Schild|Waffe \\(.*?\\)|Rüstung \\(.*?\\))';
    const rarityPattern = '(gewöhnlich|ungewöhnlich|selten|sehr selten|legendär|Artefakt|artefakt)';

    let found = false;

    for (const pattern of searchPatterns) {
      // Erlaube Leerzeichen innerhalb von Wörtern (OCR-Fehler)
      const flexiblePattern = pattern.replace(/\s+/g, '\\s*');
      const escapedPattern = flexiblePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const itemRegex = new RegExp(
        `(${escapedPattern})\\s+${categoryPattern}[,\\s]+${rarityPattern}`,
        'i'
      );

      // Suche auch mit flexiblerem Pattern (erlaubt mehr Leerzeichen)
      const veryFlexibleRegex = new RegExp(
        `(${escapedPattern.replace(/\\s\*/g, '\\s*')})\\s*${categoryPattern}[,\\s]*${rarityPattern}`,
        'i'
      );
      
      let match = text.match(itemRegex);
      if (!match) {
        match = text.match(veryFlexibleRegex);
      }
      
      // Falls immer noch nicht gefunden, suche nur nach dem Namen (ohne Kategorie/Seltenheit direkt danach)
      if (!match) {
        const nameOnlyRegex = new RegExp(`(${escapedPattern})`, 'i');
        const nameMatch = text.match(nameOnlyRegex);
        if (nameMatch) {
          // Suche nach Kategorie/Seltenheit in den nächsten 200 Zeichen
          const contextStart = nameMatch.index!;
          const context = text.substring(contextStart, contextStart + 500);
          const categoryMatch = context.match(new RegExp(`${categoryPattern}[,\\s]+${rarityPattern}`, 'i'));
          if (categoryMatch) {
            // Erstelle einen "künstlichen" Match
            match = nameMatch;
          }
        }
      }
      
      if (match) {
        const startPos = match.index!;
        const endPos = startPos + match[0].length;

        // Finde das Ende der Beschreibung (nächstes Item)
        const nextItemRegex = new RegExp(
          `([A-ZÄÖÜ][A-ZÄÖÜ\\s\\-]{5,})\\s+${categoryPattern}[,\\s]+${rarityPattern}`,
          'i'
        );
        const nextMatch = text.substring(endPos).match(nextItemRegex);

        let descriptionEnd: number;
        if (nextMatch && nextMatch.index !== undefined) {
          descriptionEnd = endPos + nextMatch.index;
        } else {
          // Suche nach nächstem Kapitel oder Abschnitt
          const nextSection = text.substring(endPos, endPos + 5000).match(/KAPITEL\s+\d+|^[A-ZÄÖÜ\s]{15,}$/m);
          if (nextSection && nextSection.index !== undefined) {
            descriptionEnd = endPos + nextSection.index;
          } else {
            descriptionEnd = Math.min(endPos + 5000, text.length);
          }
        }

        const description = text.substring(startPos, descriptionEnd).trim();

        // Aktualisiere Item
        if (!item.magic) {
          item.magic = {};
        }
        if (!item.magic.text_blocks) {
          item.magic.text_blocks = [];
        }

        item.magic.text_blocks = [
          {
            type: 'paragraph',
            text: description,
          },
        ];

        extractedCount++;
        console.log(`  ✅ Beschreibung extrahiert (${description.length} Zeichen)`);
        console.log(`     Vorschau: ${description.substring(0, 100)}...`);
        found = true;
        break;
      }
    }

    // Falls nicht gefunden, versuche eine breitere Suche ohne Kategorie/Seltenheit-Pattern
    if (!found) {
      console.log(`  ⚠️  Standard-Suche fehlgeschlagen, versuche erweiterte Suche...`);
      
      for (const pattern of searchPatterns) {
        const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Suche nur nach dem Namen (ohne Kategorie/Seltenheit)
        const nameOnlyRegex = new RegExp(`(${escapedPattern})`, 'i');
        const match = text.match(nameOnlyRegex);
        
        if (match) {
          const startPos = match.index!;
          // Suche nach dem nächsten Item oder Abschnitt
          const nextItemRegex = new RegExp(
            `([A-ZÄÖÜ][A-ZÄÖÜ\\s\\-]{5,})\\s+${categoryPattern}[,\\s]+${rarityPattern}`,
            'i'
          );
          const nextMatch = text.substring(startPos + 100).match(nextItemRegex);
          
          let descriptionEnd: number;
          if (nextMatch && nextMatch.index !== undefined) {
            descriptionEnd = startPos + 100 + nextMatch.index;
          } else {
            // Suche nach nächstem Kapitel oder Abschnitt
            const nextSection = text.substring(startPos, startPos + 5000).match(/KAPITEL\s+\d+|^[A-ZÄÖÜ\s]{15,}$/m);
            if (nextSection && nextSection.index !== undefined) {
              descriptionEnd = startPos + nextSection.index;
            } else {
              descriptionEnd = Math.min(startPos + 5000, text.length);
            }
          }
          
          const description = text.substring(startPos, descriptionEnd).trim();
          
          // Prüfe ob die Beschreibung plausibel ist (enthält Kategorie oder Seltenheit)
          if (description.length > 50 && (categoryPattern.includes(description.substring(0, 200)) || rarityPattern.includes(description.substring(0, 200)))) {
            // Aktualisiere Item
            if (!item.magic) {
              item.magic = {};
            }
            if (!item.magic.text_blocks) {
              item.magic.text_blocks = [];
            }
            
            item.magic.text_blocks = [
              {
                type: 'paragraph',
                text: description,
              },
            ];
            
            extractedCount++;
            console.log(`  ✅ Beschreibung extrahiert (erweiterte Suche, ${description.length} Zeichen)`);
            console.log(`     Vorschau: ${description.substring(0, 100)}...`);
            found = true;
            break;
          }
        }
      }
    }
    
    if (!found) {
      console.log(`  ❌ NICHT GEFUNDEN`);
    }
  }

  console.log(`\n=== ${extractedCount}/${missingData.count} Beschreibungen extrahiert ===\n`);

  // Speichere aktualisierte items.json
  await fs.writeFile(itemsJsonPath, JSON.stringify(itemsData, null, 2), 'utf-8');
  console.log('✅ items.json aktualisiert');
}

extractMissingDescriptions().catch(console.error);
