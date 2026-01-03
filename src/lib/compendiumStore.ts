import { create } from 'zustand';
import { Spell, Species, Class, Item, Feat } from './types';
import { compendiumApi } from './api';

interface CompendiumState {
  spells: Spell[];
  species: Species[];
  classes: Class[];
  items: Item[];
  feats: Feat[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSpells: () => Promise<void>;
  fetchSpecies: () => Promise<void>;
  fetchClasses: () => Promise<void>;
  fetchItems: () => Promise<void>;
  fetchFeats: () => Promise<void>;
  importPHB: () => Promise<void>;
}

export const useCompendiumStore = create<CompendiumState>((set) => ({
  spells: [],
  species: [],
  classes: [],
  items: [],
  feats: [],
  isLoading: false,
  error: null,

  fetchSpells: async () => {
    set({ isLoading: true });
    try {
      const spells = await compendiumApi.getSpells();
      set({ spells, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchSpecies: async () => {
    set({ isLoading: true });
    try {
      const species = await compendiumApi.getSpecies();
      set({ species, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchClasses: async () => {
    set({ isLoading: true });
    try {
      const classes = await compendiumApi.getClasses();
      set({ classes, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const items = await compendiumApi.getItems();
      set({ items, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchFeats: async () => {
    set({ isLoading: true });
    try {
      const feats = await compendiumApi.getFeats();
      set({ feats, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  importPHB: async () => {
    set({ isLoading: true });
    try {
      await compendiumApi.importPHB();
      set({ isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));


