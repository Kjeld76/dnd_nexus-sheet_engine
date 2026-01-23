import { invoke } from "@tauri-apps/api/core";
import {
  Character,
  CustomSpell,
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
  CustomWeapon,
  CustomArmor,
  CustomItem,
  CustomMagicItem,
  CustomSpecies,
  CustomClass,
  CustomFeat,
  CustomBackground,
  Item,
  Equipment,
  MagicItem,
  CharacterItem,
  CharacterSpell,
} from "./types";

export const characterApi = {
  async create(character: Character): Promise<Character> {
    return await invoke("create_character", { character });
  },
  async get(id: string): Promise<Character> {
    return await invoke("get_character", { id });
  },
  async update(id: string, character: Character): Promise<void> {
    await invoke("update_character", { id, character });
  },
  async delete(id: string): Promise<void> {
    await invoke("delete_character", { id });
  },
  async list(): Promise<Character[]> {
    return await invoke("list_characters");
  },
  async getInventory(characterId: string): Promise<CharacterItem[]> {
    return await invoke("get_character_inventory", {
      character_id: characterId,
    });
  },
  async updateInventoryItem(item: CharacterItem): Promise<void> {
    await invoke("update_inventory_item", { item });
  },
  async getSpells(characterId: string): Promise<CharacterSpell[]> {
    return await invoke("get_character_spells", { character_id: characterId });
  },
  async updateSpellPreparation(
    id: string,
    is_prepared: boolean,
  ): Promise<void> {
    await invoke("update_spell_preparation", { id, is_prepared });
  },
  async invoke(
    command: string,
    args: Record<string, unknown> = {},
  ): Promise<any> {
    return await invoke(command, args);
  },
};

export const compendiumApi = {
  async getSpells(limit?: number, offset?: number): Promise<Spell[]> {
    return await invoke("get_all_spells", { limit, offset });
  },
  async getSpecies(): Promise<Species[]> {
    return await invoke("get_all_species");
  },
  async getClasses(): Promise<Class[]> {
    return await invoke("get_all_classes");
  },
  async getGear(): Promise<Gear[]> {
    return await invoke("get_all_gear");
  },
  async getTools(): Promise<Tool[]> {
    return await invoke("get_all_tools");
  },
  async getWeapons(): Promise<Weapon[]> {
    return await invoke("get_all_weapons");
  },
  async getArmor(): Promise<Armor[]> {
    return await invoke("get_all_armor");
  },
  async getFeats(): Promise<Feat[]> {
    return await invoke("get_all_feats");
  },
  async getSkills(): Promise<Skill[]> {
    return await invoke("get_all_skills");
  },
  async getBackgrounds(): Promise<Background[]> {
    return await invoke("get_all_backgrounds");
  },
  async getAllItems(): Promise<Item[]> {
    return await invoke("get_all_items");
  },
  async getAllEquipment(): Promise<Equipment[]> {
    return await invoke("get_all_equipment");
  },
  async getMagicItems(): Promise<MagicItem[]> {
    return await invoke("get_all_magic_items");
  },
  async importPhbData(): Promise<void> {
    return await invoke("import_phb_data");
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
    return await invoke("validate_core_compendium");
  },
};

export const homebrewApi = {
  async upsertSpell(spell: CustomSpell): Promise<string> {
    return await invoke("upsert_custom_spell", { spell });
  },
  async upsertWeapon(weapon: CustomWeapon): Promise<string> {
    return await invoke("upsert_custom_weapon", { weapon });
  },
  async upsertArmor(armor: CustomArmor): Promise<string> {
    return await invoke("upsert_custom_armor", { armor });
  },
  async upsertItem(item: CustomItem): Promise<string> {
    return await invoke("upsert_custom_item", { item });
  },
  async upsertMagicItem(item: CustomMagicItem): Promise<string> {
    return await invoke("upsert_custom_magic_item", { item });
  },
  async upsertSpecies(species: CustomSpecies): Promise<string> {
    return await invoke("upsert_custom_species", { species });
  },
  async upsertClass(class_: CustomClass): Promise<string> {
    return await invoke("upsert_custom_class", { class: class_ });
  },
  async upsertFeat(feat: CustomFeat): Promise<string> {
    return await invoke("upsert_custom_feat", { feat });
  },
  async upsertBackground(background: CustomBackground): Promise<string> {
    return await invoke("upsert_custom_background", { background });
  },
  async deleteEntry(id: string, tableType: string): Promise<void> {
    await invoke("delete_custom_entry", { id, tableType });
  },
};
