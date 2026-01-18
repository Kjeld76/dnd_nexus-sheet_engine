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

const addToEquipmentList = (
  currentItems:
    | Array<{ id: string; name: string; quantity: number }>
    | undefined,
  itemName: string,
  quantity: number = 1,
): Array<{ id: string; name: string; quantity: number }> => {
  const items = currentItems || [];
  const existingItem = items.find((item) => item.name === itemName);

  if (existingItem) {
    return items.map((item) =>
      item.id === existingItem.id
        ? { ...item, quantity: item.quantity + quantity }
        : item,
    );
  }

  return [
    ...items,
    {
      id: crypto.randomUUID(),
      name: itemName,
      quantity: quantity,
    },
  ];
};

const removeFromEquipmentList = (
  currentItems:
    | Array<{ id: string; name: string; quantity: number }>
    | undefined,
  itemName: string,
): Array<{ id: string; name: string; quantity: number }> => {
  const items = currentItems || [];
  return items.filter((item) => item.name !== itemName);
};

interface Props {
  character: Character;
  armor: Armor[];
}

export const ArmorTable: React.FC<Props> = ({ character, armor }) => {
  const { updateInventory, saveCharacter, updateMeta } = useCharacterStore();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleToggleEquip = (armorId: string) => {
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

    if (isCurrentlyEquipped) {
      // Unequip
      updateInventory(armorId, existingItem.quantity, false);

      const updatedCharacter = useCharacterStore.getState().currentCharacter;
      const currentItems =
        updatedCharacter?.meta.equipment_on_body_items ||
        currentCharacter.meta.equipment_on_body_items ||
        [];
      const newItems = removeFromEquipmentList(currentItems, armorItem.name);
      updateMeta({ equipment_on_body_items: newItems });
    } else {
      // Equip
      if (!isShield) {
        // Rüstung: Prüfe ob bereits eine andere Rüstung ausgerüstet ist
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
          // Alte Rüstung ablegen
          updateInventory(
            otherEquippedArmor.armor.id,
            otherEquippedArmor.invItem.quantity,
            false,
          );

          const updatedCharacter =
            useCharacterStore.getState().currentCharacter;
          let currentItems =
            updatedCharacter?.meta.equipment_on_body_items ||
            currentCharacter.meta.equipment_on_body_items ||
            [];
          currentItems = removeFromEquipmentList(
            currentItems,
            otherEquippedArmor.armor.name,
          );
          updateMeta({ equipment_on_body_items: currentItems });
        }
      }
      // Neue Rüstung/Schild ausrüsten
      updateInventory(armorId, existingItem.quantity, true);

      const updatedCharacter = useCharacterStore.getState().currentCharacter;
      const currentItems =
        updatedCharacter?.meta.equipment_on_body_items ||
        currentCharacter.meta.equipment_on_body_items ||
        [];
      const newItems = addToEquipmentList(
        currentItems,
        armorItem.name,
        existingItem.quantity,
      );
      updateMeta({ equipment_on_body_items: newItems });
    }
    saveCharacter();
  };

  const handleAddArmor = (armorId: string) => {
    const armorItem = armor.find((a) => a.id === armorId);
    if (!armorItem) return;

    const isShield = armorItem.category === "schild";
    let willBeEquipped = false;

    // Prüfe ob bereits eine Rüstung ausgerüstet ist (nur für Rüstungen, nicht Schilde)
    if (!isShield) {
      const hasEquippedArmor = character.inventory.some((invItem) => {
        const a = armor.find((arm) => arm.id === invItem.item_id);
        return a && invItem.is_equipped && a.category !== "schild";
      });

      if (hasEquippedArmor) {
        // Kann nicht hinzugefügt werden, wenn bereits eine Rüstung ausgerüstet ist
        // (kann aber im Inventar sein, nur nicht ausgerüstet)
        updateInventory(armorId, 1, false);
      } else {
        // Keine Rüstung ausgerüstet, kann direkt ausgerüstet werden
        updateInventory(armorId, 1, true);
        willBeEquipped = true;
      }
    } else {
      // Schild kann immer hinzugefügt werden
      updateInventory(armorId, 1, false);
    }

    // Wenn direkt ausgerüstet, in "Am Körper" eintragen
    if (willBeEquipped) {
      const { currentCharacter } = useCharacterStore.getState();
      const currentItems = currentCharacter?.meta.equipment_on_body_items || [];
      const newItems = addToEquipmentList(currentItems, armorItem.name, 1);
      updateMeta({ equipment_on_body_items: newItems });
    }

    saveCharacter();
    setShowAddDialog(false);
  };

  const handleRemoveArmor = (itemId: string) => {
    const { currentCharacter } = useCharacterStore.getState();
    if (!currentCharacter) return;

    useCharacterStore.setState({
      currentCharacter: {
        ...currentCharacter,
        inventory: currentCharacter.inventory.filter(
          (item) => item.id !== itemId,
        ),
      },
    });
    saveCharacter();
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

    // Wenn es eine Rüstung ist (nicht Schild) und bereits eine Rüstung ausgerüstet ist,
    // kann sie nicht hinzugefügt werden
    if (a.category !== "schild") {
      const hasEquippedArmor = character.inventory.some((invItem) => {
        const armorItem = armor.find((arm) => arm.id === invItem.item_id);
        return (
          armorItem && invItem.is_equipped && armorItem.category !== "schild"
        );
      });
      return !hasEquippedArmor;
    }

    return true; // Schilde können immer hinzugefügt werden
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
            {/* Header */}
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
                          Stealth Nachteil
                        </span>
                      )}
                      {armorItem.properties &&
                        armorItem.properties.length > 0 && (
                          <span className="break-words">
                            {armorItem.properties
                              .map((p) => p.name || p.id)
                              .join(", ")}
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
