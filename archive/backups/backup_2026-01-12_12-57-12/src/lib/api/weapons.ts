import { invoke } from "@tauri-apps/api/core";
import type { Weapon } from "@/lib/types/weapons";

export const weaponsApi = {
  async getAll(): Promise<Weapon[]> {
    return await invoke("get_all_weapons");
  },

  // Note: These might need implementation in compendium.rs if needed,
  // but for now the user only asked for the wrapper structure.
  async getById(id: string): Promise<Weapon> {
    return await invoke("get_weapon_by_id", { id });
  },

  async getByCategory(category: string): Promise<Weapon[]> {
    return await invoke("get_weapons_by_category", { category });
  },

  async search(query: string): Promise<Weapon[]> {
    return await invoke("search_weapons", { query });
  },
};
