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
  MagicItem,
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
  magicItems: MagicItem[];
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
  fetchMagicItems: () => Promise<void>;
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
  magicItems: [],
  isLoading: false,
  error: null,

  fetchSpells: async () => {
    set({ isLoading: true, error: null });
    try {
      const spells = await compendiumApi.getSpells();
      console.log("[CompendiumStore] Fetched spells:", spells.length);
      set({ spells, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching spells:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchSpecies: async () => {
    set({ isLoading: true, error: null });
    try {
      const species = await compendiumApi.getSpecies();
      console.log("[CompendiumStore] Fetched species:", species.length);
      set({ species, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching species:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchClasses: async () => {
    set({ isLoading: true, error: null });
    try {
      const classes = await compendiumApi.getClasses();
      console.log("[CompendiumStore] Fetched classes:", classes.length);
      set({ classes, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching classes:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchGear: async () => {
    set({ isLoading: true, error: null });
    try {
      const gear = await compendiumApi.getGear();
      console.log("[CompendiumStore] Fetched gear:", gear.length);
      set({ gear, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching gear:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchTools: async () => {
    set({ isLoading: true, error: null });
    try {
      const tools = await compendiumApi.getTools();
      console.log("[CompendiumStore] Fetched tools:", tools.length);
      set({ tools, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching tools:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchWeapons: async () => {
    set({ isLoading: true, error: null });
    try {
      const weapons = await compendiumApi.getWeapons();
      console.log("[CompendiumStore] Fetched weapons:", weapons.length);
      set({ weapons, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching weapons:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchArmor: async () => {
    set({ isLoading: true, error: null });
    try {
      const armor = await compendiumApi.getArmor();
      console.log("[CompendiumStore] Fetched armor:", armor.length);
      set({ armor, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching armor:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchFeats: async () => {
    set({ isLoading: true, error: null });
    try {
      const feats = await compendiumApi.getFeats();
      console.log("[CompendiumStore] Fetched feats:", feats.length);
      set({ feats, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching feats:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchSkills: async () => {
    set({ isLoading: true, error: null });
    try {
      const skills = await compendiumApi.getSkills();
      console.log("[CompendiumStore] Fetched skills:", skills.length);
      set({ skills, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching skills:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchBackgrounds: async () => {
    set({ isLoading: true, error: null });
    try {
      const backgrounds = await compendiumApi.getBackgrounds();
      console.log("[CompendiumStore] Fetched backgrounds:", backgrounds.length);
      set({ backgrounds, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching backgrounds:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await compendiumApi.getAllItems();
      console.log("[CompendiumStore] Fetched items:", items.length);
      set({ items, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching items:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchEquipment: async () => {
    set({ isLoading: true, error: null });
    try {
      const equipment = await compendiumApi.getAllEquipment();
      console.log("[CompendiumStore] Fetched equipment:", equipment.length);
      set({ equipment, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching equipment:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchMagicItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const magicItems = await compendiumApi.getMagicItems();
      console.log("[CompendiumStore] Fetched magic items:", magicItems.length);
      set({ magicItems, isLoading: false, error: null });
    } catch (err) {
      console.error("[CompendiumStore] Error fetching magic items:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));
