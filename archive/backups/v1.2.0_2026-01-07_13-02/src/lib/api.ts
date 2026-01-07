import { invoke } from '@tauri-apps/api/core';
import { Character, CustomSpell, Spell, Species, Class, Gear, Tool, Feat, Weapon, Armor, Skill, CustomWeapon, CustomArmor, CustomItem } from './types';

export const characterApi = {
  async create(character: Character): Promise<Character> {
    return await invoke('create_character', { character });
  },
  async get(id: string): Promise<Character> {
    return await invoke('get_character', { id });
  },
  async update(id: string, character: Character): Promise<void> {
    await invoke('update_character', { id, character });
  },
  async delete(id: string): Promise<void> {
    await invoke('delete_character', { id });
  },
  async list(): Promise<Character[]> {
    return await invoke('list_characters');
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
  async getGear(): Promise<Gear[]> {
    return await invoke('get_all_gear');
  },
  async getTools(): Promise<Tool[]> {
    return await invoke('get_all_tools');
  },
  async getWeapons(): Promise<Weapon[]> {
    return await invoke('get_all_weapons');
  },
  async getArmor(): Promise<Armor[]> {
    return await invoke('get_all_armor');
  },
  async getFeats(): Promise<Feat[]> {
    return await invoke('get_all_feats');
  },
  async getSkills(): Promise<Skill[]> {
    return await invoke('get_all_skills');
  },
  async importPhbData(): Promise<void> {
    return await invoke('import_phb_data');
  },
  async validateCompendium(): Promise<{
    total_spells: number;
    total_species: number;
    total_classes: number;
    total_gear: number;
    total_weapons: number;
    total_armor: number;
    total_feats: number;
    encoding_errors: number;
    invalid_json: number;
    passed: boolean;
    issues: string[];
  }> {
    return await invoke('validate_core_compendium');
  },
};

export const homebrewApi = {
  async upsertSpell(spell: CustomSpell): Promise<string> {
    return await invoke('upsert_custom_spell', { spell });
  },
  async upsertWeapon(weapon: CustomWeapon): Promise<string> {
    return await invoke('upsert_custom_weapon', { weapon });
  },
  async upsertArmor(armor: CustomArmor): Promise<string> {
    return await invoke('upsert_custom_armor', { armor });
  },
  async upsertItem(item: CustomItem): Promise<string> {
    return await invoke('upsert_custom_item', { item });
  },
  async deleteEntry(id: string, tableType: string): Promise<void> {
    await invoke('delete_custom_entry', { id, tableType });
  }
};
