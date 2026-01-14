import React, { useState } from "react";
import { Character, Weapon, CharacterItem } from "../../lib/types";
import {
  Sword,
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
  weapons: Weapon[];
}

export const WeaponsTable: React.FC<Props> = ({ character, weapons }) => {
  const { updateInventory, saveCharacter, updateMeta } = useCharacterStore();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleToggleEquip = (weaponId: string) => {
    const { currentCharacter } = useCharacterStore.getState();
    if (!currentCharacter) return;

    const existingItem = currentCharacter.inventory.find(
      (item) => item.item_id === weaponId,
    );

    if (existingItem) {
      const weapon = weapons.find((w) => w.id === weaponId);
      const newEquippedState = !existingItem.is_equipped;

      updateInventory(weaponId, existingItem.quantity, newEquippedState);

      if (weapon) {
        const updatedCharacter = useCharacterStore.getState().currentCharacter;
        const currentItems =
          updatedCharacter?.meta.equipment_on_body_items ||
          currentCharacter.meta.equipment_on_body_items ||
          [];
        const newItems = newEquippedState
          ? addToEquipmentList(currentItems, weapon.name, existingItem.quantity)
          : removeFromEquipmentList(currentItems, weapon.name);
        updateMeta({ equipment_on_body_items: newItems });
      }

      saveCharacter();
    }
  };

  const handleAddWeapon = (weaponId: string) => {
    updateInventory(weaponId, 1, false);
    saveCharacter();
    setShowAddDialog(false);
  };

  const handleRemoveWeapon = (itemId: string) => {
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

  const getInventoryWeapons = () => {
    return character.inventory
      .map((invItem) => {
        const weapon = weapons.find((w) => w.id === invItem.item_id);
        return weapon ? { ...invItem, weapon } : null;
      })
      .filter(
        (item): item is { weapon: Weapon } & CharacterItem => item !== null,
      );
  };

  const availableWeapons = weapons.filter(
    (w) => !character.inventory.some((inv) => inv.item_id === w.id),
  );

  const inventoryWeapons = getInventoryWeapons();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Sword size={20} className="text-primary" />
        <h3 className="text-lg font-black italic font-serif">Waffen</h3>
        <div className="flex-1 h-px bg-border" />
        <button
          onClick={() => setShowAddDialog(!showAddDialog)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
        >
          <Plus size={16} />
          <span className="text-xs font-black uppercase tracking-wider">
            Hinzufügen
          </span>
          {showAddDialog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showAddDialog && (
        <div className="bg-muted/30 p-4 rounded-xl border-2 border-border space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {availableWeapons.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Alle Waffen bereits im Inventar
            </p>
          ) : (
            availableWeapons.map((weapon) => (
              <button
                key={weapon.id}
                onClick={() => handleAddWeapon(weapon.id)}
                className="w-full text-left bg-card p-3 rounded-lg border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {weapon.name}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>
                        {weapon.damage_dice} {weapon.damage_type}
                      </span>
                      {weapon.properties && weapon.properties.length > 0 && (
                        <span className="truncate">
                          {weapon.properties
                            .map((p: any) => p.name || p.id)
                            .join(", ")}
                        </span>
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
        {inventoryWeapons.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            Keine Waffen im Inventar. Klicke auf "Hinzufügen" um Waffen
            hinzuzufügen.
          </p>
        ) : (
          <>
            {/* Header für Aktionen-Spalte */}
            <div className="grid grid-cols-[1fr_auto] gap-4 px-2 pb-2 border-b-2 border-border/50">
              <span className="text-xs font-black text-muted-foreground/70 uppercase tracking-wider">
                Waffe
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-muted-foreground/70 uppercase tracking-wider">
                  Aktionen
                </span>
              </div>
            </div>
            {inventoryWeapons.map(({ weapon, ...invItem }) => {
              const isEquipped = invItem.is_equipped;

              return (
                <div
                  key={invItem.id}
                  className={`bg-card p-4 rounded-xl border-2 transition-all group hover:border-primary/30 ${
                    isEquipped
                      ? "border-primary/50 bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {weapon.name}
                        </h4>
                        {isEquipped && (
                          <span className="text-xs font-black text-primary uppercase tracking-wider">
                            Ausgerüstet
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {weapon.damage_dice} {weapon.damage_type}
                        </span>
                        {weapon.properties && weapon.properties.length > 0 && (
                          <span className="truncate">
                            {weapon.properties
                              .map((p: any) => p.name || p.id)
                              .join(", ")}
                          </span>
                        )}
                        {weapon.mastery && (
                          <span className="text-primary font-semibold">
                            {weapon.mastery.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleEquip(weapon.id)}
                        className={`flex-shrink-0 p-2 rounded-lg border transition-all ${
                          isEquipped
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-primary/20 hover:border-primary/30"
                        }`}
                        title={isEquipped ? "Ablegen" : "Ausrüsten"}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveWeapon(invItem.id)}
                        className="flex-shrink-0 p-2 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-all"
                        title="Aus Inventar entfernen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
