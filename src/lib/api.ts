import { invoke } from '@tauri-apps/api/core';
import { Character, CustomSpell, Spell, Species, Class, Item, Feat } from './types';

export const characterApi = {
  async create(character: Character): Promise<Character> {
    try {
      return await invoke('create_character', { character });
    } catch (error) {
      console.error('Failed to create character:', error);
      throw error;
    }
  },

  async get(id: string): Promise<Character> {
    try {
      return await invoke('get_character', { id });
    } catch (error) {
      console.error(`Failed to get character ${id}:`, error);
      throw error;
    }
  },

  async update(id: string, character: Character): Promise<void> {
    try {
      await invoke('update_character', { id, character });
    } catch (error) {
      console.error(`Failed to update character ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await invoke('delete_character', { id });
    } catch (error) {
      console.error(`Failed to delete character ${id}:`, error);
      throw error;
    }
  },

  async list(): Promise<Character[]> {
    try {
      return await invoke('list_characters');
    } catch (error) {
      console.error('Failed to list characters:', error);
      throw error;
    }
  },
};

export const homebrewApi = {
  async createSpell(spell: CustomSpell): Promise<CustomSpell> {
    try {
      return await invoke('create_custom_spell', { spell });
    } catch (error) {
      console.error('Failed to create custom spell:', error);
      throw error;
    }
  },

  async getAllSpells(): Promise<Spell[]> {
    try {
      return await invoke('get_all_spells');
    } catch (error) {
      console.error('Failed to get all spells:', error);
      throw error;
    }
  },

  async restoreSpell(id: string): Promise<void> {
    try {
      await invoke('restore_core_spell', { spellId: id });
    } catch (error) {
      console.error(`Failed to restore spell ${id}:`, error);
      throw error;
    }
  },
};

export const compendiumApi = {
  async getSpells(): Promise<Spell[]> {
    return await invoke('get_all_spells');
  },
  async getSpecies(): Promise<Species[]> {
    return await invoke('get_all_species');
  },
  async getClasses(): Promise<Class[]> {
    return await invoke('get_all_classes');
  },
  async getItems(): Promise<Item[]> {
    return await invoke('get_all_items');
  },
  async getFeats(): Promise<Feat[]> {
    return await invoke('get_all_feats');
  },
  async importPHB(): Promise<void> {
    return await invoke('import_phb_data');
  },
};


