import { create } from 'zustand';
import { Character, Attributes, Modifier } from './types';
import { characterApi } from './api';

interface CharacterState {
  currentCharacter: Character | null;
  characters: Character[];
  isLoading: boolean;
  error: string | null;

  // Methods
  loadCharacter: (id: string) => Promise<void>;
  saveCharacter: () => Promise<void>;
  updateAttribute: (attr: keyof Attributes, value: number) => void;
  addModifier: (modifier: Modifier) => void;
  removeModifier: (id: string) => void;
  loadCharacterList: () => Promise<void>;
  setCurrentCharacter: (character: Character | null) => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  currentCharacter: null,
  characters: [],
  isLoading: false,
  error: null,

  setCurrentCharacter: (character) => set({ currentCharacter: character }),

  loadCharacter: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const character = await characterApi.get(id);
      set({ currentCharacter: character, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  saveCharacter: async () => {
    const { currentCharacter, characters } = get();
    if (!currentCharacter) return;

    set({ isLoading: true, error: null });
    try {
      // Check if character already exists in list (simple heuristic)
      const exists = characters.some(c => c.id === currentCharacter.id);
      
      if (exists) {
        await characterApi.update(currentCharacter.id, currentCharacter);
      } else {
        const created = await characterApi.create(currentCharacter);
        set({ currentCharacter: created });
      }
      
      set({ isLoading: false });
      await get().loadCharacterList();
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateAttribute: (attr, value) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    set({
      currentCharacter: {
        ...currentCharacter,
        attributes: {
          ...currentCharacter.attributes,
          [attr]: value,
        },
      },
    });
  },

  addModifier: (modifier) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    set({
      currentCharacter: {
        ...currentCharacter,
        modifiers: [...currentCharacter.modifiers, modifier],
      },
    });
  },

  removeModifier: (id) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    set({
      currentCharacter: {
        ...currentCharacter,
        modifiers: currentCharacter.modifiers.filter((m) => m.id !== id),
      },
    });
  },

  loadCharacterList: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await characterApi.list();
      set({ characters: list, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));

