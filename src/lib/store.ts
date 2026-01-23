import { create } from "zustand";
import {
  Character,
  Attributes,
  Modifier,
  CharacterMeta,
  CharacterAppearance,
  CharacterItem,
  CharacterSpell,
} from "./types";
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
  updateAppearance: (appearance: Partial<CharacterAppearance>) => void;
  updateProficiency: (
    type: keyof Character["proficiencies"],
    id: string,
    add: boolean,
  ) => void;
  addModifier: (modifier: Modifier) => void;
  removeModifier: (id: string) => void;
  addFeat: (featId: string) => void;
  removeFeat: (featId: string) => void;
  updateInventory: (
    itemId: string,
    quantity: number,
    isEquipped: boolean,
    itemType?: string,
    containerId?: string,
    customName?: string,
    location?: string,
    source?: string,
  ) => void;
  applyClassStartingEquipment: (
    classId: string,
    optionLabel: string,
  ) => Promise<void>;
  applyBackgroundStartingEquipment: (
    items: Array<{ name: string; quantity: number }>,
    gold: number,
    reload?: boolean,
  ) => Promise<void>;
  removeInventoryItemByName: (name: string) => void;
  removeInventoryItemByItemId: (itemId: string) => void;
  refreshInventory: () => Promise<void>;
  loadCharacterList: () => Promise<void>;
  setCurrentCharacter: (character: Character | null) => void;
  deleteCharacter: (id: string) => Promise<void>;
  migrateLegacyInventory: () => Promise<void>;
  refreshSpells: () => Promise<void>;
  updateSpellPreparation: (id: string, isPrepared: boolean) => Promise<void>;
  migrateLegacySpells: () => Promise<void>;
  migrateLegacyStats: () => Promise<void>;
  migrateLegacyFeatures: () => Promise<void>;
  migrateLegacyModifiers: () => Promise<void>;
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
      if (!character.attributes) {
        character.attributes = {
          str: 10,
          dex: 10,
          con: 10,
          int: 10,
          wis: 10,
          cha: 10,
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
      if (!character.spells) character.spells = [];
      if (!character.appearance) character.appearance = {};
      if (!character.feats) character.feats = [];

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

  updateAppearance: (appearance) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    set({
      currentCharacter: {
        ...currentCharacter,
        appearance: {
          ...currentCharacter.appearance,
          ...appearance,
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

  addFeat: (featId) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    if (!currentCharacter.feats.includes(featId)) {
      set({
        currentCharacter: {
          ...currentCharacter,
          feats: [...currentCharacter.feats, featId],
        },
      });
    }
  },

  removeFeat: (featId) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    set({
      currentCharacter: {
        ...currentCharacter,
        feats: currentCharacter.feats.filter((f) => f !== featId),
      },
    });
  },

  updateInventory: (
    itemId,
    quantity,
    isEquipped,
    itemType = "core_item",
    containerId,
    customName,
    location = "Body",
    source = "manual",
  ) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    const existingIndex = currentCharacter.inventory.findIndex(
      (item) => item.item_id === itemId && item.container_id === containerId,
    );

    let newInventory: CharacterItem[];
    if (existingIndex >= 0) {
      // Update existing item
      newInventory = [...currentCharacter.inventory];
      newInventory[existingIndex] = {
        ...newInventory[existingIndex],
        quantity,
        is_equipped: isEquipped,
        container_id: containerId,
        custom_name: customName || newInventory[existingIndex].custom_name,
        location: location || newInventory[existingIndex].location,
        source: source || newInventory[existingIndex].source,
        updated_at: Math.floor(Date.now() / 1000),
      };
    } else {
      // Add new item
      const newItem: CharacterItem = {
        id: crypto.randomUUID(),
        character_id: currentCharacter.id,
        item_id: itemId,
        item_type: itemType,
        quantity,
        is_equipped: isEquipped,
        is_attuned: false,
        container_id: containerId,
        custom_name: customName,
        location: location,
        source: source,
        is_starting_equipment: false,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      };
      newInventory = [...currentCharacter.inventory, newItem];
    }

    set({
      currentCharacter: {
        ...currentCharacter,
        inventory: newInventory,
      },
    });
  },

  applyClassStartingEquipment: async (classId: string, optionLabel: string) => {
    const { currentCharacter, loadCharacter } = get();
    if (!currentCharacter) return;

    try {
      await characterApi.invoke("clear_starting_equipment", {
        characterId: currentCharacter.id,
        source: "class",
      });

      await characterApi.invoke("get_starting_equipment", {
        characterId: currentCharacter.id,
        classId: classId,
        optionLabel: optionLabel,
      });

      await loadCharacter(currentCharacter.id);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  applyBackgroundStartingEquipment: async (
    items: Array<{ name: string; quantity: number }>,
    gold: number,
    reload: boolean = true,
  ) => {
    const { currentCharacter, loadCharacter, refreshInventory } = get();
    if (!currentCharacter) return;

    console.log("[Store] applyBackgroundStartingEquipment", {
      items,
      gold,
      reload,
    });

    try {
      await characterApi.invoke("apply_background_starting_equipment", {
        characterId: currentCharacter.id,
        items: items,
        gold: gold,
      });

      if (reload) {
        console.log("[Store] reloading character...");
        await loadCharacter(currentCharacter.id);
      } else {
        console.log("[Store] refreshing inventory only...");
        await refreshInventory();
      }
    } catch (err) {
      console.error("[Store] Error applying background items:", err);
      set({ error: (err as Error).message });
    }
  },

  removeInventoryItemByName: (name: string) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    const normalizedTarget = name.toLowerCase().trim();

    const newInventory = currentCharacter.inventory.filter((item) => {
      const itemName = (item.custom_name || "").toLowerCase().trim();
      return itemName !== normalizedTarget;
    });

    if (newInventory.length !== currentCharacter.inventory.length) {
      set({
        currentCharacter: {
          ...currentCharacter,
          inventory: newInventory,
        },
      });
    }
  },

  removeInventoryItemByItemId: (itemId: string) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    const newInventory = currentCharacter.inventory.filter(
      (item) => item.item_id !== itemId,
    );

    if (newInventory.length !== currentCharacter.inventory.length) {
      set({
        currentCharacter: {
          ...currentCharacter,
          inventory: newInventory,
        },
      });
    }
  },

  refreshInventory: async () => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    try {
      const inventory = await characterApi.getInventory(currentCharacter.id);
      set({
        currentCharacter: {
          ...currentCharacter,
          inventory,
        },
      });
    } catch (err) {
      set({ error: (err as Error).message });
    }
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
        spells: character.spells || [],
        modifiers: character.modifiers || [],
        feats: character.feats || [],
      }));
      set({ characters: migratedList, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteCharacter: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await characterApi.delete(id);
      const { currentCharacter } = get();
      if (currentCharacter?.id === id) {
        set({ currentCharacter: null });
      }
      await get().loadCharacterList();
      set({ isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  migrateLegacyInventory: async () => {
    const { currentCharacter, updateInventory, saveCharacter, updateMeta } =
      get();
    if (!currentCharacter) return;

    const meta = currentCharacter.meta;
    let migrated = false;

    // Mapping of legacy fields to container info
    const containerFields: Array<{
      key: keyof CharacterMeta;
      itemType: string;
      containerSlug?: string;
      fallbackName?: string;
    }> = [
      { key: "equipment_on_body_items", itemType: "core_item" }, // No container
      {
        key: "equipment_in_backpack_items",
        itemType: "core_item",
        containerSlug: "rucksack",
        fallbackName: "Rucksack",
      },
      {
        key: "equipment_on_pack_animal_items",
        itemType: "core_item",
        containerSlug: "lasttier",
        fallbackName: "Lasttier/-karren",
      },
      {
        key: "equipment_in_bag_of_holding_items",
        itemType: "core_magic_item",
        containerSlug: "nimmervoller_beutel",
        fallbackName: "Nimmervoller Beutel",
      },
      { key: "equipment_tool_items", itemType: "core_tool" },
    ];

    for (const field of containerFields) {
      const items = meta[field.key] as
        | Array<{ id: string; name: string; quantity: number }>
        | undefined;
      if (!items || items.length === 0) continue;

      console.log(`[Store] Migrating legacy field ${field.key}...`);
      let containerEntryId: string | undefined;

      // 1. Handle Container if needed
      if (field.containerSlug) {
        // Find or create the container item in the new inventory
        const existingContainer = currentCharacter.inventory.find(
          (i) => i.item_id === field.containerSlug,
        );
        if (existingContainer) {
          containerEntryId = existingContainer.id;
        } else {
          // Create the container item
          updateInventory(
            field.containerSlug,
            1,
            false,
            field.itemType,
            undefined,
            field.fallbackName,
          );
          // We need the ID of the newly created item.
          // Since updateInventory is synchronous in state but we just called it,
          // we should get the latest state.
          const updatedInv = get().currentCharacter?.inventory || [];
          const newContainer = updatedInv.find(
            (i) => i.item_id === field.containerSlug,
          );
          containerEntryId = newContainer?.id;
        }
      }

      // 2. Migrate items into the container
      for (const item of items) {
        // Check if item already exists in this container to avoid duplicates
        const exists = currentCharacter.inventory.some(
          (inv) =>
            inv.item_id === item.id && inv.container_id === containerEntryId,
        );

        if (!exists) {
          // If the ID is a UUID (likely a legacy custom item), use the label as custom_name
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              item.id,
            );
          const customName = isUuid ? item.name : undefined;

          updateInventory(
            item.id,
            item.quantity,
            false,
            field.itemType === "core_tool" ? "core_tool" : "core_item",
            containerEntryId,
            customName,
          );
        }
      }
      migrated = true;
    }

    if (migrated) {
      console.log(
        "[Store] Legacy equipment migrated with containers. Cleaning up meta...",
      );
      // Clear legacy fields
      updateMeta({
        equipment_on_body_items: [],
        equipment_in_backpack_items: [],
        equipment_on_pack_animal_items: [],
        equipment_in_bag_of_holding_items: [],
        equipment_tool_items: [],
      });
      await saveCharacter();
    }
  },

  refreshSpells: async () => {
    const { currentCharacter } = get();
    if (!currentCharacter) return;

    try {
      const spells = await characterApi.getSpells(currentCharacter.id);
      set({
        currentCharacter: {
          ...currentCharacter,
          spells,
        },
      });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  updateSpellPreparation: async (id, isPrepared) => {
    const { currentCharacter, refreshSpells } = get();
    if (!currentCharacter) return;

    try {
      // Optimistic update
      const nextSpells = currentCharacter.spells.map((s) =>
        s.id === id ? { ...s, is_prepared: isPrepared } : s,
      );
      set({ currentCharacter: { ...currentCharacter, spells: nextSpells } });

      await characterApi.updateSpellPreparation(id, isPrepared);
      await refreshSpells();
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  migrateLegacySpells: async () => {
    const { currentCharacter, saveCharacter, updateMeta } = get();
    if (!currentCharacter) return;

    const spellcasting = currentCharacter.spellcasting;
    if (!spellcasting) return;

    let migrated = false;

    // 1. Migrate prepared spells to the new character.spells array
    if (
      spellcasting.prepared_spells &&
      spellcasting.prepared_spells.length > 0
    ) {
      console.log("[Store] Migrating legacy prepared spells...");
      const existingIds = new Set(
        currentCharacter.spells.map((s) => s.spell_id),
      );

      const newSpells: CharacterSpell[] = [...currentCharacter.spells];
      for (const spellId of spellcasting.prepared_spells) {
        if (!existingIds.has(spellId)) {
          newSpells.push({
            id: crypto.randomUUID(),
            spell_id: spellId,
            is_prepared: true,
            is_always_prepared: false,
            source: "legacy_migration",
          });
        }
      }

      if (newSpells.length > currentCharacter.spells.length) {
        set({ currentCharacter: { ...currentCharacter, spells: newSpells } });
        migrated = true;
      }
    }

    // 2. Migrate spell slots to the new columns
    if (spellcasting.slots) {
      console.log("[Store] Migrating legacy spell slots...");
      const slotsToUpdate: Partial<CharacterMeta> = {};
      let slotsMigrated = false;

      for (let i = 1; i <= 9; i++) {
        const slotsRecord = spellcasting.slots as Record<
          string,
          { total?: number; used?: number }
        >;
        const slotData = slotsRecord[i];

        if (slotData) {
          if (slotData.total !== undefined) {
            const key = `spell_slots_${i}`;
            (slotsToUpdate as Record<string, unknown>)[key] = slotData.total;
            slotsMigrated = true;
          }
          if (slotData.used !== undefined) {
            const key = `spell_slots_used_${i}`;
            (slotsToUpdate as Record<string, unknown>)[key] = slotData.used;
            slotsMigrated = true;
          }
        }
      }

      if (slotsMigrated) {
        updateMeta(slotsToUpdate);
        migrated = true;
      }
    }

    if (migrated) {
      console.log("[Store] Legacy spells migrated. Cleaning up...");
      // We keep spellcasting for ability/save_dc/attack_bonus but clear prepared_spells and slots
      set({
        currentCharacter: {
          ...get().currentCharacter!,
          spellcasting: {
            ...spellcasting,
            prepared_spells: [],
            slots: {},
          },
        },
      });
      await saveCharacter();
    }
  },

  migrateLegacyStats: async () => {
    const { currentCharacter, saveCharacter } = get();
    if (!currentCharacter) return;

    // This is mainly to trigger sync_stats on the backend
    // Since attributes and health are always present (due to loadCharacter initialization),
    // a simple save will populate the new columns.
    console.log("[Store] Migrating legacy stats to relational columns...");
    await saveCharacter();
  },

  migrateLegacyFeatures: async () => {
    const { currentCharacter, saveCharacter } = get();
    if (!currentCharacter) return;

    // Similar to stats, saving will trigger sync_features on the backend
    console.log(
      "[Store] Migrating legacy features & proficiencies to relational tables...",
    );
    await saveCharacter();
  },

  migrateLegacyModifiers: async () => {
    const { currentCharacter, saveCharacter } = get();
    if (!currentCharacter) return;

    // Saving will trigger sync_modifiers on the backend
    console.log("[Store] Migrating legacy modifiers to relational table...");
    await saveCharacter();
  },
}));
