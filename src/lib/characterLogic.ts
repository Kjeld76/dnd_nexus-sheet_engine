import { Character, Attributes, Modifier, Class, Armor, Weapon } from "./types";
import { calculateModifier, calculateProficiencyBonus } from "./math";

export interface DerivedStats {
  hp_max: number;
  ac: number;
  initiative: number;
  proficiency_bonus: number;
  saving_throws: Record<keyof Attributes, number>;
  skills: Record<string, number>;
  passive_perception: number;
  spell_save_dc: number;
  spell_attack_bonus: number;
  encumbrance: {
    max: number;
    current: number;
  };
  weapon_attacks: WeaponAttack[];
}

export interface WeaponAttack {
  name: string;
  attack_bonus: number;
  damage: string;
  properties: string[];
}

export const SKILL_MAP: Record<string, keyof Attributes> = {
  Athletik: "str",
  Akrobatik: "dex",
  Fingerfertigkeit: "dex",
  Heimlichkeit: "dex",
  Arkana: "int",
  Geschichte: "int",
  Nachforschen: "int",
  Naturkunde: "int",
  Religion: "int",
  Tierkunde: "wis",
  "Motiv erkennen": "wis",
  Heilkunde: "wis",
  Wahrnehmung: "wis",
  Überlebenskunst: "wis",
  Täuschen: "cha",
  Einschüchtern: "cha",
  Auftreten: "cha",
  Überzeugen: "cha",
};

/**
 * Calculates all derived statistics for a character based on PHB 2024 rules.
 */
export const calculateDerivedStats = (
  character: Character,
  characterClass?: Class,
  inventoryItems: (Weapon | Armor | any)[] = [],
  activeModifiers: Modifier[] = [],
): DerivedStats => {
  const level = character.meta.level;
  const attributes = character.attributes;
  const conMod = calculateModifier(attributes.con);
  const dexMod = calculateModifier(attributes.dex);
  const profBonus = calculateProficiencyBonus(level);

  // 1. HP Calculation
  let hp_max = 0;
  if (characterClass) {
    const hitDie = characterClass.data.hit_die || 8;
    const avgHitDie = Math.floor(hitDie / 2) + 1;
    hp_max = hitDie + conMod + (level - 1) * (avgHitDie + conMod);
  } else {
    hp_max = 10 + conMod + (level - 1) * (6 + conMod);
  }

  // 2. AC Calculation
  // Find equipped armor and shield
  const equippedArmor = character.inventory
    .map((invItem) => ({
      ...invItem,
      data: inventoryItems.find((i) => i.id === invItem.item_id),
    }))
    .find((item) => item.is_equipped && item.data?.base_ac !== undefined);

  const hasShield = character.inventory
    .map((invItem) => ({
      ...invItem,
      data: inventoryItems.find((i) => i.id === invItem.item_id),
    }))
    .some(
      (item) =>
        item.is_equipped && item.data?.name?.toLowerCase().includes("schild"),
    );

  let ac = 10 + dexMod; // Base unarmored

  if (equippedArmor && equippedArmor.data) {
    const armor = equippedArmor.data as Armor;
    const category = armor.category?.toLowerCase() || "";

    if (category.includes("leicht")) {
      ac = armor.base_ac + dexMod;
    } else if (category.includes("mittel")) {
      ac = armor.base_ac + Math.min(dexMod, 2);
    } else if (category.includes("schwer")) {
      ac = armor.base_ac;
    }
  }

  if (hasShield) {
    ac += 2;
  }

  // 3. Initiative
  let initiative = dexMod;

  // 4. Saving Throws
  const saving_throws: Record<keyof Attributes, number> = {
    str: calculateModifier(attributes.str),
    dex: calculateModifier(attributes.dex),
    con: calculateModifier(attributes.con),
    int: calculateModifier(attributes.int),
    wis: calculateModifier(attributes.wis),
    cha: calculateModifier(attributes.cha),
  };

  if (character.proficiencies?.saving_throws) {
    character.proficiencies.saving_throws.forEach((attr) => {
      saving_throws[attr] += profBonus;
    });
  }

  // 5. Skills
  const skills: Record<string, number> = {};
  Object.entries(SKILL_MAP).forEach(([skillName, attr]) => {
    const isProficient = character.proficiencies?.skills?.includes(skillName);
    skills[skillName] =
      calculateModifier(attributes[attr]) + (isProficient ? profBonus : 0);
  });

  // 6. Passive Perception
  const passive_perception =
    10 + (skills["Wahrnehmung"] || calculateModifier(attributes.wis));

  // 7. Spellcasting Stats
  let spell_save_dc = 0;
  let spell_attack_bonus = 0;
  if (character.spellcasting) {
    const spellMod = calculateModifier(
      attributes[character.spellcasting.ability],
    );
    spell_save_dc = 8 + profBonus + spellMod;
    spell_attack_bonus = profBonus + spellMod;
  }

  // 8. Weapon Attacks
  const weapon_attacks: WeaponAttack[] = character.inventory
    .map((invItem) => ({
      ...invItem,
      data: inventoryItems.find((i) => i.id === invItem.item_id),
    }))
    .filter((item) => item.data?.damage_dice !== undefined)
    .map((item) => {
      const weapon = item.data as Weapon;
      const isProficient =
        character.proficiencies?.weapons?.includes(weapon.name) ||
        character.proficiencies?.weapons?.includes(weapon.weapon_type);

      const isRanged = weapon.weapon_type?.toLowerCase().includes("fernkampf");
      const isFinesse = weapon.data?.properties?.some(
        (p: string) => p.toLowerCase() === "finesse",
      );

      let abilityMod = calculateModifier(attributes.str);
      if (isRanged) abilityMod = calculateModifier(attributes.dex);
      else if (isFinesse)
        abilityMod = Math.max(
          calculateModifier(attributes.str),
          calculateModifier(attributes.dex),
        );

      return {
        name: weapon.name,
        attack_bonus: abilityMod + (isProficient ? profBonus : 0),
        damage: `${weapon.damage_dice}${abilityMod >= 0 ? "+" : ""}${abilityMod} ${weapon.damage_type}`,
        properties: weapon.data?.properties || [],
      };
    });

  // 9. Encumbrance
  const maxWeight = character.meta.use_metric
    ? attributes.str * 7.5
    : attributes.str * 15;
  const currentWeight = character.inventory.reduce((sum, item) => {
    const data = inventoryItems.find((i) => i.id === item.item_id);
    return sum + (data?.weight_kg || 0) * item.quantity;
  }, 0);

  // Apply Modifiers
  activeModifiers.forEach((mod) => {
    if (mod.target === "ac") {
      if (mod.modifier_type === "Add") ac += mod.value;
      if (mod.modifier_type === "Override") ac = mod.value;
    }
    if (mod.target === "hp_max") {
      if (mod.modifier_type === "Add") hp_max += mod.value;
      if (mod.modifier_type === "Override") hp_max = mod.value;
    }
    if (mod.target === "initiative") {
      if (mod.modifier_type === "Add") initiative += mod.value;
      if (mod.modifier_type === "Override") initiative = mod.value;
    }
  });

  return {
    hp_max,
    ac,
    initiative,
    proficiency_bonus: profBonus,
    saving_throws,
    skills,
    passive_perception,
    spell_save_dc,
    spell_attack_bonus,
    encumbrance: {
      max: maxWeight,
      current: currentWeight,
    },
    weapon_attacks,
  };
};
