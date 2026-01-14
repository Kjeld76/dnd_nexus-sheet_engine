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

function analyzeBackgroundsTable(): BackgroundAnalysis {
  console.log('🔍 Analysiere backgrounds-Tabelle...\n');

  // 1. Schema-Struktur
  const columns = db.pragma('table_info(core_backgrounds)');
  
  console.log('📋 Aktuelle Spalten:');
  columns.forEach((col: any) => {
    console.log(`   - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}`);
  });

  // 2. Beispiel-Daten (erste 5 Einträge)
  const sampleData = db.prepare(`
    SELECT id, name, data, LENGTH(data) as data_len 
    FROM core_backgrounds 
    ORDER BY name 
    LIMIT 5
  `).all();

  console.log('\n📄 Beispiel-Datensätze:');
  sampleData.forEach((bg: any, idx: number) => {
    console.log(`\n   Background ${idx + 1}: ${bg.name} (${bg.id})`);
    console.log(`   Datenlänge: ${bg.data_len} Zeichen`);
    
    try {
      const data = JSON.parse(bg.data);
      console.log('   Inhalt:');
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val === 'string' && val.length > 100) {
          console.log(`      ${key}: ${val.substring(0, 80)}... (${val.length} Zeichen)`);
        } else if (Array.isArray(val)) {
          console.log(`      ${key}: [${val.length} Items] ${JSON.stringify(val.slice(0, 3))}${val.length > 3 ? '...' : ''}`);
        } else {
          console.log(`      ${key}: ${JSON.stringify(val)}`);
        }
      });
    } catch (e) {
      console.log(`   ⚠️  Daten nicht als JSON parsebar: ${e}`);
    }
  });

  // 3. Identifiziere fehlende Standard-Felder
  const expectedFields = [
    'short_description',
    'full_description',
    'feature_name',
    'feature_description',
    'skill_proficiency_ids',
    'tool_proficiency_ids',
    'starting_equipment',
    'source',
    'page'
  ];

  const existingColumns = columns.map((col: any) => col.name);
  const missingFields = expectedFields.filter(field => !existingColumns.includes(field));

  console.log('\n⚠️  Fehlende Felder (normalisierte Spalten):');
  if (missingFields.length === 0) {
    console.log('   Alle empfohlenen Felder vorhanden (aber aktuell im JSON data-Feld)');
  } else {
    missingFields.forEach(field => {
      console.log(`   - ${field}`);
    });
  }

  // 4. Empfehlungen
  const recommendations: string[] = [];

  const allBackgrounds = db.prepare('SELECT * FROM core_backgrounds').all();
  const avgDataLength = allBackgrounds.reduce((sum: number, bg: any) => sum + (bg.data?.length || 0), 0) / allBackgrounds.length;
  
  if (avgDataLength < 500) {
    recommendations.push('Beschreibungen erscheinen zu kurz - vollständige Regelwerk-Texte fehlen');
  }
  
  recommendations.push('Alle Daten sind im JSON data-Feld - keine normalisierten Spalten');
  recommendations.push('Keine Relationen-Tabellen für Skills, Tools, Equipment');
  recommendations.push('Keine Foreign Keys zu skills, tools, feats, items Tabellen');

  console.log('\n💡 Empfehlungen:');
  recommendations.forEach((rec, idx) => {
    console.log(`   ${idx + 1}. ${rec}`);
  });

  // 5. Prüfe existierende Relationen
  console.log('\n🔗 Existierende Foreign Keys:');
  const foreignKeys = db.pragma('foreign_key_list(core_backgrounds)');
  if (foreignKeys.length === 0) {
    console.log('   ⚠️  Keine Foreign Keys definiert!');
  } else {
    foreignKeys.forEach((fk: any) => {
      console.log(`   - ${fk.from} → ${fk.table}.${fk.to}`);
    });
  }

  // 6. Prüfe verwandte Tabellen
  console.log('\n📊 Verwandte Tabellen:');
  const relatedTables = ['core_skills', 'core_tools', 'core_feats', 'core_gear'];
  const existingTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
  `).all().map((t: any) => t.name);

  relatedTables.forEach(table => {
    if (existingTables.includes(table)) {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      console.log(`   ✓ ${table}: ${count} Einträge`);
    } else {
      console.log(`   ✗ ${table}: Tabelle existiert nicht`);
    }
  });

  const analysis: BackgroundAnalysis = {
    tableName: 'core_backgrounds',
    columns: columns.map((col: any) => ({
      name: col.name,
      type: col.type,
      notNull: col.notnull === 1,
      defaultValue: col.dflt_value
    })),
    sampleData: sampleData.slice(0, 3),
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

// Hauptausführung
console.log('═'.repeat(80));
console.log('D&D NEXUS - BACKGROUND SYSTEM ANALYSE');
console.log('═'.repeat(80) + '\n');

try {
  analyzeBackgroundsTable();
  
  console.log('\n' + '═'.repeat(80));
  console.log('Nächste Schritte:');
  console.log('1. Prüfe analysis-backgrounds.json für Details');
  console.log('2. Entscheide ob Schema-Migration nötig ist');
  console.log('3. Führe ggf. create-background-schema-migration.ts aus');
  console.log('═'.repeat(80) + '\n');
  
} catch (error) {
  console.error('\n❌ FEHLER:', error);
  process.exit(1);
} finally {
  db.close();
}
