# Migration: Background Starting Equipment - Strukturierte Items

## Kontext

Die `starting_equipment` Items in der `core_backgrounds` Tabelle wurden von einfachen Strings zu strukturierten Objekten migriert, um Mengenangaben, Einheiten und Varianten programmatisch auswerten zu können.

## Neue Datenstruktur

### Vorher (String-Format):
```typescript
starting_equipment: {
  options: [
    {
      label: "A",
      items: [
        "Pergament (10 Blätter)",
        "Buch (Gebete)",
        "Öl (drei Flaschen)",
        "zwei Dolche"
      ],
      gold: 8
    }
  ]
}
```

### Nachher (Strukturiertes Format):
```typescript
starting_equipment: {
  options: [
    {
      label: "A",
      items: [
        {
          name: "Pergament",
          quantity: 10,
          unit: "Blätter",
          variant: null
        },
        {
          name: "Buch",
          quantity: 1,
          unit: null,
          variant: "Gebete"
        },
        {
          name: "Öl",
          quantity: 3,
          unit: "Flaschen",
          variant: null
        },
        {
          name: "Dolch",
          quantity: 2,
          unit: null,
          variant: null
        }
      ],
      gold: 8
    }
  ]
}
```

### TypeScript Interface:
```typescript
interface StructuredItem {
  name: string;        // Item-Name (z.B. "Pergament", "Buch")
  quantity: number;    // Menge (z.B. 10, 3, 2, 1)
  unit: string | null; // Einheit (z.B. "Blätter", "Flaschen", "Beutel")
  variant: string | null; // Variante/Thema (z.B. "Gebete", "Philosophie")
}
```

## Betroffene Dateien

1. **`src/lib/types.ts`** (Zeile ~175-184)
   - `Background` Interface: `items` Typ von `string[]` zu `StructuredItem[] | string[]` ändern
   - Rückwärtskompatibilität: Beide Formate unterstützen

2. **`src/screens/CharacterSheet.tsx`** (mehrere Stellen)
   - `handleStartingEquipmentConfirm` Funktion (ca. Zeile 1000-1100)
   - `useEffect` für Background-Equipment (ca. Zeile 1300-1340)
   - Alle Stellen, die `option.items` iterieren

## Aufgaben

### 1. TypeScript Interface aktualisieren

**Datei:** `src/lib/types.ts`

**Änderung:**
```typescript
starting_equipment?: {
  options?: Array<{
    label: string;
    items: Array<StructuredItem | string> | null; // ← Unterstützt beide Formate
    gold: number | null;
  }>;
  // Legacy fields
  items?: string[];
  gold?: number;
};
```

**Neues Interface hinzufügen:**
```typescript
export interface StructuredItem {
  name: string;
  quantity: number;
  unit: string | null;
  variant: string | null;
}
```

### 2. Helper-Funktion erstellen

**Datei:** `src/screens/CharacterSheet.tsx` oder `src/lib/utils.ts`

**Neue Funktion:**
```typescript
/**
 * Normalisiert ein Item zu einem strukturierten Format
 * Unterstützt sowohl String- als auch StructuredItem-Format (Rückwärtskompatibilität)
 */
function normalizeItem(item: string | StructuredItem): {
  name: string;
  quantity: number;
  unit: string | null;
  variant: string | null;
} {
  if (typeof item === 'string') {
    // Legacy-Format: String
    return {
      name: item,
      quantity: 1,
      unit: null,
      variant: null
    };
  }
  // Neues Format: Strukturiertes Objekt
  return item;
}
```

### 3. CharacterSheet.tsx - handleStartingEquipmentConfirm aktualisieren

**Suchen nach:** Funktion `handleStartingEquipmentConfirm` (ca. Zeile 1000-1100)

**Aktuelle Logik:**
```typescript
selectedOption.items.forEach((itemName: string) => {
  addItemToInventory(itemName, ...);
});
```

**Neue Logik:**
```typescript
if (selectedOption.items && Array.isArray(selectedOption.items)) {
  selectedOption.items.forEach((item) => {
    const normalized = normalizeItem(item);
    
    // Verwende normalized.name für die Suche
    // Verwende normalized.quantity für die Menge
    for (let i = 0; i < normalized.quantity; i++) {
      addItemToInventory(normalized.name, items, equipment, tools, weapons, currentCharacter, updateInventory, updateMeta, saveCharacter);
    }
    
    // Optional: Variant-Information speichern (z.B. "Buch (Gebete)")
    if (normalized.variant) {
      // Variant könnte in item.data gespeichert werden oder als separater Eintrag
      console.log(`Item ${normalized.name} hat Variante: ${normalized.variant}`);
    }
  });
}
```

### 4. CharacterSheet.tsx - Legacy-Code aktualisieren

**Suchen nach:** `useEffect` für Background-Equipment (ca. Zeile 1312-1329)

**Aktuelle Logik:**
```typescript
if (startingEquipment.items && Array.isArray(startingEquipment.items)) {
  startingEquipment.items.forEach((itemName: string) => {
    addItemToInventory(itemName, ...);
  });
}
```

**Neue Logik:** (Gleiche wie oben, mit `normalizeItem`)

### 5. Item-Suche verbessern

**Datei:** `src/screens/CharacterSheet.tsx`

**Problem:** `findItemByName` sucht nach dem vollständigen String (z.B. "Pergament (10 Blätter)"), aber jetzt haben wir nur noch "Pergament".

**Lösung:** Die Funktion sollte bereits funktionieren, da sie nach "Pergament" sucht. Aber prüfe, ob Varianten berücksichtigt werden müssen:

```typescript
// Wenn Item "Buch" mit Variante "Gebete" gesucht wird
// Suche nach "Buch" im Compendium
// Optional: Prüfe ob item.data.variant oder ähnliches existiert
```

### 6. Equipment-Anzeige aktualisieren

**Datei:** `src/screens/CharacterSheet.tsx` oder `src/components/character/EquipmentList.tsx`

**Optional:** Wenn Items mit Varianten angezeigt werden, zeige:
- "Buch (Gebete)" statt nur "Buch"
- "Pergament (10 Blätter)" statt nur "Pergament"

**Beispiel:**
```typescript
function formatItemName(item: StructuredItem): string {
  let displayName = item.name;
  if (item.variant) {
    displayName += ` (${item.variant})`;
  }
  if (item.quantity > 1) {
    displayName = `${item.quantity}x ${displayName}`;
  }
  if (item.unit) {
    displayName += ` (${item.quantity} ${item.unit})`;
  }
  return displayName;
}
```

## Wichtige Hinweise

1. **Rückwärtskompatibilität:** Der Code muss beide Formate unterstützen (String und StructuredItem), da möglicherweise noch alte Daten existieren.

2. **Mengenangaben:** Wenn `quantity > 1`, sollte das Item mehrfach zum Inventar hinzugefügt werden ODER die `quantity` direkt beim Hinzufügen berücksichtigt werden.

3. **Varianten:** Varianten (z.B. "Buch (Gebete)") sollten bei der Item-Suche berücksichtigt werden. Möglicherweise existieren verschiedene "Buch"-Items im Compendium mit unterschiedlichen Varianten.

4. **Einheiten:** Einheiten (z.B. "10 Blätter Pergament") sollten beim Anzeigen berücksichtigt werden, aber bei der Item-Suche nur der Name verwendet werden.

5. **Testing:** Teste mit verschiedenen Backgrounds:
   - Akolyth: "Pergament (10 Blätter)", "Buch (Gebete)"
   - Einsiedler: "Öl (drei Flaschen)", "Buch (Philosophie)"
   - Krimineller: "zwei Dolche"
   - Händler/Handwerker: "zwei Beutel" (falls vorhanden)

## Beispiel-Implementierung

```typescript
// In CharacterSheet.tsx, in handleStartingEquipmentConfirm:

const handleStartingEquipmentConfirm = (selectedOptionIndex: number) => {
  if (!pendingBackground || !pendingStartingEquipment) return;
  
  const selectedOption = pendingStartingEquipment[selectedOptionIndex];
  if (!selectedOption) return;
  
  // Gold hinzufügen
  if (selectedOption.gold) {
    const currentGold = currentCharacter.meta.currency_gold || 0;
    updateMeta({ currency_gold: currentGold + selectedOption.gold });
  }
  
  // Items hinzufügen
  if (selectedOption.items && Array.isArray(selectedOption.items)) {
    selectedOption.items.forEach((item) => {
      const normalized = normalizeItem(item);
      
      // Für jedes Item basierend auf quantity
      for (let i = 0; i < normalized.quantity; i++) {
        // Suche Item im Compendium
        const foundItem = findItemByName(normalized.name, items);
        const foundTool = findItemByName(normalized.name, tools);
        const foundWeapon = findItemByName(normalized.name, weapons);
        
        if (foundItem) {
          updateInventory(foundItem.id, 1, false);
        } else if (foundTool) {
          updateInventory(foundTool.id, 1, false);
        } else if (foundWeapon) {
          updateInventory(foundWeapon.id, 1, false);
        } else {
          // Fallback: Als Text-Item hinzufügen
          const displayName = normalized.variant 
            ? `${normalized.name} (${normalized.variant})`
            : normalized.name;
          // ... Fallback-Logik
        }
      }
    });
  }
  
  saveCharacter();
  setShowStartingEquipmentDialog(false);
};
```

## Checkliste

- [ ] `StructuredItem` Interface in `types.ts` hinzugefügt
- [ ] `Background` Interface aktualisiert (items: `Array<StructuredItem | string>`)
- [ ] `normalizeItem` Helper-Funktion erstellt
- [ ] `handleStartingEquipmentConfirm` aktualisiert
- [ ] Legacy-Code in `useEffect` aktualisiert
- [ ] Mengenangaben (`quantity`) berücksichtigt
- [ ] Varianten (`variant`) berücksichtigt
- [ ] Einheiten (`unit`) für Anzeige berücksichtigt
- [ ] Rückwärtskompatibilität getestet (String-Format funktioniert noch)
- [ ] Mit verschiedenen Backgrounds getestet (Akolyth, Einsiedler, Krimineller, etc.)
