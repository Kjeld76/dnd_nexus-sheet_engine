import React from "react";
import {
  Character,
  Class,
  Species,
  Weapon,
  Armor,
  Attributes,
  Feat,
  Background,
} from "../../lib/types";
import { AttributeBlock } from "./AttributeBlock";
import { SkillList } from "./SkillList";
import { HPManagement } from "./HPManagement";
import { WeaponsTable } from "./WeaponsTable";
import { ArmorTable } from "./ArmorTable";
import { SpeciesTraits } from "./SpeciesTraits";
import { FeatsList } from "./FeatsList";
import { ModifiersList } from "./ModifiersList";
import { calculateDerivedStats } from "../../lib/characterLogic";
import { formatModifier } from "../../lib/math";
import { Shield, Zap, Wind } from "lucide-react";
import { useCharacterStore } from "../../lib/store";
import { UI_LOCKED_FIELD_CLASS } from "../../lib/uiConstants";
import { AutomatedHelper } from "../ui/AutomatedHelper";

interface Props {
  character: Character;
  characterClass?: Class;
  characterSpecies?: Species;
  weapons: Weapon[];
  armor: Armor[];
  feats: Feat[];
  backgrounds: Background[];
  onUpdateAttribute: (key: keyof Attributes, value: number) => void;
  onUpdateMeta: (meta: Partial<Character["meta"]>) => void;
  onSaveCharacter: () => void;
  onRemoveFeat: (id: string) => void;
  onRemoveModifier: (id: string) => void;
}

export const CharacterSheetLayout: React.FC<Props> = ({
  character,
  characterClass,
  characterSpecies,
  weapons,
  armor,
  feats,
  backgrounds: _backgrounds,
  onUpdateAttribute,
  onUpdateMeta,
  onSaveCharacter,
  onRemoveFeat,
  onRemoveModifier,
}) => {
  const stats = calculateDerivedStats(
    character,
    characterClass,
    characterSpecies,
    [...weapons, ...armor],
  );
  const speed = characterSpecies?.data?.speed || 9;
  const { updateProficiency } = useCharacterStore();
  const fightingStyles = character.meta.fighting_styles ?? [];

  const classesWithFightingStyles = [
    "kämpfer",
    "waldläufer",
    "paladin",
    "fighter",
    "ranger",
  ];
  const canHaveFightingStyles = characterClass?.id
    ? classesWithFightingStyles.includes(characterClass.id.toLowerCase())
    : false;

  const availableFightingStyles = feats.filter(
    (feat) =>
      feat.category?.toLowerCase().includes("fighting_style") ||
      feat.category?.toLowerCase().includes("kampfstil"),
  );

  return (
    <div className="w-full min-h-screen p-4 space-y-4">
      {/* Main Grid: 3 Spalten → 2 Spalten → 1 Spalte */}
      {/* Mobile: 1 Spalte (alle untereinander) */}
      {/* Tablet: 2 Spalten (linke oben, mittlere+rechte darunter nebeneinander) */}
      {/* Desktop: 3 Spalten (alle nebeneinander) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[280px_1fr_1fr] gap-4">
        {/* Linke Spalte: Attribute (schmaler für mehr Platz in der Mitte) */}
        <div className="space-y-3 w-full max-w-[280px] md:col-span-2 xl:col-span-1 xl:max-w-[280px]">
          {/* Attribute */}
          <div className="bg-card p-3 rounded-lg border-2 border-border shadow-lg h-fit">
            <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-muted-foreground mb-3">
              Attribute
            </h3>
            <div className="space-y-2">
              {[
                { key: "str", name: "Stärke" },
                { key: "dex", name: "Geschick" },
                { key: "con", name: "Konstitution" },
                { key: "int", name: "Intelligenz" },
                { key: "wis", name: "Weisheit" },
                { key: "cha", name: "Charisma" },
              ].map((attr) => {
                const attrKey = attr.key as keyof typeof character.attributes;
                const isProficient =
                  character.proficiencies?.saving_throws?.includes(attrKey) ??
                  false;
                const savingThrowBonus = stats.saving_throws[attrKey];
                return (
                  <AttributeBlock
                    key={attr.key}
                    name={attr.name}
                    attrKey={attrKey}
                    value={character.attributes[attrKey]}
                    onChange={(v) => onUpdateAttribute(attrKey, v)}
                    onBlur={onSaveCharacter}
                    species={characterSpecies}
                    savingThrowBonus={savingThrowBonus}
                    isSavingThrowProficient={isProficient}
                    onToggleSavingThrow={() => {
                      updateProficiency(
                        "saving_throws",
                        attrKey,
                        !isProficient,
                      );
                      onSaveCharacter();
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Inspiration & Übungsbonus */}
          <div className="bg-card p-2 rounded-lg border-2 border-border shadow-lg h-fit">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-black uppercase tracking-wider text-muted-foreground block mb-1">
                  Inspiration
                </label>
                <div className="h-8 border border-border rounded flex items-center justify-center">
                  <input type="checkbox" className="w-4 h-4" />
                </div>
              </div>
              <div>
                <label className="text-sm font-black uppercase tracking-wider text-muted-foreground block mb-1 flex items-center gap-1">
                  Übungsbonus
                  <AutomatedHelper size={10} />
                </label>
                <div
                  className={`h-8 border rounded flex items-center justify-center font-black text-lg ${UI_LOCKED_FIELD_CLASS}`}
                >
                  +{stats.proficiency_bonus}
                </div>
              </div>
            </div>
          </div>

          {/* Kampfstile (dynamisch aus DB) */}
          {canHaveFightingStyles && availableFightingStyles.length > 0 && (
            <div className="bg-card p-2 rounded-lg border-2 border-border shadow-lg h-fit">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-2">
                Kampfstil
              </label>
              <div className="space-y-2">
                {availableFightingStyles.map((feat) => {
                  const featId = feat.id.toLowerCase();
                  const isActive = fightingStyles.some(
                    (style) => style.toLowerCase() === featId,
                  );
                  return (
                    <label
                      key={feat.id}
                      className="flex items-center justify-between gap-3 border border-border rounded px-3 py-2 bg-muted/20"
                    >
                      <span className="text-sm font-bold text-foreground">
                        {feat.name}
                      </span>
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={isActive}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? Array.from(new Set([...fightingStyles, feat.id]))
                            : fightingStyles.filter(
                                (s) => s.toLowerCase() !== featId,
                              );
                          onUpdateMeta({ fighting_styles: next });
                          onSaveCharacter();
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fertigkeiten */}
          <div className="bg-card p-2 rounded-lg border-2 border-border shadow-lg h-fit">
            <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-muted-foreground mb-2">
              Fertigkeiten
            </h3>
            <SkillList
              character={character}
              onToggleProficiency={() => {}}
              species={characterSpecies}
            />
          </div>
        </div>

        {/* Mittlere Spalte: Kampfwerte */}
        <div className="space-y-3 md:col-span-1 xl:col-span-1">
          {/* Kampfwerte */}
          <div className="bg-card p-3 rounded-lg border-2 border-border shadow-lg h-fit">
            <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-muted-foreground mb-3">
              Kampfwerte
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Shield size={16} className="text-primary" />
                  <label className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                    RK
                  </label>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary border-2 border-primary/30 rounded-lg py-2">
                  {stats.ac}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap size={16} className="text-amber-500" />
                  <label className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                    Initiative
                  </label>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-500 border-2 border-amber-500/30 rounded-lg py-2">
                  {formatModifier(stats.initiative)}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Wind size={16} className="text-blue-500" />
                  <label className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                    Bewegung
                  </label>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-500 border-2 border-blue-500/30 rounded-lg py-2">
                  {character.meta.use_metric
                    ? `${speed}m`
                    : `${Math.round(speed / 0.3)}ft`}
                </div>
              </div>
            </div>
          </div>

          {/* HP Management - Kompakt */}
          <div className="bg-card p-3 rounded-lg border-2 border-border shadow-lg h-fit">
            <HPManagement
              character={character}
              characterClass={characterClass}
            />
          </div>

          {/* Angriffe */}
          {stats.weapon_attacks.length > 0 && (
            <div className="bg-card p-3 rounded-lg border-2 border-border shadow-lg h-fit">
              <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-muted-foreground mb-3">
                Angriffe & Zauber
              </h3>
              <div className="space-y-2">
                {stats.weapon_attacks.map((atk, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2 border border-border rounded hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm break-words">
                        {atk.name}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground break-words">
                        {atk.properties.join(", ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <div className="text-center">
                        <div className="text-xs sm:text-sm font-black uppercase text-muted-foreground">
                          Bonus
                        </div>
                        <div className="text-sm sm:text-base md:text-lg font-black text-primary whitespace-nowrap">
                          {formatModifier(atk.attack_bonus)}
                        </div>
                      </div>
                      <div className="text-center min-w-0">
                        <div className="text-xs sm:text-sm font-black uppercase text-muted-foreground">
                          Schaden
                        </div>
                        <div className="text-xs sm:text-sm font-bold break-words">
                          {atk.damage}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waffen & Rüstungen - Kompakt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-card p-3 rounded-lg border-2 border-border shadow-lg h-fit">
              <WeaponsTable character={character} weapons={weapons} />
            </div>
            <div className="bg-card p-3 rounded-lg border-2 border-border shadow-lg h-fit">
              <ArmorTable character={character} armor={armor} />
            </div>
          </div>
        </div>

        {/* Rechte Spalte: Persönlichkeit */}
        <div className="space-y-3 md:col-span-1 xl:col-span-1">
          {/* Persönlichkeit */}
          <div className="bg-card p-3 rounded-lg border-2 border-border shadow-lg h-fit">
            <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-muted-foreground mb-3 break-words">
              Persönlichkeit
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-muted-foreground block mb-1 break-words">
                  Persönlichkeitsmerkmale
                </label>
                <textarea
                  value={character.meta.personality_traits || ""}
                  onChange={(e) =>
                    onUpdateMeta({ personality_traits: e.target.value })
                  }
                  onBlur={onSaveCharacter}
                  className="w-full h-16 text-sm bg-muted/30 border border-border rounded p-2 resize-none focus:border-primary outline-none"
                  placeholder="—"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-muted-foreground block mb-1 break-words">
                  Ideale
                </label>
                <textarea
                  value={character.meta.ideals || ""}
                  onChange={(e) => onUpdateMeta({ ideals: e.target.value })}
                  onBlur={onSaveCharacter}
                  className="w-full h-16 text-sm bg-muted/30 border border-border rounded p-2 resize-none focus:border-primary outline-none"
                  placeholder="—"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-muted-foreground block mb-1 break-words">
                  Bindungen
                </label>
                <textarea
                  value={character.meta.bonds || ""}
                  onChange={(e) => onUpdateMeta({ bonds: e.target.value })}
                  onBlur={onSaveCharacter}
                  className="w-full h-16 text-sm bg-muted/30 border border-border rounded p-2 resize-none focus:border-primary outline-none"
                  placeholder="—"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-muted-foreground block mb-1 break-words">
                  Makel
                </label>
                <textarea
                  value={character.meta.flaws || ""}
                  onChange={(e) => onUpdateMeta({ flaws: e.target.value })}
                  onBlur={onSaveCharacter}
                  className="w-full h-16 text-sm bg-muted/30 border border-border rounded p-2 resize-none focus:border-primary outline-none"
                  placeholder="—"
                />
              </div>
            </div>
          </div>

          {/* Merkmale & Fähigkeiten */}
          <div className="bg-card p-3 rounded-lg border-2 border-border shadow-lg h-fit">
            <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-muted-foreground mb-3">
              Merkmale & Fähigkeiten
            </h3>
            {characterSpecies && <SpeciesTraits species={characterSpecies} />}
            <FeatsList
              feats={feats}
              characterFeats={character.feats || []}
              onRemove={onRemoveFeat}
            />
            <ModifiersList
              modifiers={character.modifiers}
              onRemove={onRemoveModifier}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
