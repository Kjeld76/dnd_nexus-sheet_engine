import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCharacterStore } from "../lib/store";
import {
  Species,
  CharacterMeta,
  Tool,
  Background,
  Attributes,
} from "../lib/types";
import { CharacterSheetLayout } from "../components/character/CharacterSheetLayout";
import { AbilityScoreChoiceDialog } from "../components/character/AbilityScoreChoiceDialog";
import { BackgroundAbilityScoreDialog } from "../components/character/BackgroundAbilityScoreDialog";
import { ToolChoiceDialog } from "../components/character/ToolChoiceDialog";
import { StartingEquipmentDialog } from "../components/character/StartingEquipmentDialog";
import {
  Save,
  User,
  Wand2,
  Backpack,
  Book,
  ChevronLeft,
  Sparkles,
  Settings,
  Shield,
  Info,
} from "lucide-react";
import { PDFExportService } from "../lib/PDFExportService";
import { calculateLevelFromXP, getXPForNextLevel } from "../lib/math";
import { useCompendiumStore } from "../lib/compendiumStore";
import { InventoryTable } from "../components/character/InventoryTable";
import { CurrencyTable } from "../components/character/CurrencyTable";
import { EncumbranceBar } from "../components/character/EncumbranceBar";
import { SpellbookTable } from "../components/character/SpellbookTable";

// Helper function to extract tool name from tool data (handles multiple formats from Background data)
const getToolName = (tool: unknown): string | null => {
  if (!tool) return null;
  if (typeof tool === "string") return tool;
  if (typeof tool === "object" && tool !== null) {
    const maybeName = (tool as { name?: unknown }).name;
    if (typeof maybeName === "string" && maybeName.trim().length > 0)
      return maybeName;
  }
  return null;
};

type Subclass = { id: string; name: string };

// Helper function to normalize item names for comparison (removes spaces, hyphens, parentheses, etc.)
const normalizeItemName = (name: string | null | undefined): string => {
  if (!name || typeof name !== "string") {
    return "";
  }
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/\(/g, "")
    .replace(/\)/g, "")
    .trim();
};

// Helper function to find item by name (fuzzy matching)
type NamedItem = { name: string; id?: string };
const findItemByName = <T extends NamedItem>(
  itemName: string,
  items: T[],
): T | null => {
  if (!items || items.length === 0) return null;

  const normalized = normalizeItemName(itemName);

  // First try exact match (normalized)
  let item = items.find((i) => normalizeItemName(i.name) === normalized);
  if (item) {
    return item;
  }

  // Try contains match (item name contains search term or vice versa)
  item = items.find((i) => {
    if (!i?.name) return false;
    const normalizedItemName = normalizeItemName(i.name);
    return (
      normalizedItemName.includes(normalized) ||
      normalized.includes(normalizedItemName)
    );
  });
  if (item) {
    return item;
  }

  // Try partial word match (for items like "Buch (Gebete)" matching "Buch")
  const words = normalized.split(/\s+/);
  if (words.length > 0) {
    const firstWord = words[0];
    item = items.find((i) => {
      if (!i?.name) return false;
      const normalizedItemName = normalizeItemName(i.name);
      return (
        normalizedItemName.startsWith(firstWord) ||
        firstWord.startsWith(normalizedItemName.substring(0, firstWord.length))
      );
    });
    if (item) {
      return item;
    }
  }

  return null;
};

// Helper function to add items to inventory
// Helper function to add item with quantity, unit, and variant

const removeBackgroundItem = (
  itemName: string,
  updateMeta: (meta: Partial<CharacterMeta>) => void,
) => {
  const latestState = useCharacterStore.getState().currentCharacter;
  if (!latestState) return;

  const { items, tools, weapons, magicItems, armor } =
    useCharacterStore.getState() as any;

  // 1. Remove from new normalized inventory
  const baseNameForSearch = itemName.includes(" (")
    ? itemName.split(" (")[0]
    : itemName;
  const found =
    findItemByName(baseNameForSearch, items) ||
    findItemByName(baseNameForSearch, tools) ||
    findItemByName(baseNameForSearch, weapons) ||
    findItemByName(baseNameForSearch, magicItems) ||
    findItemByName(baseNameForSearch, armor);

  if (found && found.id) {
    useCharacterStore.getState().removeInventoryItemByItemId(found.id);
  } else {
    // Fallback: remove by name (for custom items/labels)
    useCharacterStore.getState().removeInventoryItemByName(itemName);
  }

  // 2. Remove from legacy meta lists (for fallback/safety)
  const normalizedTarget = normalizeItemName(itemName);
  const equipmentLists = [
    "equipment_on_body_items",
    "equipment_in_backpack_items",
    "equipment_on_pack_animal_items",
    "equipment_in_bag_of_holding_items",
    "equipment_tool_items",
  ] as const;

  equipmentLists.forEach((listKey) => {
    const currentItems = latestState.meta[listKey] || [];
    const filteredItems = currentItems.filter(
      (item) => normalizeItemName(item.name) !== normalizedTarget,
    );

    if (filteredItems.length !== currentItems.length) {
      updateMeta({ [listKey]: filteredItems });
    }
  });
};

export function CharacterSheet() {
  const currentCharacter = useCharacterStore((state) => state.currentCharacter);
  const setCurrentCharacter = useCharacterStore(
    (state) => state.setCurrentCharacter,
  );
  const updateAttribute = useCharacterStore((state) => state.updateAttribute);
  const updateMeta = useCharacterStore((state) => state.updateMeta);
  const updateAppearance = useCharacterStore((state) => state.updateAppearance);
  const updateProficiency = useCharacterStore(
    (state) => state.updateProficiency,
  );
  const removeModifier = useCharacterStore((state) => state.removeModifier);
  const addFeat = useCharacterStore((state) => state.addFeat);
  const removeFeat = useCharacterStore((state) => state.removeFeat);
  const saveCharacter = useCharacterStore((state) => state.saveCharacter);
  const handleUpdateAttribute = (key: string, value: number) => {
    if (!currentCharacter) return;
    if (
      Object.prototype.hasOwnProperty.call(currentCharacter.attributes, key)
    ) {
      updateAttribute(key as keyof Attributes, value);
    }
  };
  const updateInventory = useCharacterStore((state) => state.updateInventory);
  const isLoading = useCharacterStore((state) => state.isLoading);
  const migrateLegacyInventory = useCharacterStore(
    (state) => state.migrateLegacyInventory,
  );
  const migrateLegacySpells = useCharacterStore(
    (state) => state.migrateLegacySpells,
  );
  const migrateLegacyStats = useCharacterStore(
    (state) => state.migrateLegacyStats,
  );
  const migrateLegacyFeatures = useCharacterStore(
    (state) => state.migrateLegacyFeatures,
  );
  const migrateLegacyModifiers = useCharacterStore(
    (state) => state.migrateLegacyModifiers,
  );

  const weapons = useCompendiumStore((state) => state.weapons);
  const armor = useCompendiumStore((state) => state.armor);
  const items = useCompendiumStore((state) => state.items);
  const equipment = useCompendiumStore((state) => state.equipment);
  const tools = useCompendiumStore((state) => state.tools);
  const gear = useCompendiumStore((state) => state.gear);
  const magicItems = useCompendiumStore((state) => state.magicItems);
  const species = useCompendiumStore((state) => state.species);
  const classes = useCompendiumStore((state) => state.classes);
  const backgrounds = useCompendiumStore((state) => state.backgrounds);
  const feats = useCompendiumStore((state) => state.feats);
  const spells = useCompendiumStore((state) => state.spells);
  const fetchClasses = useCompendiumStore((state) => state.fetchClasses);
  const fetchSpecies = useCompendiumStore((state) => state.fetchSpecies);
  const fetchWeapons = useCompendiumStore((state) => state.fetchWeapons);
  const fetchArmor = useCompendiumStore((state) => state.fetchArmor);
  const fetchItems = useCompendiumStore((state) => state.fetchItems);
  const fetchEquipment = useCompendiumStore((state) => state.fetchEquipment);
  const fetchTools = useCompendiumStore((state) => state.fetchTools);
  const fetchGear = useCompendiumStore((state) => state.fetchGear);
  const fetchMagicItems = useCompendiumStore((state) => state.fetchMagicItems);
  const fetchBackgrounds = useCompendiumStore(
    (state) => state.fetchBackgrounds,
  );
  const fetchFeats = useCompendiumStore((state) => state.fetchFeats);
  const fetchSpells = useCompendiumStore((state) => state.fetchSpells);

  const calculateTotalWeight = useMemo(() => {
    if (!currentCharacter) return 0;

    return currentCharacter.inventory.reduce((total, invItem) => {
      // Filter out non-encumbering locations
      const loc = invItem.location || "Body";
      if (loc === "Mount" || loc === "MagicContainer") return total;

      // Find compendium item
      const id = invItem.item_id;
      const compendiumItem =
        weapons.find((w) => w.id === id) ||
        armor.find((a) => a.id === id) ||
        items.find((i) => i.id === id) ||
        tools.find((t) => t.id === id) ||
        gear.find((g) => g.id === id) ||
        magicItems.find((m) => m.id === id);

      let weight = 0;
      if (compendiumItem) {
        // Check for weight_kg property safely
        const w = (compendiumItem as any).weight_kg;
        if (typeof w === "number") weight = w;
      }

      return total + weight * invItem.quantity;
    }, 0);
  }, [
    currentCharacter?.inventory,
    weapons,
    armor,
    items,
    tools,
    equipment,
    gear,
    magicItems,
  ]);

  useEffect(() => {
    if (currentCharacter?.id) {
      migrateLegacyInventory();
      migrateLegacySpells();
      migrateLegacyStats();
      migrateLegacyFeatures();
      migrateLegacyModifiers();
    }
  }, [currentCharacter?.id]);

  useEffect(() => {
    if (!currentCharacter) return;
    const calculatedWeight = calculateTotalWeight;
    const currentWeight = currentCharacter.meta.total_weight_kg || 0;
    if (Math.abs(calculatedWeight - currentWeight) > 0.01)
      updateMeta({ total_weight_kg: calculatedWeight });
  }, [
    currentCharacter?.inventory,
    currentCharacter?.meta.equipment_on_body_items,
    currentCharacter?.meta.equipment_in_backpack_items,
    currentCharacter?.meta.equipment_tool_items,
    weapons,
    armor,
    items,
    equipment,
    tools,
    updateMeta,
    calculateTotalWeight,
  ]);

  useEffect(() => {
    fetchClasses();
    fetchSpecies();
    fetchWeapons();
    fetchArmor();
    fetchItems();
    fetchEquipment();
    fetchTools();
    fetchGear();
    fetchSpells();
    fetchMagicItems();
    fetchBackgrounds();
    fetchFeats();
  }, [
    fetchClasses,
    fetchSpecies,
    fetchWeapons,
    fetchArmor,
    fetchItems,
    fetchEquipment,
    fetchTools,
    fetchGear,
    fetchSpells,
    fetchMagicItems,
    fetchBackgrounds,
    fetchFeats,
  ]);

  const currentClass = classes.find(
    (c) => c.id === currentCharacter?.meta.class_id,
  );
  const subclasses: Subclass[] = Array.isArray(currentClass?.data?.subclasses)
    ? (currentClass?.data?.subclasses as Subclass[]).filter(
        (sc) => typeof sc?.id === "string" && typeof sc?.name === "string",
      )
    : [];
  const currentSpecies = species.find(
    (s) => s.id === currentCharacter?.meta.species_id,
  );
  const currentBackground = backgrounds.find(
    (bg) => bg.id === currentCharacter?.meta.background_id,
  );
  const prevBackgroundIdRef = useRef<string | undefined>(
    currentCharacter?.meta.background_id,
  );
  const backgroundEquipmentAppliedRef = useRef<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<
    "combat" | "spells" | "inventory" | "notes"
  >("combat");
  const [showAbilityChoiceDialog, setShowAbilityChoiceDialog] = useState(false);
  const [pendingSpecies, setPendingSpecies] = useState<Species | null>(null);
  const [showBackgroundAbilityDialog, setShowBackgroundAbilityDialog] =
    useState(false);
  const [pendingBackground, setPendingBackground] = useState<Background | null>(
    null,
  );
  const [showToolChoiceDialog, setShowToolChoiceDialog] = useState(false);
  const [pendingToolCategory, setPendingToolCategory] = useState<string | null>(
    null,
  );
  const [showStartingEquipmentDialog, setShowStartingEquipmentDialog] =
    useState(false);
  type StructuredItem = {
    name: string;
    quantity: number;
    unit: string | null;
    variant: string | null;
  };
  type StartingEquipmentOption = {
    label: string;
    items: Array<string | StructuredItem> | null;
    gold: number | null;
  };
  const [pendingStartingEquipment, setPendingStartingEquipment] = useState<
    StartingEquipmentOption[] | null
  >(null);
  const [startingEquipmentSource, setStartingEquipmentSource] = useState<
    "background" | "class"
  >("background");
  const prevClassIdRef = useRef<string | undefined>(
    currentCharacter?.meta.class_id,
  );

  const normalizeStartingEquipmentOptions = (
    options: unknown,
  ): StartingEquipmentOption[] => {
    if (!Array.isArray(options)) return [];
    return options
      .map((opt): StartingEquipmentOption | null => {
        if (!opt || typeof opt !== "object") return null;
        const o = opt as { label?: unknown; items?: unknown; gold?: unknown };
        const itemsRaw = Array.isArray(o.items) ? o.items : null;
        const items: Array<string | StructuredItem> | null = itemsRaw
          ? itemsRaw
              .map((it): string | StructuredItem | null => {
                if (typeof it === "string") return it;
                if (it && typeof it === "object") {
                  const obj = it as {
                    name?: unknown;
                    quantity?: unknown;
                    unit?: unknown;
                    variant?: unknown;
                  };
                  const name = typeof obj.name === "string" ? obj.name : "";
                  if (!name) return null;
                  return {
                    name,
                    quantity:
                      typeof obj.quantity === "number" &&
                      Number.isFinite(obj.quantity)
                        ? obj.quantity
                        : 1,
                    unit: typeof obj.unit === "string" ? obj.unit : null,
                    variant:
                      typeof obj.variant === "string" ? obj.variant : null,
                  };
                }
                return null;
              })
              .filter((x): x is string | StructuredItem => x !== null)
          : null;
        return {
          label: typeof o.label === "string" ? o.label : "",
          items,
          gold:
            typeof o.gold === "number" && Number.isFinite(o.gold)
              ? o.gold
              : null,
        };
      })
      .filter(
        (x): x is StartingEquipmentOption => x !== null && x.label !== "",
      );
  };

  useEffect(() => {
    if (!currentCharacter || !currentSpecies) return;
    const speciesData = currentSpecies.data;
    if (!speciesData) return;
    const oldSpeciesModifiers = currentCharacter.modifiers.filter((m) =>
      m.id.startsWith("species_"),
    );
    oldSpeciesModifiers.forEach((mod) => removeModifier(mod.id));
    if (speciesData.ability_score_increase) {
      const asi = speciesData.ability_score_increase;
      if (
        asi.type === "fixed" &&
        asi.fixed &&
        Object.keys(asi.fixed).length > 0
      ) {
        Object.entries(asi.fixed).forEach(([attr, value]) => {
          const attrMap: Record<string, keyof Attributes> = {
            str: "str",
            strength: "str",
            dex: "dex",
            dexterity: "dex",
            con: "con",
            constitution: "con",
            int: "int",
            intelligence: "int",
            wis: "wis",
            wisdom: "wis",
            cha: "cha",
            charisma: "cha",
          };
          const attrKey = attrMap[attr.toLowerCase()];
          const numValue =
            typeof value === "number" ? value : Number(value) || 0;
          if (attrKey && numValue > 0) {
            const currentValue = currentCharacter.attributes[attrKey];
            updateAttribute(attrKey, currentValue + numValue);
          }
        });
      } else if (
        asi.type === "choice" &&
        asi.choice &&
        asi.choice.count > 0 &&
        asi.choice.amount > 0
      ) {
        setPendingSpecies(currentSpecies);
        setShowAbilityChoiceDialog(true);
        return;
      }
    }
    if (speciesData.languages?.known) {
      const knownLanguages = speciesData.languages.known || [];
      const currentLanguages = currentCharacter.proficiencies.languages || [];
      const newLanguages = knownLanguages.filter(
        (lang: string) => !currentLanguages.includes(lang),
      );
      newLanguages.forEach((lang: string) =>
        updateProficiency("languages", lang, true),
      );
    }
  }, [
    currentCharacter?.meta.species_id,
    currentSpecies,
    updateAttribute,
    updateProficiency,
    removeModifier,
  ]);

  const handleAbilityChoiceConfirm = (choices: Record<string, number>) => {
    if (!pendingSpecies || !currentCharacter) return;
    Object.entries(choices).forEach(([attr, value]) => {
      if (value > 0) {
        const attrKey = attr as keyof typeof currentCharacter.attributes;
        const currentValue = currentCharacter.attributes[attrKey];
        updateAttribute(attrKey, currentValue + value);
      }
    });
    if (pendingSpecies.data?.languages?.known) {
      const knownLanguages = pendingSpecies.data.languages.known || [];
      const currentLanguages = currentCharacter.proficiencies.languages || [];
      const newLanguages = knownLanguages.filter(
        (lang: string) => !currentLanguages.includes(lang),
      );
      newLanguages.forEach((lang: string) =>
        updateProficiency("languages", lang, true),
      );
    }
    setShowAbilityChoiceDialog(false);
    setPendingSpecies(null);
  };

  const handleBackgroundAbilityConfirm = (choices: Record<string, number>) => {
    if (!pendingBackground || !currentCharacter) return;
    const updatedAttributes = { ...currentCharacter.attributes };
    Object.entries(choices).forEach(([attr, value]) => {
      if (value > 0) {
        const attrKey = attr as keyof typeof currentCharacter.attributes;
        const currentValue = currentCharacter.attributes[attrKey];
        const newValue = Math.min(currentValue + value, 20);
        updatedAttributes[attrKey] = newValue;
      }
    });
    Object.entries(updatedAttributes).forEach(([attr, value]) =>
      updateAttribute(attr as keyof typeof currentCharacter.attributes, value),
    );
    updateMeta({ background_ability_scores: choices });
    saveCharacter();
    setShowBackgroundAbilityDialog(false);
  };

  const handleToolChoiceConfirm = (selectedTool: Tool) => {
    if (!currentCharacter || !pendingToolCategory) return;
    if (!currentCharacter.proficiencies.tools.includes(selectedTool.name))
      updateProficiency("tools", selectedTool.name, true);
    const toolItem = findItemByName(selectedTool.name, tools);
    if (toolItem) {
      const existingTool = currentCharacter.inventory.find(
        (i) => i.item_id === toolItem.id,
      );
      if (!existingTool)
        updateInventory(
          toolItem.id,
          1,
          false,
          toolItem.source === "core" ? "core_tool" : "custom_tool",
        );
      const latestToolItems = currentCharacter.meta.equipment_tool_items || [];
      if (
        !latestToolItems.find(
          (item) =>
            normalizeItemName(item.name) === normalizeItemName(toolItem.name),
        )
      ) {
        updateMeta({
          equipment_tool_items: [
            ...latestToolItems,
            { id: crypto.randomUUID(), name: toolItem.name, quantity: 1 },
          ],
        });
      }
    }
    updateMeta({ background_tool_choice: selectedTool.name });
    saveCharacter();
    setShowToolChoiceDialog(false);
    setPendingToolCategory(null);
  };

  const handleStartingEquipmentConfirm = async (selectedOption: {
    label: string;
    items: Array<
      | string
      | {
          name: string;
          quantity?: number;
          unit?: string | null;
          variant?: string | null;
        }
    > | null;
    gold: number | null;
  }) => {
    if (!currentCharacter || !pendingStartingEquipment) return;
    const store = useCharacterStore.getState();

    if (startingEquipmentSource === "class") {
      // Handle Class Equipment via Backend
      try {
        await store.applyClassStartingEquipment(
          currentCharacter.meta.class_id!,
          selectedOption.label,
        );
      } catch (error) {
        console.error("Failed to apply class starting equipment", error);
      }
    } else {
      // Handle Background Equipment
      try {
        const itemsToAdd = selectedOption.items || [];
        const formattedItems = itemsToAdd.map((item) => {
          if (typeof item === "string") return { name: item, quantity: 1 };
          return { name: item.name, quantity: item.quantity || 1 };
        });

        const gold = selectedOption.gold || 0;

        await store.applyBackgroundStartingEquipment(formattedItems, gold);
      } catch (error) {
        console.error("Failed to apply background equipment", error);
      }
    }

    setShowStartingEquipmentDialog(false);
    setPendingStartingEquipment(null);
    if (pendingBackground) setPendingBackground(null);
  };

  // Class Change Effect
  useEffect(() => {
    if (!currentCharacter || !currentCharacter.meta.class_id) return;
    const currentClassId = currentCharacter.meta.class_id;

    if (prevClassIdRef.current && prevClassIdRef.current !== currentClassId) {
      // Class Changed -> Fetch Options
      invoke("get_class_starting_equipment_options", {
        classId: currentClassId,
      })
        .then((options: any) => {
          if (Array.isArray(options) && options.length > 0) {
            // Cast to compatible type
            setPendingStartingEquipment(options as StartingEquipmentOption[]);
            setStartingEquipmentSource("class");
            setShowStartingEquipmentDialog(true);
          }
        })
        .catch((err) =>
          console.error("Failed to fetch class equipment options", err),
        );
    }
    prevClassIdRef.current = currentClassId;
  }, [currentCharacter?.meta.class_id]);

  useEffect(() => {
    if (!currentCharacter || !backgrounds.length) return;
    const currentBackgroundId = currentCharacter.meta.background_id;
    const previousBackgroundId = prevBackgroundIdRef.current;

    const resetDialogs = () => {
      setShowBackgroundAbilityDialog(false);
      setShowToolChoiceDialog(false);
      setShowStartingEquipmentDialog(false);
    };

    const clearBackgroundMeta = () => {
      updateMeta({
        background_ability_scores: undefined,
        background_tool_choice: undefined,
        background_gold_granted: undefined,
        background_equipment_applied: undefined,
      });
    };

    const cleanupPreviousBackgroundEffects = (
      previousBackground: Background,
    ) => {
      const MIN_ATTRIBUTE_SCORE = 1;

      const oldBonuses = currentCharacter.meta.background_ability_scores;
      if (oldBonuses) {
        Object.entries(oldBonuses).forEach(([attr, rawValue]) => {
          if (typeof rawValue !== "number") return;
          const attrKey = attr as keyof typeof currentCharacter.attributes;
          updateAttribute(
            attrKey,
            Math.max(
              currentCharacter.attributes[attrKey] - rawValue,
              MIN_ATTRIBUTE_SCORE,
            ),
          );
        });
      }

      const oldFeatName = previousBackground.data?.feat;
      if (typeof oldFeatName === "string") {
        const feat = feats.find(
          (f) => f.name.toUpperCase() === oldFeatName.toUpperCase(),
        );
        if (feat && currentCharacter.feats.includes(feat.id)) {
          removeFeat(feat.id);
        }
      }

      const oldSkills = previousBackground.data?.skills;
      if (Array.isArray(oldSkills)) {
        oldSkills.forEach((skill) => {
          if (typeof skill !== "string") return;
          if (currentCharacter.proficiencies.skills.includes(skill)) {
            updateProficiency("skills", skill, false);
          }
        });
      }

      // Clear legacy/manual items
      useCharacterStore
        .getState()
        .applyBackgroundStartingEquipment([], 0, false);

      const oldToolName = getToolName(previousBackground.data?.tool);
      const choiceToolName = currentCharacter.meta.background_tool_choice;
      const toolToRemove = choiceToolName || oldToolName;
      if (toolToRemove) {
        if (currentCharacter.proficiencies.tools.includes(toolToRemove)) {
          updateProficiency("tools", toolToRemove, false);
        }
        removeBackgroundItem(toolToRemove, updateMeta);
      }

      const oldEquipment = previousBackground.data?.starting_equipment;
      if (oldEquipment) {
        const itemsToRemove = new Set<string>();
        if (oldEquipment.options) {
          const normalized = normalizeStartingEquipmentOptions(
            oldEquipment.options,
          );
          normalized.forEach((opt) => {
            opt.items?.forEach((i) => {
              itemsToRemove.add(typeof i === "string" ? i : i.name);
            });
          });
        } else if (oldEquipment.items) {
          oldEquipment.items.forEach((i: string) => itemsToRemove.add(i));
        }
        itemsToRemove.forEach((name) => removeBackgroundItem(name, updateMeta));
      }
    };

    const rollbackGoldIfNeeded = () => {
      const granted = currentCharacter.meta.background_gold_granted;
      if (!granted) return;
      const currentGold = currentCharacter.meta.currency_gold || 0;
      updateMeta({
        currency_gold: Math.max(0, currentGold - granted),
      });
    };

    const onBackgroundChanged = () => {
      console.log(
        "Background Changed Logic Triggered. Previous:",
        previousBackgroundId,
        "Current:",
        currentBackgroundId,
      );
      resetDialogs();
      const previousBackground = backgrounds.find(
        (bg) => bg.id === previousBackgroundId,
      );
      if (previousBackground?.data) {
        cleanupPreviousBackgroundEffects(previousBackground);
      }
      rollbackGoldIfNeeded();
      clearBackgroundMeta();

      prevBackgroundIdRef.current = currentBackgroundId;
      backgroundEquipmentAppliedRef.current.delete(previousBackgroundId || "");
      if (currentBackgroundId) {
        backgroundEquipmentAppliedRef.current.delete(currentBackgroundId);
      }
    };

    if (previousBackgroundId && previousBackgroundId !== currentBackgroundId) {
      onBackgroundChanged();
      return;
    }

    if (!currentBackground || !currentBackground.data) return;
    if (
      showBackgroundAbilityDialog ||
      showToolChoiceDialog ||
      showStartingEquipmentDialog
    )
      return;

    const backgroundData = currentBackground.data;
    const maybeOpenBackgroundDialogs = (): boolean => {
      const needsAbilityScores =
        backgroundData.ability_scores &&
        Array.isArray(backgroundData.ability_scores) &&
        backgroundData.ability_scores.length === 3 &&
        !currentCharacter.meta.background_ability_scores;
      if (needsAbilityScores) {
        setPendingBackground(currentBackground);
        setShowBackgroundAbilityDialog(true);
        return true;
      }

      const toolData = backgroundData.tool;
      const needsToolChoice =
        toolData &&
        typeof toolData === "object" &&
        toolData.type === "choice" &&
        !currentCharacter.meta.background_tool_choice;
      if (needsToolChoice) {
        setPendingBackground(currentBackground);
        setPendingToolCategory(
          typeof toolData.category === "string" ? toolData.category : null,
        );
        setShowToolChoiceDialog(true);
        return true;
      }

      const options = backgroundData.starting_equipment?.options;
      const needsEquipmentChoice =
        options &&
        Array.isArray(options) &&
        options.length > 0 &&
        !currentCharacter.meta.background_equipment_applied;
      if (needsEquipmentChoice) {
        setPendingBackground(currentBackground);
        const normalized = normalizeStartingEquipmentOptions(options);
        setPendingStartingEquipment(normalized);
        setShowStartingEquipmentDialog(true);
        return true;
      }

      return false;
    };

    if (maybeOpenBackgroundDialogs()) return;

    if (backgroundData.skills && Array.isArray(backgroundData.skills)) {
      backgroundData.skills.forEach((s: string) => {
        if (!currentCharacter.proficiencies.skills.includes(s))
          updateProficiency("skills", s, true);
      });
    }
    if (backgroundData.feat && typeof backgroundData.feat === "string") {
      const matchingFeat = feats.find(
        (f) =>
          f.name.toUpperCase() ===
          (backgroundData.feat as string).toUpperCase(),
      );
      if (matchingFeat && !currentCharacter.feats.includes(matchingFeat.id))
        addFeat(matchingFeat.id);
    }
    const fixedToolName = getToolName(backgroundData.tool);
    if (
      fixedToolName &&
      (typeof backgroundData.tool !== "object" ||
        backgroundData.tool.type !== "choice")
    ) {
      if (!currentCharacter.proficiencies.tools.includes(fixedToolName))
        updateProficiency("tools", fixedToolName, true);
      const toolItem = findItemByName(fixedToolName, tools);
      if (toolItem) {
        if (
          !currentCharacter.inventory.find((i) => i.item_id === toolItem.id)
        ) {
          updateInventory(toolItem.id, 1, false);
        }
        const latestToolItems =
          currentCharacter.meta.equipment_tool_items || [];
        if (
          !latestToolItems.find(
            (item) =>
              normalizeItemName(item.name) === normalizeItemName(toolItem.name),
          )
        ) {
          updateMeta({
            equipment_tool_items: [
              ...latestToolItems,
              { id: crypto.randomUUID(), name: toolItem.name, quantity: 1 },
            ],
          });
        }
      }
    }
    if (!currentCharacter.meta.background_equipment_applied) {
      updateMeta({ background_equipment_applied: true });
      saveCharacter();
    }
  }, [
    currentCharacter?.meta.background_id,
    currentCharacter?.meta.background_ability_scores,
    currentCharacter?.meta.background_tool_choice,
    currentCharacter?.meta.background_gold_granted,
    currentCharacter?.meta.background_equipment_applied,
    currentBackground,
    backgrounds,
    feats,
    items,
    tools,
    updateProficiency,
    addFeat,
    removeFeat,
    updateInventory,
    updateMeta,
    showBackgroundAbilityDialog,
    showToolChoiceDialog,
    showStartingEquipmentDialog,
    saveCharacter,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveCharacter();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveCharacter]);

  const handleExportPDF = useCallback(async () => {
    if (!currentCharacter || !currentClass || !currentSpecies) return;

    try {
      const service = new PDFExportService(
        currentCharacter,
        currentClass,
        currentSpecies,
        spells,
      );
      const pdfBytes = await service.generatePDF();
      await invoke("save_pdf_bytes", {
        name: currentCharacter.meta.name,
        bytes: Array.from(pdfBytes),
      });
    } catch (error) {
      console.error("PDF Export failed:", error);
    }
  }, [currentCharacter, currentClass, currentSpecies, spells]);

  useEffect(() => {
    const unlisten = listen("menu-export-pdf", handleExportPDF);
    return () => {
      unlisten.then((f) => f());
    };
  }, [handleExportPDF]);

  if (!currentCharacter) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 opacity-30">
          <User size={80} strokeWidth={1} />
          <p className="text-xl font-black uppercase tracking-widest italic">
            Kein Charakter geladen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background text-foreground p-4 pb-20 transition-colors duration-500 overflow-y-auto custom-scrollbar relative">
      <header className="w-full mb-6 glass-panel border-b border-border/50">
        <div className="flex flex-col lg:flex-row items-center justify-between p-5 gap-5">
          <div className="flex items-center gap-8 w-full lg:w-auto">
            <button
              onClick={() => setCurrentCharacter(null)}
              className="p-5 bg-muted rounded-3xl transition-all text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border active:scale-90"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <div className="flex items-center gap-6 border-l-2 border-border pl-6 overflow-hidden">
              <div className="relative group shrink-0">
                <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-4 bg-primary text-primary-foreground rounded-xl shadow-xl shadow-primary/20 relative">
                  <User className="w-8 h-8" />
                  <Sparkles
                    size={20}
                    className="absolute -top-2 -right-2 text-white animate-pulse"
                  />
                </div>
              </div>
              <div className="overflow-hidden flex-1">
                <input
                  type="text"
                  value={currentCharacter.meta.name}
                  onChange={(e) => updateMeta({ name: e.target.value })}
                  onBlur={() => saveCharacter()}
                  className="w-full text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter truncate font-serif italic text-foreground leading-none mb-2 bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 -ml-2 transition-all"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-primary/10 px-4 py-1 rounded-lg">
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-primary">
                      Stufe {calculateLevelFromXP(currentCharacter.meta.xp)}
                    </span>
                    <div className="h-4 w-px bg-primary/20 mx-2" />
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-primary/60">
                      XP
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={currentCharacter.meta.xp}
                      onChange={(e) => {
                        const newXp = parseInt(e.target.value) || 0;
                        const newLevel = calculateLevelFromXP(newXp);
                        updateMeta({ xp: newXp, level: newLevel });
                      }}
                      onBlur={() => saveCharacter()}
                      className="bg-transparent text-primary font-black text-base w-20 border-none outline-none focus:ring-0"
                    />
                    {getXPForNextLevel(
                      calculateLevelFromXP(currentCharacter.meta.xp),
                    ) && (
                      <span className="text-sm font-bold text-primary/30 ml-1">
                        /{" "}
                        {getXPForNextLevel(
                          calculateLevelFromXP(currentCharacter.meta.xp),
                        )}{" "}
                        bis Level Up
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-lg border border-border/50">
                    <select
                      value={currentCharacter.meta.class_id || ""}
                      onChange={(e) => {
                        updateMeta({
                          class_id: e.target.value,
                          subclass_id: undefined,
                        });
                        setTimeout(saveCharacter, 100);
                      }}
                      className="bg-transparent text-sm font-bold uppercase tracking-wider text-foreground/70 outline-none border-none cursor-pointer hover:text-primary transition-colors"
                    >
                      <option value="" disabled className="bg-card">
                        Klasse wählen
                      </option>
                      {classes.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          className="bg-card text-foreground"
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {currentClass && subclasses.length > 0 && (
                      <>
                        <div className="w-1 h-1 bg-foreground/20 rounded-full" />
                        <select
                          value={currentCharacter.meta.subclass_id || ""}
                          onChange={(e) => {
                            updateMeta({ subclass_id: e.target.value });
                            setTimeout(saveCharacter, 100);
                          }}
                          className="bg-transparent text-sm font-bold uppercase tracking-wider text-foreground/70 outline-none border-none cursor-pointer hover:text-primary transition-colors"
                        >
                          <option value="" className="bg-card">
                            Unterklasse wählen
                          </option>
                          {subclasses.map((s) => (
                            <option
                              key={s.id}
                              value={s.id}
                              className="bg-card text-foreground"
                            >
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                    <div className="w-1 h-1 bg-foreground/20 rounded-full" />
                    <select
                      value={currentCharacter.meta.species_id || ""}
                      onChange={(e) => {
                        updateMeta({ species_id: e.target.value });
                        setTimeout(saveCharacter, 100);
                      }}
                      className="bg-transparent text-sm font-bold uppercase tracking-wider text-foreground/70 outline-none border-none cursor-pointer hover:text-primary transition-colors"
                    >
                      <option value="" disabled className="bg-card">
                        Volk wählen
                      </option>
                      {species.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          className="bg-card text-foreground"
                        >
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button className="p-4 rounded-2xl bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all">
              <Settings size={24} />
            </button>
            <button
              onClick={() => saveCharacter()}
              disabled={isLoading}
              className="flex-1 lg:flex-none flex items-center justify-center gap-4 bg-primary text-primary-foreground px-10 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.1em] transition-all shadow-2xl shadow-primary/20 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-6 h-6" />
              <span>{isLoading ? "Speichert..." : "Sichern"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 px-4 pb-4 border-t border-border/30 pt-4">
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Spieler
          </label>
          <input
            type="text"
            value={currentCharacter.meta.player_name || ""}
            onChange={(e) => updateMeta({ player_name: e.target.value })}
            onBlur={() => saveCharacter()}
            placeholder="Spielername"
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all truncate"
          />
        </div>
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Alter
          </label>
          <input
            type="text"
            value={currentCharacter.appearance?.age || ""}
            onChange={(e) => updateAppearance({ age: e.target.value })}
            onBlur={() => saveCharacter()}
            placeholder="Alter"
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all truncate"
          />
        </div>
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Geschlecht
          </label>
          <select
            value={currentCharacter.meta.gender || ""}
            onChange={(e) => {
              updateMeta({ gender: e.target.value || undefined });
              saveCharacter();
            }}
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-foreground/80 cursor-pointer hover:text-primary transition-colors focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 truncate"
          >
            <option value="" className="bg-card">
              —
            </option>
            <option value="männlich" className="bg-card">
              Männlich
            </option>
            <option value="weiblich" className="bg-card">
              Weiblich
            </option>
            <option value="divers" className="bg-card">
              Divers
            </option>
          </select>
        </div>
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Herkunft
          </label>
          <select
            value={currentCharacter.meta.background_id || ""}
            onChange={(e) => {
              console.log("Background Selection Changed to:", e.target.value);
              updateMeta({ background_id: e.target.value });
              saveCharacter();
            }}
            className="w-full bg-transparent text-xs sm:text-sm font-medium text-foreground/80 outline-none border-none cursor-pointer hover:text-primary transition-colors truncate"
          >
            <option value="" disabled className="bg-card">
              Hintergrund wählen
            </option>
            {backgrounds.map((bg) => (
              <option
                key={bg.id}
                value={bg.id}
                className="bg-card text-foreground"
              >
                {bg.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Gesinnung
          </label>
          <select
            value={currentCharacter.meta.alignment || ""}
            onChange={(e) => updateMeta({ alignment: e.target.value })}
            onBlur={() => saveCharacter()}
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-foreground/80 cursor-pointer hover:text-primary transition-colors focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 truncate"
          >
            <option value="" className="bg-card">
              —
            </option>
            <option value="RG" className="bg-card">
              RG (Rechtschaffen Gut)
            </option>
            <option value="NG" className="bg-card">
              NG (Neutral Gut)
            </option>
            <option value="CG" className="bg-card">
              CG (Chaotisch Gut)
            </option>
            <option value="RN" className="bg-card">
              RN (Rechtschaffen Neutral)
            </option>
            <option value="N" className="bg-card">
              N (Neutral)
            </option>
            <option value="CN" className="bg-card">
              CN (Chaotisch Neutral)
            </option>
            <option value="RB" className="bg-card">
              RB (Rechtschaffen Böse)
            </option>
            <option value="NB" className="bg-card">
              NB (Neutral Böse)
            </option>
            <option value="CB" className="bg-card">
              CB (Chaotisch Böse)
            </option>
          </select>
        </div>
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Glaube
          </label>
          <input
            type="text"
            value={currentCharacter.meta.faith || ""}
            onChange={(e) => updateMeta({ faith: e.target.value })}
            onBlur={() => saveCharacter()}
            placeholder="Glaube/Religion"
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all truncate"
          />
        </div>
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Augen
          </label>
          <input
            type="text"
            value={currentCharacter.appearance?.eyes || ""}
            onChange={(e) => updateAppearance({ eyes: e.target.value })}
            onBlur={() => saveCharacter()}
            placeholder="Augenfarbe"
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all truncate"
          />
        </div>
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Haare
          </label>
          <input
            type="text"
            value={currentCharacter.appearance?.hair || ""}
            onChange={(e) => updateAppearance({ hair: e.target.value })}
            onBlur={() => saveCharacter()}
            placeholder="Haarfarbe"
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all truncate"
          />
        </div>
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Haut
          </label>
          <input
            type="text"
            value={currentCharacter.appearance?.skin || ""}
            onChange={(e) => updateAppearance({ skin: e.target.value })}
            onBlur={() => saveCharacter()}
            placeholder="Hautfarbe"
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all truncate"
          />
        </div>
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Größe
          </label>
          <input
            type="text"
            value={currentCharacter.appearance?.height || ""}
            onChange={(e) => updateAppearance({ height: e.target.value })}
            onBlur={() => saveCharacter()}
            placeholder={
              currentCharacter.meta.use_metric ? "Größe (cm)" : "Größe (ft/in)"
            }
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all truncate"
          />
        </div>
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Gewicht
          </label>
          <input
            type="text"
            value={currentCharacter.appearance?.weight || ""}
            onChange={(e) => updateAppearance({ weight: e.target.value })}
            onBlur={() => saveCharacter()}
            placeholder={
              currentCharacter.meta.use_metric
                ? "Gewicht (kg)"
                : "Gewicht (lbs)"
            }
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all truncate"
          />
        </div>
        <div className="flex flex-col min-w-[120px] space-y-1">
          <label className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Größenkat.
          </label>
          <span className="w-full text-xs sm:text-sm font-medium text-foreground/80 px-2 py-1 truncate">
            {(() => {
              const size = currentSpecies?.data?.size;
              if (!size) return "Mittel";
              const sizeMap: Record<string, string> = {
                Small: "Klein",
                Medium: "Mittel",
                Large: "Groß",
                Tiny: "Winzig",
                Huge: "Riesig",
                Gargantuan: "Gigantisch",
              };
              return sizeMap[size] || size;
            })()}
          </span>
        </div>
      </div>
      <div className="w-full mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab("combat")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${activeTab === "combat" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"}`}
        >
          <Shield className="w-5 h-5" />
          Kampf
        </button>
        <button
          onClick={() => setActiveTab("spells")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${activeTab === "spells" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"}`}
        >
          <Wand2 className="w-5 h-5" />
          Zauber
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${activeTab === "inventory" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"}`}
        >
          <Backpack className="w-5 h-5" />
          Inventar
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${activeTab === "notes" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"}`}
        >
          <Book className="w-5 h-5" />
          Notizen
        </button>
      </div>
      <main className="w-full p-4">
        {activeTab === "combat" && (
          <CharacterSheetLayout
            character={currentCharacter}
            characterClass={classes.find(
              (c) => c.id === currentCharacter.meta.class_id,
            )}
            characterSpecies={currentSpecies}
            weapons={weapons}
            armor={armor}
            feats={feats}
            backgrounds={backgrounds}
            onUpdateAttribute={handleUpdateAttribute}
            onUpdateMeta={updateMeta}
            onSaveCharacter={saveCharacter}
            onRemoveFeat={removeFeat}
            onRemoveModifier={removeModifier}
          />
        )}
        {activeTab === "spells" && (
          <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="bg-card p-6 rounded-[2rem] border-2 border-border shadow-lg">
              <h3 className="text-2xl font-black uppercase tracking-wider text-muted-foreground mb-6">
                ZAUBERBUCH
              </h3>
              <SpellbookTable />
            </div>
          </div>
        )}
        {activeTab === "inventory" && (
          <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="bg-card p-6 rounded-[2rem] border-2 border-border shadow-lg">
              <h3 className="text-2xl font-black uppercase tracking-wider text-muted-foreground mb-6">
                AUSRÜSTUNG & INVENTAR
              </h3>
              <div className="mt-8">
                <InventoryTable
                  character={currentCharacter}
                  gear={gear}
                  tools={tools}
                  items={items}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-6 border-t border-border">
                <div className="lg:col-span-3 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-black uppercase tracking-wider text-muted-foreground block">
                        GESAMTGEWICHT
                      </label>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-muted-foreground/50 cursor-help hover:text-primary transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-card border-2 border-primary/30 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                          <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                            Berechnete Bereiche:
                          </p>
                          <ul className="text-[11px] space-y-1 text-foreground/80 list-disc list-inside">
                            <li>Ausrüstung Am Körper</li>
                            <li>Inhalt des Rucksacks</li>
                            <li>Alle Werkzeuge</li>
                            <li>Ausgerüstete Waffen & Rüstungen</li>
                          </ul>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-primary/30" />
                        </div>
                      </div>
                    </div>
                    {/* Currency & Encumbrance Section */}
                    <div className="bg-card/50 p-6 rounded-[2rem] border-2 border-border/50 shadow-sm space-y-8 animate-in slide-in-from-top-4 duration-500">
                      <EncumbranceBar />
                      <CurrencyTable />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "notes" && (
          <div className="p-20 text-center bg-card rounded-[4rem] border-2 border-border animate-in fade-in duration-500">
            <Book size={80} className="mx-auto mb-8 text-primary opacity-20" />
            <h2 className="text-4xl font-black italic font-serif mb-4 text-foreground">
              Notizen
            </h2>
            <p className="text-muted-foreground italic">
              Halte deine Abenteuer und Geheimnisse fest.
            </p>
          </div>
        )}
      </main>
      {showAbilityChoiceDialog && pendingSpecies && currentCharacter && (
        <AbilityScoreChoiceDialog
          species={pendingSpecies!}
          currentAttributes={currentCharacter.attributes}
          onConfirm={handleAbilityChoiceConfirm}
          onCancel={() => {
            setShowAbilityChoiceDialog(false);
            setPendingSpecies(null);
          }}
        />
      )}
      {showBackgroundAbilityDialog &&
        pendingBackground &&
        currentCharacter &&
        pendingBackground.data?.ability_scores && (
          <BackgroundAbilityScoreDialog
            backgroundName={pendingBackground.name}
            abilityScores={pendingBackground.data!.ability_scores!}
            currentAttributes={currentCharacter.attributes}
            onConfirm={handleBackgroundAbilityConfirm}
            onCancel={() => {
              setShowBackgroundAbilityDialog(false);
              setPendingBackground(null);
            }}
          />
        )}
      {showToolChoiceDialog && pendingToolCategory && (
        <ToolChoiceDialog
          backgroundName={currentBackground?.name || ""}
          toolCategory={pendingToolCategory!}
          availableTools={tools}
          onConfirm={handleToolChoiceConfirm}
          onCancel={() => {
            setShowToolChoiceDialog(false);
            setPendingToolCategory(null);
          }}
        />
      )}
      {showStartingEquipmentDialog && pendingStartingEquipment && (
        <StartingEquipmentDialog
          backgroundName={currentBackground?.name || ""}
          options={pendingStartingEquipment!}
          onConfirm={handleStartingEquipmentConfirm}
          onCancel={() => {
            setShowStartingEquipmentDialog(false);
            setPendingStartingEquipment(null);
          }}
        />
      )}
    </div>
  );
}
