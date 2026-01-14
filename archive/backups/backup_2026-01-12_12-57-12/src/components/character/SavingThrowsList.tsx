import React from "react";
import { Character, Species } from "../../lib/types";
import { Shield, TrendingUp } from "lucide-react";
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
    <div className="bg-card p-5 rounded-xl border border-border shadow-xl shadow-foreground/[0.02]">
      <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
        <div className="p-2.5 bg-primary/10 rounded-lg shadow-inner">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-xl font-black tracking-tighter italic font-serif">
            Rettungswürfe
          </h2>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
            Proficiency & Vorteile
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
        {SAVING_THROWS.map((st) => {
          const isProficient =
            character.proficiencies?.saving_throws?.includes(st.attr) ?? false;
          const bonus = stats.saving_throws[st.attr];
          const savingThrowEffects = getSavingThrowEffects(st.attr);

          return (
            <div
              key={st.attr}
              className="flex items-center px-3 py-2 rounded-lg hover:bg-muted/50 transition-all group border border-transparent hover:border-border/50 gap-2"
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
                  className="peer w-5 h-5 rounded-md border-2 border-border text-primary focus:ring-2 focus:ring-primary/10 bg-background cursor-pointer transition-all appearance-none checked:bg-primary checked:border-primary"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                </div>
              </div>
              <div className="flex flex-col -space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                    {st.name}
                  </span>
                  {savingThrowEffects.length > 0 && (
                    <div
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded shrink-0"
                      title={`Vorteil bei ${st.name} Rettungswürfen (${savingThrowEffects.map((e) => e.source).join(", ")})`}
                    >
                      <TrendingUp size={10} className="text-emerald-500" />
                      <span className="text-[7px] font-black uppercase tracking-wider text-emerald-500">
                        V
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider opacity-40 group-hover:opacity-60">
                  {st.abbr}
                </span>
              </div>
              <div className="h-px w-3 bg-border group-hover:bg-primary/20 transition-all shrink-0" />
              <span className="font-black text-primary tracking-tight text-base min-w-[30px] text-right shrink-0">
                {formatModifier(bonus)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
