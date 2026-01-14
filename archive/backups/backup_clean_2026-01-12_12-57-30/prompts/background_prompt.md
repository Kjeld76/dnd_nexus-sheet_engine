# Prompt für Cursor Agent: Background-System Analyse & Optimierung

## Kontext & Zielsetzung

Du arbeitest mit der SQLite-Datenbank `dnd-nexus.db` für ein D&D 5e Character Management System. Die **Backgrounds (Herkünfte)** sind derzeit unvollständig implementiert:

**Aktuelle Probleme:**
1. Beschreibungen im Kompendium sind zu kurz und entsprechen nicht dem vollständigen Regelwerk-Text
2. Gewährte Vorteile (Attributswerte, Talente, Fertigkeiten-Proficiencies, Werkzeug-Proficiencies, Ausrüstung) werden nicht im Eigenschaften-Fenster angezeigt
3. Keine strukturellen Verknüpfungen zu bestehenden Tabellen (features, skills, proficiencies, items, equipment)

**Deine Aufgabe:**
1. Analysiere die aktuelle `backgrounds`-Tabelle und deren Datenstruktur
2. Identifiziere fehlende Datenfelder und unvollständige Beschreibungen
3. Erstelle ein optimiertes Schema mit vollständigen Relationen
4. Implementiere Migrations-Scripts zur Daten-Vervollständigung
5. Stelle strukturelle Verknüpfungen zu allen relevanten Tabellen her

## Phase 1: Ist-Analyse der Backgrounds-Tabelle

```typescript
// scripts/analyze-backgrounds-current.ts

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./dnd-nexus.db');

interface BackgroundAnalysis {
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    notNull: boolean;
    defaultValue: any;
  }>;
  sampleData: any[];
  missingFields: string[];
  recommendations: string[];
}

/**
 * Analysiere die aktuelle Backgrounds-Tabelle
 */
function analyzeBackgroundsTable(): BackgroundAnalysis {
  console.log('🔍 Analysiere backgrounds-Tabelle...\n');

  // 1. Schema-Struktur
  const columns = db.pragma('table_info(backgrounds)');
  
  console.log('📋 Aktuelle Spalten:');
  columns.forEach((col: any) => {
    console.log(`   - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}`);
  });

  // 2. Beispiel-Daten (erste 3 Einträge)
  const sampleData = db.prepare(`
    SELECT * FROM backgrounds LIMIT 3
  `).all();

  console.log('\n📄 Beispiel-Datensätze:');
  sampleData.forEach((bg: any, idx: number) => {
    console.log(`\n   Background ${idx + 1}:`);
    console.log(`   ID: ${bg.id}`);
    console.log(`   Name: ${bg.name || 'N/A'}`);
    
    // Prüfe Beschreibungslänge
    const descField = bg.description || bg.desc || bg.text || bg.flavor_text;
    if (descField) {
      console.log(`   Beschreibung: ${descField.length} Zeichen`);
      if (descField.length < 200) {
        console.log(`   ⚠️  Beschreibung erscheint zu kurz!`);
      }
    } else {
      console.log(`   ⚠️  Keine Beschreibung gefunden!`);
    }

    // Prüfe auf Vorteil-Felder
    const benefitFields = [
      'feature', 'feature_id', 'skill_proficiencies', 'tool_proficiencies',
      'languages', 'equipment', 'starting_equipment', 'attribute_bonuses'
    ];
    
    console.log('   Vorteile:');
    benefitFields.forEach(field => {
      if (bg[field]) {
        console.log(`      ✓ ${field}: ${typeof bg[field] === 'string' ? bg[field].substring(0, 50) : bg[field]}`);
      } else {
        console.log(`      ✗ ${field}: nicht vorhanden`);
      }
    });
  });

  // 3. Identifiziere fehlende Standard-Felder
  const expectedFields = [
    // Basis-Info
    'id', 'name', 'source', 'page',
    
    // Vollständige Beschreibungen
    'description', // Kurz-Beschreibung für Kompendium
    'full_description', // Vollständiger Regelwerk-Text
    'flavor_text', // Flavor/Lore Text
    
    // Gewährtes Feature
    'feature_name',
    'feature_description',
    'feature_id', // FK zu features-Tabelle
    
    // Proficiencies
    'skill_proficiencies', // JSON Array oder komma-separiert
    'tool_proficiencies',
    'language_count', // Anzahl wählbarer Sprachen
    'language_options', // JSON Array verfügbarer Sprachen
    
    // Attribute (falls Background Boni gibt)
    'ability_score_increases', // JSON: {str: 1, dex: 1} oder NULL
    
    // Ausrüstung
    'starting_equipment', // JSON Array von Equipment-IDs
    'equipment_option_a', // JSON für Wahl A
    'equipment_option_b', // JSON für Wahl B
    'starting_gold', // Alternative zu Equipment
    
    // Persönlichkeits-Traits (optional aber nützlich)
    'personality_traits', // JSON Array
    'ideals',
    'bonds',
    'flaws',
    
    // Varianten
    'variants', // JSON Array von Varianten-Namen
    
    // Metadaten
    'created_at',
    'updated_at'
  ];

  const existingColumns = columns.map((col: any) => col.name);
  const missingFields = expectedFields.filter(field => !existingColumns.includes(field));

  console.log('\n⚠️  Fehlende Felder:');
  missingFields.forEach(field => {
    console.log(`   - ${field}`);
  });

  // 4. Empfehlungen
  const recommendations: string[] = [];

  if (missingFields.includes('full_description')) {
    recommendations.push('Füge "full_description" für vollständige Regelwerk-Texte hinzu');
  }
  if (missingFields.includes('feature_id')) {
    recommendations.push('Erstelle Foreign Key "feature_id" zur features-Tabelle');
  }
  if (missingFields.includes('skill_proficiencies')) {
    recommendations.push('Füge strukturierte "skill_proficiencies" hinzu (JSON oder Relationen-Tabelle)');
  }
  if (missingFields.includes('starting_equipment')) {
    recommendations.push('Füge strukturierte Ausrüstungs-Felder hinzu');
  }

  console.log('\n💡 Empfehlungen:');
  recommendations.forEach((rec, idx) => {
    console.log(`   ${idx + 1}. ${rec}`);
  });

  // 5. Prüfe existierende Relationen
  console.log('\n🔗 Existierende Foreign Keys:');
  const foreignKeys = db.pragma('foreign_key_list(backgrounds)');
  if (foreignKeys.length === 0) {
    console.log('   ⚠️  Keine Foreign Keys definiert!');
  } else {
    foreignKeys.forEach((fk: any) => {
      console.log(`   - ${fk.from} → ${fk.table}.${fk.to}`);
    });
  }

  const analysis: BackgroundAnalysis = {
    tableName: 'backgrounds',
    columns: columns.map((col: any) => ({
      name: col.name,
      type: col.type,
      notNull: col.notnull === 1,
      defaultValue: col.dflt_value
    })),
    sampleData,
    missingFields,
    recommendations
  };

  // Speichere Analyse
  fs.writeFileSync(
    './analysis-backgrounds.json',
    JSON.stringify(analysis, null, 2)
  );

  console.log('\n✅ Analyse abgeschlossen → analysis-backgrounds.json');

  return analysis;
}

// Zusätzlich: Prüfe verwandte Tabellen
function analyzeRelatedTables() {
  console.log('\n\n📊 Analysiere verwandte Tabellen...\n');

  const relatedTables = [
    'features',
    'skills', 
    'proficiencies',
    'items',
    'equipment',
    'tools',
    'languages'
  ];

  const existingTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
  `).all().map((t: any) => t.name);

  relatedTables.forEach(table => {
    if (existingTables.includes(table)) {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      const columns = db.pragma(`table_info(${table})`);
      const pkField = columns.find((c: any) => c.pk === 1)?.name || 'id';
      const nameField = columns.find((c: any) => 
        ['name', 'title', 'label'].includes(c.name.toLowerCase())
      )?.name;

      console.log(`✓ ${table}:`);
      console.log(`   Einträge: ${count}`);
      console.log(`   Primary Key: ${pkField}`);
      console.log(`   Name-Feld: ${nameField || 'nicht gefunden'}`);

      // Zeige Beispiel-Namen
      if (nameField && count > 0) {
        const samples = db.prepare(`
          SELECT ${nameField} FROM ${table} LIMIT 5
        `).all();
        console.log(`   Beispiele: ${samples.map((s: any) => s[nameField]).join(', ')}`);
      }
    } else {
      console.log(`✗ ${table}: Tabelle existiert nicht`);
    }
    console.log();
  });
}

// Hauptausführung
console.log('═'.repeat(80));
console.log('D&D NEXUS - BACKGROUND SYSTEM ANALYSE');
console.log('═'.repeat(80) + '\n');

analyzeBackgroundsTable();
analyzeRelatedTables();

console.log('\n' + '═'.repeat(80));
console.log('Nächste Schritte: Führe create-background-schema-migration.ts aus');
console.log('═'.repeat(80));
```

## Phase 2: Optimiertes Schema erstellen

```typescript
// scripts/create-background-schema-migration.ts

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./dnd-nexus.db');

/**
 * Erstelle oder erweitere die backgrounds-Tabelle mit vollständigem Schema
 */
function createOptimizedBackgroundSchema() {
  console.log('🔨 Erstelle optimiertes Background-Schema...\n');

  // 1. Backup der alten Tabelle (falls existiert)
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='backgrounds'
  `).get();

  if (tableExists) {
    console.log('📦 Erstelle Backup der bestehenden Tabelle...');
    db.exec(`
      DROP TABLE IF EXISTS backgrounds_backup;
      CREATE TABLE backgrounds_backup AS SELECT * FROM backgrounds;
    `);
    console.log('✓ Backup erstellt: backgrounds_backup\n');
  }

  // 2. Erstelle neue, optimierte Struktur
  console.log('🏗️  Erstelle neue Tabellen-Struktur...\n');

  db.exec(`
    -- Haupt-Backgrounds Tabelle
    CREATE TABLE IF NOT EXISTS backgrounds_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      source TEXT, -- z.B. "Player's Handbook", "Xanathar's Guide"
      page INTEGER,
      
      -- Beschreibungen
      short_description TEXT, -- Kurz für Listen/Kompendium (1-2 Sätze)
      full_description TEXT, -- Vollständiger Regelwerk-Text
      flavor_text TEXT, -- Lore/Hintergrund-Story
      
      -- Gewährtes Feature (Background Feature)
      feature_name TEXT,
      feature_description TEXT,
      feature_id TEXT, -- FK zu features (wenn dort vorhanden)
      
      -- Proficiencies (strukturiert)
      skill_proficiency_ids TEXT, -- JSON Array: ["athletics", "perception"]
      skill_proficiency_count INTEGER DEFAULT 2, -- Anzahl wählbarer Skills
      tool_proficiency_ids TEXT, -- JSON Array von Tool-IDs
      
      -- Sprachen
      language_count INTEGER DEFAULT 0, -- Anzahl wählbarer Sprachen
      language_options TEXT, -- JSON Array: ["Common", "Elvish", ...]
      
      -- Attributs-Boni (selten, aber manche Backgrounds geben welche)
      ability_score_increases TEXT, -- JSON: {"strength": 1, "intelligence": 1}
      
      -- Ausrüstung
      starting_equipment TEXT, -- JSON Array von Equipment-Objekten
      equipment_choice_a TEXT, -- JSON für Ausrüstungs-Option A
      equipment_choice_b TEXT, -- JSON für Ausrüstungs-Option B
      starting_gold_gp INTEGER, -- Alternative zu fixer Ausrüstung
      
      -- Persönlichkeits-Optionen
      personality_traits TEXT, -- JSON Array von Trait-Optionen
      ideals TEXT, -- JSON Array von Ideal-Optionen
      bonds TEXT, -- JSON Array von Bond-Optionen
      flaws TEXT, -- JSON Array von Flaw-Optionen
      
      -- Varianten
      is_variant BOOLEAN DEFAULT 0,
      variant_of_id TEXT, -- FK zu parent background
      variants TEXT, -- JSON Array von Varianten-IDs
      
      -- Metadaten
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE SET NULL,
      FOREIGN KEY (variant_of_id) REFERENCES backgrounds_new(id) ON DELETE CASCADE
    );

    -- Index für Performance
    CREATE INDEX IF NOT EXISTS idx_backgrounds_source ON backgrounds_new(source);
    CREATE INDEX IF NOT EXISTS idx_backgrounds_feature ON backgrounds_new(feature_id);
    CREATE INDEX IF NOT EXISTS idx_backgrounds_variant ON backgrounds_new(variant_of_id);
  `);

  console.log('✓ Haupt-Tabelle erstellt: backgrounds_new\n');

  // 3. Erstelle Relationen-Tabellen für Many-to-Many Beziehungen
  console.log('🔗 Erstelle Relationen-Tabellen...\n');

  db.exec(`
    -- Background → Skills (Many-to-Many)
    CREATE TABLE IF NOT EXISTS background_skill_proficiencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      background_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      is_choice BOOLEAN DEFAULT 0, -- TRUE wenn wählbar, FALSE wenn fix
      choice_group INTEGER, -- Gruppierung für "wähle 2 aus diesen"
      
      FOREIGN KEY (background_id) REFERENCES backgrounds_new(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(background_id, skill_id)
    );

    -- Background → Tool Proficiencies (Many-to-Many)
    CREATE TABLE IF NOT EXISTS background_tool_proficiencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      background_id TEXT NOT NULL,
      tool_id TEXT NOT NULL,
      is_choice BOOLEAN DEFAULT 0,
      choice_group INTEGER,
      
      FOREIGN KEY (background_id) REFERENCES backgrounds_new(id) ON DELETE CASCADE,
      FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
      UNIQUE(background_id, tool_id)
    );

    -- Background → Starting Equipment (Many-to-Many mit Quantity)
    CREATE TABLE IF NOT EXISTS background_starting_equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      background_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      is_choice_a BOOLEAN DEFAULT 0, -- Teil von Auswahl A
      is_choice_b BOOLEAN DEFAULT 0, -- Teil von Auswahl B
      choice_group INTEGER, -- Für "wähle eins aus..."
      
      FOREIGN KEY (background_id) REFERENCES backgrounds_new(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    -- Indices für Performance
    CREATE INDEX IF NOT EXISTS idx_bg_skills_bg ON background_skill_proficiencies(background_id);
    CREATE INDEX IF NOT EXISTS idx_bg_skills_skill ON background_skill_proficiencies(skill_id);
    CREATE INDEX IF NOT EXISTS idx_bg_tools_bg ON background_tool_proficiencies(background_id);
    CREATE INDEX IF NOT EXISTS idx_bg_equipment_bg ON background_starting_equipment(background_id);
  `);

  console.log('✓ Relationen-Tabellen erstellt\n');

  // 4. Migriere existierende Daten (falls vorhanden)
  if (tableExists) {
    console.log('📦 Migriere bestehende Daten...\n');
    migrateExistingData();
  }

  console.log('✅ Schema-Migration abgeschlossen!\n');
}

/**
 * Migriere Daten von alter zu neuer Struktur
 */
function migrateExistingData() {
  const oldData = db.prepare('SELECT * FROM backgrounds_backup').all();
  
  console.log(`   Migriere ${oldData.length} Backgrounds...`);

  const insert = db.prepare(`
    INSERT INTO backgrounds_new (
      id, name, source, page,
      short_description, full_description, feature_name, feature_description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let migrated = 0;
  let errors = 0;

  for (const old of oldData) {
    try {
      insert.run(
        old.id,
        old.name,
        old.source || null,
        old.page || null,
        old.description || old.short_description || null,
        old.full_description || old.description || null,
        old.feature_name || old.feature || null,
        old.feature_description || old.feature_desc || null
      );
      migrated++;
    } catch (err) {
      console.error(`   ✗ Fehler bei ${old.name}:`, err.message);
      errors++;
    }
  }

  console.log(`   ✓ ${migrated} erfolgreich, ${errors} Fehler\n`);

  // Ersetze alte Tabelle
  if (errors === 0) {
    console.log('   Ersetze alte Tabelle...');
    db.exec(`
      DROP TABLE backgrounds;
      ALTER TABLE backgrounds_new RENAME TO backgrounds;
    `);
    console.log('   ✓ Tabelle ersetzt\n');
  } else {
    console.log('   ⚠️  Fehler beim Migrieren - alte Tabelle bleibt bestehen');
    console.log('   Prüfe Daten und führe manuell aus: DROP TABLE backgrounds; ALTER TABLE backgrounds_new RENAME TO backgrounds;\n');
  }
}

/**
 * Erstelle Views für einfachere Queries
 */
function createBackgroundViews() {
  console.log('👁️  Erstelle Helper-Views...\n');

  db.exec(`
    -- View: Vollständige Background-Info mit allen Proficiencies
    CREATE VIEW IF NOT EXISTS v_backgrounds_complete AS
    SELECT 
      b.*,
      
      -- Aggregiere Skills
      (
        SELECT GROUP_CONCAT(s.name, ', ')
        FROM background_skill_proficiencies bsp
        JOIN skills s ON s.id = bsp.skill_id
        WHERE bsp.background_id = b.id AND bsp.is_choice = 0
      ) as fixed_skill_proficiencies,
      
      (
        SELECT GROUP_CONCAT(s.name, ', ')
        FROM background_skill_proficiencies bsp
        JOIN skills s ON s.id = bsp.skill_id
        WHERE bsp.background_id = b.id AND bsp.is_choice = 1
      ) as choice_skill_proficiencies,
      
      -- Aggregiere Tools
      (
        SELECT GROUP_CONCAT(t.name, ', ')
        FROM background_tool_proficiencies btp
        JOIN tools t ON t.id = btp.tool_id
        WHERE btp.background_id = b.id
      ) as tool_proficiencies,
      
      -- Aggregiere Equipment
      (
        SELECT GROUP_CONCAT(i.name || ' (x' || bse.quantity || ')', ', ')
        FROM background_starting_equipment bse
        JOIN items i ON i.id = bse.item_id
        WHERE bse.background_id = b.id 
          AND bse.is_choice_a = 0 
          AND bse.is_choice_b = 0
      ) as standard_equipment
      
    FROM backgrounds b;
  `);

  console.log('✓ View erstellt: v_backgrounds_complete\n');
}

// Hauptausführung
console.log('═'.repeat(80));
console.log('D&D NEXUS - BACKGROUND SCHEMA MIGRATION');
console.log('═'.repeat(80) + '\n');

try {
  createOptimizedBackgroundSchema();
  createBackgroundViews();
  
  console.log('═'.repeat(80));
  console.log('✅ MIGRATION ERFOLGREICH');
  console.log('═'.repeat(80));
  console.log('\nNächste Schritte:');
  console.log('1. Führe populate-background-data.ts aus, um Daten zu vervollständigen');
  console.log('2. Führe link-background-relations.ts aus, um Relationen herzustellen');
  console.log('═'.repeat(80) + '\n');
  
} catch (error) {
  console.error('\n❌ FEHLER:', error);
  process.exit(1);
}
```

## Phase 3: Daten-Vervollständigung aus Regelwerken

```typescript
// scripts/populate-background-data.ts

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./dnd-nexus.db');

/**
 * WICHTIG: Dieser Script erwartet, dass die Regelwerk-Daten
 * bereits in der Datenbank vorhanden sind (z.B. aus einem Import).
 * 
 * Falls Daten fehlen, müssen diese MANUELL aus den Regelwerken
 * eingepflegt werden - KEINE ERFUNDENEN DATEN!
 */

interface BackgroundData {
  id: string;
  name: string;
  fullDescription?: string;
  featureDescription?: string;
  skillProficiencies?: string[];
  toolProficiencies?: string[];
  equipment?: Array<{
    itemName: string;
    quantity: number;
    isChoiceA?: boolean;
    isChoiceB?: boolean;
  }>;
}

/**
 * Identifiziere Backgrounds mit unvollständigen Daten
 */
function findIncompleteBackgrounds() {
  console.log('🔍 Suche unvollständige Backgrounds...\n');

  const incomplete = db.prepare(`
    SELECT 
      id,
      name,
      CASE 
        WHEN full_description IS NULL OR LENGTH(full_description) < 200 THEN 1 
        ELSE 0 
      END as missing_description,
      CASE 
        WHEN feature_description IS NULL OR LENGTH(feature_description) < 50 THEN 1 
        ELSE 0 
      END as missing_feature,
      (
        SELECT COUNT(*) 
        FROM background_skill_proficiencies 
        WHERE background_id = backgrounds.id
      ) as skill_count,
      (
        SELECT COUNT(*) 
        FROM background_starting_equipment 
        WHERE background_id = backgrounds.id
      ) as equipment_count
    FROM backgrounds
    WHERE missing_description = 1 
       OR missing_feature = 1 
       OR skill_count = 0 
       OR equipment_count = 0
  `).all();

  console.log(`📋 Gefunden: ${incomplete.length} unvollständige Backgrounds\n`);

  incomplete.forEach((bg: any) => {
    console.log(`\n${bg.name} (${bg.id}):`);
    if (bg.missing_description) console.log('   ⚠️  Beschreibung fehlt/zu kurz');
    if (bg.missing_feature) console.log('   ⚠️  Feature-Beschreibung fehlt/zu kurz');
    if (bg.skill_count === 0) console.log('   ⚠️  Keine Skill-Proficiencies');
    if (bg.equipment_count === 0) console.log('   ⚠️  Keine Ausrüstung');
  });

  // Erstelle Template-Datei für manuelle Befüllung
  const template = incomplete.map((bg: any) => ({
    id: bg.id,
    name: bg.name,
    full_description: "TODO: Vollständige Beschreibung aus Regelwerk einfügen",
    feature_name: "TODO: Feature-Name",
    feature_description: "TODO: Feature-Beschreibung aus Regelwerk",
    skill_proficiencies: ["TODO: skill_id_1", "TODO: skill_id_2"],
    tool_proficiencies: ["TODO: tool_id"],
    starting_equipment: [
      { item_name: "TODO", quantity: 1 }
    ]
  }));

  fs.writeFileSync(
    './background-data-template.json',
    JSON.stringify(template, null, 2)
  );

  console.log('\n📄 Template erstellt: background-data-template.json');
  console.log('   → Fülle diese Datei mit Regelwerk-Daten und führe dann update-backgrounds.ts aus\n');

  return incomplete;
}

/**
 * Update Backgrounds aus JSON-Datei
 */
function updateBackgroundsFromJSON(jsonPath: string) {
  console.log(`📥 Lade Daten aus ${jsonPath}...\n`);

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Datei nicht gefunden: ${jsonPath}`);
    return;
  }

  const data: BackgroundData[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log(`📦 Verarbeite ${data.length} Backgrounds...\n`);

  let updated = 0;
  let errors = 0;

  const updateBg = db.prepare(`
    UPDATE backgrounds 
    SET 
      full_description = ?,
      feature_description = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const insertSkill = db.prepare(`
    INSERT OR IGNORE INTO background_skill_proficiencies (background_id, skill_id)
    VALUES (?, ?)
  `);

  const insertTool = db.prepare(`
    INSERT OR IGNORE INTO background_tool_proficiencies (background_id, tool_id)
    VALUES (?, ?)
  `);

  const insertEquipment = db.prepare(`
    INSERT OR IGNORE INTO background_starting_equipment 
    (background_id, item_id, quantity, is_choice_a, is_choice_b)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const bgData of data) {
    try {
      // Update Basis-Daten
      if (bgData.fullDescription || bgData.featureDescription) {
        updateBg.run(
          bgData.fullDescription || null,
          bgData.featureDescription || null,
          bgData.id
        );
      }

      // Füge Skills hinzu
      if (bgData.skillProficiencies) {
        for (const skillId of bgData.skillProficiencies) {
          if (skillId.startsWith('TODO')) continue;
          
          // Prüfe ob Skill existiert
          const skillExists = db.prepare('SELECT id FROM skills WHERE id = ?').get(skillId);
          if (skillExists) {
            insertSkill.run(bgData.id, skillId);
          } else {
            console.warn(`   ⚠️  Skill nicht gefunden: ${skillId}`);
          }
        }
      }

      // Füge Tools hinzu
      if (bgData.toolProficiencies) {
        for (const toolId of bgData.toolProficiencies) {
          if (toolId.startsWith('TODO')) continue;
          
          const toolExists = db.prepare('SELECT id FROM tools WHERE id = ?').get(toolId);
          if (toolExists) {
            insertTool.run(bgData.id, toolId);
          } else {
            console.warn(`   ⚠️  Tool nicht gefunden: ${toolId}`);
          }
        }
      }

      // Füge Equipment hinzu
      if (bgData.equipment) {
        for (const eq of bgData.equipment) {
          if (eq.itemName.startsWith('TODO')) continue;
          
          // Suche Item nach Name
          const item = db.prepare('SELECT id FROM items WHERE name = ?').get(eq.itemName);
          if (item) {
            insertEquipment.run(
              bgData.id,
              item.id,
              eq.quantity || 1,
              eq.isChoiceA ? 1 : 0,
              eq.isChoiceB ? 1 : 0
            );
          } else {
            console.warn(`   ⚠️  Item nicht gefunden: ${eq.itemName}`);
          }
        }
      }

      console.log(`✓ ${bgData.name}`);
      updated++;

    } catch (err) {
      console.error(`✗ Fehler bei ${bgData.name}:`, err.message);
      errors++;
    }
  }

  console.log(`\n✅ Update abgeschlossen: ${updated} erfolgreich, ${errors} Fehler\n`);
}

// Hauptausführung
console.log('═'.repeat(80));
console.log('D&D NEXUS - BACKGROUND DATEN-VERVOLLSTÄNDIGUNG');
console.log('═'.repeat(80) + '\n');

const args = process.argv.slice(2);

if (args.length === 0) {
  // Keine Argumente: Analysiere und erstelle Template
  findIncompleteBackgrounds();
  
  console.log('═'.repeat(80));
  console.log('NÄCHSTE SCHRITTE:');
  console.log('1. Öffne background-data-template.json');
  console.log('2. Fülle die Daten aus den D&D 5e Regelwerken ein');
  console.log('3. Führe aus: npx tsx populate-background-data
  .ts background-data-template.json');
  console.log('═'.repeat(80) + '\n');
  
} else {
  // Mit JSON-Datei: Update Daten
  const jsonPath = args[0];
  updateBackgroundsFromJSON(jsonPath);
  
  console.log('═'.repeat(80));
  console.log('✅ DATEN AKTUALISIERT');
  console.log('═'.repeat(80) + '\n');
}
```

## Phase 4: Automatische Relationen-Verknüpfung

```typescript
// scripts/link-background-relations.ts

import Database from 'better-sqlite3';

const db = new Database('./dnd-nexus.db');

/**
 * Erstelle Relationen zu entity_relations Tabelle
 */
function linkBackgroundRelations() {
  console.log('🔗 Erstelle Background-Relationen...\n');

  // 1. Background → Skills
  console.log('📋 Verknüpfe Skills...');
  const skillLinks = db.prepare(`
    INSERT OR IGNORE INTO entity_relations (
      source_table, source_id, source_field,
      target_table, target_id, target_name,
      relation_type, detection_method, confidence, is_structural
    )
    SELECT 
      'backgrounds' as source_table,
      bsp.background_id as source_id,
      'skill_proficiencies' as source_field,
      'skills' as target_table,
      bsp.skill_id as target_id,
      s.name as target_name,
      'grants' as relation_type,
      'foreign_key' as detection_method,
      1.0 as confidence,
      1 as is_structural
    FROM background_skill_proficiencies bsp
    JOIN skills s ON s.id = bsp.skill_id
  `).run();
  console.log(`   ✓ ${skillLinks.changes} Skill-Relationen\n`);

  // 2. Background → Tools
  console.log('🔧 Verknüpfe Tools...');
  const toolLinks = db.prepare(`
    INSERT OR IGNORE INTO entity_relations (
      source_table, source_id, source_field,
      target_table, target_id, target_name,
      relation_type, detection_method, confidence, is_structural
    )
    SELECT 
      'backgrounds',
      btp.background_id,
      'tool_proficiencies',
      'tools',
      btp.tool_id,
      t.name,
      'grants',
      'foreign_key',
      1.0,
      1
    FROM background_tool_proficiencies btp
    JOIN tools t ON t.id = btp.tool_id
  `).run();
  console.log(`   ✓ ${toolLinks.changes} Tool-Relationen\n`);

  // 3. Background → Equipment
  console.log('🎒 Verknüpfe Equipment...');
  const equipmentLinks = db.prepare(`
    INSERT OR IGNORE INTO entity_relations (
      source_table, source_id, source_field,
      target_table, target_id, target_name,
      relation_type, detection_method, confidence, is_structural,
      context_snippet
    )
    SELECT 
      'backgrounds',
      bse.background_id,
      'starting_equipment',
      'items',
      bse.item_id,
      i.name,
      'grants',
      'foreign_key',
      1.0,
      1,
      'Quantity: ' || bse.quantity || 
      CASE 
        WHEN bse.is_choice_a THEN ' (Choice A)'
        WHEN bse.is_choice_b THEN ' (Choice B)'
        ELSE ''
      END as context_snippet
    FROM background_starting_equipment bse
    JOIN items i ON i.id = bse.item_id
  `).run();
  console.log(`   ✓ ${equipmentLinks.changes} Equipment-Relationen\n`);

  // 4. Background → Features
  console.log('⭐ Verknüpfe Features...');
  const featureLinks = db.prepare(`
    INSERT OR IGNORE INTO entity_relations (
      source_table, source_id, source_field,
      target_table, target_id, target_name,
      relation_type, detection_method, confidence, is_structural
    )
    SELECT 
      'backgrounds',
      b.id,
      'feature_id',
      'features',
      b.feature_id,
      f.name,
      'grants',
      'foreign_key',
      1.0,
      1
    FROM backgrounds b
    JOIN features f ON f.id = b.feature_id
    WHERE b.feature_id IS NOT NULL
  `).run();
  console.log(`   ✓ ${featureLinks.changes} Feature-Relationen\n`);

  console.log('✅ Alle Background-Relationen erstellt!\n');
}

/**
 * Validiere Relationen
 */
function validateRelations() {
  console.log('🔍 Validiere Relationen...\n');

  const stats = db.prepare(`
    SELECT 
      target_table,
      relation_type,
      COUNT(*) as count
    FROM entity_relations
    WHERE source_table = 'backgrounds'
    GROUP BY target_table, relation_type
    ORDER BY target_table, count DESC
  `).all();

  console.log('📊 Background-Relationen:');
  stats.forEach((stat: any) => {
    console.log(`   ${stat.target_table} (${stat.relation_type}): ${stat.count}`);
  });

  // Prüfe auf Backgrounds ohne Relationen
  const withoutRelations = db.prepare(`
    SELECT b.id, b.name
    FROM backgrounds b
    WHERE NOT EXISTS (
      SELECT 1 FROM entity_relations er 
      WHERE er.source_table = 'backgrounds' 
      AND er.source_id = b.id
    )
  `).all();

  if (withoutRelations.length > 0) {
    console.log(`\n⚠️  Backgrounds ohne Relationen: ${withoutRelations.length}`);
    withoutRelations.forEach((bg: any) => {
      console.log(`   - ${bg.name} (${bg.id})`);
    });
  } else {
    console.log('\n✓ Alle Backgrounds haben Relationen');
  }

  console.log();
}

// Hauptausführung
console.log('═'.repeat(80));
console.log('D&D NEXUS - BACKGROUND RELATIONEN VERKNÜPFEN');
console.log('═'.repeat(80) + '\n');

try {
  linkBackgroundRelations();
  validateRelations();
  
  console.log('═'.repeat(80));
  console.log('✅ RELATIONEN ERFOLGREICH ERSTELLT');
  console.log('═'.repeat(80) + '\n');
  
} catch (error) {
  console.error('\n❌ FEHLER:', error);
  process.exit(1);
}
```

## Phase 5: Query-Helpers für Frontend

```typescript
// src/lib/queries/backgrounds.ts

import Database from 'better-sqlite3';

const db = new Database('./dnd-nexus.db', { readonly: true });

/**
 * Hole vollständige Background-Daten mit allen Vorteilen
 */
export function getBackgroundComplete(backgroundId: string) {
  const background = db.prepare(`
    SELECT * FROM backgrounds WHERE id = ?
  `).get(backgroundId);

  if (!background) return null;

  // Hole Skills
  const skills = db.prepare(`
    SELECT 
      s.id,
      s.name,
      s.ability_score,
      bsp.is_choice,
      bsp.choice_group
    FROM background_skill_proficiencies bsp
    JOIN skills s ON s.id = bsp.skill_id
    WHERE bsp.background_id = ?
    ORDER BY bsp.is_choice, s.name
  `).all(backgroundId);

  // Hole Tools
  const tools = db.prepare(`
    SELECT 
      t.id,
      t.name,
      t.category,
      btp.is_choice,
      btp.choice_group
    FROM background_tool_proficiencies btp
    JOIN tools t ON t.id = btp.tool_id
    WHERE btp.background_id = ?
    ORDER BY btp.is_choice, t.name
  `).all(backgroundId);

  // Hole Equipment
  const equipment = db.prepare(`
    SELECT 
      i.id,
      i.name,
      i.type,
      bse.quantity,
      bse.is_choice_a,
      bse.is_choice_b,
      bse.choice_group
    FROM background_starting_equipment bse
    JOIN items i ON i.id = bse.item_id
    WHERE bse.background_id = ?
    ORDER BY bse.is_choice_a DESC, bse.is_choice_b DESC, i.name
  `).all(backgroundId);

  // Hole Feature (falls verlinkt)
  let feature = null;
  if (background.feature_id) {
    feature = db.prepare(`
      SELECT * FROM features WHERE id = ?
    `).get(background.feature_id);
  }

  return {
    ...background,
    skills,
    tools,
    equipment,
    feature
  };
}

/**
 * Hole alle Backgrounds für Liste/Auswahl
 */
export function getAllBackgrounds() {
  return db.prepare(`
    SELECT 
      id,
      name,
      short_description,
      source,
      (SELECT COUNT(*) FROM background_skill_proficiencies WHERE background_id = backgrounds.id) as skill_count,
      (SELECT COUNT(*) FROM background_tool_proficiencies WHERE background_id = backgrounds.id) as tool_count
    FROM backgrounds
    ORDER BY name
  `).all();
}
```

## Ausführungsreihenfolge

```bash
# 1. Ist-Analyse
npx tsx scripts/analyze-backgrounds-current.ts

# 2. Schema erstellen/migrieren
npx tsx scripts/create-background-schema-migration.ts

# 3. Daten vervollständigen (erstellt Template)
npx tsx scripts/populate-background-data.ts

# 4. Template ausfüllen mit Regelwerk-Daten
# → Manuell: background-data-template.json bearbeiten

# 5. Daten importieren
npx tsx scripts/populate-background-data.ts background-data-template.json

# 6. Relationen erstellen
npx tsx scripts/link-background-relations.ts
```

## Wichtige Hinweise

⚠️ **KEINE ERFUNDENEN DATEN**: Alle Scripts analysieren nur vorhandene Daten und erstellen Strukturen. Die eigentlichen D&D-Inhalte müssen aus den offiziellen Regelwerken manuell eingepflegt werden.

✅ **Strukturierte Migration**: Die Scripts erstellen eine saubere, relationale Struktur für alle Background-Daten.

🔗 **Vollständige Verlinkung**: Alle Proficiencies, Equipment und Features werden korrekt mit den jeweiligen Tabellen verknüpft.