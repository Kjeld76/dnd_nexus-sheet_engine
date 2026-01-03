# Prompt 7: Zustand Store

```
Create Zustand store in src/lib/store.ts:

1. CharacterStore interface:
   - currentCharacter: Character | null
   - characters: Character[]
   - isLoading: boolean
   - error: string | null

2. Store methods:
   - loadCharacter(id: string): Promise<void>
   - saveCharacter(): Promise<void>
   - updateAttribute(attr: keyof Attributes, value: number): void
   - addModifier(modifier: Modifier): void
   - removeModifier(id: string): void
   - loadCharacterList(): Promise<void>

3. Use characterApi for backend calls
4. Update loading/error states appropriately
5. Optimistic updates for UI responsiveness
```




