# Prompt 6: Frontend API Layer

```
Create TypeScript API layer in src/lib/:

1. src/lib/types.ts:
   - Export all TypeScript interfaces matching Rust types
   - Character, Attributes, Modifier, CustomSpell interfaces

2. src/lib/api.ts:
   - Import invoke from @tauri-apps/api/tauri
   - characterApi object with methods:
     - create(character: Character): Promise<Character>
     - get(id: string): Promise<Character>
     - update(id: string, character: Character): Promise<void>
     - delete(id: string): Promise<void>
     - list(): Promise<Character[]>
   - homebrewApi object with methods:
     - createSpell(spell: CustomSpell): Promise<CustomSpell>
     - getAllSpells(): Promise<Spell[]>
     - restoreSpell(id: string): Promise<void>
   - Wrap all calls in try-catch with error logging
```




