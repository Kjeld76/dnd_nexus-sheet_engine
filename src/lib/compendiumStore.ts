import { create } from "zustand";
import {
  Spell,
  Species,
  Class,
  Gear,
  Tool,
  Feat,
  Weapon,
  Armor,
  Skill,
  Background,
} from "./types";
import { compendiumApi } from "./api";

interface CompendiumState {
  spells: Spell[];
  species: Species[];
  classes: Class[];
  gear: Gear[];
  tools: Tool[];
  weapons: Weapon[];
  armor: Armor[];
  feats: Feat[];
  skills: Skill[];
  backgrounds: Background[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSpells: () => Promise<void>;
  fetchSpecies: () => Promise<void>;
  fetchClasses: () => Promise<void>;
  fetchGear: () => Promise<void>;
  fetchTools: () => Promise<void>;
  fetchWeapons: () => Promise<void>;
  fetchArmor: () => Promise<void>;
  fetchFeats: () => Promise<void>;
  fetchSkills: () => Promise<void>;
  fetchBackgrounds: () => Promise<void>;
}

export const useCompendiumStore = create<CompendiumState>((set) => ({
  spells: [],
  species: [],
  classes: [],
  gear: [],
  tools: [],
  weapons: [],
  armor: [],
  feats: [],
  skills: [],
  backgrounds: [],
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

  fetchGear: async () => {
    set({ isLoading: true });
    try {
      const gear = await compendiumApi.getGear();
      set({ gear, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchTools: async () => {
    set({ isLoading: true });
    try {
      const tools = await compendiumApi.getTools();
      set({ tools, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchWeapons: async () => {
    set({ isLoading: true });
    try {
      const weapons = await compendiumApi.getWeapons();
      set({ weapons, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchArmor: async () => {
    set({ isLoading: true });
    try {
      const armor = await compendiumApi.getArmor();
      set({ armor, isLoading: false });
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

  fetchSkills: async () => {
    set({ isLoading: true });
    try {
      const skills = await compendiumApi.getSkills();
      set({ skills, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchBackgrounds: async () => {
    set({ isLoading: true, error: null });
    try {
      const backgrounds = await compendiumApi.getBackgrounds();
      console.log("Fetched backgrounds:", backgrounds.length);
      set({ backgrounds, isLoading: false, error: null });
    } catch (err) {
      console.error("Error fetching backgrounds:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));
