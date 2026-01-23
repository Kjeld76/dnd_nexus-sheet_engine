import React, { useMemo } from "react";
import { useCharacterStore } from "../../lib/store";
import { useCompendiumStore } from "../../lib/compendiumStore";
import { calculateDerivedStats } from "../../lib/characterLogic";
import { formatModifier } from "../../lib/math";
import { UI_LOCKED_FIELD_CLASS } from "../../lib/uiConstants";
import { AutomatedHelper } from "../ui/AutomatedHelper";
import { CheckCircle2, Circle, Wand2, Target } from "lucide-react";

export const SpellbookTable: React.FC = () => {
  const { currentCharacter, updateMeta, updateSpellPreparation } =
    useCharacterStore();
  const {
    spells: allSpells,
    classes,
    species,
    weapons,
    armor,
  } = useCompendiumStore();

  const characterSpells = currentCharacter?.spells || [];

  // Calculate Derived Stats for Spell DC / Attack
  const stats = useMemo(() => {
    if (!currentCharacter) return null;

    const currentClass = classes.find(
      (c) => c.id === currentCharacter.meta.class_id,
    );
    const currentSpecies = species.find(
      (s) => s.id === currentCharacter.meta.species_id,
    );
    const inventoryItems = [...weapons, ...armor];

    return calculateDerivedStats(
      currentCharacter,
      currentClass,
      currentSpecies,
      inventoryItems,
    );
  }, [currentCharacter, classes, species, weapons, armor]);

  const resolvedSpells = useMemo(() => {
    return characterSpells
      .map((cs) => {
        const details = allSpells.find((s) => s.id === cs.spell_id);
        return {
          ...cs,
          details,
        };
      })
      .sort((a, b) => (a.details?.level || 0) - (b.details?.level || 0));
  }, [characterSpells, allSpells]);

  const spellsByLevel = useMemo(() => {
    const levels: Record<number, typeof resolvedSpells> = {};
    resolvedSpells.forEach((s) => {
      const level = s.details?.level || 0;
      if (!levels[level]) levels[level] = [];
      levels[level].push(s);
    });
    return levels;
  }, [resolvedSpells]);

  if (!currentCharacter) return null;

  // Safety check for stats
  const spellSaveDC = stats?.spell_save_dc || 10;
  const spellAttackBonus = stats?.spell_attack_bonus || 0;

  return (
    <div className="space-y-6">
      {/* Spell Stats Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className={`flex-1 bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm ${UI_LOCKED_FIELD_CLASS}`}
        >
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
            <Wand2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                Zauber-SG
              </p>
              <AutomatedHelper size={12} />
            </div>
            <p className="text-3xl font-black text-foreground">{spellSaveDC}</p>
          </div>
        </div>
        <div
          className={`flex-1 bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm ${UI_LOCKED_FIELD_CLASS}`}
        >
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
            <Target size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                Zauber-Angriff
              </p>
              <AutomatedHelper size={12} />
            </div>
            <p className="text-3xl font-black text-foreground">
              {formatModifier(spellAttackBonus)}
            </p>
          </div>
        </div>
      </div>

      {/* Spell Slots Summary */}
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
          const totalKey =
            `spell_slots_${level}` as keyof typeof currentCharacter.meta;
          const usedKey =
            `spell_slots_used_${level}` as keyof typeof currentCharacter.meta;
          const totalValue = (currentCharacter.meta[totalKey] as number) || 0;
          const usedValue = (currentCharacter.meta[usedKey] as number) || 0;

          // Don't show levels we don't have slots for, except Level 1
          if (totalValue === 0 && level > 1) return null;

          return (
            <div
              key={level}
              className="bg-card p-3 rounded-2xl border border-border flex flex-col items-center gap-1 shadow-sm"
            >
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Grad {level}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={usedValue}
                  onChange={(e) =>
                    updateMeta({ [usedKey]: parseInt(e.target.value) || 0 })
                  }
                  className="w-8 bg-transparent text-center font-bold text-primary focus:outline-none text-sm"
                />
                <span className="text-muted-foreground text-xs">/</span>
                <input
                  type="number"
                  value={totalValue}
                  onChange={(e) =>
                    updateMeta({ [totalKey]: parseInt(e.target.value) || 0 })
                  }
                  className="w-8 bg-transparent text-center font-medium focus:outline-none text-sm"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Spells List */}
      <div className="space-y-6">
        {Object.keys(spellsByLevel).map((levelStr) => {
          const level = parseInt(levelStr);
          const levelSpells = spellsByLevel[level];

          return (
            <div key={level} className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">
                  {level === 0 ? "Zaubertricks" : `Grad ${level}`}
                </h3>
                <div className="h-px w-full bg-border/50" />
              </div>
              <div className="bg-card rounded-[2rem] border-2 border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="p-4 w-12 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Vorb.
                        </th>
                        <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Zauber
                        </th>
                        <th className="p-4 hidden md:table-cell text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Zeit
                        </th>
                        <th className="p-4 hidden md:table-cell text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Reichweite
                        </th>
                        <th className="p-4 hidden md:table-cell text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Dauer
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {levelSpells.map((spell) => (
                        <tr
                          key={spell.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors group"
                        >
                          <td className="p-4 text-center">
                            {level > 0 && (
                              <button
                                onClick={() =>
                                  updateSpellPreparation(
                                    spell.id,
                                    !spell.is_prepared,
                                  )
                                }
                                disabled={spell.is_always_prepared}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                                  spell.is_prepared
                                    ? "bg-primary/20 text-primary shadow-inner shadow-primary/10"
                                    : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"
                                } ${spell.is_always_prepared ? "opacity-100 ring-1 ring-primary/30" : ""}`}
                              >
                                {spell.is_prepared ? (
                                  <CheckCircle2 size={16} strokeWidth={2.5} />
                                ) : (
                                  <Circle size={16} />
                                )}
                              </button>
                            )}
                            {level === 0 && (
                              <span className="text-muted-foreground/30">
                                —
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                {spell.details?.name || "Unbekannter Zauber"}
                              </span>
                              <span className="text-[10px] text-muted-foreground italic">
                                {spell.details?.school}
                                {spell.source && (
                                  <span className="ml-2 font-normal opacity-50">
                                    ({spell.source})
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell text-xs font-medium text-muted-foreground">
                            {spell.details?.casting_time}
                          </td>
                          <td className="p-4 hidden md:table-cell text-xs font-medium text-muted-foreground">
                            {spell.details?.range}
                          </td>
                          <td className="p-4 hidden md:table-cell text-xs font-medium text-muted-foreground">
                            {spell.details?.duration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
        {Object.keys(spellsByLevel).length === 0 && (
          <div className="p-12 text-center bg-muted/20 rounded-[3rem] border-2 border-dashed border-border">
            <p className="text-muted-foreground font-medium italic">
              Noch keine Zauber in diesem Zauberbuch.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
