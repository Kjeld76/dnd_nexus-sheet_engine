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
  weapon_id: string;
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
  inventoryItems: Array<Weapon | Armor> = [],
  activeModifiers: Modifier[] = [],
): DerivedStats => {
  const isWeapon = (v: unknown): v is Weapon => {
    if (typeof v !== "object" || v === null) return false;
    return (v as { damage_dice?: unknown }).damage_dice !== undefined;
  };
  const normalize = (v: string) => v.trim().toLowerCase();
  const parseNumber = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed.replace(/^\+/, ""));
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };
  const parseJsonObject = (v: unknown): Record<string, unknown> | null => {
    if (typeof v === "object" && v !== null)
      return v as Record<string, unknown>;
    if (typeof v === "string") {
      try {
        const parsed = JSON.parse(v) as unknown;
        if (typeof parsed === "object" && parsed !== null)
          return parsed as Record<string, unknown>;
      } catch {
        // ignore
      }
    }
    return null;
  };
  const hasWeaponProperty = (weapon: Weapon, propertyId: string) => {
    const wanted = normalize(propertyId);
    return (
      weapon.properties?.some(
        (p) => normalize(p.id) === wanted || normalize(p.name) === wanted,
      ) ?? false
    );
  };
  const getWeaponMagicBonus = (weapon: Weapon) => {
    let attack = 0;
    let damage = 0;

    for (const prop of weapon.properties ?? []) {
      if (normalize(prop.parameter_type ?? "") !== "bonus") continue;

      const obj = parseJsonObject(prop.parameter_value);
      if (!obj) continue;

      // Schema (DB trigger): { bonus_type: 'flat'|'dice', attack_bonus: number, damage_bonus?: number }
      const atk = parseNumber(obj.attack_bonus);
      const dmg = parseNumber(obj.damage_bonus);
      if (atk !== null) attack += atk;
      if (dmg !== null) damage += dmg;
      // Falls nur attack_bonus existiert (z.B. +1 Waffe), Damage standardmäßig gleich behandeln
      if (atk !== null && dmg === null) damage += atk;
    }

    return { attack, damage };
  };
  const getInventoryItemMagicBonus = (
    inv: { custom_data?: Record<string, unknown> } | null | undefined,
  ) => {
    const obj = inv?.custom_data;
    if (!obj) return { attack: 0, damage: 0 };

    // Unterstützte Keys (flexibel, damit wir keine harte Struktur voraussetzen)
    const shared =
      parseNumber(obj.magic_bonus) ??
      parseNumber(obj.bonus) ??
      parseNumber(obj.enhancement_bonus);

    const attack =
      (shared ?? 0) +
      (parseNumber(obj.attack_bonus) ??
        parseNumber(obj.to_hit_bonus) ??
        parseNumber(obj.hit_bonus) ??
        0);

    const damage =
      (shared ?? 0) +
      (parseNumber(obj.damage_bonus) ??
        parseNumber(obj.dmg_bonus) ??
        parseNumber(obj.damage_mod) ??
        0);

    return { attack, damage };
  };
  const getWeaponRangeLabels = (weapon: Weapon): string[] => {
    const data = (weapon.data ?? {}) as Record<string, unknown>;
    const range = data.range as { normal?: unknown; max?: unknown } | undefined;
    const thrown = data.thrown_range as
      | { normal?: unknown; max?: unknown }
      | undefined;

    const labels: string[] = [];
    const normal = parseNumber(range?.normal);
    const max = parseNumber(range?.max);
    if (normal !== null && max !== null)
      labels.push(`Reichweite ${normal}/${max}`);

    const tNormal = parseNumber(thrown?.normal);
    const tMax = parseNumber(thrown?.max);
    if (tNormal !== null && tMax !== null)
      labels.push(`Wurf ${tNormal}/${tMax}`);

    return labels;
  };
  const getVersatileDice = (weapon: Weapon): string | null => {
    const data = (weapon.data ?? {}) as Record<string, unknown>;
    const versatile = data.versatile_damage;
    return typeof versatile === "string" && versatile.trim().length > 0
      ? versatile.trim()
      : null;
  };
  const getOffhandFlags = (inv: { custom_data?: Record<string, unknown> }) => {
    const obj = inv.custom_data ?? {};
    const hand = typeof obj.hand === "string" ? normalize(obj.hand) : "";
    const isOffhand =
      hand === "off" ||
      hand === "offhand" ||
      hand === "nebenhand" ||
      obj.offhand === true;

    const twoWeaponFighting =
      obj.two_weapon_fighting === true ||
      obj.twoWeaponFighting === true ||
      obj.add_ability_to_offhand_damage === true;

    const twoHanded =
      obj.two_handed === true ||
      obj.twoHanded === true ||
      obj.is_two_handed === true;

    return { isOffhand, twoWeaponFighting, twoHanded };
  };
  const isWeaponRanged = (weapon: Weapon) => {
    // bevorzugt strukturierte Infos
    // range != thrown_range → echtes Fernkampf-Attribut (DEX)
    const data = (weapon.data ?? {}) as Record<string, unknown>;
    if (
      data.range &&
      (hasWeaponProperty(weapon, "ammunition") ||
        normalize(weapon.weapon_subtype ?? "").includes("fernkampf"))
    )
      return true;
    const subtype = weapon.weapon_subtype
      ? normalize(weapon.weapon_subtype)
      : "";
    if (subtype.includes("fernkampf")) return true;

    // Fallbacks
    const cat = weapon.category ? normalize(weapon.category) : "";
    if (cat.includes("ranged") || cat.includes("fernkampf")) return true;
    if (hasWeaponProperty(weapon, "ammunition")) return true;
    return false;
  };
  const isWeaponProficient = (weapon: Weapon) => {
    const profs = character.proficiencies?.weapons ?? [];
    if (profs.length === 0) return false;

    const weaponKeys = [
      weapon.name,
      weapon.category,
      weapon.category_label ?? "",
      weapon.weapon_subtype ?? "",
    ]
      .map((v) => normalize(v))
      .filter(Boolean);

    return profs.some((p) => {
      const prof = normalize(p);
      return weaponKeys.some(
        (k) => k === prof || k.includes(prof) || prof.includes(k),
      );
    });
  };
  const level = character.meta.level;
  const attributes = character.attributes;
  const conMod = calculateModifier(attributes.con);
  const dexMod = calculateModifier(attributes.dex);
  const profBonus = calculateProficiencyBonus(level);

  // 1. HP Calculation
  let hp_max = 0;
  if (characterClass) {
    const hitDie =
      typeof characterClass.data?.hit_die === "number"
        ? characterClass.data.hit_die
        : 8;
    const avgHitDie = Math.floor(hitDie / 2) + 1;
    hp_max = hitDie + conMod + (level - 1) * (avgHitDie + conMod);
  } else {
    hp_max = 10 + conMod + (level - 1) * (6 + conMod);
  }

  // 2. AC Calculation
  // Find equipped armor (only one armor can be equipped, plus optional shield)
  const equippedArmor = character.inventory
    .map((invItem) => ({
      ...invItem,
      data: inventoryItems.find((i) => i.id === invItem.item_id),
    }))
    .filter((item) => item.is_equipped && item.data?.category)
    .find((item) => {
      const category = item.data?.category?.toLowerCase() || "";
      return (
        category !== "schild" &&
        (category.includes("ruestung") ||
          category === "leichte_ruestung" ||
          category === "mittelschwere_ruestung" ||
          category === "schwere_ruestung")
      );
    });

  const equippedShield = character.inventory
    .map((invItem) => ({
      ...invItem,
      data: inventoryItems.find((i) => i.id === invItem.item_id),
    }))
    .find((item) => item.is_equipped && item.data?.category === "schild");

  let ac = 10 + dexMod; // Base unarmored

  if (equippedArmor && equippedArmor.data) {
    const armor = equippedArmor.data as Armor;
    const category = armor.category?.toLowerCase() || "";

    // Use ac_formula if available, otherwise fall back to base_ac
    if (armor.ac_formula) {
      // Parse formula like "11 + DEX", "12 + DEX (max. 2)", "14"
      const formula = armor.ac_formula;
      if (formula.includes("+ DEX")) {
        const baseMatch = formula.match(/(\d+)/);
        const base = baseMatch ? parseInt(baseMatch[1]) : 10;
        if (formula.includes("max. 2")) {
          ac = base + Math.min(dexMod, 2);
        } else {
          ac = base + dexMod;
        }
      } else {
        // Fixed value like "14"
        const baseMatch = formula.match(/(\d+)/);
        ac = baseMatch ? parseInt(baseMatch[1]) : 10;
      }
    } else if (armor.base_ac !== null && armor.base_ac !== undefined) {
      // Fallback to old base_ac logic
      if (category.includes("leicht")) {
        ac = armor.base_ac + dexMod;
      } else if (category.includes("mittel")) {
        ac = armor.base_ac + Math.min(dexMod, 2);
      } else if (category.includes("schwer")) {
        ac = armor.base_ac;
      }
    }
  }

  // Add shield bonus
  if (equippedShield && equippedShield.data) {
    const shield = equippedShield.data as Armor;
    ac += shield.ac_bonus || 2; // Default +2 for shields
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
    .filter((item) => item.is_equipped && isWeapon(item.data))
    .map((item) => {
      const weapon = item.data as Weapon;
      const isProficient = isWeaponProficient(weapon);
      const isRanged = isWeaponRanged(weapon);
      const isFinesse = hasWeaponProperty(weapon, "finesse");
      const flags = getOffhandFlags(item);

      let abilityMod = calculateModifier(attributes.str);
      if (isRanged) abilityMod = calculateModifier(attributes.dex);
      else if (isFinesse)
        abilityMod = Math.max(
          calculateModifier(attributes.str),
          calculateModifier(attributes.dex),
        );

      const rangeLabels = getWeaponRangeLabels(weapon);
      const baseProperties =
        weapon.properties?.map((p) => p.name || p.id) || [];
      const properties = [...rangeLabels, ...baseProperties];
      const weaponBonus = getWeaponMagicBonus(weapon);
      const invBonus = getInventoryItemMagicBonus(item);
      const attackBonus = weaponBonus.attack + invBonus.attack;
      const damageBonus = weaponBonus.damage + invBonus.damage;
      const addAbilityToDamage =
        !flags.isOffhand || (flags.isOffhand && flags.twoWeaponFighting);
      const abilityDamageMod = addAbilityToDamage ? abilityMod : 0;
      const totalDamageMod = abilityDamageMod + damageBonus;

      const versatileDice = getVersatileDice(weapon);
      const baseDice =
        versatileDice && flags.twoHanded ? versatileDice : weapon.damage_dice;
      const versatileSuffix =
        versatileDice && !flags.twoHanded ? ` (2H: ${versatileDice})` : "";

      return {
        weapon_id: weapon.id,
        name: weapon.name,
        attack_bonus: abilityMod + (isProficient ? profBonus : 0) + attackBonus,
        damage: `${baseDice}${totalDamageMod >= 0 ? "+" : ""}${totalDamageMod} ${weapon.damage_type}${versatileSuffix}`,
        properties: properties,
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
