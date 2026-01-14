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
  Item,
  Equipment,
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
  items: Item[];
  equipment: Equipment[];
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
  fetchItems: () => Promise<void>;
  fetchEquipment: () => Promise<void>;
}

export const useCompendiumStore = create<CompendiumState>((set, get) => ({
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
  items: [],
  equipment: [],
  isLoading: false,
  error: null,

  fetchSpells: async () => {
    const state = get();
    if (state.spells.length > 0) return;
    set({ isLoading: true });
    try {
      // Lade alle Spells (kein Limit für initial load)
      const spells = await compendiumApi.getSpells();
      set({ spells, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchSpecies: async () => {
    const state = get();
    if (state.species.length > 0) return;
    set({ isLoading: true });
    try {
      const species = await compendiumApi.getSpecies();
      set({ species, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchClasses: async () => {
    const state = get();
    if (state.classes.length > 0) return;
    set({ isLoading: true });
    try {
      const classes = await compendiumApi.getClasses();
      set({ classes, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchGear: async () => {
    const state = get();
    if (state.gear.length > 0) return;
    set({ isLoading: true });
    try {
      const gear = await compendiumApi.getGear();
      set({ gear, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchTools: async () => {
    const state = get();
    if (state.tools.length > 0) return;
    set({ isLoading: true });
    try {
      const tools = await compendiumApi.getTools();
      set({ tools, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchWeapons: async () => {
    const state = get();
    if (state.weapons.length > 0) return;
    set({ isLoading: true });
    try {
      const weapons = await compendiumApi.getWeapons();
      set({ weapons, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchArmor: async () => {
    const state = get();
    if (state.armor.length > 0) return;
    set({ isLoading: true });
    try {
      const armor = await compendiumApi.getArmor();
      set({ armor, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchFeats: async () => {
    const state = get();
    if (state.feats.length > 0) return;
    set({ isLoading: true });
    try {
      const feats = await compendiumApi.getFeats();
      set({ feats, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchSkills: async () => {
    const state = get();
    if (state.skills.length > 0) return;
    set({ isLoading: true });
    try {
      const skills = await compendiumApi.getSkills();
      set({ skills, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchBackgrounds: async () => {
    const state = get();
    if (state.backgrounds.length > 0) return;
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

  fetchItems: async () => {
    const state = get();
    if (state.items.length > 0) return;
    set({ isLoading: true, error: null });
    try {
      const items = await compendiumApi.getAllItems();
      console.log("Fetched items:", items.length);
      set({ items, isLoading: false, error: null });
    } catch (err) {
      console.error("Error fetching items:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchEquipment: async () => {
    const state = get();
    if (state.equipment.length > 0) return;
    set({ isLoading: true, error: null });
    try {
      const equipment = await compendiumApi.getAllEquipment();
      console.log("Fetched equipment:", equipment.length);
      set({ equipment, isLoading: false, error: null });
    } catch (err) {
      console.error("Error fetching equipment:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));
