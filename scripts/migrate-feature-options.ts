import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

// Extrahiere Optionen aus Feature-Beschreibung (für einmalige Migration)
function extractOptionsFromDescription(featureId: string, description: string): Array<{ name: string; description: string }> {
  const options: Array<{ name: string; description: string }> = [];

  // Suche nach Hinweisen auf Optionen: "nach deiner Wahl", "eine der folgenden", etc.
  const optionIndicators = [
    /nach deiner wahl/i,
    /eine der folgenden/i,
    /wähle.*aus/i,
    /du erhältst eine der folgenden/i,
    /du kannst.*wählen/i,
    /folgende option/i,
    /wähle eine/i,
    /wähle.*zwischen/i,
  ];

  const hasOptionIndicator = optionIndicators.some(pattern => pattern.test(description));

  // Erweiterte Suche: Auch nach Aufzählungen mit Bindestrichen oder Nummerierungen
  const hasListPattern = /(?:^|\n|\.)\s*[-•*]\s*[A-ZÄÖÜ]/.test(description);
  const hasNumberedList = /(?:^|\n|\.)\s*\d+[.)]\s*[A-ZÄÖÜ]/.test(description);

  if (!hasOptionIndicator && !hasListPattern && !hasNumberedList) {
    return options; // Keine klaren Hinweise auf Optionen
  }

  // Finde alle Optionen: Name (1-5 Wörter) gefolgt von Doppelpunkt
  // Pattern: Großbuchstabe, gefolgt von 0-4 weiteren Wörtern, dann Doppelpunkt
  const optionPattern = /([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){0,4}):\s*([^:]+?)(?=\s+[A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*:|$)/g;

  // Alternative Pattern für Aufzählungen mit Bindestrichen oder Nummerierungen
  const listPattern1 = /(?:^|\n|\.)\s*[-•*]\s*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){0,4}):\s*([^\n•*-]+?)(?=\s*(?:[-•*]|\d+[.)]|[A-ZÄÖÜ][a-zäöüß]+:|$))/gm;
  const listPattern2 = /(?:^|\n|\.)\s*\d+[.)]\s*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){0,4}):\s*([^\n\d]+?)(?=\s*(?:\d+[.)]|[A-ZÄÖÜ][a-zäöüß]+:|$))/gm;

  let match;
  const foundOptions: Array<{ name: string; description: string; position: number }> = [];

  // Verwende zuerst das Hauptpattern (Name: Beschreibung)
  while ((match = optionPattern.exec(description)) !== null) {
    const name = match[1].trim();
    let desc = match[2].trim();

    // Entferne führende Satzzeichen und Leerzeichen
    desc = desc.replace(/^[.,;:]\s*/, '').trim();

    // Filtere bekannte Falschtreffer (nur wenn sie allein stehen)
    const skipNames = [
      'Du', 'Die', 'Der', 'Das', 'Ein', 'Eine', 'Wann', 'Wenn', 'Solange',
      'Deine', 'Als', 'Bei', 'Von', 'Mit', 'Für', 'Nach', 'Beispiel',
      'Voraussetzungen', 'Zauberplätze', 'Zauberwirken', 'Zauberfokus',
      'Zauberbuch', 'Kosten', 'Grad', 'Effekten', 'Funke'
    ];

    // Erlaube "Zaubertricks" nur wenn es Teil eines längeren Namens ist
    if (name === 'Zaubertricks' || name === 'Verstärkte Zaubertricks') {
      // "Verstärkte Zaubertricks" ist ok, aber nicht "Zaubertricks" allein
      if (name === 'Zaubertricks') continue;
    }

    // Filtere sehr kurze Namen (unter 3 Zeichen) oder sehr lange Namen (über 50 Zeichen)
    if (name.length < 3 || name.length > 50) continue;

    // Filtere Namen, die in der Skip-Liste stehen
    if (skipNames.includes(name)) continue;

    // Beschreibung sollte mindestens 20 Zeichen haben
    if (desc.length < 20) continue;

    // Prüfe, ob der Name sinnvoll ist (enthält keine offensichtlich falschen Wörter)
    const invalidWords = ['die', 'der', 'das', 'ein', 'eine', 'du', 'deine'];
    const nameLower = name.toLowerCase();
    const nameWords = nameLower.split(/\s+/);
    // Prüfe nur das erste Wort, nicht alle
    if (invalidWords.includes(nameWords[0])) continue;

    foundOptions.push({
      name,
      description: desc,
      position: match.index
    });
  }

  // Helper-Funktion zur Validierung einer Option
  const isValidOption = (name: string, desc: string): boolean => {
    // Filtere bekannte Falschtreffer
    const skipNames = [
      'Du', 'Die', 'Der', 'Das', 'Ein', 'Eine', 'Wann', 'Wenn', 'Solange',
      'Deine', 'Als', 'Bei', 'Von', 'Mit', 'Für', 'Nach', 'Beispiel',
      'Voraussetzungen', 'Zauberplätze', 'Zauberwirken', 'Zauberfokus',
      'Zauberbuch', 'Kosten', 'Grad', 'Effekten', 'Funke'
    ];

    // Erlaube "Zaubertricks" nur wenn es Teil eines längeren Namens ist
    if (name === 'Zaubertricks') return false;

    // Filtere sehr kurze oder sehr lange Namen
    if (name.length < 3 || name.length > 50) return false;

    // Filtere Namen in der Skip-Liste
    if (skipNames.includes(name)) return false;

    // Beschreibung sollte mindestens 20 Zeichen haben
    if (desc.length < 20) return false;

    // Prüfe, ob der Name sinnvoll ist
    const invalidWords = ['die', 'der', 'das', 'ein', 'eine', 'du', 'deine'];
    const nameLower = name.toLowerCase();
    const nameWords = nameLower.split(/\s+/);
    if (invalidWords.includes(nameWords[0])) return false;

    return true;
  };

  // Wenn keine Optionen gefunden wurden, versuche Listen-Patterns
  if (foundOptions.length === 0 && (hasListPattern || hasNumberedList)) {
    // Teste Listen-Pattern mit Bindestrichen
    while ((match = listPattern1.exec(description)) !== null) {
      const name = match[1].trim();
      let desc = match[2].trim();

      desc = desc.replace(/^[.,;:]\s*/, '').trim();

      if (isValidOption(name, desc)) {
        foundOptions.push({
          name,
          description: desc,
          position: match.index
        });
      }
    }

    // Teste nummerierte Listen
    while ((match = listPattern2.exec(description)) !== null) {
      const name = match[1].trim();
      let desc = match[2].trim();

      desc = desc.replace(/^[.,;:]\s*/, '').trim();

      if (isValidOption(name, desc)) {
        foundOptions.push({
          name,
          description: desc,
          position: match.index
        });
      }
    }
  }

  // Sortiere nach Position im Text
  foundOptions.sort((a, b) => a.position - b.position);

  // Filtere Optionen, die zu nah beieinander sind (wahrscheinlich Teil derselben Option)
  const filteredOptions: Array<{ name: string; description: string }> = [];
  for (let i = 0; i < foundOptions.length; i++) {
    const current = foundOptions[i];

    // Überspringe nicht, sondern prüfe nur ob die Beschreibung zu kurz wäre

    // Kürze die Beschreibung, falls sie die nächste Option enthält
    let cleanDesc = current.description;
    if (i < foundOptions.length - 1) {
      const nextOptionName = foundOptions[i + 1].name;
      const nextIndex = cleanDesc.indexOf(nextOptionName + ':');
      if (nextIndex > 0) {
        cleanDesc = cleanDesc.substring(0, nextIndex).trim();
      }
    }

    // Entferne abschließende Satzzeichen am Ende
    cleanDesc = cleanDesc.replace(/[.,;:]+\s*$/, '').trim();

    // Beschreibung muss mindestens 20 Zeichen haben
    if (cleanDesc.length >= 20) {
      filteredOptions.push({
        name: current.name,
        description: cleanDesc
      });
    }
  }

  return filteredOptions;
}

function migrateFeatureOptions(dbPath: string) {
  const db = new Database(dbPath);

  try {
    console.log('Starte Migration von Feature-Optionen...');

    // Finde alle Choice-Features (auch mit bestehenden Optionen, um sie zu aktualisieren)
    const features = db.prepare(`
      SELECT id, name, description 
      FROM core_class_features 
      WHERE feature_type = 'choice'
    `).all() as Array<{ id: string; name: string; description: string }>;

    console.log(`Gefundene Choice-Features: ${features.length}`);

    let migrated = 0;

    for (const feature of features) {
      const options = extractOptionsFromDescription(feature.id, feature.description);

      if (options.length > 0) {
        // Lösche alte Optionen für dieses Feature
        db.prepare('DELETE FROM core_feature_options WHERE feature_id = ?').run(feature.id);

        console.log(`\nFeature: ${feature.name} (${feature.id})`);
        console.log(`  Gefundene Optionen: ${options.length}`);

        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          const optionId = `${feature.id}_${option.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;

          try {
            db.prepare(`
              INSERT INTO core_feature_options (id, feature_id, option_name, option_description, display_order)
              VALUES (?, ?, ?, ?, ?)
            `).run(optionId, feature.id, option.name, option.description, i + 1);

            console.log(`    ✓ ${option.name}`);
            migrated++;
          } catch (err: unknown) {
            console.error(`    ✗ Fehler bei ${option.name}:`, (err as Error).message);
          }
        }
      }
    }

    console.log(`\nMigration abgeschlossen! ${migrated} Optionen migriert.`);

  } catch (error) {
    console.error('Fehler bei Migration:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Main
const dbPath = path.join(process.cwd(), 'dnd-nexus.db');
if (!fs.existsSync(dbPath)) {
  console.error(`Datenbank nicht gefunden: ${dbPath}`);
  process.exit(1);
}

migrateFeatureOptions(dbPath);
