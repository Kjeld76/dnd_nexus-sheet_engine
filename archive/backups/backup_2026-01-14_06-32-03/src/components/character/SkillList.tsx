import React from "react";
import { Character, Species } from "../../lib/types";
import { Users, Search, TrendingUp } from "lucide-react";
import { formatModifier } from "../../lib/math";
import { calculateDerivedStats } from "../../lib/characterLogic";
import { useCharacterStore } from "../../lib/store";
import { getTraitEffectsForSpecies, TraitEffect } from "../../lib/traitParser";

interface Props {
  character: Character;
  onToggleProficiency: (skillName: string) => void;
  species?: Species;
}

const SKILLS = [
  // ... (keep the same skills list)
  { name: "Akrobatik", attr: "dex" },
  { name: "Tierkunde", attr: "wis" },
  { name: "Arkana", attr: "int" },
  { name: "Athletik", attr: "str" },
  { name: "Täuschen", attr: "cha" },
  { name: "Geschichte", attr: "int" },
  { name: "Motiv erkennen", attr: "wis" },
  { name: "Einschüchtern", attr: "cha" },
  { name: "Nachforschen", attr: "int" },
  { name: "Heilkunde", attr: "wis" },
  { name: "Naturkunde", attr: "int" },
  { name: "Wahrnehmung", attr: "wis" },
  { name: "Auftreten", attr: "cha" },
  { name: "Überzeugen", attr: "cha" },
  { name: "Religion", attr: "int" },
  { name: "Fingerfertigkeit", attr: "dex" },
  { name: "Heimlichkeit", attr: "dex" },
  { name: "Überlebenskunst", attr: "wis" },
];

export const SkillList: React.FC<Props> = ({ character, species }) => {
  const { updateProficiency, saveCharacter } = useCharacterStore();
  const stats = calculateDerivedStats(character);
  const [search, setSearch] = React.useState("");

  // Get trait effects for skills
  const traitEffects: TraitEffect[] = species
    ? getTraitEffectsForSpecies(species)
    : [];

  const calculateBonus = (skill: (typeof SKILLS)[0]) => {
    const isProficient =
      character.proficiencies?.skills?.includes(skill.name) ?? false;
    const attrMod =
      stats.saving_throws[skill.attr as keyof typeof stats.saving_throws]; // base mod
    return isProficient ? attrMod + stats.proficiency_bonus : attrMod;
  };

  const getSkillEffects = (skillName: string): TraitEffect[] => {
    return traitEffects.filter(
      (effect) =>
        effect.target.toLowerCase() === skillName.toLowerCase() &&
        effect.type === "advantage",
    );
  };

  const filteredSkills = SKILLS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-black uppercase tracking-wider text-muted-foreground">
          Fertigkeiten
        </h3>
        <div className="relative">
          <Search
            size={12}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40"
          />
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 pr-2 py-0.5 bg-muted/30 border border-border rounded text-[9px] outline-none focus:border-primary transition-all w-24"
          />
        </div>
      </div>

      <div className="space-y-1">
        {filteredSkills.map((skill) => {
          const isProficient =
            character.proficiencies?.skills?.includes(skill.name) ?? false;
          const skillEffects = getSkillEffects(skill.name);
          return (
            <div
              key={skill.name}
              className="flex items-center px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-all group border border-transparent hover:border-border/50 gap-2 min-w-0"
            >
              <div className="relative flex items-center shrink-0">
                <input
                  type="checkbox"
                  checked={isProficient}
                  onChange={(e) => {
                    updateProficiency("skills", skill.name, e.target.checked);
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
                  {skill.name}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider opacity-40 shrink-0">
                  ({skill.attr})
                </span>
                {skillEffects.length > 0 && (
                  <div
                    className="flex items-center gap-1 px-1 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded shrink-0"
                    title={`Vorteil bei ${skill.name} (${skillEffects.map((e) => e.source).join(", ")})`}
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
                {formatModifier(calculateBonus(skill))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
