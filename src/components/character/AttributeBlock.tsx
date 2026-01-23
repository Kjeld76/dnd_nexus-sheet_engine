import React from "react";
import { calculateModifier, formatModifier } from "../../lib/math";
import { Species } from "../../lib/types";
import { getTraitEffectsForSpecies, TraitEffect } from "../../lib/traitParser";
import { TrendingUp } from "lucide-react";
import { UI_LOCKED_FIELD_CLASS } from "../../lib/uiConstants";
import { AutomatedHelper } from "../ui/AutomatedHelper";

interface Props {
  name: string;
  attrKey: "str" | "dex" | "con" | "int" | "wis" | "cha";
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  species?: Species;
  savingThrowBonus?: number;
  isSavingThrowProficient?: boolean;
  onToggleSavingThrow?: () => void;
}

const AttributeBlockComponent: React.FC<Props> = ({
  name,
  attrKey,
  value,
  onChange,
  onBlur,
  species,
  savingThrowBonus,
  isSavingThrowProficient,
  onToggleSavingThrow,
}) => {
  const modifier = calculateModifier(value);
  const modifierText = formatModifier(modifier);

  const traitEffects: TraitEffect[] = species
    ? getTraitEffectsForSpecies(species)
    : [];
  const savingThrowEffects = traitEffects.filter(
    (effect) =>
      effect.target === `${attrKey} saving throw` &&
      effect.type === "advantage",
  );

  return (
    <div className="flex flex-col items-center p-3 bg-card rounded-lg border-2 border-border shadow-lg shadow-foreground/[0.02] transition-all hover:border-primary/40 w-full group relative overflow-hidden active:scale-[0.98]">
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/10 group-hover:bg-primary/40 transition-all duration-500" />

      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-xs font-black text-muted-foreground/80 uppercase tracking-[0.25em]">
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

      <div className="mt-2 w-full flex items-center justify-center gap-12">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
              Mod
            </span>
            <AutomatedHelper size={10} />
          </div>
          <div
            className={`text-lg font-black text-primary px-3 py-1 rounded-lg border min-w-[55px] text-center shadow-inner tracking-tight transition-all duration-300 ${UI_LOCKED_FIELD_CLASS}`}
          >
            {modifierText}
          </div>
        </div>

        {savingThrowBonus !== undefined && onToggleSavingThrow && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center shrink-0">
                <input
                  type="checkbox"
                  checked={isSavingThrowProficient || false}
                  onChange={onToggleSavingThrow}
                  className="peer w-4 h-4 rounded-md border-2 border-border text-primary focus:ring-2 focus:ring-primary/10 bg-background cursor-pointer transition-all appearance-none checked:bg-primary checked:border-primary"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">
                  <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                RW
              </span>
            </div>
            <div className="text-lg font-black text-primary bg-muted/50 px-3 py-1 rounded-lg border border-border min-w-[55px] text-center shadow-inner tracking-tight group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
              {formatModifier(savingThrowBonus)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AttributeBlock = React.memo(AttributeBlockComponent);
