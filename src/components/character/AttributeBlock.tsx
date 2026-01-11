import React from "react";
import { calculateModifier, formatModifier } from "../../lib/math";
import { Species } from "../../lib/types";
import { getTraitEffectsForSpecies, TraitEffect } from "../../lib/traitParser";
import { TrendingUp } from "lucide-react";

interface Props {
  name: string;
  attrKey: "str" | "dex" | "con" | "int" | "wis" | "cha";
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  species?: Species;
}

export const AttributeBlock: React.FC<Props> = ({
  name,
  attrKey,
  value,
  onChange,
  onBlur,
  species,
}) => {
  const modifier = calculateModifier(value);
  const modifierText = formatModifier(modifier);

  // Find trait effects for this attribute's saving throw
  const traitEffects: TraitEffect[] = species
    ? getTraitEffectsForSpecies(species)
    : [];
  const savingThrowEffects = traitEffects.filter(
    (effect) =>
      effect.target === `${attrKey} saving throw` &&
      effect.type === "advantage",
  );

  return (
    <div className="flex flex-col items-center p-3.5 bg-card rounded-lg border border-border shadow-lg shadow-foreground/[0.02] transition-all hover:border-primary/40 w-full group relative overflow-hidden active:scale-[0.98]">
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/10 group-hover:bg-primary/40 transition-all duration-500" />

      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[9px] font-black text-muted-foreground/70 uppercase tracking-[0.25em]">
          {name}
        </span>
        {savingThrowEffects.length > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg"
            title={`Vorteil bei ${name} Rettungswürfen (${savingThrowEffects.map((e) => e.source).join(", ")})`}
          >
            <TrendingUp size={12} className="text-emerald-500" />
            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-500">
              Vorteil
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          onBlur={onBlur}
          className="w-full text-2xl font-black bg-transparent text-center focus:outline-none transition-all tracking-tighter text-foreground selection:bg-primary/20"
        />
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none" />
      </div>

      <div className="mt-3 w-full flex justify-center">
        <div className="text-lg font-black text-primary bg-muted/50 px-4 py-1.5 rounded-xl border border-border min-w-[60px] text-center shadow-inner tracking-tight group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
          {modifierText}
        </div>
      </div>
    </div>
  );
};
