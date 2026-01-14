import { useEffect, useState, useRef } from "react";
import { useCharacterStore } from "../lib/store";
import { Species } from "../lib/types";
import { AttributeBlock } from "../components/character/AttributeBlock";
import { SkillList } from "../components/character/SkillList";
import { CombatStats } from "../components/character/CombatStats";
import { SavingThrowsList } from "../components/character/SavingThrowsList";
import { ModifiersList } from "../components/character/ModifiersList";
import { FeatsList } from "../components/character/FeatsList";
import { SpeciesTraits } from "../components/character/SpeciesTraits";
import { WeaponsTable } from "../components/character/WeaponsTable";
import { ArmorTable } from "../components/character/ArmorTable";
import { HPManagement } from "../components/character/HPManagement";
import { AbilityScoreChoiceDialog } from "../components/character/AbilityScoreChoiceDialog";
import { BackgroundAbilityScoreDialog } from "../components/character/BackgroundAbilityScoreDialog";
import {
  Save,
  User,
  Wand2,
  Backpack,
  Book,
  ChevronLeft,
  Sparkles,
  Settings,
  Shield,
} from "lucide-react";
import { calculateLevelFromXP, getXPForNextLevel } from "../lib/math";
import { useCompendiumStore } from "../lib/compendiumStore";

export function CharacterSheet() {
  const {
    currentCharacter,
    setCurrentCharacter,
    updateAttribute,
    updateMeta,
    updateAppearance,
    updateProficiency,
    removeModifier,
    addFeat,
    removeFeat,
    saveCharacter,
    isLoading,
  } = useCharacterStore();

  const {
    weapons = [],
    armor = [],
    species = [],
    classes = [],
    backgrounds = [],
    feats = [],
    fetchClasses,
    fetchSpecies,
    fetchWeapons,
    fetchArmor,
    fetchBackgrounds,
    fetchFeats,
  } = useCompendiumStore();

  useEffect(() => {
    fetchClasses();
    fetchSpecies();
    fetchWeapons();
    fetchArmor();
    fetchBackgrounds();
    fetchFeats();
  }, [
    fetchClasses,
    fetchSpecies,
    fetchWeapons,
    fetchArmor,
    fetchBackgrounds,
    fetchFeats,
  ]);

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

  // Find current background
  const currentBackground = backgrounds.find(
    (bg) => bg.id === currentCharacter?.meta.background_id,
  );

  // Track previous background_id to detect changes
  const prevBackgroundIdRef = useRef<string | undefined>(
    currentCharacter?.meta.background_id,
  );

  const [activeTab, setActiveTab] = useState<
    "combat" | "spells" | "inventory" | "notes"
  >("combat");

  const [showAbilityChoiceDialog, setShowAbilityChoiceDialog] = useState(false);
  const [pendingSpecies, setPendingSpecies] = useState<Species | null>(null);
  const [showBackgroundAbilityDialog, setShowBackgroundAbilityDialog] =
    useState(false);
  const [pendingBackground, setPendingBackground] = useState<any>(null);

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

  const handleBackgroundAbilityConfirm = (choices: Record<string, number>) => {
    if (!pendingBackground || !currentCharacter) return;

    // Apply ability score increases (all at once to avoid race conditions)
    const updatedAttributes = { ...currentCharacter.attributes };
    Object.entries(choices).forEach(([attr, value]) => {
      if (value > 0) {
        const attrKey = attr as keyof typeof currentCharacter.attributes;
        const currentValue = currentCharacter.attributes[attrKey];
        const newValue = Math.min(currentValue + value, 20); // Max 20
        updatedAttributes[attrKey] = newValue;
      }
    });

    // Update all attributes at once
    Object.entries(updatedAttributes).forEach(([attr, value]) => {
      updateAttribute(attr as keyof typeof currentCharacter.attributes, value);
    });

    // Store which ability scores were applied from this background
    updateMeta({ background_ability_scores: choices });
    saveCharacter();

    setShowBackgroundAbilityDialog(false);
    setPendingBackground(null);
  };

  // Apply background data when background_id changes
  useEffect(() => {
    if (!currentCharacter) return;

    const currentBackgroundId = currentCharacter.meta.background_id;
    const previousBackgroundId = prevBackgroundIdRef.current;

    // If background changed, remove the old background's bonuses
    if (previousBackgroundId && previousBackgroundId !== currentBackgroundId) {
      const previousBackground = backgrounds.find(
        (bg) => bg.id === previousBackgroundId,
      );
      if (previousBackground?.data) {
        // Remove old background's ability score bonuses
        if (currentCharacter.meta.background_ability_scores) {
          const oldBonuses = currentCharacter.meta.background_ability_scores;
          Object.entries(oldBonuses).forEach(([attr, value]) => {
            if (value > 0) {
              const attrKey = attr as keyof typeof currentCharacter.attributes;
              const currentValue = currentCharacter.attributes[attrKey];
              updateAttribute(attrKey, Math.max(currentValue - value, 1)); // Min 1
            }
          });
          updateMeta({ background_ability_scores: undefined });
        }

        // Remove old background's feat
        if (previousBackground.data.feat) {
          const previousFeatName = previousBackground.data.feat;
          const previousFeat = feats.find(
            (f) => f.name.toUpperCase() === previousFeatName.toUpperCase(),
          );
          if (
            previousFeat &&
            currentCharacter.feats.includes(previousFeat.id)
          ) {
            removeFeat(previousFeat.id);
          }
        }

        // Remove old background's skills
        if (
          previousBackground.data.skills &&
          Array.isArray(previousBackground.data.skills)
        ) {
          const oldSkills = previousBackground.data.skills || [];
          oldSkills.forEach((skill: string) => {
            if (currentCharacter.proficiencies.skills.includes(skill)) {
              updateProficiency("skills", skill, false);
            }
          });
        }

        // Remove old background's tool
        if (previousBackground.data.tool) {
          const oldTool = previousBackground.data.tool;
          if (currentCharacter.proficiencies.tools.includes(oldTool)) {
            updateProficiency("tools", oldTool, false);
          }
        }
      }
    }

    // Update the ref to the current background_id
    prevBackgroundIdRef.current = currentBackgroundId;

    // Now apply the new background's data
    if (!currentBackground) return;

    const backgroundData = currentBackground.data;
    if (!backgroundData) return;

    // Add skills from background
    if (backgroundData.skills && Array.isArray(backgroundData.skills)) {
      const backgroundSkills = backgroundData.skills || [];
      backgroundSkills.forEach((skill: string) => {
        if (!currentCharacter.proficiencies.skills.includes(skill)) {
          updateProficiency("skills", skill, true);
        }
      });
    }

    // Add tool proficiency from background
    if (backgroundData.tool) {
      const toolName = backgroundData.tool;
      if (!currentCharacter.proficiencies.tools.includes(toolName)) {
        updateProficiency("tools", toolName, true);
      }
    }

    // Add feat from background
    if (backgroundData.feat) {
      const featName = backgroundData.feat;
      // Find feat by name (case-insensitive)
      const matchingFeat = feats.find(
        (f) => f.name.toUpperCase() === featName.toUpperCase(),
      );
      if (matchingFeat && !currentCharacter.feats.includes(matchingFeat.id)) {
        addFeat(matchingFeat.id);
      }
    }

    // Check if ability scores need to be applied (show dialog if not already applied)
    // Only check if background changed (not on every render)
    if (
      backgroundData.ability_scores &&
      Array.isArray(backgroundData.ability_scores) &&
      previousBackgroundId !== currentBackgroundId &&
      backgroundData.ability_scores.length === 3 &&
      !currentCharacter.meta.background_ability_scores
    ) {
      setPendingBackground(currentBackground);
      setShowBackgroundAbilityDialog(true);
      return; // Wait for user choice
    }
  }, [
    currentCharacter?.meta.background_id,
    currentBackground,
    backgrounds,
    feats,
    updateProficiency,
    addFeat,
    removeFeat,
  ]);

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
    <div className="h-full bg-background text-foreground p-4 pb-20 transition-colors duration-500 overflow-y-auto custom-scrollbar relative">
      {/* Dynamic Header */}
      <header className="w-full mb-6 glass-panel border-b border-border/50">
        <div className="flex flex-col lg:flex-row items-center justify-between p-5 gap-5">
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
        </div>

        {/* Erweiterte Charakterinformationen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 px-4 pb-4 border-t border-border/30 pt-4">
          {/* Persönlichkeitsinfo */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Spieler:
              </label>
              <input
                type="text"
                value={currentCharacter.meta.player_name || ""}
                onChange={(e) => updateMeta({ player_name: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Spielername"
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Alter:
              </label>
              <input
                type="text"
                value={currentCharacter.appearance?.age || ""}
                onChange={(e) => updateAppearance({ age: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Alter"
                className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-xs font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Geschlecht:
              </label>
              <select
                value={currentCharacter.meta.gender || ""}
                onChange={(e) => {
                  updateMeta({ gender: e.target.value || undefined });
                  saveCharacter();
                }}
                className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-xs font-medium text-foreground/80 cursor-pointer hover:text-primary transition-colors focus:ring-1 focus:ring-primary/30 rounded px-2 py-1"
              >
                <option value="" className="bg-card">
                  —
                </option>
                <option value="männlich" className="bg-card">
                  Männlich
                </option>
                <option value="weiblich" className="bg-card">
                  Weiblich
                </option>
                <option value="divers" className="bg-card">
                  Divers
                </option>
              </select>
            </div>
          </div>

          {/* Herkunft & Glaube */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Herkunft:
              </label>
              <select
                value={currentCharacter.meta.background_id || ""}
                onChange={(e) => {
                  updateMeta({ background_id: e.target.value });
                  setTimeout(saveCharacter, 100);
                }}
                className="flex-1 min-w-[120px] bg-transparent text-xs font-medium text-foreground/80 outline-none border-none cursor-pointer hover:text-primary transition-colors"
              >
                <option value="" disabled className="bg-card">
                  Hintergrund wählen
                </option>
                {backgrounds.map((bg) => (
                  <option
                    key={bg.id}
                    value={bg.id}
                    className="bg-card text-foreground"
                  >
                    {bg.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Gesinnung:
              </label>
              <select
                value={currentCharacter.meta.alignment || ""}
                onChange={(e) => updateMeta({ alignment: e.target.value })}
                onBlur={() => saveCharacter()}
                className="flex-1 min-w-[140px] bg-transparent border-none outline-none text-xs font-medium text-foreground/80 cursor-pointer hover:text-primary transition-colors focus:ring-1 focus:ring-primary/30 rounded px-2 py-1"
              >
                <option value="" className="bg-card">
                  —
                </option>
                <option value="RG" className="bg-card">
                  RG (Rechtschaffen Gut)
                </option>
                <option value="NG" className="bg-card">
                  NG (Neutral Gut)
                </option>
                <option value="CG" className="bg-card">
                  CG (Chaotisch Gut)
                </option>
                <option value="RN" className="bg-card">
                  RN (Rechtschaffen Neutral)
                </option>
                <option value="N" className="bg-card">
                  N (Neutral)
                </option>
                <option value="CN" className="bg-card">
                  CN (Chaotisch Neutral)
                </option>
                <option value="RB" className="bg-card">
                  RB (Rechtschaffen Böse)
                </option>
                <option value="NB" className="bg-card">
                  NB (Neutral Böse)
                </option>
                <option value="CB" className="bg-card">
                  CB (Chaotisch Böse)
                </option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Glaube:
              </label>
              <input
                type="text"
                value={currentCharacter.meta.faith || ""}
                onChange={(e) => updateMeta({ faith: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Glaube/Religion"
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
          </div>

          {/* Körperliche Merkmale */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Augen:
              </label>
              <input
                type="text"
                value={currentCharacter.appearance?.eyes || ""}
                onChange={(e) => updateAppearance({ eyes: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Augenfarbe"
                className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-xs font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Haare:
              </label>
              <input
                type="text"
                value={currentCharacter.appearance?.hair || ""}
                onChange={(e) => updateAppearance({ hair: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Haarfarbe"
                className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-xs font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Haut:
              </label>
              <input
                type="text"
                value={currentCharacter.appearance?.skin || ""}
                onChange={(e) => updateAppearance({ skin: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder="Hautfarbe"
                className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-xs font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
          </div>

          {/* Größe & Gewicht */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Größe:
              </label>
              <input
                type="text"
                value={currentCharacter.appearance?.height || ""}
                onChange={(e) => updateAppearance({ height: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder={
                  currentCharacter.meta.use_metric
                    ? "Größe (cm)"
                    : "Größe (ft/in)"
                }
                className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-xs font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Gewicht:
              </label>
              <input
                type="text"
                value={currentCharacter.appearance?.weight || ""}
                onChange={(e) => updateAppearance({ weight: e.target.value })}
                onBlur={() => saveCharacter()}
                placeholder={
                  currentCharacter.meta.use_metric
                    ? "Gewicht (kg)"
                    : "Gewicht (lbs)"
                }
                className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-xs font-medium text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Größenkat.:
              </label>
              <span className="flex-1 min-w-[80px] text-xs font-medium text-foreground/80 px-2 py-1">
                {(() => {
                  const size = currentSpecies?.data?.size;
                  if (!size) return "Mittel";
                  const sizeMap: Record<string, string> = {
                    Small: "Klein",
                    Medium: "Mittel",
                    Large: "Groß",
                    Tiny: "Winzig",
                    Huge: "Riesig",
                    Gargantuan: "Gigantisch",
                  };
                  return sizeMap[size] || size;
                })()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="w-full mb-6 flex items-center gap-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("combat")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${
            activeTab === "combat"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          <Shield className="w-5 h-5" />
          Kampf
        </button>
        <button
          onClick={() => setActiveTab("spells")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${
            activeTab === "spells"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          <Wand2 className="w-5 h-5" />
          Zauber
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${
            activeTab === "inventory"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          <Backpack className="w-5 h-5" />
          Inventar
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all whitespace-nowrap ${
            activeTab === "notes"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          <Book className="w-5 h-5" />
          Notizen
        </button>
      </div>

      <main className="w-full p-4">
        {activeTab === "combat" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
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
            <div className="xl:col-span-8 flex flex-col gap-4 xl:gap-5 animate-in slide-in-from-bottom-8 duration-700">
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
              <div className="bg-card p-5 rounded-xl border border-border shadow-xl shadow-foreground/[0.02]">
                <HPManagement
                  character={currentCharacter}
                  characterClass={classes.find(
                    (c) => c.id === currentCharacter.meta.class_id,
                  )}
                />
              </div>
              <div className="bg-card p-5 rounded-xl border border-border shadow-xl shadow-foreground/[0.02]">
                <WeaponsTable character={currentCharacter} weapons={weapons} />
              </div>
              <div className="bg-card p-5 rounded-xl border border-border shadow-xl shadow-foreground/[0.02]">
                <ArmorTable character={currentCharacter} armor={armor} />
              </div>
              <div className="bg-card p-5 rounded-xl border border-border shadow-xl shadow-foreground/[0.02]">
                <SavingThrowsList
                  character={currentCharacter}
                  species={currentSpecies}
                />
              </div>
              <div className="bg-card p-5 rounded-xl border border-border shadow-xl shadow-foreground/[0.02]">
                <SkillList
                  character={currentCharacter}
                  onToggleProficiency={(s) => console.log("Toggle skill:", s)}
                  species={currentSpecies}
                />
              </div>
              {currentSpecies && <SpeciesTraits species={currentSpecies} />}
            </div>

            {/* Right Column: Feats & Modifiers */}
            <div className="xl:col-span-2 animate-in slide-in-from-right-8 duration-500">
              <div className="sticky top-24 space-y-6">
                <FeatsList
                  feats={feats}
                  characterFeats={currentCharacter.feats || []}
                  onRemove={removeFeat}
                />
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

      {showBackgroundAbilityDialog &&
        pendingBackground &&
        currentCharacter &&
        pendingBackground.data?.ability_scores && (
          <BackgroundAbilityScoreDialog
            backgroundName={pendingBackground.name}
            abilityScores={pendingBackground.data.ability_scores}
            currentAttributes={currentCharacter.attributes}
            onConfirm={handleBackgroundAbilityConfirm}
            onCancel={() => {
              setShowBackgroundAbilityDialog(false);
              setPendingBackground(null);
            }}
          />
        )}
    </div>
  );
}
