import React from "react";
import { Character, Species } from "../../lib/types";
import { TrendingUp } from "lucide-react";
import { formatModifier } from "../../lib/math";
import { calculateDerivedStats } from "../../lib/characterLogic";
import { useCharacterStore } from "../../lib/store";
import { getTraitEffectsForSpecies, TraitEffect } from "../../lib/traitParser";

interface Props {
  character: Character;
  species?: Species;
}

const SAVING_THROWS = [
  { name: "Stärke", attr: "str" as const, abbr: "STR" },
  { name: "Geschick", attr: "dex" as const, abbr: "DEX" },
  { name: "Konstitution", attr: "con" as const, abbr: "CON" },
  { name: "Intelligenz", attr: "int" as const, abbr: "INT" },
  { name: "Weisheit", attr: "wis" as const, abbr: "WIS" },
  { name: "Charisma", attr: "cha" as const, abbr: "CHA" },
];

export const SavingThrowsList: React.FC<Props> = ({ character, species }) => {
  const { updateProficiency, saveCharacter } = useCharacterStore();
  const stats = calculateDerivedStats(character);

  const traitEffects: TraitEffect[] = species
    ? getTraitEffectsForSpecies(species)
    : [];

  const getSavingThrowEffects = (
    attr: keyof typeof character.attributes,
  ): TraitEffect[] => {
    return traitEffects.filter(
      (effect) =>
        effect.target === `${attr} saving throw` && effect.type === "advantage",
    );
  };

  return (
    <div>
      <div className="space-y-1">
        {SAVING_THROWS.map((st) => {
          const isProficient =
            character.proficiencies?.saving_throws?.includes(st.attr) ?? false;
          const bonus = stats.saving_throws[st.attr];
          const savingThrowEffects = getSavingThrowEffects(st.attr);

          return (
            <div
              key={st.attr}
              className="flex items-center px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-all group border border-transparent hover:border-border/50 gap-2 min-w-0"
            >
              <div className="relative flex items-center shrink-0">
                <input
                  type="checkbox"
                  checked={isProficient}
                  onChange={(e) => {
                    updateProficiency(
                      "saving_throws",
                      st.attr,
                      e.target.checked,
                    );
                    saveCharacter();
                  }}
                  className="peer w-4 h-4 rounded-md border-2 border-border text-primary focus:ring-2 focus:ring-primary/10 bg-background cursor-pointer transition-all appearance-none checked:bg-primary checked:border-primary"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">
                  <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                  {st.name}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider opacity-40 shrink-0">
                  {st.abbr}
                </span>
                {savingThrowEffects.length > 0 && (
                  <div
                    className="flex items-center gap-1 px-1 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded shrink-0"
                    title={`Vorteil bei ${st.name} Rettungswürfen (${savingThrowEffects.map((e) => e.source).join(", ")})`}
                  >
                    <TrendingUp size={8} className="text-emerald-500" />
                    <span className="text-[6px] font-black uppercase tracking-wider text-emerald-500">
                      V
                    </span>
                  </div>
                )}
              </div>
              <div className="h-px w-2 bg-border group-hover:bg-primary/20 transition-all shrink-0" />
              <span className="font-black text-primary tracking-tight text-base min-w-[32px] text-right shrink-0">
                {formatModifier(bonus)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
