import { create } from "zustand";
import { Character, Attributes, Modifier, CharacterMeta } from "./types";
import { characterApi } from "./api";

interface CharacterState {
  currentCharacter: Character | null;
  characters: Character[];
  isLoading: boolean;
  error: string | null;

  // Methods
  loadCharacter: (id: string) => Promise<void>;
  saveCharacter: () => Promise<void>;
  updateAttribute: (attr: keyof Attributes, value: number) => void;
  updateMeta: (meta: Partial<CharacterMeta>) => void;
  updateProficiency: (
    type: keyof Character["proficiencies"],
    id: string,
    add: boolean,
  ) => void;
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

      // Migration for old characters
      if (!character.proficiencies) {
        character.proficiencies = {
          skills: [],
          saving_throws: [],
          weapons: [],
          armor: [],
          tools: [],
          languages: ["Common"],
        };
      }
      if (!character.health) {
        character.health = {
          current: 10,
          max: 10,
          temp: 0,
          hit_dice_max: 1,
          hit_dice_used: 0,
          death_saves: { successes: 0, failures: 0 },
        };
      }
      if (!character.inventory) character.inventory = [];

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
      const exists = characters.some((c) => c.id === currentCharacter.id);

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

  updateMeta: (meta) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    set({
      currentCharacter: {
        ...currentCharacter,
        meta: {
          ...currentCharacter.meta,
          ...meta,
        },
      },
    });
  },

  updateProficiency: (type, id, add) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    const currentList = currentCharacter.proficiencies[type] as string[];
    const newList = add
      ? [...currentList, id]
      : currentList.filter((x) => x !== id);

    set({
      currentCharacter: {
        ...currentCharacter,
        proficiencies: {
          ...currentCharacter.proficiencies,
          [type]: newList,
        },
      },
    });
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
      const migratedList = list.map((character) => ({
        ...character,
        meta: {
          ...character.meta,
          xp: character.meta.xp || 0,
          level: character.meta.level || 1,
          use_metric: character.meta.use_metric ?? true,
        },
        proficiencies: character.proficiencies || {
          skills: [],
          saving_throws: [],
          weapons: [],
          armor: [],
          tools: [],
          languages: ["Common"],
        },
        health: character.health || {
          current: 10,
          max: 10,
          temp: 0,
          hit_dice_max: 1,
          hit_dice_used: 0,
          death_saves: { successes: 0, failures: 0 },
        },
        inventory: character.inventory || [],
        modifiers: character.modifiers || [],
      }));
      set({ characters: migratedList, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));
