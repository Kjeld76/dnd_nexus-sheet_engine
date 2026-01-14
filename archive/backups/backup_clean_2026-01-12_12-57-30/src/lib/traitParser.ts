export interface TraitEffect {
  type: "advantage" | "bonus" | "resistance" | "proficiency" | "other";
  target: string; // e.g. 'con saving throw', 'Athletik', 'poison damage'
  value?: number; // for bonuses
  source: string; // trait name
}

export function parseTraitEffects(trait: any): TraitEffect[] {
  const effects: TraitEffect[] = [];
  const desc = (trait.description || "").toLowerCase();

  // Vorteil bei Rettungswürfen
  if (desc.includes("vorteil") && desc.includes("rettungswurf")) {
    const attrMatch = desc.match(
      /(?:auf|bei)\s+(?:rettungswürfen\s+(?:auf|gegen|bei|zum)?\s*)?(\w+)/,
    );
    if (attrMatch) {
      const attr = attrMatch[1];
      const attrMap: Record<string, string> = {
        stärke: "str",
        geschick: "dex",
        konstitution: "con",
        intelligenz: "int",
        weisheit: "wis",
        charisma: "cha",
        vergift: "con", // "gegen Vergiftung" -> con saving throw
      };
      const attrKey = attrMap[attr] || attr;
      effects.push({
        type: "advantage",
        target: `${attrKey} saving throw`,
        source: trait.name,
      });
    }
  }

  // Vorteil bei Fertigkeiten
  if (
    desc.includes("vorteil") &&
    (desc.includes("fertigkeit") || desc.includes("wurf"))
  ) {
    const skillMatch = desc.match(
      /(?:auf|bei)\s+(?:fertigkeitswürfen\s+(?:auf|bei)?\s*)?([A-ZÄÖÜ][\w\s]+)/,
    );
    if (skillMatch) {
      effects.push({
        type: "advantage",
        target: skillMatch[1].trim(),
        source: trait.name,
      });
    }
  }

  // Resistenz
  if (desc.includes("resistenz") || desc.includes("resistent")) {
    const damageMatch = desc.match(
      /(?:gegen|zu)\s+([\w\s]+)\s+(?:schaden|schäden)/,
    );
    if (damageMatch) {
      effects.push({
        type: "resistance",
        target: damageMatch[1].trim(),
        source: trait.name,
      });
    }
  }

  // Bonus auf Attribute (selten, aber möglich)
  if (
    desc.includes("bonus") &&
    (desc.includes("attribut") || desc.includes("wert"))
  ) {
    const bonusMatch = desc.match(/(\d+)\s+(?:zu|auf)\s+(\w+)/);
    if (bonusMatch) {
      effects.push({
        type: "bonus",
        target: bonusMatch[2],
        value: parseInt(bonusMatch[1]),
        source: trait.name,
      });
    }
  }

  return effects;
}

export function getTraitEffectsForSpecies(species: any): TraitEffect[] {
  if (!species?.data?.traits) return [];

  const allEffects: TraitEffect[] = [];
  species.data.traits.forEach((trait: any) => {
    const effects = parseTraitEffects(trait);
    allEffects.push(...effects);
  });

  return allEffects;
}
