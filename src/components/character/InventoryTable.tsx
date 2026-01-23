import React, { useState } from "react";
import { Character, Gear, Tool, Item, CharacterItem } from "../../lib/types";
import {
  Package,
  Trash2,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Box,
  Move,
  Sparkles,
  User,
} from "lucide-react";
import { useCharacterStore } from "../../lib/store";
import { useCompendiumStore } from "../../lib/compendiumStore";
import { characterApi } from "../../lib/api";

interface Props {
  character: Character;
  gear: Gear[];
  tools: Tool[];
  items: Item[];
}

export const InventoryTable: React.FC<Props> = ({
  character,
  gear,
  tools,
  items,
}) => {
  const { updateInventory, refreshInventory } = useCharacterStore();
  const { magicItems } = useCompendiumStore();

  const locations = [
    { id: "Body", label: "Am Körper", icon: <User size={16} /> },
    { id: "Backpack", label: "Im Rucksack", icon: <Package size={16} /> },
    { id: "Mount", label: "Reittier & Lager", icon: <Box size={16} /> },
    {
      id: "MagicContainer",
      label: "Magische Behälter",
      icon: <Sparkles size={16} />,
    },
  ];

  const handleMoveToLocation = async (
    invItem: CharacterItem,
    location: string,
  ) => {
    const updated = { ...invItem, location: location, container_id: undefined }; // Clear container_id when changing location
    await characterApi.updateInventoryItem(updated);
    await refreshInventory();
    setMovingItemId(null);
  };

  const [movingItemId, setMovingItemId] = useState<string | null>(null);

  const handleUpdateQuantity = async (
    invItem: CharacterItem,
    newQty: number,
  ) => {
    if (newQty < 1) return;

    // Optimistic UI update via store
    updateInventory(
      invItem.item_id,
      newQty,
      invItem.is_equipped,
      invItem.item_type,
      undefined,
      undefined,
      invItem.location,
      invItem.source,
    );

    // Persist
    const updated = { ...invItem, quantity: newQty };
    await characterApi.updateInventoryItem(updated);
    await refreshInventory();
  };

  const handleRemoveItem = async (invItem: CharacterItem) => {
    const { currentCharacter } = useCharacterStore.getState();
    if (!currentCharacter) return;

    useCharacterStore.setState({
      currentCharacter: {
        ...currentCharacter,
        inventory: currentCharacter.inventory.filter(
          (it) => it.id !== invItem.id,
        ),
      },
    });

    // Full save for removal since we don't have delete_inventory_item command yet
    // (or we use update_character)
    await useCharacterStore.getState().saveCharacter();
  };

  const handleToggleAttunement = async (invItem: CharacterItem) => {
    const updated = { ...invItem, is_attuned: !invItem.is_attuned };
    await characterApi.updateInventoryItem(updated);
    await refreshInventory();
  };

  // Resolve item names and weights
  const resolveItemDetail = (invItem: CharacterItem) => {
    const match =
      gear.find((g) => g.id === invItem.item_id) ||
      tools.find((t) => t.id === invItem.item_id) ||
      items.find((i) => i.id === invItem.item_id) ||
      magicItems.find((m) => m.id === invItem.item_id);

    return {
      name: invItem.custom_name || match?.name || "Unbekanntes Item",
      weight: (match as unknown as Record<string, number>)?.weight_kg || 0,
      requiresAttunement:
        (match as unknown as Record<string, boolean>)?.requires_attunement ||
        false,
    };
  };

  // Filter items that are NOT weapons or armor (those have their own tables)
  const isGeneralItem = (invItem: CharacterItem) => {
    return ![
      "core_weapon",
      "custom_weapon",
      "core_armor",
      "custom_armor",
    ].includes(invItem.item_type);
  };

  const filteredInventory = character.inventory.filter(isGeneralItem);
  console.log(
    "InventoryTable: filteredInventory:",
    filteredInventory.map((i) => `${i.item_id} (${i.location})`),
  );

  const getItemsForLocation = (loc: string) => {
    return filteredInventory.filter((it) => (it.location || "Body") === loc);
  };

  // Magic Container Validation
  const validateMagicContainer = (items: CharacterItem[]) => {
    // Logic: specific limits for Bag of Holding (250kg) or Heward's (450kg)
    // Check if character HAS one of these items in inventory?
    // Or assume the limit based on the existence of items in "MagicContainer" location.
    // For now, simpler: Sum weight of items in MagicContainer location.
    // If it exceeds 450kg (Heward's max), show warning?
    // Or checking individual container items:
    // We need to know WHICH container we are in.
    // But we are grouping ALL "MagicContainer" items.
    // If we assume strict singular magic container usage or just sum check:
    const totalWeight = items.reduce(
      (sum, it) => sum + resolveItemDetail(it).weight * it.quantity,
      0,
    );

    let limit = 0;
    const hasBagOfHolding = character.inventory.some(
      (i) =>
        resolveItemDetail(i).name.includes("Nimmervoller") ||
        resolveItemDetail(i).name.includes("Bag of Holding"),
    );
    const hasHewards = character.inventory.some((i) =>
      resolveItemDetail(i).name.includes("Heward"),
    );

    if (hasHewards) limit = 450;
    else if (hasBagOfHolding) limit = 250;

    if (limit > 0 && totalWeight > limit) {
      return {
        valid: false,
        message: `Warnung: Gewichtslimit (${limit}kg) überschritten!`,
      };
    }
    return { valid: true };
  };

  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(locations.map((l) => l.id)),
  );

  const toggleLocation = (id: string) => {
    const next = new Set(expandedLocations);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedLocations(next);
  };

  const renderLocationGroup = (loc: {
    id: string;
    label: string;
    icon: React.ReactNode;
  }) => {
    const items = getItemsForLocation(loc.id);
    const totalWeight = items.reduce(
      (sum, it) => sum + resolveItemDetail(it).weight * it.quantity,
      0,
    );
    const isMagic = loc.id === "MagicContainer";
    const validation = isMagic
      ? validateMagicContainer(items)
      : { valid: true, message: "" };
    const isExpanded = expandedLocations.has(loc.id);

    return (
      <div key={loc.id} className="space-y-2">
        <button
          onClick={() => toggleLocation(loc.id)}
          className="w-full flex items-center gap-3 px-1 py-2 bg-muted/20 hover:bg-muted/30 rounded-lg transition-all group"
        >
          <div className="text-primary">{loc.icon}</div>
          <h3 className="text-sm font-black uppercase tracking-widest italic flex-1 text-left">
            {loc.label}
          </h3>
          <div className="flex flex-col items-end mr-2">
            <span
              className={`text-[10px] font-bold whitespace-nowrap ${!validation.valid ? "text-red-500" : "text-muted-foreground"}`}
            >
              {totalWeight.toFixed(1)} kg • {items.length} Items
            </span>
            {!validation.valid && (
              <span className="text-[10px] font-bold text-red-500 animate-pulse">
                {validation.message}
              </span>
            )}
          </div>
          <div className="text-muted-foreground group-hover:text-primary transition-colors">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        </button>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {items.length === 0 ? (
              <p className="col-span-full text-xs text-muted-foreground italic py-4 text-center border border-dashed border-border rounded-lg">
                Keine Items
              </p>
            ) : (
              items.map((invItem) => {
                const { name, weight } = resolveItemDetail(invItem);
                const isEditingMove = movingItemId === invItem.id;

                return (
                  <div
                    key={invItem.id}
                    className="group flex flex-col gap-2 p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon based on item type? Use general box */}
                      <div className="p-2 bg-muted/50 rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                        {loc.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate">{name}</h4>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                          {weight * invItem.quantity} kg
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-lg border border-border/50">
                        {resolveItemDetail(invItem).requiresAttunement && (
                          <button
                            onClick={() => handleToggleAttunement(invItem)}
                            className={`p-1 rounded transition-all ${invItem.is_attuned ? "text-primary bg-primary/20" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}
                            title={
                              invItem.is_attuned
                                ? "Einstimmung aufheben"
                                : "Einstimmen"
                            }
                          >
                            <Sparkles
                              size={12}
                              className={
                                invItem.is_attuned ? "fill-current" : ""
                              }
                            />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleUpdateQuantity(invItem, invItem.quantity - 1)
                          }
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-black">
                          {invItem.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(invItem, invItem.quantity + 1)
                          }
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() =>
                            setMovingItemId(isEditingMove ? null : invItem.id)
                          }
                          className={`p-1.5 rounded-lg border transition-all ${isEditingMove ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-primary"}`}
                          title="Verschieben..."
                        >
                          <Move size={14} />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(invItem)}
                          className="p-1.5 rounded-lg bg-muted/30 border border-border hover:bg-red-500/10 hover:border-red-500/30 text-muted-foreground hover:text-red-500 transition-all"
                          title="Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {isEditingMove && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-primary/20 animate-in slide-in-from-top-1 duration-200">
                        <p className="text-[10px] font-black uppercase tracking-wider text-primary mb-2 px-1">
                          Verschieben nach:
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {locations
                            .filter((l) => l.id !== loc.id)
                            .map((l) => (
                              <button
                                key={l.id}
                                onClick={() =>
                                  handleMoveToLocation(invItem, l.id)
                                }
                                className="text-left px-2 py-1 rounded text-[10px] font-bold bg-card hover:bg-primary/5 border border-transparent hover:border-primary/30 transition-all"
                              >
                                {l.label}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  return <div className="space-y-6">{locations.map(renderLocationGroup)}</div>;
};
