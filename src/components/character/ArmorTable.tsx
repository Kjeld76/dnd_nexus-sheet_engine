import React, { useState } from "react";
import { Character, Armor, CharacterItem } from "../../lib/types";
import {
  Shield,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { useCharacterStore } from "../../lib/store";
import { characterApi } from "../../lib/api";

interface Props {
  character: Character;
  armor: Armor[];
}

export const ArmorTable: React.FC<Props> = ({ character, armor }) => {
  const { updateInventory, refreshInventory } = useCharacterStore();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleToggleEquip = async (armorId: string) => {
    const { currentCharacter } = useCharacterStore.getState();
    if (!currentCharacter) return;

    const existingItem = currentCharacter.inventory.find(
      (item) => item.item_id === armorId,
    );

    if (!existingItem) return;

    const armorItem = armor.find((a) => a.id === armorId);
    if (!armorItem) return;

    const isShield = armorItem.category === "schild";
    const isCurrentlyEquipped = existingItem.is_equipped;
    const itemType =
      armorItem.source === "core" ? "core_armor" : "custom_armor";

    if (isCurrentlyEquipped) {
      // Unequip
      updateInventory(armorId, existingItem.quantity, false, itemType);
    } else {
      // Equip
      if (!isShield) {
        // Unequip any other non-shield armor
        const otherEquippedArmor = currentCharacter.inventory
          .map((invItem) => {
            const a = armor.find((arm) => arm.id === invItem.item_id);
            return a ? { invItem, armor: a } : null;
          })
          .find(
            (item) =>
              item &&
              item.invItem.is_equipped &&
              item.armor.category !== "schild" &&
              item.armor.id !== armorId,
          );

        if (otherEquippedArmor) {
          const otherItemType =
            otherEquippedArmor.armor.source === "core"
              ? "core_armor"
              : "custom_armor";
          updateInventory(
            otherEquippedArmor.armor.id,
            otherEquippedArmor.invItem.quantity,
            false,
            otherItemType,
          );

          // Persist the unequip of the other armor
          const otherStoredItem = useCharacterStore
            .getState()
            .currentCharacter?.inventory.find(
              (it) => it.item_id === otherEquippedArmor.armor.id,
            );
          if (otherStoredItem) {
            await characterApi.updateInventoryItem(otherStoredItem);
          }
        }
      }

      // Equip the new one
      updateInventory(armorId, existingItem.quantity, true, itemType);
    }

    // Persist the change for the target item
    const updatedItem = useCharacterStore
      .getState()
      .currentCharacter?.inventory.find((it) => it.item_id === armorId);
    if (updatedItem) {
      await characterApi.updateInventoryItem(updatedItem);
      await refreshInventory();
    }
  };

  const handleAddArmor = async (armorId: string) => {
    const armorItem = armor.find((a) => a.id === armorId);
    if (!armorItem) return;

    const isShield = armorItem.category === "schild";
    const itemType =
      armorItem.source === "core" ? "core_armor" : "custom_armor";

    let willBeEquipped = false;
    if (!isShield) {
      const hasEquippedArmor = character.inventory.some((invItem) => {
        const a = armor.find((arm) => arm.id === invItem.item_id);
        return a && invItem.is_equipped && a.category !== "schild";
      });
      willBeEquipped = !hasEquippedArmor;
    }

    updateInventory(armorId, 1, willBeEquipped, itemType);

    // Save to character blob (since adding new relational item might need full save if we don't have create_inventory_item)
    // Actually, we use update_inventory_item which might handle upsert or we use saveCharacter.
    // For now, saveCharacter is safer for additions.
    await useCharacterStore.getState().saveCharacter();
    setShowAddDialog(false);
  };

  const handleRemoveArmor = async (itemId: string) => {
    const { currentCharacter } = useCharacterStore.getState();
    if (!currentCharacter) return;

    useCharacterStore.setState({
      currentCharacter: {
        ...currentCharacter,
        inventory: currentCharacter.inventory.filter((it) => it.id !== itemId),
      },
    });
    await useCharacterStore.getState().saveCharacter();
  };

  const getInventoryArmor = () => {
    return character.inventory
      .map((invItem) => {
        const armorItem = armor.find((a) => a.id === invItem.item_id);
        return armorItem ? { ...invItem, armor: armorItem } : null;
      })
      .filter(
        (item): item is { armor: Armor } & CharacterItem => item !== null,
      );
  };

  const availableArmor = armor.filter((a) => {
    const isInInventory = character.inventory.some(
      (inv) => inv.item_id === a.id,
    );
    if (isInInventory) return false;

    if (a.category !== "schild") {
      const hasEquippedArmor = character.inventory.some((invItem) => {
        const armorItem = armor.find((arm) => arm.id === invItem.item_id);
        return (
          armorItem && invItem.is_equipped && armorItem.category !== "schild"
        );
      });
      return !hasEquippedArmor;
    }
    return true;
  });

  const inventoryArmor = getInventoryArmor();

  const formatAC = (armorItem: Armor) => {
    if (armorItem.category === "schild") {
      return `+${armorItem.ac_bonus}`;
    }
    return (
      armorItem.ac_formula ||
      (armorItem.base_ac !== null ? armorItem.base_ac.toString() : "—")
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-primary" />
          <h3 className="text-lg font-black italic font-serif">Rüstungen</h3>
          <div className="flex-1 h-px bg-border" />
        </div>
        <button
          onClick={() => setShowAddDialog(!showAddDialog)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-xs font-black uppercase tracking-wider"
        >
          <Plus size={14} />
          <span>Hinzufügen</span>
          {showAddDialog ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {showAddDialog && (
        <div className="bg-muted/30 p-4 rounded-xl border-2 border-border space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {availableArmor.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Alle Rüstungen bereits im Inventar
            </p>
          ) : (
            availableArmor.map((armorItem) => (
              <button
                key={armorItem.id}
                onClick={() => handleAddArmor(armorItem.id)}
                className="w-full text-left bg-card p-3 rounded-lg border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {armorItem.name}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="font-semibold text-foreground">
                        RK {formatAC(armorItem)}
                      </span>
                      {armorItem.strength_requirement && (
                        <span>STÄ {armorItem.strength_requirement}</span>
                      )}
                    </div>
                  </div>
                  <Plus
                    size={16}
                    className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </button>
            ))
          )}
        </div>
      )}

      <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
        {inventoryArmor.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            Keine Rüstungen im Inventar. Klicke auf "Hinzufügen" um Rüstungen
            hinzuzufügen.
          </p>
        ) : (
          <>
            <div className="px-2 pb-2 border-b-2 border-border/50">
              <span className="text-xs font-black text-muted-foreground/70 uppercase tracking-wider">
                Rüstung
              </span>
            </div>
            {inventoryArmor.map(({ armor: armorItem, ...invItem }) => {
              const isEquipped = invItem.is_equipped;

              return (
                <div
                  key={invItem.id}
                  className={`bg-card p-3 rounded-lg border-2 transition-all group hover:border-primary/30 relative ${
                    isEquipped
                      ? "border-primary/50 bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="space-y-1 pr-20 pb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-foreground break-words">
                        {armorItem.name}
                      </h4>
                      {isEquipped && (
                        <span className="text-xs font-black text-primary uppercase tracking-wider whitespace-nowrap shrink-0">
                          Ausgerüstet
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground whitespace-nowrap">
                        RK {formatAC(armorItem)}
                      </span>
                      {armorItem.strength_requirement && (
                        <span className="whitespace-nowrap">
                          STÄ {armorItem.strength_requirement}
                        </span>
                      )}
                      {armorItem.stealth_disadvantage && (
                        <span className="text-amber-500 whitespace-nowrap">
                          Heimlichkeit Nachteil
                        </span>
                      )}
                      {armorItem.properties &&
                        armorItem.properties.length > 0 && (
                          <span className="break-words">
                            {Array.from(
                              new Set(
                                armorItem.properties
                                  .filter((p) => {
                                    if (armorItem.stealth_disadvantage) {
                                      const propName = (
                                        p.name ||
                                        p.id ||
                                        ""
                                      ).toLowerCase();
                                      return (
                                        !propName.includes("stealth") &&
                                        !propName.includes("heimlichkeit") &&
                                        !propName.includes("nachteil")
                                      );
                                    }
                                    return true;
                                  })
                                  .map((p) => p.name || p.id),
                              ),
                            ).join(", ")}
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <button
                      onClick={() => handleToggleEquip(armorItem.id)}
                      className={`p-1 rounded border transition-all shrink-0 ${
                        isEquipped
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-primary/20 hover:border-primary/30"
                      }`}
                      title={isEquipped ? "Ablegen" : "Ausrüsten"}
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => handleRemoveArmor(invItem.id)}
                      className="p-1 rounded border border-border bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-all shrink-0"
                      title="Aus Inventar entfernen"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
