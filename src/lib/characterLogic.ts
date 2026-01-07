import { Character, Attributes, Modifier, Class } from './types';
import { calculateModifier, calculateProficiencyBonus } from './math';

export interface DerivedStats {
  hp_max: number;
  ac: number;
  initiative: number;
  proficiency_bonus: number;
  saving_throws: Record<keyof Attributes, number>;
  skills: Record<string, number>;
  passive_perception: number;
  encumbrance: {
    max: number;
    current: number;
  };
}

/**
 * Calculates all derived statistics for a character based on PHB 2024 rules.
 */
export const calculateDerivedStats = (
  character: Character, 
  characterClass?: Class,
  activeModifiers: Modifier[] = []
): DerivedStats => {
  const level = character.meta.level;
  const attributes = character.attributes;
  const conMod = calculateModifier(attributes.con);
  const dexMod = calculateModifier(attributes.dex);
  const profBonus = calculateProficiencyBonus(level);

  // 1. HP Calculation
  // PHB 2024: Level 1 = Max Hit Die + CON. Level 2+ = (Avg or Roll) + CON per level.
  let hp_max = 0;
  if (characterClass) {
    const hitDie = characterClass.data.hit_die || 8;
    const avgHitDie = Math.floor(hitDie / 2) + 1;
    hp_max = hitDie + conMod + (level - 1) * (avgHitDie + conMod);
  } else {
    // Fallback if no class selected
    hp_max = 10 + conMod + (level - 1) * (6 + conMod);
  }

  // 2. AC Calculation
  // Base 10 + Dex. In Phase 4 we will integrate armor logic.
  let ac = 10 + dexMod;

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
    character.proficiencies.saving_throws.forEach(attr => {
      saving_throws[attr] += profBonus;
    });
  }

  // 5. Skills (simplified for now, using base attributes)
  const skills: Record<string, number> = {};

  // 6. Passive Perception
  const perceptionMod = calculateModifier(attributes.wis) + (character.proficiencies?.skills?.includes('Wahrnehmung') ? profBonus : 0);
  const passive_perception = 10 + perceptionMod;

  // 7. Encumbrance (Strength * 15 lbs or * 7.5 kg)
  const maxWeight = character.meta.use_metric ? attributes.str * 7.5 : attributes.str * 15;
  const currentWeight = 0; // Will be calculated from inventory

  // Apply Modifiers
  activeModifiers.forEach(mod => {
    if (mod.target === 'ac') {
        if (mod.modifier_type === 'Add') ac += mod.value;
        if (mod.modifier_type === 'Override') ac = mod.value;
    }
    if (mod.target === 'hp_max') {
        if (mod.modifier_type === 'Add') hp_max += mod.value;
        if (mod.modifier_type === 'Override') hp_max = mod.value;
    }
    if (mod.target === 'initiative') {
        if (mod.modifier_type === 'Add') initiative += mod.value;
        if (mod.modifier_type === 'Override') initiative = mod.value;
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
    encumbrance: {
      max: maxWeight,
      current: currentWeight
    }
  };
};

