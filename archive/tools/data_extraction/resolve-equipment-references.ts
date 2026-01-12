import fs from 'fs/promises';
import path from 'path';

interface Item {
  id: string;
  name: string;
  description: string;
  cost_gp: number;
  weight_kg: number;
  category?: string;
  data: any;
}

interface EquipmentItem {
  item_id: string;
  quantity: number;
}

interface Equipment {
  id: string;
  name: string;
  description: string;
  total_cost_gp?: number;
  total_weight_kg?: number;
  items: EquipmentItem[];
  tools?: EquipmentItem[];
  data: any;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (match) => {
      const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
      return map[match] || match;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[äöüß]/g, (match) => {
      const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
      return map[match] || match;
    });
}

// Komposita-Mapping (Equipment Item-ID → tatsächliche Item-ID)
const COMPOSITA_MAPPING: Record<string, string> = {
  'flaschen-oel': 'öl', // Flasche(n) Öl → Öl (ID: öl)
  'flaschen-oe': 'öl',
  'boegen-pergament': 'pergament', // Bögen Pergament → Pergament
  'boegen-papier': 'papier', // Bögen Papier → Papier
  'tagesrationen': 'rationen', // Tagesrationen → Rationen
  'fackeln': 'fackel', // Plural → Singular
  'kerzen': 'kerze', // Plural → Singular
  'kostueme': 'kostuem', // Plural → Singular
  'metallkuegelchen': 'metallkuegelchen', // Bleibt gleich
  'kraehenfuesse': 'kraehenfuesse', // Bleibt gleich
  'karten-oder-schriftrollenbehaelter': 'karte', // Vereinfachen → Karte
  'feine-kleidung': 'kleidung-fein', // → Kleidung, fein
  'abdeckbare-laterne': 'abdeckbare-laterne' // Bleibt gleich (falls vorhanden)
};

// Plural → Singular Mapping (erweitert)
const PLURAL_SINGULAR: Record<string, string> = {
  'fackeln': 'fackel',
  'kerzen': 'kerze',
  'flaschen': 'flasche',
  'boegen': 'bogen',
  'kostueme': 'kostuem',
  'tagesrationen': 'rationen'
};

async function resolveReferences() {
  console.log('🔍 Lade extrahierte Daten...\n');

  const itemsData = JSON.parse(
    await fs.readFile('archive/tools/data_extraction/intermediate_data/items.json', 'utf-8')
  );
  const equipmentData = JSON.parse(
    await fs.readFile('archive/tools/data_extraction/intermediate_data/equipment.json', 'utf-8')
  );

  const items: Item[] = itemsData.items;
  const equipment: Equipment[] = equipmentData.equipment;

  console.log(`✅ ${items.length} Items geladen`);
  console.log(`✅ ${equipment.length} Equipment-Pakete geladen\n`);

  // Erstelle Mappings
  console.log('📋 Erstelle Item-Mappings...\n');
  
  const itemById = new Map<string, Item>();
  const itemByName = new Map<string, Item>();
  const itemBySlug = new Map<string, Item>();
  
  for (const item of items) {
    itemById.set(item.id, item);
    itemByName.set(normalizeName(item.name), item);
    itemBySlug.set(slugify(item.name), item);
    
    // Alternative Namen-Varianten
    const altNames = [
      item.name.toLowerCase().replace(/\s+/g, '-'),
      item.name.toLowerCase().replace(/-/g, ' '),
      item.name.toLowerCase().replace(/\s+/g, '')
    ];
    for (const altName of altNames) {
      if (!itemBySlug.has(altName)) {
        itemBySlug.set(altName, item);
      }
    }
  }

  console.log(`✅ ${itemById.size} Items by ID`);
  console.log(`✅ ${itemByName.size} Items by Name`);
  console.log(`✅ ${itemBySlug.size} Items by Slug\n`);

  // Analysiere Equipment-Referenzen
  console.log('🔍 Analysiere Equipment-Referenzen...\n');
  
  let totalRefs = 0;
  let resolvedRefs = 0;
  let unresolvedRefs = 0;
  const unresolved: Array<{ equipment: string; ref_id: string; quantity: number }> = [];

  for (const eq of equipment) {
    for (const itemRef of eq.items) {
      totalRefs++;
      const refId = itemRef.item_id;
      
      // Versuche, Referenz aufzulösen
      let resolvedItem: Item | undefined = undefined;
      let resolvedRefId = refId;
      
      // 0. Komposita-Mapping
      if (COMPOSITA_MAPPING[refId]) {
        resolvedRefId = COMPOSITA_MAPPING[refId];
      }
      // 0.1. Plural → Singular
      else if (PLURAL_SINGULAR[refId]) {
        resolvedRefId = PLURAL_SINGULAR[refId];
      }
      // 0.2. Einfache Plural-Erkennung (endet auf -en)
      else if (refId.endsWith('en') && refId.length > 4) {
        const singular = refId.slice(0, -2);
        if (itemBySlug.has(singular) || itemById.has(singular)) {
          resolvedRefId = singular;
        }
      }
      
      // 1. Direkte ID-Suche (mit aufgelöster ID)
      if (itemById.has(resolvedRefId)) {
        resolvedItem = itemById.get(resolvedRefId)!;
      }
      // 2. Slug-Suche
      else if (itemBySlug.has(resolvedRefId)) {
        resolvedItem = itemBySlug.get(resolvedRefId)!;
      }
      // 3. Name-Suche (normalisiert)
      else {
        const normalizedRef = normalizeName(resolvedRefId.replace(/-/g, ' '));
        if (itemByName.has(normalizedRef)) {
          resolvedItem = itemByName.get(normalizedRef)!;
        }
      }
      
      // 4. Fallback: Original-RefId nochmal versuchen
      if (!resolvedItem) {
        if (itemById.has(refId)) {
          resolvedItem = itemById.get(refId)!;
        } else if (itemBySlug.has(refId)) {
          resolvedItem = itemBySlug.get(refId)!;
        } else {
          const normalizedRef = normalizeName(refId.replace(/-/g, ' '));
          if (itemByName.has(normalizedRef)) {
            resolvedItem = itemByName.get(normalizedRef)!;
          }
        }
      }

      if (resolvedItem) {
        // Aktualisiere Item-ID
        itemRef.item_id = resolvedItem.id;
        resolvedRefs++;
      } else {
        unresolvedRefs++;
        unresolved.push({
          equipment: eq.name,
          ref_id: refId,
          quantity: itemRef.quantity
        });
      }
    }
  }

  console.log(`📊 Referenz-Auflösung:\n`);
  console.log(`   Gesamt-Referenzen: ${totalRefs}`);
  console.log(`   ✅ Aufgelöst: ${resolvedRefs}`);
  console.log(`   ❌ Nicht aufgelöst: ${unresolvedRefs}\n`);

  if (unresolved.length > 0) {
    console.log(`⚠️  Nicht aufgelöste Referenzen:\n`);
    for (const ref of unresolved.slice(0, 20)) {
      console.log(`   - "${ref.ref_id}" (qty: ${ref.quantity}) in ${ref.equipment}`);
      
      // Zeige ähnliche Item-Namen
      const similar = items
        .filter(item => {
          const itemName = item.name.toLowerCase();
          const refName = ref.ref_id.toLowerCase();
          return itemName.includes(refName) || refName.includes(itemName);
        })
        .slice(0, 3);
      
      if (similar.length > 0) {
        console.log(`     Ähnlich: ${similar.map(i => `"${i.name}" (${i.id})`).join(', ')}`);
      }
    }
    if (unresolved.length > 20) {
      console.log(`   ... und ${unresolved.length - 20} weitere\n`);
    }
  }

  // Speichere korrigierte Equipment-Daten
  const outputDir = 'archive/tools/data_extraction/intermediate_data';
  await fs.writeFile(
    path.join(outputDir, 'equipment_resolved.json'),
    JSON.stringify({ equipment }, null, 2)
  );

  console.log(`\n✅ Korrigierte Equipment-Daten gespeichert:`);
  console.log(`   ${outputDir}/equipment_resolved.json\n`);

  // Statistiken
  console.log('📊 Zusammenfassung:');
  console.log(`   Equipment-Pakete: ${equipment.length}`);
  console.log(`   Referenzen aufgelöst: ${resolvedRefs}/${totalRefs}`);
  if (unresolvedRefs > 0) {
    console.log(`   ⚠️  Nicht aufgelöst: ${unresolvedRefs}`);
  } else {
    console.log(`   ✅ Alle Referenzen aufgelöst!`);
  }
}

resolveReferences().catch(console.error);
