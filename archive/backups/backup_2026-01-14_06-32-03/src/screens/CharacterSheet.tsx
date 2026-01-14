import { useEffect, useState, useRef } from "react";
import { useCharacterStore } from "../lib/store";
import { Species, Character, CharacterMeta } from "../lib/types";
import { AttributeBlock } from "../components/character/AttributeBlock";
import { SkillList } from "../components/character/SkillList";
import { CombatStats } from "../components/character/CombatStats";
import { ModifiersList } from "../components/character/ModifiersList";
import { FeatsList } from "../components/character/FeatsList";
import { SpeciesTraits } from "../components/character/SpeciesTraits";
import { WeaponsTable } from "../components/character/WeaponsTable";
import { ArmorTable } from "../components/character/ArmorTable";
import { HPManagement } from "../components/character/HPManagement";
import { CharacterSheetLayout } from "../components/character/CharacterSheetLayout";
import { AbilityScoreChoiceDialog } from "../components/character/AbilityScoreChoiceDialog";
import { BackgroundAbilityScoreDialog } from "../components/character/BackgroundAbilityScoreDialog";
import { ToolChoiceDialog } from "../components/character/ToolChoiceDialog";
import { StartingEquipmentDialog } from "../components/character/StartingEquipmentDialog";
import { logger } from "../lib/logger";
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
} from "lucide-react";
import { calculateLevelFromXP, getXPForNextLevel } from "../lib/math";
import { useCompendiumStore } from "../lib/compendiumStore";
import { EquipmentList } from "../components/character/EquipmentList";

// Helper function to extract tool name from tool data (handles both string and object formats)
const getToolName = (tool: any): string | null => {
  if (!tool) return null;
  if (typeof tool === "string") return tool;
  if (typeof tool === "object" && tool.name) return tool.name;
  return null;
};

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
const findItemByName = (itemName: string, items: any[]): any | null => {
  if (!items || items.length === 0) return null;

  const normalized = normalizeItemName(itemName);

  // First try exact match (normalized)
  let item = items.find((i) => normalizeItemName(i.name) === normalized);
  if (item) {
    console.log(`   ✓ Exact match found: "${item.name}" for "${itemName}"`);
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
    console.log(`   ✓ Contains match found: "${item.name}" for "${itemName}"`);
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
      console.log(
        `   ✓ Partial word match found: "${item.name}" for "${itemName}"`,
      );
      return item;
    }
  }

  console.log(`   ✗ No match found for "${itemName}"`);
  return null;
};

// Helper function to add items to inventory
const addItemToInventory = (
  itemName: string,
  items: any[],
  equipment: any[],
  tools: any[],
  weapons: any[],
  currentCharacter: Character,
  updateInventory: (
    itemId: string,
    quantity: number,
    isEquipped: boolean,
  ) => void,
  updateMeta: (meta: Partial<CharacterMeta>) => void,
  saveCharacter: () => void,
) => {
  console.log("🔍 Processing item:", itemName);

  // Get fresh state to avoid stale closures - MUST be done for each item
  const freshState = useCharacterStore.getState().currentCharacter;
  const freshCharacter = freshState || currentCharacter;
  const currentBodyItems = freshCharacter.meta.equipment_on_body_items || [];

  // Helper to add to body items with fresh state check
  const addToBodyItems = (nameToAdd: string) => {
    const latestState = useCharacterStore.getState().currentCharacter;
    const latestBodyItems = latestState?.meta.equipment_on_body_items || [];
    const existingBodyItem = latestBodyItems.find(
      (bodyItem) =>
        normalizeItemName(bodyItem.name) === normalizeItemName(nameToAdd),
    );
    if (!existingBodyItem) {
      updateMeta({
        equipment_on_body_items: [
          ...latestBodyItems,
          {
            id: crypto.randomUUID(),
            name: nameToAdd,
            quantity: 1,
          },
        ],
      });
      console.log("✅ Added to 'Am Körper':", nameToAdd);
      return true;
    } else {
      console.log("⚠️ Already on body:", nameToAdd);
      return false;
    }
  };

  // Try to find in items
  const item = findItemByName(itemName, items);
  if (item) {
    const existingItem = freshCharacter.inventory.find(
      (inv) => inv.item_id === item.id,
    );
    if (!existingItem) {
      console.log(
        "✅ Adding item to inventory:",
        item.name,
        "(matched:",
        itemName,
        ")",
      );
      updateInventory(item.id, 1, false);
      addToBodyItems(item.name);
      saveCharacter();
      return;
    } else {
      console.log("⚠️ Item already in inventory:", item.name);
      // Still add to body if not there
      addToBodyItems(item.name);
      return;
    }
  }

  // Try to find in tools
  const tool = findItemByName(itemName, tools);
  if (tool) {
    const existingTool = freshCharacter.inventory.find(
      (inv) => inv.item_id === tool.id,
    );
    if (!existingTool) {
      console.log(
        "✅ Adding tool to inventory:",
        tool.name,
        "(matched:",
        itemName,
        ")",
      );
      updateInventory(tool.id, 1, false);
      addToBodyItems(tool.name);
      saveCharacter();
      return;
    } else {
      console.log("⚠️ Tool already in inventory:", tool.name);
      // Still add to body if not there
      addToBodyItems(tool.name);
      return;
    }
  }

  // Try to find in weapons (e.g., "Sichel")
  const weapon = findItemByName(itemName, weapons);
  if (weapon) {
    const existingWeapon = freshCharacter.inventory.find(
      (inv) => inv.item_id === weapon.id,
    );
    if (!existingWeapon) {
      console.log(
        "✅ Adding weapon to inventory:",
        weapon.name,
        "(matched:",
        itemName,
        ")",
      );
      updateInventory(weapon.id, 1, false);
      addToBodyItems(weapon.name);
      saveCharacter();
      return;
    } else {
      console.log("⚠️ Weapon already in inventory:", weapon.name);
      // Still add to body if not there
      addToBodyItems(weapon.name);
      return;
    }
  }

  // Try to find in equipment packages
  const equip = findItemByName(itemName, equipment);
  if (equip) {
    console.log("✅ Found equipment package:", equip.name);
    const currentBodyItems =
      currentCharacter.meta.equipment_on_body_items || [];

    // Add equipment package items to inventory
    if (equip.items && Array.isArray(equip.items)) {
      equip.items.forEach(
        (equipItem: { item_id: string; quantity: number }) => {
          const existingItem = currentCharacter.inventory.find(
            (inv) => inv.item_id === equipItem.item_id,
          );
          if (!existingItem) {
            updateInventory(equipItem.item_id, equipItem.quantity, false);

            // Find item name from compendium
            const foundItem = items.find((i) => i.id === equipItem.item_id);
            if (foundItem) {
              const existingBodyItem = currentBodyItems.find(
                (bodyItem) =>
                  normalizeItemName(bodyItem.name) ===
                  normalizeItemName(foundItem.name),
              );
              if (!existingBodyItem) {
                updateMeta({
                  equipment_on_body_items: [
                    ...currentBodyItems,
                    {
                      id: crypto.randomUUID(),
                      name: foundItem.name,
                      quantity: equipItem.quantity,
                    },
                  ],
                });
                console.log(
                  "✅ Added equipment package item to 'Am Körper':",
                  foundItem.name,
                );
              }
            }
            saveCharacter();
          }
        },
      );
    }
    // Also add tools from equipment package
    if (equip.tools && Array.isArray(equip.tools)) {
      equip.tools.forEach(
        (equipTool: { tool_id: string; quantity: number }) => {
          const existingTool = currentCharacter.inventory.find(
            (inv) => inv.item_id === equipTool.tool_id,
          );
          if (!existingTool) {
            updateInventory(equipTool.tool_id, equipTool.quantity, false);

            // Find tool name from compendium
            const foundTool = tools.find((t) => t.id === equipTool.tool_id);
            if (foundTool) {
              const existingBodyItem = currentBodyItems.find(
                (bodyItem) =>
                  normalizeItemName(bodyItem.name) ===
                  normalizeItemName(foundTool.name),
              );
              if (!existingBodyItem) {
                updateMeta({
                  equipment_on_body_items: [
                    ...currentBodyItems,
                    {
                      id: crypto.randomUUID(),
                      name: foundTool.name,
                      quantity: equipTool.quantity,
                    },
                  ],
                });
                console.log(
                  "✅ Added equipment package tool to 'Am Körper':",
                  foundTool.name,
                );
              }
            }
            saveCharacter();
          }
        },
      );
    }
    return;
  }

  // Fallback: Add as text item to equipment_on_body_items (Am Körper)
  console.log(
    "⚠️ Item not found in compendium, adding as text item to body:",
    itemName,
  );
  console.log(
    "   Available items in compendium:",
    items
      .filter((i) => i?.name)
      .map((i) => i.name)
      .slice(0, 10)
      .join(", "),
    "...",
  );
  console.log(
    "   Available tools in compendium:",
    tools
      .filter((t) => t?.name)
      .map((t) => t.name)
      .slice(0, 10)
      .join(", "),
    "...",
  );
  console.log(
    "   Available weapons in compendium:",
    weapons
      .filter((w) => w?.name)
      .map((w) => w.name)
      .slice(0, 10)
      .join(", "),
    "...",
  );

  // Get fresh state for fallback too
  const latestState = useCharacterStore.getState().currentCharacter;
  const latestBodyItems = latestState?.meta.equipment_on_body_items || [];
  const existingItem = latestBodyItems.find(
    (item) => normalizeItemName(item.name) === normalizeItemName(itemName),
  );
  if (!existingItem) {
    updateMeta({
      equipment_on_body_items: [
        ...latestBodyItems,
        {
          id: crypto.randomUUID(),
          name: itemName,
          quantity: 1,
        },
      ],
    });
    saveCharacter();
    console.log("✅ Added to body (fallback):", itemName);
  } else {
    console.log("⚠️ Item already on body:", itemName);
  }
};

// Helper function to remove background item (only if it's not used elsewhere)
const removeBackgroundItem = (
  itemName: string,
  items: any[],
  equipment: any[],
  tools: any[],
  currentCharacter: Character,
  updateMeta: (meta: Partial<CharacterMeta>) => void,
) => {
  // Try to find in items
  const item = findItemByName(itemName, items);
  if (item) {
    const itemInInventory = currentCharacter.inventory.find(
      (inv) => inv.item_id === item.id,
    );
    // Only remove if quantity is 1 (was added by background)
    // If quantity > 1, user might have added more manually, so keep it
    if (itemInInventory && itemInInventory.quantity === 1) {
      useCharacterStore.setState({
        currentCharacter: {
          ...currentCharacter,
          inventory: currentCharacter.inventory.filter(
            (inv) => inv.id !== itemInInventory.id,
          ),
        },
      });
      return;
    }
  }

  // Try to find in tools
  const tool = findItemByName(itemName, tools);
  if (tool) {
    const toolInInventory = currentCharacter.inventory.find(
      (inv) => inv.item_id === tool.id,
    );
    if (toolInInventory && toolInInventory.quantity === 1) {
      useCharacterStore.setState({
        currentCharacter: {
          ...currentCharacter,
          inventory: currentCharacter.inventory.filter(
            (inv) => inv.id !== toolInInventory.id,
          ),
        },
      });
      return;
    }
  }

  // Try to find in equipment packages
  const equip = findItemByName(itemName, equipment);
  if (equip) {
    // Remove equipment package items from inventory
    if (equip.items && Array.isArray(equip.items)) {
      equip.items.forEach((equipItem: { item_id: string }) => {
        const itemInInventory = currentCharacter.inventory.find(
          (inv) => inv.item_id === equipItem.item_id,
        );
        if (itemInInventory && itemInInventory.quantity === 1) {
          useCharacterStore.setState({
            currentCharacter: {
              ...currentCharacter,
              inventory: currentCharacter.inventory.filter(
                (inv) => inv.id !== itemInInventory.id,
              ),
            },
          });
        }
      });
    }
    // Remove tools from equipment package
    if (equip.tools && Array.isArray(equip.tools)) {
      equip.tools.forEach((equipTool: { tool_id: string }) => {
        const toolInInventory = currentCharacter.inventory.find(
          (inv) => inv.item_id === equipTool.tool_id,
        );
        if (toolInInventory && toolInInventory.quantity === 1) {
          useCharacterStore.setState({
            currentCharacter: {
              ...currentCharacter,
              inventory: currentCharacter.inventory.filter(
                (inv) => inv.id !== toolInInventory.id,
              ),
            },
          });
        }
      });
    }
    return;
  }

  // Remove from all equipment lists (on_body, in_backpack, etc.)
  const allEquipmentLists = [
    {
      key: "equipment_on_body_items",
      items: currentCharacter.meta.equipment_on_body_items || [],
    },
    {
      key: "equipment_in_backpack_items",
      items: currentCharacter.meta.equipment_in_backpack_items || [],
    },
    {
      key: "equipment_on_pack_animal_items",
      items: currentCharacter.meta.equipment_on_pack_animal_items || [],
    },
    {
      key: "equipment_in_bag_of_holding_items",
      items: currentCharacter.meta.equipment_in_bag_of_holding_items || [],
    },
  ];

  allEquipmentLists.forEach(({ key, items: listItems }) => {
    const textItem = listItems.find(
      (item) => normalizeItemName(item.name) === normalizeItemName(itemName),
    );
    if (textItem && textItem.quantity === 1) {
      const updatedItems = listItems.filter((item) => item.id !== textItem.id);
      updateMeta({ [key]: updatedItems });
    }
  });
};

export function CharacterSheet() {
  const {
    currentCharacter,
    setCurrentCharacter,
    updateAttribute,
    updateMeta,
    updateAppearance,
    updateProficiency,
    removeModifier,
    addFeat,
    removeFeat,
    saveCharacter,
    updateInventory,
    isLoading,
  } = useCharacterStore();

  const {
    weapons = [],
    armor = [],
    items = [],
    equipment = [],
    tools = [],
    species = [],
    classes = [],
    backgrounds = [],
    feats = [],
    fetchClasses,
    fetchSpecies,
    fetchWeapons,
    fetchArmor,
    fetchItems,
    fetchEquipment,
    fetchTools,
    fetchBackgrounds,
    fetchFeats,
  } = useCompendiumStore();

  const calculateTotalWeight = () => {
    if (!currentCharacter) return 0;

    let totalWeight = 0;

    // Waffen und Rüstungen aus dem inventory (nur ausgerüstete)
    const equippedItems = currentCharacter.inventory.filter(
      (item) => item.is_equipped,
    );

    equippedItems.forEach((invItem) => {
      const weapon = weapons.find((w) => w.id === invItem.item_id);
      const armorItem = armor.find((a) => a.id === invItem.item_id);

      if (weapon) {
        totalWeight += weapon.weight_kg * invItem.quantity;
      } else if (armorItem) {
        totalWeight += armorItem.weight_kg * invItem.quantity;
      }
    });

    // Items aus "Am Körper" und "Im Rucksack"
    const equipmentLists = [
      ...(currentCharacter.meta.equipment_on_body_items || []),
      ...(currentCharacter.meta.equipment_in_backpack_items || []),
    ];

    equipmentLists.forEach((equipItem) => {
      if (!equipItem?.name) return;

      // Suche in Items
      const item = items.find(
        (i) => i?.name && i.name.toLowerCase() === equipItem.name.toLowerCase(),
      );
      if (item) {
        totalWeight += item.weight_kg * equipItem.quantity;
        return;
      }

      // Suche in Tools
      const tool = tools.find(
        (t) => t?.name && t.name.toLowerCase() === equipItem.name.toLowerCase(),
      );
      if (tool) {
        totalWeight += tool.weight_kg * equipItem.quantity;
        return;
      }

      // Suche in Equipment (Ausrüstungspakete)
      const equip = equipment.find(
        (e) => e?.name && e.name.toLowerCase() === equipItem.name.toLowerCase(),
      );
      if (equip && equip.total_weight_kg) {
        totalWeight += equip.total_weight_kg * equipItem.quantity;
      }
    });

    return totalWeight;
  };

  useEffect(() => {
    if (!currentCharacter) return;

    const calculatedWeight = calculateTotalWeight();
    const currentWeight = currentCharacter.meta.total_weight_kg || 0;

    if (Math.abs(calculatedWeight - currentWeight) > 0.01) {
      updateMeta({ total_weight_kg: calculatedWeight });
    }
  }, [
    currentCharacter?.inventory,
    currentCharacter?.meta.equipment_on_body_items,
    currentCharacter?.meta.equipment_in_backpack_items,
    weapons,
    armor,
    items,
    equipment,
    tools,
    updateMeta,
  ]);

  useEffect(() => {
    fetchClasses();
    fetchSpecies();
    fetchWeapons();
    fetchArmor();
    fetchItems();
    fetchEquipment();
    fetchTools();
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
    fetchBackgrounds,
    fetchFeats,
  ]);

  // Find current class name
  const currentClass = classes.find(
    (c) => c.id === currentCharacter?.meta.class_id,
  );

  // Get subclasses for current class
  const subclasses = currentClass?.data?.subclasses || [];

  // Find current species
  const currentSpecies = species.find(
    (s) => s.id === currentCharacter?.meta.species_id,
  );

  // Find current background
  const currentBackground = backgrounds.find(
    (bg) => bg.id === currentCharacter?.meta.background_id,
  );

  // Track previous background_id to detect changes
  const prevBackgroundIdRef = useRef<string | undefined>(
    currentCharacter?.meta.background_id,
  );

  // Track if background equipment has been applied (to avoid re-applying on every render)
  const backgroundEquipmentAppliedRef = useRef<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<
    "combat" | "spells" | "inventory" | "notes"
  >("combat");

  const [showAbilityChoiceDialog, setShowAbilityChoiceDialog] = useState(false);
  const [pendingSpecies, setPendingSpecies] = useState<Species | null>(null);
  const [showBackgroundAbilityDialog, setShowBackgroundAbilityDialog] =
    useState(false);
  const [pendingBackground, setPendingBackground] = useState<any>(null);
  const [showToolChoiceDialog, setShowToolChoiceDialog] = useState(false);
  const [pendingToolCategory, setPendingToolCategory] = useState<string | null>(
    null,
  );
  const [showStartingEquipmentDialog, setShowStartingEquipmentDialog] =
    useState(false);
  const [pendingStartingEquipment, setPendingStartingEquipment] =
    useState<any>(null);

  // Apply species data when species_id changes
  useEffect(() => {
    if (!currentCharacter || !currentSpecies) return;

    const speciesData = currentSpecies.data;
    if (!speciesData) return;

    // Remove old species modifiers (from previous species) - these are legacy markers
    const oldSpeciesModifiers = currentCharacter.modifiers.filter((m) =>
      m.id.startsWith("species_"),
    );
    oldSpeciesModifiers.forEach((mod) => {
      removeModifier(mod.id);
    });

    // Apply ability score increases when species is selected
    // Note: PHB 2024 species do NOT have ability score increases (this was removed in the 2024 rules)
    // Only custom/homebrew species may have ability_score_increase
    if (speciesData.ability_score_increase) {
      const asi = speciesData.ability_score_increase;

      if (
        asi.type === "fixed" &&
        asi.fixed &&
        Object.keys(asi.fixed).length > 0
      ) {
        Object.entries(asi.fixed).forEach(([attr, value]) => {
          const attrMap: Record<
            string,
            "str" | "dex" | "con" | "int" | "wis" | "cha"
          > = {
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
            // Add the bonus to current value
            updateAttribute(attrKey, currentValue + numValue);
          }
        });
      } else if (
        asi.type === "choice" &&
        asi.choice &&
        asi.choice.count > 0 &&
        asi.choice.amount > 0
      ) {
        // Show dialog for choice-based ability score increases
        setPendingSpecies(currentSpecies);
        setShowAbilityChoiceDialog(true);
        return; // Don't apply languages yet, wait for choice
      }
    }

    // Add languages
    if (speciesData.languages?.known) {
      const knownLanguages = speciesData.languages.known || [];
      const currentLanguages = currentCharacter.proficiencies.languages || [];
      const newLanguages = knownLanguages.filter(
        (lang: string) => !currentLanguages.includes(lang),
      );

      newLanguages.forEach((lang: string) => {
        updateProficiency("languages", lang, true);
      });
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

    // Apply languages after choice is made
    if (pendingSpecies.data?.languages?.known) {
      const knownLanguages = pendingSpecies.data.languages.known || [];
      const currentLanguages = currentCharacter.proficiencies.languages || [];
      const newLanguages = knownLanguages.filter(
        (lang: string) => !currentLanguages.includes(lang),
      );
      newLanguages.forEach((lang: string) => {
        updateProficiency("languages", lang, true);
      });
    }

    setShowAbilityChoiceDialog(false);
    setPendingSpecies(null);
  };

  const handleBackgroundAbilityConfirm = (choices: Record<string, number>) => {
    if (!pendingBackground || !currentCharacter) {
      console.error(
        "❌ handleBackgroundAbilityConfirm: missing pendingBackground or currentCharacter",
      );
      return;
    }

    logger.trace("handleBackgroundAbilityConfirm called", "Background", {
      name: pendingBackground.name,
    });
    logger.trace("Background data", "Background", {
      hasTool: !!pendingBackground.data.tool,
      toolType:
        typeof pendingBackground.data.tool === "object"
          ? pendingBackground.data.tool.type
          : typeof pendingBackground.data.tool,
      toolCategory:
        typeof pendingBackground.data.tool === "object"
          ? pendingBackground.data.tool.category
          : null,
      hasStartingEquipment: !!pendingBackground.data.starting_equipment,
      startingEquipmentOptions:
        pendingBackground.data.starting_equipment?.options,
      isAlreadyApplied: backgroundEquipmentAppliedRef.current.has(
        pendingBackground.id,
      ),
    });

    // Apply ability score increases (all at once to avoid race conditions)
    const updatedAttributes = { ...currentCharacter.attributes };
    Object.entries(choices).forEach(([attr, value]) => {
      if (value > 0) {
        const attrKey = attr as keyof typeof currentCharacter.attributes;
        const currentValue = currentCharacter.attributes[attrKey];
        const newValue = Math.min(currentValue + value, 20); // Max 20
        updatedAttributes[attrKey] = newValue;
      }
    });

    // Update all attributes at once
    Object.entries(updatedAttributes).forEach(([attr, value]) => {
      updateAttribute(attr as keyof typeof currentCharacter.attributes, value);
    });

    // Store which ability scores were applied from this background
    updateMeta({ background_ability_scores: choices });
    saveCharacter();

    setShowBackgroundAbilityDialog(false);

    // Check if we need to show tool choice or starting equipment dialogs next
    const backgroundData = pendingBackground.data;
    if (backgroundData) {
      const currentBackgroundId = pendingBackground.id;

      // Check for tool choice dialog FIRST (before starting equipment)
      if (
        backgroundData.tool &&
        typeof backgroundData.tool === "object" &&
        backgroundData.tool.type === "choice"
      ) {
        logger.trace(
          "Showing tool choice dialog after ability scores",
          "Background",
          { name: pendingBackground.name },
        );
        logger.trace("Tool category", "Background", {
          category: backgroundData.tool.category,
        });
        setPendingToolCategory(backgroundData.tool.category || null);
        // Keep pendingBackground for next dialog - DON'T clear it yet!
        setShowToolChoiceDialog(true);
        return; // Exit early, don't mark as applied yet
      }

      // Check for starting equipment dialog SECOND (only if no tool choice)
      if (
        backgroundData.starting_equipment?.options &&
        Array.isArray(backgroundData.starting_equipment.options)
      ) {
        // Normalize options: Convert StructuredItem objects to strings
        const normalizedOptions = backgroundData.starting_equipment.options.map(
          (option: any) => {
            let normalizedItems: string[] | null = null;

            if (option.items) {
              if (Array.isArray(option.items)) {
                normalizedItems = option.items.map((item: any) => {
                  if (typeof item === "string") return item;
                  if (typeof item === "object" && item !== null && item.name) {
                    return item.variant
                      ? `${item.name} (${item.variant})`
                      : item.name;
                  }
                  return String(item);
                });
              }
            }

            return {
              label: option.label || "A",
              items: normalizedItems,
              gold: option.gold || null,
            };
          },
        );

        logger.trace(
          "Showing starting equipment dialog after ability scores",
          "Background",
          { name: pendingBackground.name },
        );
        setPendingStartingEquipment(normalizedOptions);
        // Keep pendingBackground for next dialog - DON'T clear it yet!
        setShowStartingEquipmentDialog(true);
        return; // Exit early, don't mark as applied yet
      }
    }

    // All dialogs are done, mark as applied and clear pendingBackground
    if (pendingBackground?.id) {
      backgroundEquipmentAppliedRef.current.add(pendingBackground.id);
      logger.trace(
        "Marked background as fully applied (after ability scores)",
        "Background",
        { id: pendingBackground.id },
      );
      setPendingBackground(null);
    }
  };

  const handleToolChoiceConfirm = (selectedTool: any) => {
    if (!currentCharacter || !pendingToolCategory) {
      console.error(
        "❌ handleToolChoiceConfirm: missing currentCharacter or pendingToolCategory",
      );
      return;
    }

    logger.trace("handleToolChoiceConfirm called", "Background", null);
    logger.trace("Selected tool", "Background", {
      name: selectedTool.name,
      id: selectedTool.id,
    });
    logger.trace("Pending background", "Background", {
      name: pendingBackground?.name || "NONE",
    });
    logger.trace("Current background ID", "Background", {
      id: currentCharacter.meta.background_id,
    });

    // Add tool proficiency
    if (!currentCharacter.proficiencies.tools.includes(selectedTool.name)) {
      updateProficiency("tools", selectedTool.name, true);
    }

    // Add tool to inventory
    const freshState = useCharacterStore.getState().currentCharacter;
    const freshCharacter = freshState || currentCharacter;

    const existingTool = freshCharacter.inventory.find(
      (item: any) => item.item_id === selectedTool.id,
    );
    if (!existingTool) {
      console.log("✅ Adding selected tool to inventory:", selectedTool.name);
      updateInventory(selectedTool.id, 1, false);
    } else {
      console.log(
        "⚠️ Selected tool already in inventory, but ensuring it's on body",
      );
    }

    // Always add to equipment_on_body_items so it appears in "Am Körper"
    const latestState = useCharacterStore.getState().currentCharacter;
    const latestBodyItems = latestState?.meta.equipment_on_body_items || [];
    const existingBodyItem = latestBodyItems.find(
      (bodyItem: any) =>
        normalizeItemName(bodyItem.name) ===
        normalizeItemName(selectedTool.name),
    );
    if (!existingBodyItem) {
      updateMeta({
        equipment_on_body_items: [
          ...latestBodyItems,
          {
            id: crypto.randomUUID(),
            name: selectedTool.name,
            quantity: 1,
          },
        ],
      });
      console.log("✅ Added selected tool to 'Am Körper':", selectedTool.name);
    } else {
      console.log("⚠️ Selected tool already on body:", selectedTool.name);
    }
    saveCharacter();

    setShowToolChoiceDialog(false);
    setPendingToolCategory(null);

    // Use pendingBackground if available, otherwise fall back to current background
    const backgroundToCheck =
      pendingBackground ||
      backgrounds.find((bg) => bg.id === currentCharacter.meta.background_id);
    const currentBackgroundId =
      backgroundToCheck?.id || currentCharacter.meta.background_id;

    if (backgroundToCheck && currentBackgroundId) {
      logger.trace("Checking for starting equipment dialog for", "Background", {
        name: backgroundToCheck.name,
      });
      logger.trace("Starting equipment data", "Background", {
        hasOptions: !!backgroundToCheck.data.starting_equipment?.options,
        isArray: Array.isArray(
          backgroundToCheck.data.starting_equipment?.options,
        ),
        isAlreadyApplied:
          backgroundEquipmentAppliedRef.current.has(currentBackgroundId),
      });

      // Check if we need to show starting equipment dialog next
      if (
        backgroundToCheck.data?.starting_equipment?.options &&
        Array.isArray(backgroundToCheck.data.starting_equipment.options)
      ) {
        // Normalize options: Convert StructuredItem objects to strings
        const normalizedOptions =
          backgroundToCheck.data.starting_equipment.options.map(
            (option: any) => {
              let normalizedItems: string[] | null = null;

              if (option.items) {
                if (Array.isArray(option.items)) {
                  normalizedItems = option.items.map((item: any) => {
                    if (typeof item === "string") return item;
                    if (
                      typeof item === "object" &&
                      item !== null &&
                      item.name
                    ) {
                      return item.variant
                        ? `${item.name} (${item.variant})`
                        : item.name;
                    }
                    return String(item);
                  });
                }
              }

              return {
                label: option.label || "A",
                items: normalizedItems,
                gold: option.gold || null,
              };
            },
          );

        logger.trace(
          "Showing starting equipment dialog after tool choice",
          "Background",
          { name: backgroundToCheck.name },
        );
        setPendingStartingEquipment(normalizedOptions);
        // Keep pendingBackground for next dialog - DON'T clear it yet!
        setShowStartingEquipmentDialog(true);
        return; // Exit early, don't mark as applied yet
      }

      // Mark equipment as applied only if no more dialogs are coming
      backgroundEquipmentAppliedRef.current.add(currentBackgroundId);
      logger.trace(
        "Marked background as fully applied (after tool choice)",
        "Background",
        { id: currentBackgroundId },
      );
      // Clear pendingBackground only when all dialogs are done
      if (pendingBackground) {
        setPendingBackground(null);
      }
    }
  };

  const handleStartingEquipmentConfirm = (selectedOption: {
    label: string;
    items: string[] | null;
    gold: number | null;
  }) => {
    if (!currentCharacter || !pendingStartingEquipment) {
      console.error(
        "❌ handleStartingEquipmentConfirm: missing currentCharacter or pendingStartingEquipment",
      );
      return;
    }

    logger.trace("handleStartingEquipmentConfirm called", "Background", null);
    logger.trace("Pending background", "Background", {
      name: pendingBackground?.name || "NONE",
    });
    console.log("📦 Starting equipment confirmed:", selectedOption);
    console.log("   Items to add:", selectedOption.items);
    console.log("   Gold to add:", selectedOption.gold);
    console.log("   Available items count:", items.length);
    console.log("   Available tools count:", tools.length);

    // Add items from selected option
    if (selectedOption.items && Array.isArray(selectedOption.items)) {
      console.log(`   Processing ${selectedOption.items.length} items...`);
      // Collect all items to add first, then add them all at once
      const itemsToAdd: string[] = [];
      if (selectedOption.items) {
        selectedOption.items.forEach((item: any, index: number) => {
          // Handle both string and object formats
          let itemName: string;
          if (typeof item === "string") {
            itemName = item;
          } else if (typeof item === "object" && item !== null) {
            // StructuredItem format
            if (item.name) {
              itemName = item.variant
                ? `${item.name} (${item.variant})`
                : item.name;
            } else {
              console.warn(`   ⚠️  Item at index ${index} has no name:`, item);
              return; // Skip invalid items
            }
          } else {
            itemName = String(item);
          }
          console.log(
            `   [${index + 1}/${selectedOption.items!.length}] Queued:`,
            itemName,
          );
          itemsToAdd.push(itemName);
        });
      }

      // Add all items sequentially
      itemsToAdd.forEach((itemName: string, index: number) => {
        console.log(
          `   [${index + 1}/${itemsToAdd.length}] Processing:`,
          itemName,
        );
        // Get fresh character state for each item to avoid stale closures
        const freshCharacter = useCharacterStore.getState().currentCharacter;
        if (freshCharacter) {
          addItemToInventory(
            itemName,
            items,
            equipment,
            tools,
            weapons,
            freshCharacter,
            updateInventory,
            updateMeta,
            saveCharacter,
          );
        }
      });
    }

    // Add gold from selected option
    if (selectedOption.gold && typeof selectedOption.gold === "number") {
      const currentGold = currentCharacter.meta.currency_gold || 0;
      console.log(
        `   Adding ${selectedOption.gold} GM (current: ${currentGold}, new: ${currentGold + selectedOption.gold})`,
      );
      updateMeta({ currency_gold: currentGold + selectedOption.gold });
      saveCharacter();
    }

    // Mark equipment as applied for this background
    const backgroundIdToMark =
      pendingBackground?.id || currentCharacter.meta.background_id;
    if (backgroundIdToMark) {
      backgroundEquipmentAppliedRef.current.add(backgroundIdToMark);
      logger.trace("Marked background equipment as applied", "Background", {
        id: backgroundIdToMark,
      });
    }

    console.log("✅ Starting equipment applied");
    setShowStartingEquipmentDialog(false);
    setPendingStartingEquipment(null);

    // Clear pendingBackground now that all dialogs are done
    if (pendingBackground) {
      logger.trace(
        "Clearing pendingBackground after all dialogs completed",
        "Background",
        null,
      );
      setPendingBackground(null);
    }
  };

  // Apply background data when background_id changes
  useEffect(() => {
    if (!currentCharacter) return;

    const currentBackgroundId = currentCharacter.meta.background_id;
    const previousBackgroundId = prevBackgroundIdRef.current;

    // If background changed, remove the old background's bonuses
    if (previousBackgroundId && previousBackgroundId !== currentBackgroundId) {
      const previousBackground = backgrounds.find(
        (bg) => bg.id === previousBackgroundId,
      );
      if (previousBackground?.data) {
        // Remove old background's ability score bonuses
        if (currentCharacter.meta.background_ability_scores) {
          const oldBonuses = currentCharacter.meta.background_ability_scores;
          Object.entries(oldBonuses).forEach(([attr, value]) => {
            if (value > 0) {
              const attrKey = attr as keyof typeof currentCharacter.attributes;
              const currentValue = currentCharacter.attributes[attrKey];
              updateAttribute(attrKey, Math.max(currentValue - value, 1)); // Min 1
            }
          });
          updateMeta({ background_ability_scores: undefined });
        }

        // Remove old background's feat
        if (previousBackground.data.feat) {
          const previousFeatName = previousBackground.data.feat;
          const previousFeat = feats.find(
            (f) => f.name.toUpperCase() === previousFeatName.toUpperCase(),
          );
          if (
            previousFeat &&
            currentCharacter.feats.includes(previousFeat.id)
          ) {
            removeFeat(previousFeat.id);
          }
        }

        // Remove old background's skills
        if (
          previousBackground.data.skills &&
          Array.isArray(previousBackground.data.skills)
        ) {
          const oldSkills = previousBackground.data.skills || [];
          oldSkills.forEach((skill: string) => {
            if (currentCharacter.proficiencies.skills.includes(skill)) {
              updateProficiency("skills", skill, false);
            }
          });
        }

        // Remove old background's tool
        if (previousBackground.data.tool) {
          const oldToolName = getToolName(previousBackground.data.tool);
          if (
            oldToolName &&
            currentCharacter.proficiencies.tools.includes(oldToolName)
          ) {
            updateProficiency("tools", oldToolName, false);
          }

          // Remove tool from inventory
          if (oldToolName) {
            const tool = tools.find(
              (t) =>
                t?.name && t.name.toLowerCase() === oldToolName.toLowerCase(),
            );
            if (tool) {
              const toolInInventory = currentCharacter.inventory.find(
                (item) => item.item_id === tool.id,
              );
              if (toolInInventory) {
                useCharacterStore.setState({
                  currentCharacter: {
                    ...currentCharacter,
                    inventory: currentCharacter.inventory.filter(
                      (item) => item.id !== toolInInventory.id,
                    ),
                  },
                });
              }
            } else {
              // Remove from all equipment lists if it was added as text
              const normalizedToolName = normalizeItemName(oldToolName);
              const equipmentLists = [
                "equipment_on_body_items",
                "equipment_in_backpack_items",
                "equipment_on_pack_animal_items",
                "equipment_in_bag_of_holding_items",
              ] as const;

              equipmentLists.forEach((listKey) => {
                const currentItems = currentCharacter.meta[listKey] || [];
                const toolItem = currentItems.find(
                  (item) => normalizeItemName(item.name) === normalizedToolName,
                );
                if (toolItem) {
                  updateMeta({
                    [listKey]: currentItems.filter(
                      (item) => item.id !== toolItem.id,
                    ),
                  });
                }
              });
            }
          }
        }

        // Remove old background's starting equipment
        // IMPORTANT: Remove ALL items from ALL options, since we don't know which was selected
        if (previousBackground.data.starting_equipment) {
          const oldEquipment = previousBackground.data.starting_equipment;

          // Collect all unique item names from all options
          const allItemNames = new Set<string>();

          // Handle new structure with options
          if (oldEquipment.options && Array.isArray(oldEquipment.options)) {
            oldEquipment.options.forEach((option: any) => {
              // Collect items from this option
              if (option.items && Array.isArray(option.items)) {
                option.items.forEach((item: any) => {
                  // Handle both string and object formats
                  let itemName: string;
                  if (typeof item === "string") {
                    itemName = item;
                  } else if (
                    typeof item === "object" &&
                    item !== null &&
                    item.name
                  ) {
                    itemName = item.variant
                      ? `${item.name} (${item.variant})`
                      : item.name;
                  } else {
                    itemName = String(item);
                  }
                  allItemNames.add(itemName);
                });
              }
            });

            // Remove all collected items
            allItemNames.forEach((itemName: string) => {
              removeBackgroundItem(
                itemName,
                items,
                equipment,
                tools,
                currentCharacter,
                updateMeta,
              );
            });

            // Remove gold from the highest option (safest approach)
            const maxGold = oldEquipment.options
              .map((opt: { gold: number | null }) => opt.gold || 0)
              .reduce((max: number, gold: number) => Math.max(max, gold), 0);
            if (maxGold > 0) {
              const currentGold = currentCharacter.meta.currency_gold || 0;
              const newGold = Math.max(0, currentGold - maxGold);
              updateMeta({ currency_gold: newGold });
            }
          }
          // Legacy: Handle old structure
          else {
            // Remove items
            if (oldEquipment.items && Array.isArray(oldEquipment.items)) {
              oldEquipment.items.forEach((itemName: string) => {
                removeBackgroundItem(
                  itemName,
                  items,
                  equipment,
                  tools,
                  currentCharacter,
                  updateMeta,
                );
              });
            }

            // Remove gold (subtract the old background's gold)
            if (oldEquipment.gold && typeof oldEquipment.gold === "number") {
              const currentGold = currentCharacter.meta.currency_gold || 0;
              const newGold = Math.max(0, currentGold - oldEquipment.gold);
              updateMeta({ currency_gold: newGold });
            }
          }

          // Save after removing old equipment
          saveCharacter();
        }

        // Also clear the applied flag for the old background
        if (previousBackgroundId) {
          backgroundEquipmentAppliedRef.current.delete(previousBackgroundId);
        }
      }
    }

    // Now apply the new background's data
    if (!currentBackground) return;

    const backgroundData = currentBackground.data;
    if (!backgroundData) return;

    // Apply equipment/tools ONLY if background just changed (not on every render)
    // The dialog should only show once per background change
    const shouldApplyEquipment = previousBackgroundId !== currentBackgroundId;

    // Only apply if background actually changed (not if it's the same background)
    const shouldApply = shouldApplyEquipment;

    // Debug: Log background data
    console.log("🔍 Background check:", {
      name: currentBackground.name,
      currentId: currentBackgroundId,
      previousId: previousBackgroundId,
      shouldApplyEquipment,
      shouldApply,
      hasTool: !!backgroundData.tool,
      hasStartingEquipment: !!backgroundData.starting_equipment,
      tool: backgroundData.tool,
      startingEquipment: backgroundData.starting_equipment,
      backgroundDataKeys: Object.keys(backgroundData),
    });

    // Add skills from background
    if (backgroundData.skills && Array.isArray(backgroundData.skills)) {
      const backgroundSkills = backgroundData.skills || [];
      backgroundSkills.forEach((skill: string) => {
        if (!currentCharacter.proficiencies.skills.includes(skill)) {
          updateProficiency("skills", skill, true);
        }
      });
    }

    // Check if ability scores need to be applied (show dialog if background changed)
    // Must be checked BEFORE starting equipment to avoid being skipped
    // Show dialog if background changed (shouldApply) AND ability_scores exist
    if (shouldApply) {
      logger.trace("Checking ability scores for", "Background", {
        name: currentBackground.name,
        hasAbilityScores: !!backgroundData.ability_scores,
        isArray: Array.isArray(backgroundData.ability_scores),
        length: Array.isArray(backgroundData.ability_scores)
          ? backgroundData.ability_scores.length
          : 0,
      });
    }

    if (
      shouldApply &&
      backgroundData.ability_scores &&
      Array.isArray(backgroundData.ability_scores) &&
      backgroundData.ability_scores.length === 3
    ) {
      logger.trace("Showing ability score dialog for", "Background", {
        name: currentBackground.name,
      });
      logger.trace("Ability scores", "Background", {
        scores: backgroundData.ability_scores,
      });
      setPendingBackground(currentBackground);
      setShowBackgroundAbilityDialog(true);
      return; // Wait for user choice
    }

    // Add tool proficiency from background
    if (backgroundData.tool) {
      // Check if tool is a choice (new structure)
      if (
        typeof backgroundData.tool === "object" &&
        backgroundData.tool.type === "choice"
      ) {
        // Show dialog to choose tool (only if ability scores don't need to be shown first)
        // If ability scores need to be shown, the tool choice will be shown after that dialog
        if (shouldApply) {
          // Check if ability scores need to be shown first
          const needsAbilityScoreDialog =
            backgroundData.ability_scores &&
            Array.isArray(backgroundData.ability_scores) &&
            backgroundData.ability_scores.length === 3;

          // Only show tool choice dialog directly if ability scores don't need to be shown
          if (
            !needsAbilityScoreDialog &&
            !showBackgroundAbilityDialog &&
            !showStartingEquipmentDialog
          ) {
            logger.trace("Showing tool choice dialog for", "Background", {
              name: currentBackground.name,
            });
            logger.trace("Tool category", "Background", {
              category: backgroundData.tool.category,
            });
            // Set pendingBackground to ensure it's available in handleToolChoiceConfirm
            setPendingBackground(currentBackground);
            setPendingToolCategory(backgroundData.tool.category || null);
            setShowToolChoiceDialog(true);
            return; // Wait for user choice
          }
        }
      } else {
        // Fixed tool (legacy or new structure with fixed name)
        const toolName = getToolName(backgroundData.tool);

        if (
          toolName &&
          !currentCharacter.proficiencies.tools.includes(toolName)
        ) {
          updateProficiency("tools", toolName, true);
        }

        // Add tool to inventory automatically (only when background changes or first time)
        if (shouldApply && toolName) {
          console.log("🔧 Adding tool from background:", toolName);

          // Use findItemByName for better matching
          const tool = findItemByName(toolName, tools);
          console.log(
            "Found tool in compendium:",
            tool ? tool.name : "NOT FOUND",
          );

          if (tool) {
            // Get fresh state
            const freshState = useCharacterStore.getState().currentCharacter;
            const freshCharacter = freshState || currentCharacter;

            const existingTool = freshCharacter.inventory.find(
              (item: any) => item.item_id === tool.id,
            );
            if (!existingTool) {
              console.log("✅ Adding tool to inventory:", tool.name);
              updateInventory(tool.id, 1, false);
            } else {
              console.log(
                "⚠️ Tool already in inventory, but ensuring it's on body",
              );
            }

            // Always add to equipment_on_body_items so it appears in "Am Körper"
            const latestState = useCharacterStore.getState().currentCharacter;
            const latestBodyItems =
              latestState?.meta.equipment_on_body_items || [];
            const existingBodyItem = latestBodyItems.find(
              (bodyItem: any) =>
                normalizeItemName(bodyItem.name) ===
                normalizeItemName(tool.name),
            );
            if (!existingBodyItem) {
              updateMeta({
                equipment_on_body_items: [
                  ...latestBodyItems,
                  {
                    id: crypto.randomUUID(),
                    name: tool.name,
                    quantity: 1,
                  },
                ],
              });
              console.log("✅ Added tool to 'Am Körper':", tool.name);
            } else {
              console.log("⚠️ Tool already on body:", tool.name);
            }
            saveCharacter();
          } else {
            // Fallback: Add as text item to "Am Körper" if tool not found in compendium
            console.log(
              "⚠️ Tool not found in compendium, adding as text item to body",
            );
            const latestState = useCharacterStore.getState().currentCharacter;
            const latestBodyItems =
              latestState?.meta.equipment_on_body_items || [];
            const existingItem = latestBodyItems.find(
              (item: any) =>
                normalizeItemName(item.name) === normalizeItemName(toolName),
            );
            if (!existingItem) {
              updateMeta({
                equipment_on_body_items: [
                  ...latestBodyItems,
                  {
                    id: crypto.randomUUID(),
                    name: toolName,
                    quantity: 1,
                  },
                ],
              });
              saveCharacter();
              console.log("✅ Added tool to body (fallback):", toolName);
            } else {
              console.log("⚠️ Tool already on body:", toolName);
            }
          }
        }
      }
    }

    // Add starting equipment from background (only when background changes)
    // NOTE: This code should NOT run if we're in the middle of a dialog sequence
    // (ability scores -> tool choice -> starting equipment)
    // It should only run if we're directly applying starting equipment without dialogs
    if (
      shouldApply &&
      !showBackgroundAbilityDialog &&
      !showToolChoiceDialog &&
      !showStartingEquipmentDialog
    ) {
      // Check for new structure with options FIRST (before checking alreadyApplied)
      // This ensures dialogs always show, even when switching backgrounds
      if (
        backgroundData.starting_equipment?.options &&
        Array.isArray(backgroundData.starting_equipment.options)
      ) {
        // Normalize options: Convert StructuredItem objects to strings
        const normalizedOptions = backgroundData.starting_equipment.options.map(
          (option: any) => {
            let normalizedItems: string[] | null = null;

            if (option.items) {
              if (Array.isArray(option.items)) {
                normalizedItems = option.items.map((item: any) => {
                  // If item is a string, use it directly
                  if (typeof item === "string") {
                    return item;
                  }
                  // If item is an object (StructuredItem), extract the name
                  if (typeof item === "object" && item !== null) {
                    if (item.name) {
                      // If variant exists, append it
                      if (item.variant) {
                        return `${item.name} (${item.variant})`;
                      }
                      return item.name;
                    }
                  }
                  return String(item);
                });
              }
            }

            return {
              label: option.label || "A",
              items: normalizedItems,
              gold: option.gold || null,
            };
          },
        );

        // Show dialog to choose between options
        // IMPORTANT: Always show dialog, even if already applied (for background switching)
        logger.trace("Showing starting equipment dialog for", "Background", {
          name: currentBackground.name,
        });
        // Set pendingBackground to ensure it's available in handleStartingEquipmentConfirm
        setPendingBackground(currentBackground);
        setPendingStartingEquipment(normalizedOptions);
        setShowStartingEquipmentDialog(true);
        // Clear the alreadyApplied flag so dialog can show again
        if (currentBackgroundId) {
          backgroundEquipmentAppliedRef.current.delete(currentBackgroundId);
        }
        return; // Wait for user choice
      }

      // Check if equipment was already applied for this background (only for non-options)
      const alreadyApplied = backgroundEquipmentAppliedRef.current.has(
        currentBackgroundId || "",
      );

      if (alreadyApplied) {
        console.log(
          "⚠️ Equipment already applied for this background, skipping",
        );
        return;
      }

      // Legacy: Check for old structure with starting_equipment.items/gold
      if (backgroundData.starting_equipment) {
        const startingEquipment = backgroundData.starting_equipment;
        console.log(
          "📦 Adding starting equipment (legacy):",
          startingEquipment,
        );

        // Add items
        if (startingEquipment.items && Array.isArray(startingEquipment.items)) {
          startingEquipment.items.forEach((itemName: string) => {
            addItemToInventory(
              itemName,
              items,
              equipment,
              tools,
              weapons,
              currentCharacter,
              updateInventory,
              updateMeta,
              saveCharacter,
            );
          });
        }

        // Add gold
        if (
          startingEquipment.gold &&
          typeof startingEquipment.gold === "number"
        ) {
          const currentGold = currentCharacter.meta.currency_gold || 0;
          updateMeta({ currency_gold: currentGold + startingEquipment.gold });
          saveCharacter();
        }
      }
      // Legacy: Check for old structure with gold directly
      else if (backgroundData.gold && typeof backgroundData.gold === "number") {
        console.log("📦 Adding gold (legacy):", backgroundData.gold);
        const currentGold = currentCharacter.meta.currency_gold || 0;
        updateMeta({ currency_gold: currentGold + backgroundData.gold });
        saveCharacter();
      }

      // Mark equipment as applied for this background
      if (currentBackgroundId) {
        backgroundEquipmentAppliedRef.current.add(currentBackgroundId);
      }
    }

    // Add feat from background
    if (backgroundData.feat) {
      const featName = backgroundData.feat;
      // Find feat by name (case-insensitive)
      const matchingFeat = feats.find(
        (f) => f.name.toUpperCase() === featName.toUpperCase(),
      );
      if (matchingFeat && !currentCharacter.feats.includes(matchingFeat.id)) {
        addFeat(matchingFeat.id);
      }
    }

    // Update prevBackgroundIdRef only if no dialogs are showing AND background is marked as applied
    // This ensures dialogs are shown when background changes, but not on every render
    if (
      !showBackgroundAbilityDialog &&
      !showToolChoiceDialog &&
      !showStartingEquipmentDialog &&
      backgroundEquipmentAppliedRef.current.has(currentBackgroundId || "")
    ) {
      prevBackgroundIdRef.current = currentBackgroundId;
    }
  }, [
    currentCharacter?.meta.background_id,
    currentBackground,
    backgrounds,
    feats,
    items,
    equipment,
    tools,
    updateProficiency,
    addFeat,
    removeFeat,
    updateInventory,
    updateMeta,
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
      {/* Dynamic Header */}
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
                  className="w-full text-5xl font-black tracking-tighter truncate font-serif italic text-foreground leading-none mb-2 bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 -ml-2 transition-all"
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
                          {subclasses.map((s: any) => (
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

        {/* Erweiterte Charakterinformationen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 px-4 pb-4 border-t border-border/30 pt-4">
          {/* Persönlichkeitsinfo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Spieler:
              </label>
              <input
                type="text"
                value={currentCharacter.meta.player_name || ""}
                onChange={(e) => updateMeta({ player_name: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Spielername"
                className="w-55 bg-transparent border-none outline-none text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Alter:
              </label>
              <input
                type="text"
                value={currentCharacter.appearance?.age || ""}
                onChange={(e) => updateAppearance({ age: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Alter"
                className="w-55 bg-transparent border-none outline-none text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Geschlecht:
              </label>
              <select
                value={currentCharacter.meta.gender || ""}
                onChange={(e) => {
                  updateMeta({ gender: e.target.value || undefined });
                  saveCharacter();
                }}
                className="w-55 bg-transparent border-none outline-none text-sm font-medium text-foreground/80 cursor-pointer hover:text-primary transition-colors focus:ring-1 focus:ring-primary/30 rounded px-2 py-1"
              >
                <option key="gender-empty" value="" className="bg-card">
                  —
                </option>
                <option key="gender-male" value="männlich" className="bg-card">
                  Männlich
                </option>
                <option
                  key="gender-female"
                  value="weiblich"
                  className="bg-card"
                >
                  Weiblich
                </option>
                <option key="gender-diverse" value="divers" className="bg-card">
                  Divers
                </option>
              </select>
            </div>
          </div>

          {/* Herkunft & Glaube */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Herkunft:
              </label>
              <select
                value={currentCharacter.meta.background_id || ""}
                onChange={(e) => {
                  updateMeta({ background_id: e.target.value });
                  setTimeout(saveCharacter, 100);
                }}
                className="w-55 bg-transparent text-sm font-medium text-foreground/80 outline-none border-none cursor-pointer hover:text-primary transition-colors"
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
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Gesinnung:
              </label>
              <select
                value={currentCharacter.meta.alignment || ""}
                onChange={(e) => updateMeta({ alignment: e.target.value })}
                onBlur={() => saveCharacter()}
                className="w-55 bg-transparent border-none outline-none text-sm font-medium text-foreground/80 cursor-pointer hover:text-primary transition-colors focus:ring-1 focus:ring-primary/30 rounded px-2 py-1"
              >
                <option key="align-empty" value="" className="bg-card">
                  —
                </option>
                <option key="align-RG" value="RG" className="bg-card">
                  RG (Rechtschaffen Gut)
                </option>
                <option key="align-NG" value="NG" className="bg-card">
                  NG (Neutral Gut)
                </option>
                <option key="align-CG" value="CG" className="bg-card">
                  CG (Chaotisch Gut)
                </option>
                <option key="align-RN" value="RN" className="bg-card">
                  RN (Rechtschaffen Neutral)
                </option>
                <option key="align-N" value="N" className="bg-card">
                  N (Neutral)
                </option>
                <option key="align-CN" value="CN" className="bg-card">
                  CN (Chaotisch Neutral)
                </option>
                <option key="align-RB" value="RB" className="bg-card">
                  RB (Rechtschaffen Böse)
                </option>
                <option key="align-NB" value="NB" className="bg-card">
                  NB (Neutral Böse)
                </option>
                <option key="align-CB" value="CB" className="bg-card">
                  CB (Chaotisch Böse)
                </option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Glaube:
              </label>
              <input
                type="text"
                value={currentCharacter.meta.faith || ""}
                onChange={(e) => updateMeta({ faith: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Glaube/Religion"
                className="w-55 bg-transparent border-none outline-none text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
          </div>

          {/* Körperliche Merkmale */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Augen:
              </label>
              <input
                type="text"
                value={currentCharacter.appearance?.eyes || ""}
                onChange={(e) => updateAppearance({ eyes: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Augenfarbe"
                className="w-55 bg-transparent border-none outline-none text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Haare:
              </label>
              <input
                type="text"
                value={currentCharacter.appearance?.hair || ""}
                onChange={(e) => updateAppearance({ hair: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Haarfarbe"
                className="w-55 bg-transparent border-none outline-none text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Haut:
              </label>
              <input
                type="text"
                value={currentCharacter.appearance?.skin || ""}
                onChange={(e) => updateAppearance({ skin: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Hautfarbe"
                className="w-55 bg-transparent border-none outline-none text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
          </div>

          {/* Größe & Gewicht */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Größe:
              </label>
              <input
                type="text"
                value={currentCharacter.appearance?.height || ""}
                onChange={(e) => updateAppearance({ height: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder={
                  currentCharacter.meta.use_metric
                    ? "Größe (cm)"
                    : "Größe (ft/in)"
                }
                className="w-55 bg-transparent border-none outline-none text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Gewicht:
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
                className="w-55 bg-transparent border-none outline-none text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-32 shrink-0">
                Größenkat.:
              </label>
              <span className="w-55 text-sm font-medium text-foreground/80 px-2 py-1">
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
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="w-full mb-6 flex items-center gap-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("combat")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${
            activeTab === "combat"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          <Shield className="w-5 h-5" />
          Kampf
        </button>
        <button
          onClick={() => setActiveTab("spells")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${
            activeTab === "spells"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          <Wand2 className="w-5 h-5" />
          Zauber
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${
            activeTab === "inventory"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          <Backpack className="w-5 h-5" />
          Inventar
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${
            activeTab === "notes"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
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
            onUpdateAttribute={updateAttribute}
            onUpdateMeta={updateMeta}
            onSaveCharacter={saveCharacter}
            onRemoveFeat={removeFeat}
            onRemoveModifier={removeModifier}
          />
        )}

        {activeTab === "spells" && (
          <div className="p-20 text-center bg-card rounded-[4rem] border-2 border-border animate-in fade-in duration-500">
            <Wand2 size={80} className="mx-auto mb-8 text-primary opacity-20" />
            <h2 className="text-4xl font-black italic font-serif mb-4 text-foreground">
              Zauberbuch
            </h2>
            <p className="text-muted-foreground italic">
              Hier werden bald alle deine arkane Künste gelistet.
            </p>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="bg-card p-6 rounded-[2rem] border-2 border-border shadow-lg">
              <h3 className="text-2xl font-black uppercase tracking-wider text-muted-foreground mb-6">
                AUSRÜSTUNG & INVENTAR
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-muted/20 border-2 border-border rounded-2xl p-5 shadow-md">
                    <label className="text-sm font-black uppercase tracking-wider text-primary block mb-4 pb-2 border-b-2 border-primary/30">
                      AM KÖRPER
                    </label>
                    <EquipmentList
                      items={
                        currentCharacter.meta.equipment_on_body_items || []
                      }
                      onChange={(items) => {
                        updateMeta({ equipment_on_body_items: items });
                        saveCharacter();
                      }}
                      placeholder="Item hinzufügen..."
                    />
                  </div>

                  <div className="bg-muted/20 border-2 border-border rounded-2xl p-5 shadow-md">
                    <label className="text-sm font-black uppercase tracking-wider text-primary block mb-4 pb-2 border-b-2 border-primary/30">
                      IM RUCKSACK
                    </label>
                    <EquipmentList
                      items={
                        currentCharacter.meta.equipment_in_backpack_items || []
                      }
                      onChange={(items) => {
                        updateMeta({ equipment_in_backpack_items: items });
                        saveCharacter();
                      }}
                      placeholder="Item hinzufügen..."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-muted/20 border-2 border-border rounded-2xl p-5 shadow-md">
                    <label className="text-sm font-black uppercase tracking-wider text-primary block mb-4 pb-2 border-b-2 border-primary/30">
                      AUF PACKTIER/LASTKARREN
                    </label>
                    <EquipmentList
                      items={
                        currentCharacter.meta.equipment_on_pack_animal_items ||
                        []
                      }
                      onChange={(items) => {
                        updateMeta({ equipment_on_pack_animal_items: items });
                        saveCharacter();
                      }}
                      placeholder="Item hinzufügen..."
                    />
                  </div>

                  <div className="bg-muted/20 border-2 border-border rounded-2xl p-5 shadow-md">
                    <label className="text-sm font-black uppercase tracking-wider text-primary block mb-4 pb-2 border-b-2 border-primary/30">
                      IM NIMMERVOLLEN BEUTEL
                    </label>
                    <EquipmentList
                      items={
                        currentCharacter.meta
                          .equipment_in_bag_of_holding_items || []
                      }
                      onChange={(items) => {
                        updateMeta({
                          equipment_in_bag_of_holding_items: items,
                        });
                        saveCharacter();
                      }}
                      placeholder="Item hinzufügen..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-6 border-t border-border">
                <div className="lg:col-span-3 space-y-4">
                  <div>
                    <label className="text-sm font-black uppercase tracking-wider text-muted-foreground block mb-2">
                      GESAMTGEWICHT
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={currentCharacter.meta.total_weight_kg || 0}
                        onChange={(e) =>
                          updateMeta({
                            total_weight_kg: parseFloat(e.target.value) || 0,
                          })
                        }
                        onBlur={() => saveCharacter()}
                        className="flex-1 h-10 border border-border rounded-lg p-2 text-sm focus:border-primary outline-none transition-colors bg-muted/30"
                        readOnly
                      />
                      <span className="text-sm font-bold text-muted-foreground">
                        {currentCharacter.meta.use_metric ? "kg" : "lbs"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mt-1">
                      Berechnet aus: Am Körper + Im Rucksack (inkl. ausgerüstete
                      Waffen & Rüstungen)
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-black uppercase tracking-wider text-muted-foreground block mb-2">
                      GOLD
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={currentCharacter.meta.currency_gold || 0}
                      onChange={(e) =>
                        updateMeta({
                          currency_gold: parseInt(e.target.value) || 0,
                        })
                      }
                      onBlur={() => saveCharacter()}
                      className="w-full h-10 border border-border rounded-lg p-2 text-sm focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-black uppercase tracking-wider text-muted-foreground block mb-2">
                      SILBER
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={currentCharacter.meta.currency_silver || 0}
                      onChange={(e) =>
                        updateMeta({
                          currency_silver: parseInt(e.target.value) || 0,
                        })
                      }
                      onBlur={() => saveCharacter()}
                      className="w-full h-10 border border-border rounded-lg p-2 text-sm focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-black uppercase tracking-wider text-muted-foreground block mb-2">
                      KUPFER
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={currentCharacter.meta.currency_copper || 0}
                      onChange={(e) =>
                        updateMeta({
                          currency_copper: parseInt(e.target.value) || 0,
                        })
                      }
                      onBlur={() => saveCharacter()}
                      className="w-full h-10 border border-border rounded-lg p-2 text-sm focus:border-primary outline-none transition-colors"
                    />
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
          species={pendingSpecies}
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
            abilityScores={pendingBackground.data.ability_scores}
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
          toolCategory={pendingToolCategory}
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
          options={pendingStartingEquipment}
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
