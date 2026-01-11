import { useEffect, useState } from "react";
import { useCharacterStore } from "../lib/store";
import { Species } from "../lib/types";
import { AttributeBlock } from "../components/character/AttributeBlock";
import { SkillList } from "../components/character/SkillList";
import { CombatStats } from "../components/character/CombatStats";
import { ModifiersList } from "../components/character/ModifiersList";
import { SpeciesTraits } from "../components/character/SpeciesTraits";
import { AbilityScoreChoiceDialog } from "../components/character/AbilityScoreChoiceDialog";
import {
  Save,
  User,
  Swords,
  Wand2,
  Backpack,
  Book,
  ChevronLeft,
  Sparkles,
  Settings,
} from "lucide-react";
import { calculateLevelFromXP, getXPForNextLevel } from "../lib/math";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { useCompendiumStore } from "../lib/compendiumStore";

export function CharacterSheet() {
  const {
    currentCharacter,
    setCurrentCharacter,
    updateAttribute,
    updateMeta,
    updateProficiency,
    removeModifier,
    saveCharacter,
    isLoading,
  } = useCharacterStore();

  const {
    weapons = [],
    armor = [],
    species = [],
    classes = [],
    fetchClasses,
    fetchSpecies,
    fetchWeapons,
    fetchArmor,
  } = useCompendiumStore();

  useEffect(() => {
    fetchClasses();
    fetchSpecies();
    fetchWeapons();
    fetchArmor();
  }, [fetchClasses, fetchSpecies, fetchWeapons, fetchArmor]);

  // Find current class name
  const currentClass = classes.find(
    (c) => c.id === currentCharacter?.meta.class_id,
  );

  // Get subclasses for current class
  const subclasses = currentClass?.data?.subclasses || [];

  // Find current species
  const currentSpecies = species.find(
    (s) => s.id === currentCharacter?.meta.species_id,
  );

  const [activeTab, setActiveTab] = useState<
    "combat" | "spells" | "inventory" | "notes"
  >("combat");

  const [showAbilityChoiceDialog, setShowAbilityChoiceDialog] = useState(false);
  const [pendingSpecies, setPendingSpecies] = useState<Species | null>(null);

  // Apply species data when species_id changes
  useEffect(() => {
    if (!currentCharacter || !currentSpecies) return;

    const speciesData = currentSpecies.data;
    if (!speciesData) return;

    // Remove old species modifiers (from previous species) - these are legacy markers
    const oldSpeciesModifiers = currentCharacter.modifiers.filter((m) =>
      m.id.startsWith("species_"),
    );
    oldSpeciesModifiers.forEach((mod) => {
      removeModifier(mod.id);
    });

    // Apply ability score increases when species is selected
    // Note: PHB 2024 species do NOT have ability score increases (this was removed in the 2024 rules)
    // Only custom/homebrew species may have ability_score_increase
    if (speciesData.ability_score_increase) {
      const asi = speciesData.ability_score_increase;

      if (
        asi.type === "fixed" &&
        asi.fixed &&
        Object.keys(asi.fixed).length > 0
      ) {
        Object.entries(asi.fixed).forEach(([attr, value]) => {
          const attrMap: Record<
            string,
            "str" | "dex" | "con" | "int" | "wis" | "cha"
          > = {
            str: "str",
            strength: "str",
            dex: "dex",
            dexterity: "dex",
            con: "con",
            constitution: "con",
            int: "int",
            intelligence: "int",
            wis: "wis",
            wisdom: "wis",
            cha: "cha",
            charisma: "cha",
          };

          const attrKey = attrMap[attr.toLowerCase()];
          const numValue =
            typeof value === "number" ? value : Number(value) || 0;
          if (attrKey && numValue > 0) {
            const currentValue = currentCharacter.attributes[attrKey];
            // Add the bonus to current value
            updateAttribute(attrKey, currentValue + numValue);
          }
        });
      } else if (
        asi.type === "choice" &&
        asi.choice &&
        asi.choice.count > 0 &&
        asi.choice.amount > 0
      ) {
        // Show dialog for choice-based ability score increases
        setPendingSpecies(currentSpecies);
        setShowAbilityChoiceDialog(true);
        return; // Don't apply languages yet, wait for choice
      }
    }

    // Add languages
    if (speciesData.languages?.known) {
      const knownLanguages = speciesData.languages.known || [];
      const currentLanguages = currentCharacter.proficiencies.languages || [];
      const newLanguages = knownLanguages.filter(
        (lang: string) => !currentLanguages.includes(lang),
      );

      newLanguages.forEach((lang: string) => {
        updateProficiency("languages", lang, true);
      });
    }
  }, [
    currentCharacter?.meta.species_id,
    currentSpecies,
    updateAttribute,
    updateProficiency,
    removeModifier,
  ]);

  const handleAbilityChoiceConfirm = (choices: Record<string, number>) => {
    if (!pendingSpecies || !currentCharacter) return;

    Object.entries(choices).forEach(([attr, value]) => {
      if (value > 0) {
        const attrKey = attr as keyof typeof currentCharacter.attributes;
        const currentValue = currentCharacter.attributes[attrKey];
        updateAttribute(attrKey, currentValue + value);
      }
    });

    // Apply languages after choice is made
    if (pendingSpecies.data?.languages?.known) {
      const knownLanguages = pendingSpecies.data.languages.known || [];
      const currentLanguages = currentCharacter.proficiencies.languages || [];
      const newLanguages = knownLanguages.filter(
        (lang: string) => !currentLanguages.includes(lang),
      );
      newLanguages.forEach((lang: string) => {
        updateProficiency("languages", lang, true);
      });
    }

    setShowAbilityChoiceDialog(false);
    setPendingSpecies(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveCharacter();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveCharacter]);

  if (!currentCharacter) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 opacity-30">
          <User size={80} strokeWidth={1} />
          <p className="text-xl font-black uppercase tracking-widest italic">
            Kein Charakter geladen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background text-foreground p-6 pb-24 transition-colors duration-500 overflow-y-auto custom-scrollbar relative">
      {/* Dynamic Header */}
      <header className="w-full flex flex-col lg:flex-row items-center justify-between mb-8 glass-panel p-6 gap-6">
        <div className="flex items-center gap-8 w-full lg:w-auto">
          <button
            onClick={() => setCurrentCharacter(null)}
            className="p-5 bg-muted rounded-3xl transition-all text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border active:scale-90"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div className="flex items-center gap-6 border-l-2 border-border pl-6 overflow-hidden">
            <div className="relative group shrink-0">
              <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-4 bg-primary text-primary-foreground rounded-xl shadow-xl shadow-primary/20 relative">
                <User className="w-8 h-8" />
                <Sparkles
                  size={20}
                  className="absolute -top-2 -right-2 text-white animate-pulse"
                />
              </div>
            </div>
            <div className="overflow-hidden flex-1">
              <input
                type="text"
                value={currentCharacter.meta.name}
                onChange={(e) => updateMeta({ name: e.target.value })}
                onBlur={() => saveCharacter()}
                className="w-full text-5xl font-black tracking-tighter truncate font-serif italic text-foreground leading-none mb-2 bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 -ml-2 transition-all"
              />
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-1 rounded-lg">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    Stufe {calculateLevelFromXP(currentCharacter.meta.xp)}
                  </span>
                  <div className="h-4 w-px bg-primary/20 mx-2" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                    XP
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={currentCharacter.meta.xp}
                    onChange={(e) => {
                      const newXp = parseInt(e.target.value) || 0;
                      const newLevel = calculateLevelFromXP(newXp);
                      updateMeta({ xp: newXp, level: newLevel });
                    }}
                    onBlur={() => saveCharacter()}
                    className="bg-transparent text-primary font-black text-sm w-20 border-none outline-none focus:ring-0"
                  />
                  {getXPForNextLevel(
                    calculateLevelFromXP(currentCharacter.meta.xp),
                  ) && (
                    <span className="text-[9px] font-bold text-primary/30 ml-1">
                      /{" "}
                      {getXPForNextLevel(
                        calculateLevelFromXP(currentCharacter.meta.xp),
                      )}{" "}
                      bis Level Up
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-lg border border-border/50">
                  <select
                    value={currentCharacter.meta.class_id || ""}
                    onChange={(e) => {
                      updateMeta({
                        class_id: e.target.value,
                        subclass_id: undefined,
                      });
                      setTimeout(saveCharacter, 100);
                    }}
                    className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-foreground/70 outline-none border-none cursor-pointer hover:text-primary transition-colors"
                  >
                    <option value="" disabled className="bg-card">
                      Klasse wählen
                    </option>
                    {classes.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                        className="bg-card text-foreground"
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {currentClass && subclasses.length > 0 && (
                    <>
                      <div className="w-1 h-1 bg-foreground/20 rounded-full" />
                      <select
                        value={currentCharacter.meta.subclass_id || ""}
                        onChange={(e) => {
                          updateMeta({ subclass_id: e.target.value });
                          setTimeout(saveCharacter, 100);
                        }}
                        className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-foreground/70 outline-none border-none cursor-pointer hover:text-primary transition-colors"
                      >
                        <option value="" className="bg-card">
                          Unterklasse wählen
                        </option>
                        {subclasses.map((s: any) => (
                          <option
                            key={s.id}
                            value={s.id}
                            className="bg-card text-foreground"
                          >
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  <div className="w-1 h-1 bg-foreground/20 rounded-full" />

                  <select
                    value={currentCharacter.meta.species_id || ""}
                    onChange={(e) => {
                      updateMeta({ species_id: e.target.value });
                      setTimeout(saveCharacter, 100);
                    }}
                    className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-foreground/70 outline-none border-none cursor-pointer hover:text-primary transition-colors"
                  >
                    <option value="" disabled className="bg-card">
                      Volk wählen
                    </option>
                    {species.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        className="bg-card text-foreground"
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <button className="p-4 rounded-2xl bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all">
            <Settings size={24} />
          </button>
          <button
            onClick={() => saveCharacter()}
            disabled={isLoading}
            className="flex-1 lg:flex-none flex items-center justify-center gap-4 bg-primary text-primary-foreground px-10 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.1em] transition-all shadow-2xl shadow-primary/20 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-6 h-6" />
            <span>{isLoading ? "Speichert..." : "Sichern"}</span>
          </button>
        </div>
      </header>

      <main className="w-full">
        {activeTab === "combat" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Left Column: Attributes */}
            <div className="xl:col-span-2 flex flex-col gap-4 animate-in slide-in-from-left-8 duration-500 max-w-[140px]">
              <AttributeBlock
                name="Stärke"
                attrKey="str"
                value={currentCharacter.attributes.str}
                onChange={(v) => updateAttribute("str", v)}
                onBlur={saveCharacter}
                species={currentSpecies}
              />
              <AttributeBlock
                name="Geschick"
                attrKey="dex"
                value={currentCharacter.attributes.dex}
                onChange={(v) => updateAttribute("dex", v)}
                onBlur={saveCharacter}
                species={currentSpecies}
              />
              <AttributeBlock
                name="Konstitution"
                attrKey="con"
                value={currentCharacter.attributes.con}
                onChange={(v) => updateAttribute("con", v)}
                onBlur={saveCharacter}
                species={currentSpecies}
              />
              <AttributeBlock
                name="Intelligenz"
                attrKey="int"
                value={currentCharacter.attributes.int}
                onChange={(v) => updateAttribute("int", v)}
                onBlur={saveCharacter}
                species={currentSpecies}
              />
              <AttributeBlock
                name="Weisheit"
                attrKey="wis"
                value={currentCharacter.attributes.wis}
                onChange={(v) => updateAttribute("wis", v)}
                onBlur={saveCharacter}
                species={currentSpecies}
              />
              <AttributeBlock
                name="Charisma"
                attrKey="cha"
                value={currentCharacter.attributes.cha}
                onChange={(v) => updateAttribute("cha", v)}
                onBlur={saveCharacter}
                species={currentSpecies}
              />
            </div>

            {/* Center Column: Combat & Skills */}
            <div className="xl:col-span-7 flex flex-col gap-6 xl:gap-8 animate-in slide-in-from-bottom-8 duration-700">
              <div className="bg-card p-4 rounded-2xl border border-border shadow-xl shadow-foreground/[0.02]">
                <CombatStats
                  character={currentCharacter}
                  characterClass={classes.find(
                    (c) => c.id === currentCharacter.meta.class_id,
                  )}
                  characterSpecies={currentSpecies}
                  inventoryItems={[...weapons, ...armor]}
                />
              </div>
              <div className="bg-card p-5 rounded-2xl border border-border shadow-xl shadow-foreground/[0.02]">
                <SkillList
                  character={currentCharacter}
                  onToggleProficiency={(s) => console.log("Toggle skill:", s)}
                  species={currentSpecies}
                />
              </div>
              {currentSpecies && <SpeciesTraits species={currentSpecies} />}
            </div>

            {/* Right Column: Modifiers */}
            <div className="xl:col-span-3 animate-in slide-in-from-right-8 duration-500">
              <div className="sticky top-6">
                <ModifiersList
                  modifiers={currentCharacter.modifiers}
                  onRemove={removeModifier}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "spells" && (
          <div className="p-20 text-center bg-card rounded-[4rem] border border-border animate-in fade-in duration-500">
            <Wand2 size={80} className="mx-auto mb-8 text-primary opacity-20" />
            <h2 className="text-4xl font-black italic font-serif mb-4 text-foreground">
              Zauberbuch
            </h2>
            <p className="text-muted-foreground italic">
              Hier werden bald alle deine arkane Künste gelistet.
            </p>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="p-20 text-center bg-card rounded-[4rem] border border-border animate-in fade-in duration-500">
            <Backpack
              size={80}
              className="mx-auto mb-8 text-primary opacity-20"
            />
            <h2 className="text-4xl font-black italic font-serif mb-4 text-foreground">
              Inventar
            </h2>
            <p className="text-muted-foreground italic">
              Deine gesammelten Schätze und Ausrüstung.
            </p>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="p-20 text-center bg-card rounded-[4rem] border border-border animate-in fade-in duration-500">
            <Book size={80} className="mx-auto mb-8 text-primary opacity-20" />
            <h2 className="text-4xl font-black italic font-serif mb-4 text-foreground">
              Notizen
            </h2>
            <p className="text-muted-foreground italic">
              Halte deine Abenteuer und Geheimnisse fest.
            </p>
          </div>
        )}
      </main>

      {/* Navigation Tabs (Floating Bottom) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50">
        <nav className="bg-card/70 backdrop-blur-2xl border border-border px-10 py-4 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex justify-around items-center gap-4 lg:gap-8">
          <TabItem
            icon={<Swords className="w-6 h-6" />}
            label="Kampf"
            active={activeTab === "combat"}
            onClick={() => setActiveTab("combat")}
          />
          <TabItem
            icon={<Wand2 className="w-6 h-6" />}
            label="Zauber"
            active={activeTab === "spells"}
            onClick={() => setActiveTab("spells")}
          />
          <TabItem
            icon={<Backpack className="w-6 h-6" />}
            label="Inventar"
            active={activeTab === "inventory"}
            onClick={() => setActiveTab("inventory")}
          />
          <TabItem
            icon={<Book className="w-6 h-6" />}
            label="Notizen"
            active={activeTab === "notes"}
            onClick={() => setActiveTab("notes")}
          />
        </nav>
      </div>

      {showAbilityChoiceDialog && pendingSpecies && currentCharacter && (
        <AbilityScoreChoiceDialog
          species={pendingSpecies}
          currentAttributes={currentCharacter.attributes}
          onConfirm={handleAbilityChoiceConfirm}
          onCancel={() => {
            setShowAbilityChoiceDialog(false);
            setPendingSpecies(null);
          }}
        />
      )}
    </div>
  );
}

function TabItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group transition-all relative px-4"
    >
      <div
        className={cn(
          "p-4 rounded-2xl transition-all duration-300 relative overflow-hidden",
          active
            ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30 scale-110 -translate-y-2"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        {icon}
        {active && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20" />
        )}
      </div>
      <span
        className={cn(
          "text-[10px] uppercase font-black tracking-[0.2em] transition-all",
          active
            ? "text-primary opacity-100 translate-y-[-4px]"
            : "text-muted-foreground opacity-40 group-hover:opacity-100",
        )}
      >
        {label}
      </span>
      {active && (
        <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
      )}
    </button>
  );
}
