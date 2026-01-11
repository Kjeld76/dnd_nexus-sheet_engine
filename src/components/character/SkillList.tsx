import React from "react";
import { Character, Species } from "../../lib/types";
import { Users, Search, TrendingUp } from "lucide-react";
import { formatModifier } from "../../lib/math";
import { calculateDerivedStats } from "../../lib/characterLogic";
import { useCharacterStore } from "../../lib/store";
import { getTraitEffectsForSpecies, TraitEffect } from "../../lib/traitParser";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    <div className="bg-card p-10 rounded-[3rem] border border-border shadow-2xl shadow-foreground/[0.02]">
      {/* ... existing header code ... */}
      <div className="flex items-center justify-between mb-10 border-b border-border pb-8">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-primary/10 rounded-2xl shadow-inner">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter italic font-serif">
              Fertigkeiten
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
              Proficiency & Expertise
            </p>
          </div>
        </div>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40"
          />
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-6 py-2.5 bg-muted/30 border border-border rounded-xl text-xs outline-none focus:border-primary transition-all w-48"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
        {filteredSkills.map((skill) => {
          const isProficient =
            character.proficiencies?.skills?.includes(skill.name) ?? false;
          const skillEffects = getSkillEffects(skill.name);
          return (
            <div
              key={skill.name}
              className="flex items-center justify-between px-5 py-3.5 rounded-2xl hover:bg-muted/50 transition-all group border border-transparent hover:border-border/50"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="relative flex items-center shrink-0">
                  <input
                    type="checkbox"
                    checked={isProficient}
                    onChange={(e) => {
                      updateProficiency("skills", skill.name, e.target.checked);
                      saveCharacter();
                    }}
                    className="peer w-6 h-6 rounded-lg border-2 border-border text-primary focus:ring-4 focus:ring-primary/10 bg-background cursor-pointer transition-all appearance-none checked:bg-primary checked:border-primary"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                  </div>
                </div>
                <div className="flex flex-col -space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                      {skill.name}
                    </span>
                    {skillEffects.length > 0 && (
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded shrink-0"
                        title={`Vorteil bei ${skill.name} (${skillEffects.map((e) => e.source).join(", ")})`}
                      >
                        <TrendingUp size={10} className="text-emerald-500" />
                        <span className="text-[7px] font-black uppercase tracking-wider text-emerald-500">
                          V
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-40 group-hover:opacity-60">
                    ({skill.attr})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-px w-8 bg-border group-hover:bg-primary/20 transition-all" />
                <span className="font-black text-primary tracking-tight text-lg min-w-[40px] text-right">
                  {formatModifier(calculateBonus(skill))}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
