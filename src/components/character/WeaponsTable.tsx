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
import { calculateDerivedStats } from "../../lib/characterLogic";
import { formatModifier } from "../../lib/math";

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
  const attackByWeaponId = React.useMemo(() => {
    const stats = calculateDerivedStats(character, undefined, weapons);
    const map = new Map<string, (typeof stats.weapon_attacks)[number]>();
    stats.weapon_attacks.forEach((a) => map.set(a.weapon_id, a));
    return map;
  }, [character, weapons]);

  const updateItemCustomData = (
    inventoryItemId: string,
    updater: (prev: Record<string, unknown>) => Record<string, unknown>,
  ) => {
    const { currentCharacter } = useCharacterStore.getState();
    if (!currentCharacter) return;

    const nextInventory = currentCharacter.inventory.map((it) => {
      if (it.id !== inventoryItemId) return it;
      const prev =
        (it.custom_data as Record<string, unknown> | undefined) ?? {};
      return { ...it, custom_data: updater(prev) };
    });

    useCharacterStore.setState({
      currentCharacter: { ...currentCharacter, inventory: nextInventory },
    });
    saveCharacter();
  };

  const normalize = (v: string) => v.trim().toLowerCase();
  const hasWeaponProperty = (weapon: Weapon, prop: string) => {
    const wanted = normalize(prop);
    return (
      weapon.properties?.some((p) => {
        const id = typeof p.id === "string" ? normalize(p.id) : "";
        const name = typeof p.name === "string" ? normalize(p.name) : "";
        return id === wanted || name === wanted || name.includes(wanted);
      }) ?? false
    );
  };
  const isMeleeWeapon = (weapon: Weapon) => {
    const cat =
      typeof weapon.category === "string" ? normalize(weapon.category) : "";
    if (cat.includes("melee") || cat.includes("nahkampf")) return true;
    if (hasWeaponProperty(weapon, "ammunition")) return false;
    return true;
  };
  const isLightWeapon = (weapon: Weapon) =>
    hasWeaponProperty(weapon, "light") || hasWeaponProperty(weapon, "leicht");

  const hasTWFStyle = (character.meta.fighting_styles ?? []).some((style) => {
    const normalized = style.toLowerCase().replace(/[_-]/g, "");
    return (
      normalized.includes("twoweapon") ||
      normalized.includes("zweiwaffen") ||
      normalized.includes("two_weapon_fighting") ||
      style.toLowerCase() === "two-weapon-fighting"
    );
  });

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
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Sword size={20} className="text-primary" />
          <h3 className="text-lg font-black italic font-serif">Waffen</h3>
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
                            .map((p) => p.name || p.id)
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
            {/* Header */}
            <div className="px-2 pb-2 border-b-2 border-border/50">
              <span className="text-xs font-black text-muted-foreground/70 uppercase tracking-wider">
                Waffe
              </span>
            </div>
            {inventoryWeapons.map(({ weapon, ...invItem }) => {
              const isEquipped = invItem.is_equipped;
              const atk = attackByWeaponId.get(weapon.id);
              const custom = (invItem.custom_data ?? {}) as Record<
                string,
                unknown
              >;
              const versatileDamage =
                typeof (weapon.data as { versatile_damage?: unknown })
                  ?.versatile_damage === "string"
                  ? ((
                      weapon.data as {
                        versatile_damage?: string;
                      }
                    ).versatile_damage?.trim() ?? "")
                  : "";
              const isVersatile = versatileDamage.length > 0;
              const hand = typeof custom.hand === "string" ? custom.hand : "";
              const isOffhand =
                hand === "offhand" ||
                hand === "nebenhand" ||
                custom.offhand === true;
              const isTwoHanded =
                custom.two_handed === true ||
                custom.twoHanded === true ||
                custom.is_two_handed === true;
              const twf =
                custom.two_weapon_fighting === true ||
                custom.twoWeaponFighting === true ||
                custom.add_ability_to_offhand_damage === true;

              const canBeOffhand =
                isLightWeapon(weapon) && isMeleeWeapon(weapon);
              const otherEquippedLight = inventoryWeapons.some((w) => {
                if (w.id === invItem.id) return false;
                if (!w.is_equipped) return false;
                return isLightWeapon(w.weapon) && isMeleeWeapon(w.weapon);
              });
              const canEnableOffhand =
                isEquipped && canBeOffhand && otherEquippedLight;
              const nhDisabled = !isOffhand && !canEnableOffhand;
              const nhTitle = isOffhand
                ? "Nebenhand deaktivieren"
                : !isEquipped
                  ? "Erst ausrüsten"
                  : !canBeOffhand
                    ? "Nur leichte Nahkampfwaffen können Nebenhand sein"
                    : !otherEquippedLight
                      ? "Du brauchst eine zweite leichte Nahkampfwaffe (ausgerüstet)"
                      : "Als Nebenhand markieren";

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
                        {weapon.name}
                      </h4>
                      {isEquipped && (
                        <span className="text-xs font-black text-primary uppercase tracking-wider whitespace-nowrap shrink-0">
                          Ausgerüstet
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {atk ? (
                        <>
                          <span className="whitespace-nowrap">
                            Angriff {formatModifier(atk.attack_bonus)}
                          </span>
                          <span className="whitespace-nowrap">·</span>
                          <span className="break-words">
                            Schaden {atk.damage}
                          </span>
                        </>
                      ) : (
                        <span className="whitespace-nowrap">
                          {weapon.damage_dice} {weapon.damage_type}
                        </span>
                      )}
                      {weapon.properties && weapon.properties.length > 0 && (
                        <span className="break-words">
                          {weapon.properties
                            .map((p) => p.name || p.id)
                            .join(", ")}
                        </span>
                      )}
                      {weapon.mastery && (
                        <span className="text-primary font-semibold whitespace-nowrap">
                          {weapon.mastery.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <button
                      disabled={nhDisabled}
                      onClick={() => {
                        if (nhDisabled) return;

                        const { currentCharacter } =
                          useCharacterStore.getState();
                        if (!currentCharacter) return;

                        const enabling = !isOffhand;
                        const nextInventory = currentCharacter.inventory.map(
                          (it) => {
                            const prev =
                              (it.custom_data as
                                | Record<string, unknown>
                                | undefined) ?? {};
                            const next = { ...prev };

                            // Offhand global: nur 1 Item darf Offhand sein
                            delete next.hand;
                            delete next.offhand;
                            delete next.two_weapon_fighting;
                            delete next.twoWeaponFighting;
                            delete next.add_ability_to_offhand_damage;

                            if (enabling && it.id === invItem.id) {
                              next.hand = "offhand";
                              next.offhand = true;
                              // 2H macht hier keinen Sinn
                              delete next.two_handed;
                              delete next.twoHanded;
                              delete next.is_two_handed;
                            }

                            return { ...it, custom_data: next };
                          },
                        );

                        useCharacterStore.setState({
                          currentCharacter: {
                            ...currentCharacter,
                            inventory: nextInventory,
                          },
                        });
                        saveCharacter();
                      }}
                      className={`px-2 py-1 rounded border text-[10px] font-black uppercase tracking-wider transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                        isOffhand
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-primary/20 hover:border-primary/30"
                      }`}
                      title={nhTitle}
                    >
                      NH
                    </button>
                    {isVersatile && (
                      <button
                        onClick={() =>
                          updateItemCustomData(invItem.id, (prev) => {
                            const next = { ...prev };
                            const currentlyTwoHanded =
                              next.two_handed === true ||
                              next.twoHanded === true ||
                              next.is_two_handed === true;
                            if (currentlyTwoHanded) {
                              delete next.two_handed;
                              delete next.twoHanded;
                              delete next.is_two_handed;
                            } else {
                              next.two_handed = true;
                              next.twoHanded = true;
                              next.is_two_handed = true;
                              // Nebenhand macht hier keinen Sinn
                              delete next.hand;
                              delete next.offhand;
                              delete next.two_weapon_fighting;
                              delete next.twoWeaponFighting;
                              delete next.add_ability_to_offhand_damage;
                            }
                            return next;
                          })
                        }
                        className={`px-2 py-1 rounded border text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                          isTwoHanded
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-primary/20 hover:border-primary/30"
                        }`}
                        title={
                          isTwoHanded
                            ? "Zweihändig deaktivieren"
                            : `Zweihändig (Vielseitig: ${versatileDamage})`
                        }
                      >
                        2H
                      </button>
                    )}
                    {isOffhand && hasTWFStyle && (
                      <button
                        onClick={() =>
                          updateItemCustomData(invItem.id, (prev) => {
                            const next = { ...prev };
                            const currently =
                              next.two_weapon_fighting === true ||
                              next.twoWeaponFighting === true ||
                              next.add_ability_to_offhand_damage === true;
                            if (currently) {
                              delete next.two_weapon_fighting;
                              delete next.twoWeaponFighting;
                              delete next.add_ability_to_offhand_damage;
                            } else {
                              next.two_weapon_fighting = true;
                              next.twoWeaponFighting = true;
                              next.add_ability_to_offhand_damage = true;
                            }
                            return next;
                          })
                        }
                        className={`px-2 py-1 rounded border text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                          twf
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-primary/20 hover:border-primary/30"
                        }`}
                        title={
                          twf
                            ? "Zwei-Waffen-Kampf deaktivieren (Nebenhand ohne Attribut-Mod)"
                            : "Zwei-Waffen-Kampf aktivieren (Nebenhand mit Attribut-Mod)"
                        }
                      >
                        ZWK
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleEquip(weapon.id)}
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
                      onClick={() => handleRemoveWeapon(invItem.id)}
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
