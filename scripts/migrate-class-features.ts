import Database from 'better-sqlite3';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ProgressionTableRow {
  level: number;
  proficiency_bonus: number;
  feature_names: string[];
  class_specific_data: Record<string, unknown>;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  level: number;
  feature_type: 'passive' | 'active' | 'progression' | 'choice' | 'reaction' | 'bonus_action';
  effects: {
    when_active?: unknown[];
    when_passive?: unknown[];
    on_activation?: unknown[];
    on_deactivation?: unknown[];
  };
  conditions?: Record<string, unknown>;
  uses_per_rest?: string | number;
  rest_type?: 'short' | 'long';
}

interface Subclass {
  id: string;
  name: string;
  description: string;
  level: number;
}

interface ClassData {
  id: string;
  name: string;
  description?: string;
  progression_table: ProgressionTableRow[];
  features: Feature[];
  subclasses: Subclass[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseProgressionTable(markdown: string, classId: string): ProgressionTableRow[] {
  const rows: ProgressionTableRow[] = [];
  
  // Suche nach der Progressionstabelle
  const tableMatch = markdown.match(/### Progressionstabelle.*?\n\n(\|.*?\|.*?\n\|.*?\n(?:\|.*?\n)+)/s);
  if (!tableMatch) {
    console.warn(`⚠️  Keine Progressionstabelle für ${classId} gefunden`);
    return rows;
  }
  
  const tableLines = tableMatch[1].split('\n').filter(line => line.trim().startsWith('|'));
  
  // Parse Header (erste Zeile mit |)
  if (tableLines.length < 2) return rows;
  
  // Parse Data Rows (ab Zeile 3, da Zeile 1 Header, Zeile 2 Separator)
  for (let i = 2; i < tableLines.length; i++) {
    const cells = tableLines[i].split('|').map(c => c.trim()).filter(c => c);
    if (cells.length < 3) continue;
    
    const level = parseInt(cells[0], 10);
    if (isNaN(level) || level < 1 || level > 20) continue;
    
    // Parse Übungsbonus (entferne +)
    const profBonusMatch = cells[1].match(/(\d+)/);
    const proficiency_bonus = profBonusMatch ? parseInt(profBonusMatch[1], 10) : Math.ceil(level / 4) + 1;
    
    // Parse Feature-Namen
    const featureNamesStr = cells[2] || '';
    const feature_names = featureNamesStr
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);
    
    // Parse klassenspezifische Daten (Spalten 3+)
    const class_specific_data: Record<string, unknown> = {};
    for (let j = 3; j < cells.length; j++) {
      const headerCells = tableLines[0].split('|').map(c => c.trim()).filter(c => c);
      if (headerCells[j]) {
        const headerName = slugify(headerCells[j]);
        const value = cells[j];
        // Versuche Zahlen zu parsen
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
          class_specific_data[headerName] = numValue;
        } else {
          class_specific_data[headerName] = value;
        }
      }
    }
    
    rows.push({
      level,
      proficiency_bonus,
      feature_names,
      class_specific_data,
    });
  }
  
  return rows;
}

function parseFeatures(markdown: string, classId: string): Feature[] {
  const features: Feature[] = [];
  
  // Suche nach "### Features nach Level"
  const featuresSectionMatch = markdown.match(/### Features nach Level\n\n(.*?)(?:### Unterklassen|$)/s);
  if (!featuresSectionMatch) {
    console.warn(`⚠️  Kein Features-Abschnitt für ${classId} gefunden`);
    return features;
  }
  
  const featuresSection = featuresSectionMatch[1];
  
  // Parse Level-Abschnitte
  const levelMatches = featuresSection.matchAll(/#### Level (\d+)\n\n(.*?)(?=\n#### Level |$)/gs);
  
  for (const levelMatch of levelMatches) {
    const level = parseInt(levelMatch[1], 10);
    const levelContent = levelMatch[2];
    
    // Parse Features in diesem Level (Format: - **NAME** Beschreibung)
    const featureMatches = levelContent.matchAll(/- \*\*(.+?)\*\*\n\s+(.+?)(?=\n- \*\*|\n#### |$)/gs);
    
    for (const featureMatch of featureMatches) {
      const name = featureMatch[1].trim();
      const description = featureMatch[2].trim();
      
      // Bestimme Feature-Type
      let feature_type: Feature['feature_type'] = 'passive';
      if (description.match(/\bals (Bonusaktion|Aktion|Reaktion)\b/i)) {
        feature_type = description.includes('Bonusaktion') ? 'bonus_action' :
                      description.includes('Reaktion') ? 'reaction' : 'active';
      } else if (description.match(/\b(?:deiner|deiner|deine) Wahl\b/i) || 
                 description.match(/\bauswählen\b/i) ||
                 description.match(/\boder\b.*\boder\b/i)) {
        feature_type = 'choice';
      } else if (name.includes('Unterklasse') || name.includes('MERKMAL')) {
        feature_type = 'progression';
      }
      
      // Bestimme uses_per_rest
      let uses_per_rest: string | number | undefined;
      let rest_type: 'short' | 'long' | undefined;
      
      const usesMatch = description.match(/Wie oft du dies tun kannst, ist.*?(\d+)/i);
      if (usesMatch) {
        uses_per_rest = parseInt(usesMatch[1], 10);
      }
      
      if (description.includes('kurze Rast')) {
        rest_type = 'short';
      } else if (description.includes('lange Rast')) {
        rest_type = 'long';
      }
      
      const featureId = `${classId}_${slugify(name)}_l${level}`;
      
      // Initiale Effects-Struktur (später können wir diese genauer parsen)
      const effects: Feature['effects'] = {
        when_passive: feature_type === 'passive' ? [] : undefined,
        when_active: feature_type === 'active' || feature_type === 'bonus_action' || feature_type === 'reaction' ? [] : undefined,
      };
      
      features.push({
        id: featureId,
        name,
        description,
        level,
        feature_type,
        effects,
        uses_per_rest,
        rest_type,
      });
    }
  }
  
  return features;
}

function parseSubclasses(markdown: string, classId: string): Subclass[] {
  const subclasses: Subclass[] = [];
  
  // Suche nach "### Unterklassen"
  const subclassesSectionMatch = markdown.match(/### Unterklassen\n\n(.*?)(?=\n## |$)/s);
  if (!subclassesSectionMatch) {
    return subclasses;
  }
  
  const subclassesSection = subclassesSectionMatch[1];
  
  // Parse Subclass-Abschnitte (Format: #### UNTERKLASSENNAME)
  const subclassMatches = subclassesSection.matchAll(/#### ([A-ZÄÖÜ][A-ZÄÖÜ\s]+)\n\n(.*?)(?=\n#### |$)/gs);
  
  for (const subclassMatch of subclassMatches) {
    const name = subclassMatch[1].trim();
    const content = subclassMatch[2].trim();
    
    // Extrahiere Beschreibung (erster Paragraph)
    const descriptionMatch = content.match(/^(.+?)(?:\n\n|$)/);
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';
    
    // Subclass Level ist normalerweise 3 (Standard für D&D 5e)
    const level = 3;
    
    const subclassId = `${classId}_${slugify(name)}`;
    
    subclasses.push({
      id: subclassId,
      name,
      description,
      level,
    });
  }
  
  return subclasses;
}

function parseClasses(markdown: string): ClassData[] {
  const classes: ClassData[] = [];
  
  // Split nach Klassen-Abschnitten (## KLASSENNAME)
  const classMatches = markdown.matchAll(/## ([A-ZÄÖÜ][A-ZÄÖÜ]+)\n\n(.*?)(?=\n## |$)/gs);
  
  for (const classMatch of classMatches) {
    const className = classMatch[1].trim();
    const classContent = classMatch[2];
    
    // Extrahiere ID
    const idMatch = classContent.match(/\*\*ID:\*\* `(.+?)`/);
    const id = idMatch ? idMatch[1] : slugify(className);
    
    // Extrahiere Beschreibung
    const descMatch = classContent.match(/### Klassenbeschreibung\n\n(.+?)(?=\n### |$)/s);
    const description = descMatch ? descMatch[1].trim() : undefined;
    
    console.log(`\n📚 Parse Klasse: ${className} (${id})`);
    
    const progression_table = parseProgressionTable(classContent, id);
    console.log(`   📊 Progressionstabelle: ${progression_table.length} Einträge`);
    
    const features = parseFeatures(classContent, id);
    console.log(`   ⚡ Features: ${features.length} Einträge`);
    
    const subclasses = parseSubclasses(classContent, id);
    console.log(`   🎯 Unterklassen: ${subclasses.length} Einträge`);
    
    classes.push({
      id,
      name: className,
      description,
      progression_table,
      features,
      subclasses,
    });
  }
  
  return classes;
}

async function migrateClasses() {
  const dbPath = path.resolve(__dirname, '..', 'dnd-nexus.db');
  const markdownPath = path.resolve(__dirname, '..', 'export_classes.md');
  
  console.log('📖 Lade export_classes.md...');
  const markdown = await fs.readFile(markdownPath, 'utf-8');
  
  console.log('🔍 Parse Klassen-Daten...');
  const classes = parseClasses(markdown);
  console.log(`\n✅ ${classes.length} Klassen gefunden\n`);
  
  console.log('🔌 Verbinde mit Datenbank...');
  const db = new Database(dbPath);
  
  // Stelle sicher, dass Tabellen existieren
  console.log('🔧 Prüfe/Erstelle Tabellen...');
  
  // Core Progression Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS core_progression_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      proficiency_bonus INTEGER NOT NULL,
      feature_names TEXT,
      class_specific_data JSON,
      created_at INTEGER DEFAULT (unixepoch()),
      UNIQUE(class_id, level),
      FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
    );
  `);
  
  // Core Class Features
  db.exec(`
    CREATE TABLE IF NOT EXISTS core_class_features (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      subclass_id TEXT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      level INTEGER NOT NULL,
      feature_type TEXT NOT NULL CHECK(feature_type IN (
        'passive', 'active', 'progression', 'choice', 'reaction', 'bonus_action'
      )),
      effects JSON NOT NULL,
      conditions JSON,
      uses_per_rest TEXT,
      rest_type TEXT CHECK(rest_type IN ('short', 'long', NULL)),
      created_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
    );
  `);
  
  // Core Subclasses
  db.exec(`
    CREATE TABLE IF NOT EXISTS core_subclasses (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      level INTEGER NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
    );
  `);
  
  // Indizes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_core_progression_class_level ON core_progression_tables(class_id, level);
    CREATE INDEX IF NOT EXISTS idx_core_features_class_level ON core_class_features(class_id, level);
    CREATE INDEX IF NOT EXISTS idx_core_features_subclass ON core_class_features(subclass_id);
    CREATE INDEX IF NOT EXISTS idx_core_subclasses_class ON core_subclasses(class_id);
  `);
  
  // Beginne Transaktion
  const transaction = db.transaction(() => {
    let progressionCount = 0;
    let featuresCount = 0;
    let subclassesCount = 0;
    
    for (const classData of classes) {
      console.log(`\n📦 Migriere: ${classData.name}`);
      
      // Migriere Progression Tables
      for (const row of classData.progression_table) {
        db.prepare(`
          INSERT OR REPLACE INTO core_progression_tables 
          (class_id, level, proficiency_bonus, feature_names, class_specific_data)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          classData.id,
          row.level,
          row.proficiency_bonus,
          JSON.stringify(row.feature_names),
          JSON.stringify(row.class_specific_data)
        );
        progressionCount++;
      }
      console.log(`   ✅ ${classData.progression_table.length} Progression-Tabellen-Einträge`);
      
      // Migriere Features
      for (const feature of classData.features) {
        db.prepare(`
          INSERT OR REPLACE INTO core_class_features 
          (id, class_id, name, description, level, feature_type, effects, conditions, uses_per_rest, rest_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          feature.id,
          classData.id,
          feature.name,
          feature.description,
          feature.level,
          feature.feature_type,
          JSON.stringify(feature.effects),
          feature.conditions ? JSON.stringify(feature.conditions) : null,
          typeof feature.uses_per_rest === 'number' ? feature.uses_per_rest.toString() : feature.uses_per_rest || null,
          feature.rest_type || null
        );
        featuresCount++;
      }
      console.log(`   ✅ ${classData.features.length} Features`);
      
      // Migriere Subclasses
      for (const subclass of classData.subclasses) {
        db.prepare(`
          INSERT OR REPLACE INTO core_subclasses 
          (id, class_id, name, description, level)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          subclass.id,
          classData.id,
          subclass.name,
          subclass.description,
          subclass.level
        );
        subclassesCount++;
      }
      console.log(`   ✅ ${classData.subclasses.length} Unterklassen`);
    }
    
    return { progressionCount, featuresCount, subclassesCount };
  });
  
  const result = transaction();
  
  console.log(`\n📊 Migration abgeschlossen:`);
  console.log(`   ✅ Progression Tables: ${result.progressionCount}`);
  console.log(`   ✅ Features: ${result.featuresCount}`);
  console.log(`   ✅ Unterklassen: ${result.subclassesCount}`);
  
  db.close();
}

// Ausführen
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate-class-features.ts')) {
  migrateClasses().catch(console.error);
}
