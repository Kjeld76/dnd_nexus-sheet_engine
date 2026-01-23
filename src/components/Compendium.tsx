import { useState, useEffect, useRef } from "react";
import { useCompendiumStore } from "../lib/compendiumStore";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Zap,
  Users,
  Shield,
  Sword,
  Package,
  Award,
  Search,
  Plus,
  Edit2,
  Book,
  Info,
  Brain,
  ChevronRight,
  Sparkles,
  ScrollText,
  Target,
  Clock,
  Compass,
  X,
  Wand2,
  UserCircle,
  Hammer,
} from "lucide-react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CompendiumEditor } from "./CompendiumEditor";
import { Button } from "./ui/Button";
import {
  COMPENDIUM_OVERSCAN_ROWS,
  COMPENDIUM_ROW_ESTIMATED_HEIGHT_PX,
} from "../lib/uiConstants";
import type {
  Armor,
  Background,
  Class,
  Equipment,
  Species,
  Weapon,
} from "../lib/types";
import {
  formatBackgroundTool,
  getFeaturesByLevel,
  getSubclasses,
  getTraits,
  isRecord,
  getWeaponMasteryName,
} from "./compendium/compendiumUtils";
import type {
  ClickableItem,
  CompendiumEntry,
  IconType,
  SubclassWithFeatures,
  Tab,
  MainCategory,
  FilterChip,
} from "./compendium/compendiumUtils";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mapping: Hauptkategorie -> Sub-Tabs
const CATEGORY_TABS: Record<MainCategory, Tab[]> = {
  magic: ["spells", "magic-items"],
  characters: ["classes", "species", "backgrounds", "feats", "skills"],
  arsenal: ["weapons", "armor", "tools", "items", "equipment"],
};

// Mapping: Tab -> Hauptkategorie
const TAB_TO_CATEGORY: Record<Tab, MainCategory> = {
  spells: "magic",
  "magic-items": "magic",
  classes: "characters",
  species: "characters",
  backgrounds: "characters",
  feats: "characters",
  skills: "characters",
  weapons: "arsenal",
  armor: "arsenal",
  tools: "arsenal",
  items: "arsenal",
  equipment: "arsenal",
  gear: "arsenal",
};

export function Compendium() {
  const [activeCategory, setActiveCategory] = useState<MainCategory>("magic");
  const [activeTab, setActiveTab] = useState<Tab>("spells");
  const categoryChangeRef = useRef(false); // Verhindert Endlosschleife
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSubclass, setSelectedSubclass] =
    useState<SubclassWithFeatures | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedMagicCategory, setSelectedMagicCategory] = useState<
    string | null
  >(null);
  const [selectedFeatCategory, setSelectedFeatCategory] = useState<
    string | null
  >(null);
  const [selectedWeaponCategory, setSelectedWeaponCategory] = useState<
    string | null
  >(null);
  const [selectedWeaponType, setSelectedWeaponType] = useState<
    "Nahkampf" | "Fernkampf" | null
  >(null);
  const [selectedWeaponSubtype, setSelectedWeaponSubtype] = useState<
    string | null
  >(null);
  const [selectedArmorCategory, setSelectedArmorCategory] = useState<
    string | null
  >(null);
  const [spellSortMode, setSpellSortMode] = useState<
    "level" | "alphabetical" | "school" | "class"
  >("level");
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<number | null>(
    null,
  );
  const [selectedSpellSchool, setSelectedSpellSchool] = useState<string | null>(
    null,
  );
  const [selectedSpellClass, setSelectedSpellClass] = useState<string | null>(
    null,
  );
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    spells,
    species,
    classes,
    weapons,
    armor,
    tools,
    feats,
    skills,
    backgrounds,
    items,
    equipment,
    magicItems,
    isLoading,
    error,
    fetchSpells,
    fetchSpecies,
    fetchClasses,
    fetchWeapons,
    fetchArmor,
    fetchTools,
    fetchFeats,
    fetchSkills,
    fetchBackgrounds,
    fetchItems,
    fetchEquipment,
    fetchMagicItems,
  } = useCompendiumStore();

  // Setze ersten Tab der Kategorie, wenn Kategorie wechselt
  useEffect(() => {
    const tabs = CATEGORY_TABS[activeCategory];
    if (tabs.length > 0) {
      // Wenn die Kategorie-Änderung von einem Klick kommt, setze immer den ersten Tab
      if (categoryChangeRef.current) {
        categoryChangeRef.current = false;
        setActiveTab(tabs[0]);
        return;
      }
      // Sonst nur setzen, wenn Tab nicht zur Kategorie gehört
      if (!tabs.includes(activeTab)) {
        setActiveTab(tabs[0]);
      }
    }
  }, [activeCategory]);

  // Synchronisiere activeCategory mit activeTab (nur wenn Tab nicht zur aktuellen Kategorie gehört)
  // WICHTIG: Nur wenn categoryChangeRef NICHT gesetzt ist (also nicht von Kategorie-Klick)
  useEffect(() => {
    // Kurze Verzögerung, damit der categoryChangeRef-Reset im anderen useEffect zuerst passiert
    const timeoutId = setTimeout(() => {
      if (categoryChangeRef.current) {
        return; // Ignoriere, wenn Kategorie gerade geändert wurde
      }
      const category = TAB_TO_CATEGORY[activeTab];
      if (category && category !== activeCategory) {
        setActiveCategory(category);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [activeTab, activeCategory]);

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = () => {
    setSelectedId(null);
    setSelectedSubclass(null);
    switch (activeTab) {
      case "spells":
        fetchSpells();
        break;
      case "species":
        fetchSpecies();
        break;
      case "classes":
        fetchClasses();
        break;
      case "weapons":
        fetchWeapons();
        break;
      case "armor":
        fetchArmor();
        break;
      case "tools":
        fetchTools();
        break;
      case "feats":
        fetchFeats();
        break;
      case "skills":
        fetchSkills();
        break;
      case "backgrounds":
        fetchBackgrounds();
        break;
      case "items":
        fetchItems();
        break;
      case "equipment":
        fetchEquipment();
        break;
      case "magic-items":
        fetchMagicItems();
        break;
    }
  };

  // Setze erste Kategorie für Magic Items automatisch
  useEffect(() => {
    if (
      activeTab === "magic-items" &&
      magicItems.length > 0 &&
      !selectedMagicCategory
    ) {
      const categories = Array.from(
        new Set(magicItems.map((mi) => mi.category)),
      ).sort();
      if (categories.length > 0) {
        setSelectedMagicCategory(categories[0]);
      }
    }
  }, [activeTab, magicItems, selectedMagicCategory]);

  // Setze ersten Zaubergrad für Spells automatisch
  useEffect(() => {
    if (
      activeTab === "spells" &&
      spells.length > 0 &&
      spellSortMode === "level" &&
      selectedSpellLevel === null
    ) {
      const levels = Array.from(new Set(spells.map((s) => s.level))).sort(
        (a, b) => a - b,
      );
      if (levels.length > 0) {
        setSelectedSpellLevel(levels[0]);
      }
    }
  }, [activeTab, spells, spellSortMode, selectedSpellLevel]);

  // Setze erste Schule für Spells automatisch
  useEffect(() => {
    if (
      activeTab === "spells" &&
      spells.length > 0 &&
      spellSortMode === "school" &&
      selectedSpellSchool === null
    ) {
      const schools = Array.from(new Set(spells.map((s) => s.school))).sort();
      if (schools.length > 0) {
        setSelectedSpellSchool(schools[0]);
      }
    }
  }, [activeTab, spells, spellSortMode, selectedSpellSchool]);

  const getFilteredData = () => {
    const s = searchTerm.toLowerCase();
    const sidebarS = sidebarSearchTerm.toLowerCase();
    let baseData: CompendiumEntry[] = [];
    switch (activeTab) {
      case "spells":
        baseData = spells as CompendiumEntry[];
        // Filter nach Zaubergrad, wenn nach Level sortiert
        if (spellSortMode === "level" && selectedSpellLevel !== null) {
          baseData = baseData.filter((x) => {
            const spell = x as import("../lib/types").Spell;
            return spell.level === selectedSpellLevel;
          });
        }
        // Filter nach Schule, wenn nach Schule sortiert
        if (spellSortMode === "school" && selectedSpellSchool !== null) {
          baseData = baseData.filter((x) => {
            const spell = x as import("../lib/types").Spell;
            return spell.school === selectedSpellSchool;
          });
        }
        // Filter nach Klasse, wenn nach Klasse sortiert
        if (spellSortMode === "class" && selectedSpellClass !== null) {
          baseData = baseData.filter((x) => {
            const spell = x as import("../lib/types").Spell;
            // Prüfe, ob die ausgewählte Klasse in der classes-String enthalten ist
            return spell.classes.includes(selectedSpellClass);
          });
        }
        // Sortiere alphabetisch, wenn gewünscht
        if (spellSortMode === "alphabetical") {
          baseData = [...baseData].sort((a, b) =>
            a.name.localeCompare(b.name, "de"),
          );
        } else if (spellSortMode === "school") {
          // Sortiere nach Schule, dann nach Level, dann alphabetisch
          baseData = [...baseData].sort((a, b) => {
            const spellA = a as import("../lib/types").Spell;
            const spellB = b as import("../lib/types").Spell;
            if (spellA.school !== spellB.school) {
              return spellA.school.localeCompare(spellB.school, "de");
            }
            if (spellA.level !== spellB.level) {
              return spellA.level - spellB.level;
            }
            return spellA.name.localeCompare(spellB.name, "de");
          });
        } else if (spellSortMode === "class") {
          // Sortiere nach Level, dann alphabetisch (bei Klassen-Sortierung)
          baseData = [...baseData].sort((a, b) => {
            const spellA = a as import("../lib/types").Spell;
            const spellB = b as import("../lib/types").Spell;
            if (spellA.level !== spellB.level) {
              return spellA.level - spellB.level;
            }
            return spellA.name.localeCompare(spellB.name, "de");
          });
        } else {
          // Sortiere nach Level, dann alphabetisch
          baseData = [...baseData].sort((a, b) => {
            const spellA = a as import("../lib/types").Spell;
            const spellB = b as import("../lib/types").Spell;
            if (spellA.level !== spellB.level) {
              return spellA.level - spellB.level;
            }
            return spellA.name.localeCompare(spellB.name, "de");
          });
        }
        break;
      case "species":
        baseData = species as CompendiumEntry[];
        break;
      case "classes":
        baseData = classes as CompendiumEntry[];
        break;
      case "weapons":
        baseData = weapons as CompendiumEntry[];
        // Filter nach Kategorie
        if (selectedWeaponCategory) {
          baseData = baseData.filter((x) => {
            const weapon = x as import("../lib/types").Weapon;
            const categoryLabel = weapon.category_label || weapon.category;
            return categoryLabel === selectedWeaponCategory;
          });
        }
        // Filter nach Typ (Nahkampf/Fernkampf)
        if (selectedWeaponType) {
          baseData = baseData.filter((x) => {
            const weapon = x as import("../lib/types").Weapon;
            return weapon.weapon_type === selectedWeaponType;
          });
        }
        // Filter nach Subtyp (Stangenwaffen, Fernkampfwaffen, Wurfwaffen, Nahkampfwaffen)
        if (selectedWeaponSubtype) {
          baseData = baseData.filter((x) => {
            const weapon = x as import("../lib/types").Weapon;
            return weapon.weapon_subtype === selectedWeaponSubtype;
          });
        }
        // Sortierung: Kategorie > Typ > Alphabetisch
        baseData = [...baseData].sort((a, b) => {
          const weaponA = a as import("../lib/types").Weapon;
          const weaponB = b as import("../lib/types").Weapon;
          const catA = weaponA.category_label || weaponA.category;
          const catB = weaponB.category_label || weaponB.category;
          if (catA !== catB) {
            return catA.localeCompare(catB, "de");
          }
          const typeA = weaponA.weapon_type || "";
          const typeB = weaponB.weapon_type || "";
          if (typeA !== typeB) {
            return typeA.localeCompare(typeB, "de");
          }
          return weaponA.name.localeCompare(weaponB.name, "de");
        });
        break;
      case "armor":
        baseData = armor as CompendiumEntry[];
        // Filter nach Kategorie
        if (selectedArmorCategory) {
          baseData = baseData.filter((x) => {
            const armorItem = x as import("../lib/types").Armor;
            const categoryLabel =
              armorItem.category_label || armorItem.category;
            return categoryLabel === selectedArmorCategory;
          });
        }
        // Sortierung: Kategorie > AC (aufsteigend) > Alphabetisch
        baseData = [...baseData].sort((a, b) => {
          const armorA = a as import("../lib/types").Armor;
          const armorB = b as import("../lib/types").Armor;
          const catA = armorA.category_label || armorA.category;
          const catB = armorB.category_label || armorB.category;
          if (catA !== catB) {
            return catA.localeCompare(catB, "de");
          }
          const parseAC = (formula: string | null): number => {
            if (!formula) return 0;
            const match = formula.match(/^(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          };
          const acA = armorA.base_ac ?? parseAC(armorA.ac_formula);
          const acB = armorB.base_ac ?? parseAC(armorB.ac_formula);
          if (acA !== acB) {
            return acA - acB;
          }
          return armorA.name.localeCompare(armorB.name, "de");
        });
        break;
      case "tools":
        baseData = tools as CompendiumEntry[];
        break;
      case "feats":
        baseData = feats as CompendiumEntry[];
        if (selectedFeatCategory) {
          baseData = baseData.filter((x) => {
            const feat = x as import("../lib/types").Feat;
            return feat.category === selectedFeatCategory;
          });
        }
        break;
      case "skills":
        baseData = skills as CompendiumEntry[];
        break;
      case "backgrounds":
        baseData = backgrounds as CompendiumEntry[];
        break;
      case "items":
        baseData = items as CompendiumEntry[];
        break;
      case "equipment":
        baseData = equipment as CompendiumEntry[];
        break;
      case "magic-items":
        baseData = magicItems as CompendiumEntry[];
        // Filter nach Kategorie, wenn eine ausgewählt ist
        if (selectedMagicCategory) {
          baseData = baseData.filter((x) => {
            const mi = x as import("../lib/types").MagicItem;
            return mi.category === selectedMagicCategory;
          });
        }
        break;
    }
    // Kombiniere globale und Sidebar-Suche
    return baseData.filter((x) => {
      const nameMatch = x.name.toLowerCase().includes(s);
      const sidebarMatch =
        sidebarS === "" || x.name.toLowerCase().includes(sidebarS);
      return nameMatch && sidebarMatch;
    });
  };

  const data = getFilteredData();
  const selectedItem = data.find((x) => x.id === selectedId);

  const renderSourceBadge = (source: string) => {
    if (source === "core" || !source) return null;
    return (
      <span
        className={cn(
          "text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ml-2",
          source === "homebrew"
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            : "bg-primary/10 text-primary border border-primary/20",
        )}
      >
        {source === "homebrew" ? "Custom" : "Edit"}
      </span>
    );
  };

  // Helper: Tab-Labels und Icons
  const TAB_CONFIG: Record<Tab, { label: string; icon: IconType }> = {
    spells: { label: "Zauber", icon: Zap },
    "magic-items": { label: "Magische Gegenstände", icon: Sparkles },
    classes: { label: "Klassen", icon: Shield },
    species: { label: "Spezies", icon: Users },
    backgrounds: { label: "Hintergründe", icon: ScrollText },
    feats: { label: "Talente", icon: Award },
    skills: { label: "Fertigkeiten", icon: Brain },
    weapons: { label: "Waffen", icon: Sword },
    armor: { label: "Rüstungen", icon: Shield },
    tools: { label: "Werkzeuge", icon: Package },
    items: { label: "Gegenstände", icon: Book },
    equipment: { label: "Ausrüstungspakete", icon: Package },
    gear: { label: "Ausrüstung", icon: Package },
  };

  const CATEGORY_CONFIG: Record<
    MainCategory,
    { label: string; icon: IconType }
  > = {
    magic: { label: "Magie", icon: Wand2 },
    characters: { label: "Charaktere", icon: UserCircle },
    arsenal: { label: "Arsenal", icon: Hammer },
  };

  const renderCategoryButton = (category: MainCategory) => {
    const config = CATEGORY_CONFIG[category];
    const isActive = activeCategory === category;
    return (
      <button
        key={category}
        onClick={() => {
          categoryChangeRef.current = true;
          const tabs = CATEGORY_TABS[category];
          if (tabs.length > 0) {
            setActiveTab(tabs[0]);
          }
          setActiveCategory(category);
        }}
        className={cn(
          "flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all relative overflow-hidden group",
          isActive
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <config.icon
          size={18}
          className={cn(
            "transition-transform group-hover:scale-110",
            isActive ? "text-primary-foreground" : "text-muted-foreground",
          )}
        />
        <span className="text-xs font-black uppercase tracking-wider">
          {config.label}
        </span>
      </button>
    );
  };

  const renderSubTabButton = (tab: Tab) => {
    const config = TAB_CONFIG[tab];
    const isActive = activeTab === tab;
    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-medium",
          isActive
            ? "bg-primary/20 text-primary border border-primary/30"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        )}
      >
        <config.icon size={14} />
        <span>{config.label}</span>
      </button>
    );
  };

  // Breadcrumb generieren
  const getBreadcrumb = () => {
    const categoryConfig = CATEGORY_CONFIG[activeCategory];
    const tabConfig = TAB_CONFIG[activeTab];
    const parts = [categoryConfig.label, tabConfig.label];

    // Zusätzliche Filter-Infos
    if (activeTab === "spells" && selectedSpellLevel !== null) {
      parts.push(`Grad ${selectedSpellLevel}`);
    } else if (activeTab === "spells" && selectedSpellSchool !== null) {
      parts.push(selectedSpellSchool);
    } else if (activeTab === "spells" && selectedSpellClass !== null) {
      parts.push(selectedSpellClass);
    } else if (activeTab === "magic-items" && selectedMagicCategory) {
      parts.push(selectedMagicCategory);
    } else if (activeTab === "feats" && selectedFeatCategory) {
      parts.push(selectedFeatCategory);
    } else if (activeTab === "weapons" && selectedWeaponCategory) {
      parts.push(selectedWeaponCategory);
      if (selectedWeaponType) {
        parts.push(selectedWeaponType);
      }
      if (selectedWeaponSubtype) {
        parts.push(selectedWeaponSubtype);
      }
    } else if (activeTab === "armor" && selectedArmorCategory) {
      parts.push(selectedArmorCategory);
    }

    return parts;
  };

  // Filter-Chips generieren
  const updateFilterChips = () => {
    const chips: FilterChip[] = [];

    if (activeTab === "spells") {
      if (selectedSpellLevel !== null) {
        chips.push({
          id: "spell-level",
          label: `Grad ${selectedSpellLevel}`,
          type: "level",
          value: selectedSpellLevel,
          onRemove: () => setSelectedSpellLevel(null),
        });
      }
      if (selectedSpellSchool !== null) {
        chips.push({
          id: "spell-school",
          label: selectedSpellSchool,
          type: "school",
          value: selectedSpellSchool,
          onRemove: () => setSelectedSpellSchool(null),
        });
      }
      if (selectedSpellClass !== null) {
        chips.push({
          id: "spell-class",
          label: selectedSpellClass,
          type: "class",
          value: selectedSpellClass,
          onRemove: () => setSelectedSpellClass(null),
        });
      }
    } else if (activeTab === "magic-items" && selectedMagicCategory) {
      chips.push({
        id: "magic-category",
        label: selectedMagicCategory,
        type: "category",
        value: selectedMagicCategory,
        onRemove: () => setSelectedMagicCategory(null),
      });
    } else if (activeTab === "feats" && selectedFeatCategory) {
      chips.push({
        id: "feat-category",
        label: selectedFeatCategory,
        type: "category",
        value: selectedFeatCategory,
        onRemove: () => setSelectedFeatCategory(null),
      });
    } else if (activeTab === "weapons") {
      if (selectedWeaponCategory) {
        chips.push({
          id: "weapon-category",
          label: selectedWeaponCategory,
          type: "category",
          value: selectedWeaponCategory,
          onRemove: () => setSelectedWeaponCategory(null),
        });
      }
      if (selectedWeaponType) {
        chips.push({
          id: "weapon-type",
          label: selectedWeaponType,
          type: "itemType",
          value: selectedWeaponType,
          onRemove: () => setSelectedWeaponType(null),
        });
      }
      if (selectedWeaponSubtype) {
        chips.push({
          id: "weapon-subtype",
          label: selectedWeaponSubtype,
          type: "itemType",
          value: selectedWeaponSubtype,
          onRemove: () => setSelectedWeaponSubtype(null),
        });
      }
    } else if (activeTab === "armor" && selectedArmorCategory) {
      chips.push({
        id: "armor-category",
        label: selectedArmorCategory,
        type: "category",
        value: selectedArmorCategory,
        onRemove: () => setSelectedArmorCategory(null),
      });
    }

    setActiveFilters(chips);
  };

  useEffect(() => {
    updateFilterChips();
  }, [
    selectedSpellLevel,
    selectedSpellSchool,
    selectedSpellClass,
    selectedMagicCategory,
    selectedFeatCategory,
    selectedWeaponCategory,
    selectedWeaponType,
    selectedWeaponSubtype,
    selectedArmorCategory,
    activeTab,
  ]);

  const breadcrumb = getBreadcrumb();
  const currentSubTabs = CATEGORY_TABS[activeCategory];

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <header className="px-8 py-6 border-b border-border bg-card/80 backdrop-blur-xl shrink-0 z-20 sticky top-0 shadow-sm">
        {/* Hauptkategorien */}
        <div className="flex items-center gap-2 mb-4">
          {renderCategoryButton("magic")}
          {renderCategoryButton("characters")}
          {renderCategoryButton("arsenal")}
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-2 px-1">
          {currentSubTabs.map((tab) => renderSubTabButton(tab))}
        </div>

        {/* Breadcrumb & Actions */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumb.map((part, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight size={14} />}
                <span
                  className={
                    idx === breadcrumb.length - 1
                      ? "text-foreground font-medium"
                      : ""
                  }
                >
                  {part}
                </span>
              </div>
            ))}
          </div>

          {/* Actions & Global Search */}
          <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto">
            <Button
              onClick={() => {
                setSelectedId(null);
                setIsEditorOpen(true);
              }}
              variant="primary"
              size="md"
              className="flex-1 lg:flex-none flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Neu
            </Button>

            <div className="relative flex-1 lg:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                size={18}
              />
              <input
                type="text"
                placeholder="Kompendium durchsuchen..."
                className="w-full pl-12 pr-6 py-3 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none border-b-2 focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filter-Chips */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {activeFilters.map((chip) => (
              <button
                key={chip.id}
                onClick={chip.onRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium hover:bg-primary/20 transition-all"
              >
                <span>{chip.label}</span>
                <X size={12} />
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left: Spell Navigation (nur für spells) */}
        {activeTab === "spells" &&
          spells.length > 0 &&
          (() => {
            const levels = Array.from(new Set(spells.map((s) => s.level))).sort(
              (a, b) => a - b,
            );
            const levelCounts = levels.reduce(
              (acc, level) => {
                acc[level] = spells.filter((s) => s.level === level).length;
                return acc;
              },
              {} as Record<number, number>,
            );
            const schools = Array.from(
              new Set(spells.map((s) => s.school)),
            ).sort();
            const schoolCounts = schools.reduce(
              (acc, school) => {
                acc[school] = spells.filter((s) => s.school === school).length;
                return acc;
              },
              {} as Record<string, number>,
            );

            // Extrahiere alle eindeutigen Klassen
            const allClasses = new Set<string>();
            spells.forEach((spell) => {
              const classes = spell.classes.split(",").map((c) => c.trim());
              classes.forEach((cls) => allClasses.add(cls));
            });
            const sortedClasses = Array.from(allClasses).sort();
            const classCounts = sortedClasses.reduce(
              (acc, className) => {
                acc[className] = spells.filter((s) =>
                  s.classes.includes(className),
                ).length;
                return acc;
              },
              {} as Record<string, number>,
            );

            return (
              <aside className="w-56 border-r border-border flex flex-col bg-muted/20 overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-3">
                    Sortierung
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => {
                        setSpellSortMode("level");
                        const levels = Array.from(
                          new Set(spells.map((s) => s.level)),
                        ).sort((a, b) => a - b);
                        if (levels.length > 0 && selectedSpellLevel === null) {
                          setSelectedSpellLevel(levels[0]);
                        }
                      }}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                        spellSortMode === "level"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/30 hover:bg-muted/50 text-foreground",
                      )}
                    >
                      Grad
                    </button>
                    <button
                      onClick={() => {
                        setSpellSortMode("school");
                        const schools = Array.from(
                          new Set(spells.map((s) => s.school)),
                        ).sort();
                        if (
                          schools.length > 0 &&
                          selectedSpellSchool === null
                        ) {
                          setSelectedSpellSchool(schools[0]);
                        }
                        setSelectedSpellLevel(null);
                        setSelectedSpellClass(null);
                      }}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                        spellSortMode === "school"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/30 hover:bg-muted/50 text-foreground",
                      )}
                    >
                      Schule
                    </button>
                    <button
                      onClick={() => {
                        setSpellSortMode("class");
                        const allClasses = new Set<string>();
                        spells.forEach((spell) => {
                          const classes = spell.classes
                            .split(",")
                            .map((c) => c.trim());
                          classes.forEach((cls) => allClasses.add(cls));
                        });
                        const sortedClasses = Array.from(allClasses).sort();
                        if (
                          sortedClasses.length > 0 &&
                          selectedSpellClass === null
                        ) {
                          setSelectedSpellClass(sortedClasses[0]);
                        }
                        setSelectedSpellLevel(null);
                        setSelectedSpellSchool(null);
                      }}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                        spellSortMode === "class"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/30 hover:bg-muted/50 text-foreground",
                      )}
                    >
                      Klasse
                    </button>
                    <button
                      onClick={() => {
                        setSpellSortMode("alphabetical");
                        setSelectedSpellLevel(null);
                        setSelectedSpellSchool(null);
                        setSelectedSpellClass(null);
                      }}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all col-span-2",
                        spellSortMode === "alphabetical"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/30 hover:bg-muted/50 text-foreground",
                      )}
                    >
                      A-Z
                    </button>
                  </div>
                </div>
                {spellSortMode === "level" && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <div className="mb-2 px-2">
                      <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-2">
                        Zaubergrad
                      </p>
                    </div>
                    {levels.map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setSelectedSpellLevel(level);
                          setSelectedId(null);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl mb-2 transition-all text-sm font-medium",
                          selectedSpellLevel === level
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "bg-muted/30 hover:bg-muted/50 text-foreground",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {level === 0 ? "Zaubertricks" : `Grad ${level}`}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full",
                              selectedSpellLevel === level
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {levelCounts[level]}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {spellSortMode === "school" && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <div className="mb-2 px-2">
                      <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-2">
                        Schule
                      </p>
                    </div>
                    {schools.map((school) => (
                      <button
                        key={school}
                        onClick={() => {
                          setSelectedSpellSchool(school);
                          setSelectedId(null);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl mb-2 transition-all text-sm font-medium",
                          selectedSpellSchool === school
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "bg-muted/30 hover:bg-muted/50 text-foreground",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span>{school}</span>
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full",
                              selectedSpellSchool === school
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {schoolCounts[school]}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {spellSortMode === "class" && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <div className="mb-2 px-2">
                      <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-2">
                        Klasse
                      </p>
                    </div>
                    {sortedClasses.map((className) => (
                      <button
                        key={className}
                        onClick={() => {
                          setSelectedSpellClass(className);
                          setSelectedId(null);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl mb-2 transition-all text-sm font-medium",
                          selectedSpellClass === className
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "bg-muted/30 hover:bg-muted/50 text-foreground",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span>{className}</span>
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full",
                              selectedSpellClass === className
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {classCounts[className]}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {spellSortMode === "alphabetical" && (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-sm text-muted-foreground/60 italic text-center">
                      Alle Zauber werden alphabetisch sortiert angezeigt
                    </p>
                  </div>
                )}
              </aside>
            );
          })()}

        {/* Left: Category Navigation (nur für magic-items) */}
        {activeTab === "magic-items" &&
          magicItems.length > 0 &&
          (() => {
            const categories = Array.from(
              new Set(magicItems.map((mi) => mi.category)),
            ).sort();
            const categoryCounts = categories.reduce(
              (acc, cat) => {
                acc[cat] = magicItems.filter(
                  (mi) => mi.category === cat,
                ).length;
                return acc;
              },
              {} as Record<string, number>,
            );

            return (
              <aside className="w-56 border-r border-border flex flex-col bg-muted/20 overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-3">
                    Kategorien
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedMagicCategory(category);
                        setSelectedId(null);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl mb-2 transition-all text-sm font-medium",
                        selectedMagicCategory === category
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted/30 hover:bg-muted/50 text-foreground",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category}</span>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full",
                            selectedMagicCategory === category
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {categoryCounts[category]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
            );
          })()}

        {/* Left: Category Navigation (nur für feats) */}
        {activeTab === "feats" &&
          feats.length > 0 &&
          (() => {
            const categories = Array.from(
              new Set(feats.map((f) => f.category).filter(Boolean)),
            ).sort();
            const categoryCounts = categories.reduce(
              (acc, cat) => {
                acc[cat] = feats.filter((f) => f.category === cat).length;
                return acc;
              },
              {} as Record<string, number>,
            );

            return (
              <aside className="w-56 border-r border-border flex flex-col bg-muted/20 overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-3">
                    Kategorien
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedFeatCategory(category);
                        setSelectedId(null);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl mb-2 transition-all text-sm font-medium",
                        selectedFeatCategory === category
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted/30 hover:bg-muted/50 text-foreground",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category}</span>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full",
                            selectedFeatCategory === category
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {categoryCounts[category]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
            );
          })()}

        {/* Left: Category Navigation (nur für weapons) */}
        {activeTab === "weapons" &&
          weapons.length > 0 &&
          (() => {
            // Gruppiere nach category_label
            const categories = Array.from(
              new Set(
                weapons
                  .map((w) => w.category_label || w.category)
                  .filter(Boolean),
              ),
            ).sort();
            const categoryCounts = categories.reduce(
              (acc, cat) => {
                acc[cat] = weapons.filter(
                  (w) => (w.category_label || w.category) === cat,
                ).length;
                return acc;
              },
              {} as Record<string, number>,
            );

            // Für jede Kategorie: Nahkampf/Fernkampf Unterkategorien
            const getWeaponTypesForCategory = (category: string) => {
              const categoryWeapons = weapons.filter(
                (w) => (w.category_label || w.category) === category,
              );
              const types = Array.from(
                new Set(
                  categoryWeapons.map((w) => w.weapon_type).filter(Boolean),
                ),
              ) as string[];
              return types.sort();
            };

            // Für jede Kategorie: Subtypen (Stangenwaffen, etc.)
            const getWeaponSubtypesForCategory = (category: string) => {
              const categoryWeapons = weapons.filter(
                (w) => (w.category_label || w.category) === category,
              );
              const subtypes = Array.from(
                new Set(
                  categoryWeapons.map((w) => w.weapon_subtype).filter(Boolean),
                ),
              ) as string[];
              return subtypes.sort();
            };

            return (
              <aside className="w-56 border-r border-border flex flex-col bg-muted/20 overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-3">
                    Kategorien
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {categories.map((category) => {
                    const types = getWeaponTypesForCategory(category);
                    const isActive = selectedWeaponCategory === category;

                    return (
                      <div key={category} className="mb-2">
                        <button
                          onClick={() => {
                            setSelectedWeaponCategory(category);
                            setSelectedWeaponType(null);
                            setSelectedWeaponSubtype(null);
                            setSelectedId(null);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-lg"
                              : "bg-muted/30 hover:bg-muted/50 text-foreground",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span>{category}</span>
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full",
                                isActive
                                  ? "bg-primary-foreground/20 text-primary-foreground"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {categoryCounts[category]}
                            </span>
                          </div>
                        </button>
                        {isActive && (
                          <>
                            {types.length > 0 && (
                              <div className="mt-2 ml-4 space-y-1">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-3">
                                  Typ
                                </div>
                                {types.map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      setSelectedWeaponType(
                                        type as "Nahkampf" | "Fernkampf",
                                      );
                                      setSelectedWeaponSubtype(null);
                                      setSelectedId(null);
                                    }}
                                    className={cn(
                                      "w-full text-left px-3 py-2 rounded-lg transition-all text-xs font-medium",
                                      selectedWeaponType === type
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : "bg-muted/20 hover:bg-muted/30 text-foreground",
                                    )}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            )}
                            {(() => {
                              const subtypes =
                                getWeaponSubtypesForCategory(category);
                              return (
                                subtypes.length > 0 && (
                                  <div className="mt-2 ml-4 space-y-1">
                                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-3">
                                      Unterkategorie
                                    </div>
                                    {subtypes.map((subtype) => (
                                      <button
                                        key={subtype}
                                        onClick={() => {
                                          setSelectedWeaponSubtype(subtype);
                                          setSelectedWeaponType(null);
                                          setSelectedId(null);
                                        }}
                                        className={cn(
                                          "w-full text-left px-3 py-2 rounded-lg transition-all text-xs font-medium",
                                          selectedWeaponSubtype === subtype
                                            ? "bg-primary/20 text-primary border border-primary/30"
                                            : "bg-muted/20 hover:bg-muted/30 text-foreground",
                                        )}
                                      >
                                        {subtype}
                                      </button>
                                    ))}
                                  </div>
                                )
                              );
                            })()}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </aside>
            );
          })()}

        {/* Left: Category Navigation (nur für armor) */}
        {activeTab === "armor" &&
          armor.length > 0 &&
          (() => {
            const categories = Array.from(
              new Set(
                armor
                  .map((a) => a.category_label || a.category)
                  .filter(Boolean),
              ),
            ).sort();
            const categoryCounts = categories.reduce(
              (acc, cat) => {
                acc[cat] = armor.filter(
                  (a) => (a.category_label || a.category) === cat,
                ).length;
                return acc;
              },
              {} as Record<string, number>,
            );

            return (
              <aside className="w-56 border-r border-border flex flex-col bg-muted/20 overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-3">
                    Kategorien
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedArmorCategory(category);
                        setSelectedId(null);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl mb-2 transition-all text-sm font-medium",
                        selectedArmorCategory === category
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted/30 hover:bg-muted/50 text-foreground",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category}</span>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full",
                            selectedArmorCategory === category
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {categoryCounts[category]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
            );
          })()}

        {/* Left: Sidebar List */}
        <aside
          className={cn(
            "border-r border-border flex flex-col bg-muted/10 overflow-hidden",
            activeTab === "magic-items" ||
              activeTab === "feats" ||
              activeTab === "spells" ||
              activeTab === "weapons" ||
              activeTab === "armor"
              ? "w-80"
              : "w-96",
          )}
        >
          {/* Sidebar Suchleiste */}
          <div className="p-4 border-b border-border bg-muted/20">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                size={16}
              />
              <input
                type="text"
                placeholder="In Liste suchen..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                value={sidebarSearchTerm}
                onChange={(e) => setSidebarSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto custom-scrollbar p-6"
            ref={parentRef}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-xl shadow-primary/20"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">
                  Rufe alte Schriften auf...
                </p>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-red-500/60 text-sm italic border-2 border-dashed border-red-500/20 rounded-[2rem]">
                Fehler beim Laden: {error}
              </div>
            ) : data.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground/40 text-sm italic border-2 border-dashed border-border rounded-[2rem]">
                Keine Einträge gefunden
                {activeTab === "weapons" &&
                  weapons.length === 0 &&
                  " (Waffen werden geladen...)"}
                {activeTab === "armor" &&
                  armor.length === 0 &&
                  " (Rüstungen werden geladen...)"}
                {activeTab === "magic-items" &&
                  magicItems.length === 0 &&
                  " (Magische Gegenstände werden geladen...)"}
                {activeTab === "equipment" &&
                  equipment.length === 0 &&
                  " (Ausrüstungspakete werden geladen...)"}
              </div>
            ) : (
              <VirtualizedList
                parentRef={parentRef}
                data={data}
                selectedId={selectedId}
                activeTab={activeTab}
                onSelect={(id) => {
                  setSelectedId(id);
                  setSelectedSubclass(null);
                }}
                renderSourceBadge={renderSourceBadge}
              />
            )}
          </div>
        </aside>

        {/* Right: Main Content */}
        <section className="flex-1 overflow-y-auto bg-background relative custom-scrollbar scroll-smooth">
          {!selectedItem ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 space-y-8 animate-reveal">
              <Book size={140} strokeWidth={0.5} className="opacity-40" />
              <div className="text-center space-y-2">
                <p className="text-2xl font-black tracking-[0.4em] uppercase opacity-30">
                  Nexus-Wissen
                </p>
                <p className="text-sm font-medium tracking-wide italic">
                  Wähle eine Legende aus dem Archiv
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full p-6 lg:p-10 space-y-10 animate-reveal">
              {/* Header Card */}
              <div className="space-y-8">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="px-6 py-2 bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase rounded-full tracking-[0.3em] shadow-sm">
                    {activeTab.slice(0, -1)}
                  </div>
                  {renderSourceBadge(selectedItem.source)}
                  <div className="h-px w-12 bg-border" />
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">
                    PHB v2024 Reference
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter leading-[0.9] font-serif italic selection:bg-primary/20">
                    {selectedSubclass
                      ? selectedSubclass.name
                      : selectedItem.name}
                  </h1>
                  {selectedSubclass && (
                    <div className="flex items-center gap-3 text-primary">
                      <ChevronRight size={20} />
                      <p className="text-2xl font-bold tracking-tight italic">
                        Unterklasse von {selectedItem.name}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsEditorOpen(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-card border border-border text-foreground hover:text-primary hover:border-primary/50 rounded-2xl transition-all shadow-xl hover:shadow-primary/5 active:scale-95 group"
                >
                  <Edit2
                    size={20}
                    className="group-hover:rotate-12 transition-transform"
                  />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Eintrag bearbeiten
                  </span>
                </button>
              </div>

              {/* Layout Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                {/* Left Column (Details) */}
                <div className="xl:col-span-8 space-y-10">
                  {/* Knowledge Block */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-6">
                      <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.5em] whitespace-nowrap">
                        Beschreibung
                      </h4>
                      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                    </div>

                    <div className="glass-panel p-6 lg:p-8 relative group overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-primary/10 group-hover:bg-primary transition-colors duration-700" />
                      <p className="text-foreground/90 leading-relaxed text-lg lg:text-xl whitespace-pre-wrap font-medium italic first-letter:text-3xl first-letter:font-black first-letter:text-primary first-letter:mr-2">
                        {(() => {
                          // Für Magic Items: Suche in data.description (facts_json)
                          if (activeTab === "magic-items") {
                            const mi =
                              selectedItem as import("../lib/types").MagicItem;
                            const facts =
                              typeof mi.data === "object" && mi.data !== null
                                ? mi.data
                                : {};
                            const description = facts["description"];
                            if (
                              typeof description === "string" &&
                              description
                            ) {
                              // Entferne Item-Name und Meta-Info am Anfang, falls vorhanden
                              let cleanDesc = description;
                              // Entferne Item-Name am Anfang (falls vorhanden)
                              const itemNameUpper = mi.name.toUpperCase();
                              if (
                                cleanDesc
                                  .toUpperCase()
                                  .startsWith(itemNameUpper)
                              ) {
                                const lines = cleanDesc.split("\n");
                                // Überspringe erste Zeile wenn sie nur der Item-Name ist
                                if (
                                  lines[0]?.trim().toUpperCase() ===
                                  itemNameUpper
                                ) {
                                  cleanDesc = lines.slice(1).join("\n").trim();
                                }
                              }
                              // Entferne Meta-Line (Kategorie, Seltenheit) am Anfang
                              cleanDesc = cleanDesc
                                .replace(
                                  /^(Waffe|Wundersamer Gegenstand|Rüstung|Ring|Schriftrolle|Zauberstab|Stab|Zepter|Trank|Schild).*?$/m,
                                  "",
                                )
                                .trim();
                              return cleanDesc || description;
                            }
                          }

                          const direct = (
                            selectedItem as { description?: unknown }
                          ).description;
                          if (typeof direct === "string" && direct)
                            return direct;
                          const data = (selectedItem as { data?: unknown })
                            .data;
                          if (isRecord(data)) {
                            const fromData = data["description"];
                            if (typeof fromData === "string" && fromData)
                              return fromData;
                          }
                          return "Keine Beschreibung im Archiv gefunden.";
                        })()}
                      </p>
                    </div>

                    {activeTab === "spells" &&
                      (() => {
                        const spell =
                          selectedItem as import("../lib/types").Spell;
                        if (!spell.higher_levels) return null;
                        return (
                          <div className="p-6 bg-primary/[0.02] rounded-2xl border-2 border-dashed border-primary/10 relative group">
                            <Sparkles className="absolute top-4 right-4 text-primary/20 group-hover:rotate-12 group-hover:scale-125 transition-all duration-500" />
                            <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-4 flex items-center gap-4">
                              <Zap size={18} /> Verstärkung
                            </h4>
                            <p className="text-base text-muted-foreground/80 leading-relaxed italic border-l-4 border-primary/20 pl-6">
                              {spell.higher_levels}
                            </p>
                          </div>
                        );
                      })()}
                  </div>

                  {/* Species Specifics */}
                  {activeTab === "species" &&
                    (() => {
                      const sp = selectedItem as Species;
                      const traits = getTraits(sp.data?.traits);
                      return (
                        <div className="grid grid-cols-1 gap-6">
                          {traits.map((trait, idx) => (
                            <div
                              key={`${trait.name}-${idx}`}
                              className="bg-card p-6 rounded-[2rem] border border-border shadow-xl hover:border-primary/40 transition-all group relative overflow-hidden"
                            >
                              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-1000" />
                              <h4 className="text-xl font-black text-foreground mb-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                                  <Zap size={20} className="text-primary" />
                                </div>
                                {trait.name}
                              </h4>
                              <p className="text-base text-muted-foreground leading-relaxed italic border-l-4 border-border/50 pl-6 group-hover:border-primary/30 transition-colors">
                                {trait.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                  {/* Class Features Timeline */}
                  {activeTab === "classes" && (
                    <div className="space-y-16">
                      <div className="flex flex-wrap gap-4 p-4 bg-muted/20 rounded-[2.5rem] border border-border w-fit shadow-inner backdrop-blur-sm">
                        <button
                          onClick={() => setSelectedSubclass(null)}
                          className={cn(
                            "px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all active:scale-95",
                            !selectedSubclass
                              ? "bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/30"
                              : "text-muted-foreground border-transparent hover:bg-card hover:text-primary",
                          )}
                        >
                          Basisklasse
                        </button>
                        {getSubclasses(
                          (selectedItem as Class).data?.subclasses,
                        ).map((sc) => (
                          <button
                            key={sc.name}
                            onClick={() => setSelectedSubclass(sc)}
                            className={cn(
                              "px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all active:scale-95",
                              selectedSubclass?.name === sc.name
                                ? "bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/30"
                                : "text-muted-foreground border-transparent hover:bg-card hover:text-primary",
                            )}
                          >
                            {sc.name}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-10">
                        <h3 className="text-2xl font-black text-foreground tracking-tighter flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-lg">
                            <Award size={24} className="text-primary" />
                          </div>
                          {selectedSubclass
                            ? "Spezialisierung"
                            : "Pfad der Klasse"}
                        </h3>

                        <div className="space-y-10 relative pl-8 lg:pl-12">
                          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary via-border to-transparent rounded-full" />
                          {Object.entries(
                            getFeaturesByLevel(
                              selectedSubclass?.features ||
                                (selectedItem as Class).data?.[
                                  "features_by_level"
                                ],
                            ),
                          ).map(([level, features]) => {
                            if (features.length === 0) return null;
                            return (
                              <div key={level} className="relative pl-16 group">
                                <div className="absolute left-[-40px] lg:left-[-56px] top-4 w-8 h-8 rounded-full bg-background border-4 border-primary shadow-2xl group-hover:scale-125 transition-transform z-10" />
                                <span className="text-base font-black text-primary/30 uppercase tracking-[0.5em] mb-6 block">
                                  Grad {level}
                                </span>
                                <div className="grid gap-10">
                                  {features.map((f) => (
                                    <div
                                      key={f.name}
                                      className="bg-card p-6 lg:p-8 rounded-[2.5rem] border border-border shadow-2xl shadow-foreground/[0.02] hover:border-primary/20 transition-all group/feat"
                                    >
                                      <h5 className="text-xl font-black text-foreground mb-4 group-hover/feat:text-primary transition-colors italic font-serif">
                                        {f.name}
                                      </h5>
                                      <p className="text-base text-muted-foreground italic leading-relaxed border-l-4 border-border pl-6 group-hover/feat:border-primary transition-colors">
                                        {f.description}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column (Stats) */}
                <aside className="xl:col-span-4 space-y-10 sticky top-36">
                  <div className="bg-card p-6 rounded-[3rem] border border-border shadow-2xl shadow-foreground/[0.04] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-1000" />

                    <h4 className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.6em] mb-8 border-b border-border pb-4 text-center">
                      Eigenschaften
                    </h4>

                    <div className="space-y-6">
                      {activeTab === "spells" &&
                        (() => {
                          const spell =
                            selectedItem as import("../lib/types").Spell;
                          return (
                            <>
                              <StatRow
                                label="Zaubergrad"
                                value={`Stufe ${spell.level}`}
                                highlight
                                icon={Sparkles}
                              />
                              <StatRow
                                label="Schule"
                                value={spell.school}
                                icon={Brain}
                              />
                              <StatRow
                                label="Zeitaufwand"
                                value={spell.casting_time}
                                icon={Clock}
                              />
                              <StatRow
                                label="Reichweite"
                                value={spell.range}
                                icon={Target}
                              />
                              <StatRow
                                label="Dauer"
                                value={spell.duration}
                                icon={Clock}
                              />
                              <StatRow
                                label="Komponenten"
                                value={spell.components}
                                icon={ScrollText}
                              />
                              {spell.material_components && (
                                <div className="bg-muted/30 p-10 rounded-[3rem] border border-border mt-10 relative group">
                                  <Info
                                    className="absolute top-6 right-6 text-primary/30 group-hover:text-primary transition-colors"
                                    size={20}
                                  />
                                  <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.4em] block mb-4">
                                    Materialien
                                  </span>
                                  <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                                    {spell.material_components}
                                  </p>
                                </div>
                              )}
                              <StatRow
                                label="Klassen"
                                value={spell.classes}
                                highlight
                                icon={Users}
                              />
                            </>
                          );
                        })()}

                      {activeTab === "weapons" &&
                        (() => {
                          const weapon = selectedItem as Weapon;
                          return (
                            <>
                              <StatRow
                                label="Schaden"
                                value={weapon.damage_dice}
                                highlight
                                icon={Zap}
                              />
                              <StatRow label="Typ" value={weapon.damage_type} />
                              <StatRow
                                label="Eigenschaft"
                                value={
                                  weapon.properties &&
                                  weapon.properties.length > 0
                                    ? weapon.properties
                                        .map((p) => p.name)
                                        .join(", ")
                                    : weapon.weapon_type || "—"
                                }
                                icon={Sword}
                              />
                              <StatRow
                                label="Meisterung"
                                value={getWeaponMasteryName(weapon) || "—"}
                                highlight
                                icon={Award}
                              />
                              <div className="grid grid-cols-2 gap-8 border-t border-border pt-8 mt-8">
                                <StatRow
                                  label="Gewicht"
                                  value={`${weapon.weight_kg} kg`}
                                />
                                <StatRow
                                  label="Preis"
                                  value={`${weapon.cost_gp} GM`}
                                />
                              </div>
                            </>
                          );
                        })()}

                      {activeTab === "armor" &&
                        (() => {
                          const a = selectedItem as Armor;
                          return (
                            <>
                              <StatRow
                                label="Rüstungsklasse"
                                value={
                                  a.category === "schild"
                                    ? `+${a.ac_bonus}`
                                    : a.ac_formula ||
                                      (a.base_ac !== null &&
                                      a.base_ac !== undefined
                                        ? a.base_ac.toString()
                                        : "—")
                                }
                                highlight
                                icon={Shield}
                              />
                              {a.ac_bonus > 0 && a.category !== "schild" && (
                                <StatRow
                                  label="AC-Bonus"
                                  value={`+${a.ac_bonus}`}
                                  highlight
                                />
                              )}
                              <StatRow label="Typ" value={a.category} />
                              <StatRow
                                label="Stärke"
                                value={a.strength_requirement || "—"}
                              />
                              <StatRow
                                label="Schleichen"
                                value={
                                  a.stealth_disadvantage ? "Nachteil" : "Normal"
                                }
                              />
                              {(a.don_time_minutes !== null ||
                                a.doff_time_minutes !== null) && (
                                <div className="grid grid-cols-2 gap-8 border-t border-border pt-8 mt-8">
                                  <StatRow
                                    label="Anlegezeit"
                                    value={
                                      a.don_time_minutes === 0
                                        ? "1 Aktion"
                                        : a.don_time_minutes !== null
                                          ? `${a.don_time_minutes} Min.`
                                          : "—"
                                    }
                                  />
                                  <StatRow
                                    label="Ablegezeit"
                                    value={
                                      a.doff_time_minutes === 0
                                        ? "1 Aktion"
                                        : a.doff_time_minutes !== null
                                          ? `${a.doff_time_minutes} Min.`
                                          : "—"
                                    }
                                  />
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-8 border-t border-border pt-8 mt-8">
                                <StatRow
                                  label="Gewicht"
                                  value={`${a.weight_kg} kg`}
                                />
                                <StatRow
                                  label="Preis"
                                  value={`${a.cost_gp} GM`}
                                />
                              </div>

                              {/* Properties Details für Rüstungen */}
                              {a.properties && a.properties.length > 0 && (
                                <div className="glass-panel p-6 rounded-[2.5rem] space-y-6 animate-reveal mt-8">
                                  <h4 className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                                    <Info size={18} /> Eigenschaften Details
                                  </h4>
                                  <div className="space-y-8">
                                    {a.properties.map((prop) => (
                                      <div
                                        key={prop.id}
                                        className="space-y-3 group"
                                      >
                                        <span className="text-base font-black text-primary uppercase tracking-widest block group-hover:translate-x-1 transition-transform">
                                          {prop.name}
                                          {"parameter_value" in prop &&
                                            prop.parameter_value != null && (
                                              <span className="text-sm text-muted-foreground normal-case ml-2">
                                                {(() => {
                                                  const param =
                                                    prop.parameter_value;
                                                  const p = isRecord(param)
                                                    ? (param as Record<
                                                        string,
                                                        unknown
                                                      >)
                                                    : null;
                                                  const strength =
                                                    p?.["strength_requirement"];
                                                  if (
                                                    typeof strength === "number"
                                                  ) {
                                                    return `(STÄ ${strength})`;
                                                  }
                                                  const acBonus =
                                                    p?.["ac_bonus"];
                                                  if (
                                                    typeof acBonus === "number"
                                                  ) {
                                                    return `(+${acBonus} RK)`;
                                                  }
                                                  const damageType =
                                                    p?.["damage_type"];
                                                  if (
                                                    typeof damageType ===
                                                    "string"
                                                  ) {
                                                    return `(${damageType})`;
                                                  }
                                                  return "";
                                                })()}
                                              </span>
                                            )}
                                        </span>
                                        <p className="text-sm text-muted-foreground italic leading-relaxed pl-6 border-l-2 border-primary/20 group-hover:border-primary transition-colors">
                                          {prop.description ||
                                            "Keine Beschreibung im PHB."}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}

                      {activeTab === "classes" &&
                        (() => {
                          const cls = selectedItem as Class;
                          const savingThrowsRaw = cls.data?.["saving_throws"];
                          const savingThrows = Array.isArray(savingThrowsRaw)
                            ? savingThrowsRaw.filter(
                                (x): x is string => typeof x === "string",
                              )
                            : [];
                          return (
                            <>
                              <StatRow
                                label="Trefferwürfel"
                                value={
                                  cls.data?.hit_die
                                    ? `W${cls.data.hit_die}`
                                    : "—"
                                }
                                highlight
                                icon={Zap}
                              />
                              <StatRow
                                label="Rettungswürfe"
                                value={
                                  savingThrows.length > 0
                                    ? savingThrows.join(", ")
                                    : "—"
                                }
                                icon={Shield}
                              />
                            </>
                          );
                        })()}

                      {activeTab === "species" &&
                        (() => {
                          const sp = selectedItem as Species;
                          const known = sp.data?.languages?.known;
                          const knownText = Array.isArray(known)
                            ? known
                                .filter(
                                  (x): x is string => typeof x === "string",
                                )
                                .join(", ")
                            : "";
                          return (
                            <>
                              <StatRow
                                label="Größe"
                                value={(() => {
                                  const size = sp.data.size;
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
                                icon={Users}
                              />
                              <StatRow
                                label="Bewegung"
                                value={`${sp.data.speed ?? "—"} m`}
                                highlight
                                icon={Compass}
                              />
                              <StatRow
                                label="Sprachen"
                                value={knownText || "—"}
                              />
                            </>
                          );
                        })()}

                      {(activeTab === "tools" || activeTab === "items") &&
                        (() => {
                          if (activeTab === "tools") {
                            const t =
                              selectedItem as import("../lib/types").Tool;
                            const abilitiesRaw = t.data?.["abilities"];
                            const abilities = Array.isArray(abilitiesRaw)
                              ? abilitiesRaw.filter(
                                  (x): x is string => typeof x === "string",
                                )
                              : [];
                            return (
                              <>
                                <StatRow
                                  label="Preis"
                                  value={`${t.cost_gp} GM`}
                                />
                                <StatRow
                                  label="Gewicht"
                                  value={`${t.weight_kg} kg`}
                                />
                                <StatRow
                                  label="Attribute"
                                  value={
                                    abilities.length > 0
                                      ? abilities.join(", ")
                                      : "—"
                                  }
                                  highlight
                                  icon={Brain}
                                />
                              </>
                            );
                          }
                          const it =
                            selectedItem as import("../lib/types").Item;
                          return (
                            <>
                              <StatRow
                                label="Preis"
                                value={`${it.cost_gp} GM`}
                              />
                              <StatRow
                                label="Gewicht"
                                value={`${it.weight_kg} kg`}
                              />
                              {it.category && (
                                <StatRow
                                  label="Kategorie"
                                  value={it.category}
                                />
                              )}
                            </>
                          );
                        })()}

                      {activeTab === "equipment" &&
                        (() => {
                          const eq = selectedItem as Equipment;
                          return (
                            <>
                              {eq.total_cost_gp !== undefined && (
                                <StatRow
                                  label="Gesamtkosten"
                                  value={`${eq.total_cost_gp} GM`}
                                  highlight
                                />
                              )}
                              {eq.total_weight_kg !== undefined && (
                                <StatRow
                                  label="Gesamtgewicht"
                                  value={`${eq.total_weight_kg} kg`}
                                />
                              )}
                              {Array.isArray(eq.items) &&
                                eq.items.length > 0 && (
                                  <ClickableStatRow
                                    label="Enthält Gegenstände"
                                    items={eq.items.map((i) => {
                                      const item = items.find(
                                        (it) => it.id === i.item_id,
                                      );
                                      return item
                                        ? `${i.quantity > 1 ? `${i.quantity}x ` : ""}${item.name}`
                                        : `${i.quantity > 1 ? `${i.quantity}x ` : ""}${i.item_id}`;
                                    })}
                                    itemsData={items}
                                    onItemClick={(id) => {
                                      setActiveTab("items");
                                      setSelectedId(id);
                                    }}
                                    highlight
                                    icon={Book}
                                  />
                                )}
                              {Array.isArray(eq.tools) &&
                                eq.tools.length > 0 && (
                                  <ClickableStatRow
                                    label="Enthält Werkzeuge"
                                    items={eq.tools.map((t) => {
                                      const tool = tools.find(
                                        (to) => to.id === t.tool_id,
                                      );
                                      return tool
                                        ? `${t.quantity > 1 ? `${t.quantity}x ` : ""}${tool.name}`
                                        : `${t.quantity > 1 ? `${t.quantity}x ` : ""}${t.tool_id}`;
                                    })}
                                    itemsData={tools}
                                    onItemClick={(id) => {
                                      setActiveTab("tools");
                                      setSelectedId(id);
                                    }}
                                    icon={Package}
                                  />
                                )}
                            </>
                          );
                        })()}

                      {activeTab === "magic-items" &&
                        (() => {
                          const mi =
                            selectedItem as import("../lib/types").MagicItem;
                          const facts =
                            typeof mi.data === "object" && mi.data !== null
                              ? mi.data
                              : {};
                          const bonuses = facts.bonuses as
                            | Record<string, number | null>
                            | undefined;
                          const charges = facts.charges as
                            | { max?: number | null; recharge?: string | null }
                            | undefined;
                          const activation = facts.activation as
                            | {
                                time?: string | null;
                                action_type?: string | null;
                                trigger?: string | null;
                                command_word?: string | null;
                              }
                            | undefined;
                          const spellsGranted = facts.spells_granted as
                            | Array<{
                                name: string;
                                frequency?: string | null;
                                notes?: string | null;
                              }>
                            | undefined;

                          return (
                            <>
                              <StatRow
                                label="Seltenheit"
                                value={mi.rarity}
                                highlight
                              />
                              <StatRow label="Kategorie" value={mi.category} />
                              {mi.requires_attunement && (
                                <StatRow
                                  label="Einstimmung"
                                  value="Erforderlich"
                                  highlight
                                />
                              )}
                              {mi.source_book && (
                                <StatRow
                                  label="Quelle"
                                  value={`${mi.source_book}${mi.source_page ? `, S. ${mi.source_page}` : ""}`}
                                />
                              )}
                              {bonuses && (
                                <>
                                  {bonuses.ac !== null &&
                                    bonuses.ac !== undefined && (
                                      <StatRow
                                        label="RK-Bonus"
                                        value={`+${bonuses.ac}`}
                                      />
                                    )}
                                  {bonuses.attack_roll !== null &&
                                    bonuses.attack_roll !== undefined && (
                                      <StatRow
                                        label="Angriffsbonus"
                                        value={`+${bonuses.attack_roll}`}
                                      />
                                    )}
                                  {bonuses.damage_roll !== null &&
                                    bonuses.damage_roll !== undefined && (
                                      <StatRow
                                        label="Schadensbonus"
                                        value={`+${bonuses.damage_roll}`}
                                      />
                                    )}
                                  {bonuses.save_dc !== null &&
                                    bonuses.save_dc !== undefined && (
                                      <StatRow
                                        label="Rettungswurf-SG"
                                        value={`${bonuses.save_dc}`}
                                      />
                                    )}
                                  {bonuses.spell_attack !== null &&
                                    bonuses.spell_attack !== undefined && (
                                      <StatRow
                                        label="Zauberangriffsbonus"
                                        value={`+${bonuses.spell_attack}`}
                                      />
                                    )}
                                </>
                              )}
                              {charges &&
                                charges.max !== null &&
                                charges.max !== undefined && (
                                  <StatRow
                                    label="Ladungen"
                                    value={`${charges.max}${charges.recharge ? ` (${charges.recharge})` : ""}`}
                                  />
                                )}
                              {activation && (
                                <>
                                  {activation.time && (
                                    <StatRow
                                      label="Aktivierungszeit"
                                      value={activation.time}
                                    />
                                  )}
                                  {activation.action_type && (
                                    <StatRow
                                      label="Aktionstyp"
                                      value={activation.action_type}
                                    />
                                  )}
                                  {activation.trigger && (
                                    <StatRow
                                      label="Auslöser"
                                      value={activation.trigger}
                                    />
                                  )}
                                  {activation.command_word && (
                                    <StatRow
                                      label="Befehlswort"
                                      value={activation.command_word}
                                    />
                                  )}
                                </>
                              )}
                              {facts.duration &&
                                typeof facts.duration === "string" && (
                                  <StatRow
                                    label="Dauer"
                                    value={facts.duration}
                                  />
                                )}
                              {facts.range &&
                                typeof facts.range === "string" && (
                                  <StatRow
                                    label="Reichweite"
                                    value={facts.range}
                                  />
                                )}
                              {facts.area && typeof facts.area === "string" && (
                                <StatRow
                                  label="Wirkungsbereich"
                                  value={facts.area}
                                />
                              )}
                              {spellsGranted && spellsGranted.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">
                                    Gewährte Zauber
                                  </p>
                                  <div className="space-y-2">
                                    {spellsGranted.map((spell, idx) => (
                                      <div
                                        key={idx}
                                        className="text-sm text-muted-foreground"
                                      >
                                        <span className="font-semibold">
                                          {spell.name}
                                        </span>
                                        {spell.frequency && (
                                          <span className="ml-2 text-xs">
                                            ({spell.frequency})
                                          </span>
                                        )}
                                        {spell.notes && (
                                          <p className="text-xs mt-1 italic">
                                            {spell.notes}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {facts.description &&
                                typeof facts.description === "string" && (
                                  <div className="mt-4">
                                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">
                                      Beschreibung
                                    </p>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                      {facts.description}
                                    </p>
                                  </div>
                                )}
                            </>
                          );
                        })()}

                      {activeTab === "backgrounds" &&
                        (() => {
                          const bg = selectedItem as Background;
                          return (
                            <>
                              {bg.data?.skills && bg.data.skills.length > 0 && (
                                <ClickableStatRow
                                  label="Fertigkeiten"
                                  items={bg.data.skills}
                                  itemsData={skills}
                                  onItemClick={(id) => {
                                    setActiveTab("skills");
                                    setSelectedId(id);
                                  }}
                                  highlight
                                  icon={Brain}
                                />
                              )}
                              {bg.data?.tool && (
                                <ClickableStatRow
                                  label="Werkzeug"
                                  items={[formatBackgroundTool(bg.data.tool)]}
                                  itemsData={tools}
                                  onItemClick={(id: string) => {
                                    setActiveTab("tools");
                                    setSelectedId(id);
                                  }}
                                  icon={Package}
                                />
                              )}
                              {bg.data?.feat && (
                                <ClickableStatRow
                                  label="Herkunftstalent"
                                  items={[bg.data.feat]}
                                  itemsData={feats}
                                  onItemClick={(id: string) => {
                                    setActiveTab("feats");
                                    setSelectedId(id);
                                  }}
                                  highlight
                                  icon={Award}
                                />
                              )}
                              {bg.data?.ability_scores &&
                                bg.data.ability_scores.length > 0 && (
                                  <StatRow
                                    label="Attributs-Boni"
                                    value={bg.data.ability_scores.join(", ")}
                                    icon={Zap}
                                  />
                                )}
                              {bg.data?.equipment_id && (
                                <ClickableStatRow
                                  label="Ausrüstung"
                                  items={[
                                    (() => {
                                      const eqId =
                                        typeof bg.data.equipment_id === "string"
                                          ? bg.data.equipment_id
                                          : "";
                                      return (
                                        equipment.find((eq) => eq.id === eqId)
                                          ?.name || eqId
                                      );
                                    })(),
                                  ]}
                                  itemsData={equipment}
                                  onItemClick={(id) => {
                                    setActiveTab("equipment");
                                    setSelectedId(id);
                                  }}
                                  highlight
                                  icon={Package}
                                />
                              )}
                              {bg.data?.gold && (
                                <StatRow
                                  label="Startgold"
                                  value={`${bg.data.gold} GM`}
                                  highlight
                                  icon={Package}
                                />
                              )}
                            </>
                          );
                        })()}
                    </div>
                  </div>

                  {activeTab === "weapons" &&
                    (() => {
                      const weapon = selectedItem as Weapon;
                      return (
                        <>
                          {/* Property Details for Weapons */}
                          {weapon.properties &&
                            weapon.properties.length > 0 &&
                            (() => {
                              // KRITISCH: Entferne ALLE Duplikate - sowohl nach ID als auch nach Name
                              // Problem: Es gibt sowohl deutsche ("leicht", "wurfwaffe") als auch englische ("light", "thrown") IDs
                              // Lösung: Normalisiere auf englische IDs und entferne Duplikate nach Name

                              // Mapping: Deutsche zu englische IDs
                              const idNormalization: Record<string, string> = {
                                leicht: "light",
                                wurfwaffe: "thrown",
                                zweihändig: "two-handed",
                                geschosse: "ammunition",
                                reichweite: "range",
                                vielseitig: "versatile",
                                finesse: "finesse", // bereits gleich
                                schwer: "heavy",
                                weitreichend: "reach",
                                laden: "loading",
                              };

                              // Schritt 1: Normalisiere IDs und entferne Duplikate nach normalisierter ID
                              const normalizedMap = new Map<
                                string,
                                (typeof weapon.properties)[0]
                              >();
                              const seenNormalizedIds = new Set<string>();

                              for (const prop of weapon.properties) {
                                // Normalisiere ID (deutsch -> englisch)
                                const normalizedId =
                                  idNormalization[prop.id.toLowerCase()] ||
                                  prop.id.toLowerCase();

                                if (seenNormalizedIds.has(normalizedId)) {
                                  // Duplikat gefunden - wähle die beste Version
                                  const existing =
                                    normalizedMap.get(normalizedId)!;
                                  const existingHasDesc =
                                    existing.description &&
                                    existing.description.trim() &&
                                    existing.description !==
                                      "Keine Beschreibung im PHB.";
                                  const newHasDesc =
                                    prop.description &&
                                    prop.description.trim() &&
                                    prop.description !==
                                      "Keine Beschreibung im PHB.";

                                  // Bevorzuge: 1) Mit Beschreibung, 2) Englische ID, 3) Mit Parameter
                                  const existingIsEnglish =
                                    !idNormalization[existing.id.toLowerCase()];
                                  const newIsEnglish =
                                    !idNormalization[prop.id.toLowerCase()];

                                  let shouldReplace = false;
                                  if (newHasDesc && !existingHasDesc) {
                                    shouldReplace = true;
                                  } else if (newHasDesc && existingHasDesc) {
                                    // Beide haben Beschreibungen - bevorzuge englische ID oder längere Beschreibung
                                    if (newIsEnglish && !existingIsEnglish) {
                                      shouldReplace = true;
                                    } else if (
                                      (prop.description || "").length >
                                      (existing.description || "").length
                                    ) {
                                      shouldReplace = true;
                                    }
                                  } else if (!newHasDesc && !existingHasDesc) {
                                    // Beide ohne Beschreibung - bevorzuge englische ID
                                    if (newIsEnglish && !existingIsEnglish) {
                                      shouldReplace = true;
                                    }
                                  }

                                  if (shouldReplace) {
                                    normalizedMap.set(normalizedId, prop);
                                  }
                                } else {
                                  // Erste Property mit dieser normalisierten ID
                                  normalizedMap.set(normalizedId, prop);
                                  seenNormalizedIds.add(normalizedId);
                                }
                              }

                              // Schritt 2: Finale Liste erstellen und IDs normalisieren
                              let finalProperties = Array.from(
                                normalizedMap.values(),
                              ).map((prop) => {
                                // Setze die ID auf die normalisierte Version
                                const normalizedId =
                                  idNormalization[prop.id.toLowerCase()] ||
                                  prop.id.toLowerCase();
                                return {
                                  ...prop,
                                  id: normalizedId, // Verwende immer die normalisierte (englische) ID
                                };
                              });

                              // Schritt 3: ABSOLUTE Sicherheitsprüfung nach normalisierter ID
                              const finalSeenIds = new Set<string>();
                              finalProperties = finalProperties.filter(
                                (prop) => {
                                  if (finalSeenIds.has(prop.id)) {
                                    console.error(
                                      `[CRITICAL ERROR] Property '${prop.id}' still appears multiple times for ${weapon.name} after all deduplication steps!`,
                                    );
                                    return false;
                                  }
                                  finalSeenIds.add(prop.id);
                                  return true;
                                },
                              );

                              // Prüfe, ob Waffe "ammunition" hat (für range-Filterung)
                              const hasAmmunition = finalProperties.some(
                                (p) => p.id === "ammunition",
                              );

                              // Debug: Log final properties to check for duplicates
                              const duplicateCheck = finalProperties.map(
                                (p) => p.id,
                              );
                              const duplicates = duplicateCheck.filter(
                                (id, index) =>
                                  duplicateCheck.indexOf(id) !== index,
                              );
                              if (duplicates.length > 0) {
                                console.error(
                                  `[ERROR] Duplicate properties still found for ${weapon.name}:`,
                                  duplicates,
                                );
                                console.error(
                                  "All properties:",
                                  finalProperties.map((p) => ({
                                    id: p.id,
                                    name: p.name,
                                    desc: p.description?.substring(0, 50),
                                  })),
                                );
                              }

                              // Debug: Log weapon data to console
                              console.log("Weapon data:", {
                                name: weapon.name,
                                data: weapon.data,
                                dataType: typeof weapon.data,
                                dataRange: (
                                  weapon.data as Record<string, unknown>
                                )?.range,
                                dataAmmunitionType: (
                                  weapon.data as Record<string, unknown>
                                )?.ammunition_type,
                                dataThrownRange: (
                                  weapon.data as Record<string, unknown>
                                )?.thrown_range,
                                properties: weapon.properties.map((p) => ({
                                  id: p.id,
                                  name: p.name,
                                  parameter_value: p.parameter_value,
                                  has_parameter: p.has_parameter,
                                })),
                                hasAmmunitionProperty: weapon.properties.some(
                                  (p) => p.id === "ammunition",
                                ),
                                hasRangeProperty: weapon.properties.some(
                                  (p) => p.id === "range",
                                ),
                              });

                              return (
                                <div className="glass-panel p-6 rounded-[2.5rem] space-y-6 animate-reveal">
                                  <h4 className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                                    <Info size={18} /> Eigenschaften
                                  </h4>
                                  <div className="space-y-8">
                                    {finalProperties
                                      .map((prop) => {
                                        // Formatiere Parameter-Werte lesbar
                                        // Prüfe auch weapon.data für Reichweiten und Geschoss-Typen
                                        const formatParameterValue = (
                                          paramValue: unknown,
                                          propId: string,
                                          weaponData: Record<string, unknown>,
                                        ): string | null => {
                                          // Versuche zuerst parameter_value
                                          interface ParsedParam {
                                            range?: {
                                              normal: number;
                                              max: number;
                                            };
                                            ammunition_type?: string;
                                            damage?: string;
                                            unit?: string;
                                            normal?: number;
                                            max?: number;
                                          }
                                          let parsed:
                                            | ParsedParam
                                            | string
                                            | null = null;

                                          if (paramValue != null) {
                                            try {
                                              parsed =
                                                typeof paramValue === "string"
                                                  ? JSON.parse(paramValue)
                                                  : paramValue;
                                            } catch {
                                              parsed = paramValue as
                                                | ParsedParam
                                                | string;
                                            }
                                          }

                                          // Debug: Log für Entwicklung
                                          if (
                                            process.env.NODE_ENV ===
                                              "development" &&
                                            propId === "ammunition"
                                          ) {
                                            console.log(
                                              "Formatting ammunition:",
                                              {
                                                propId,
                                                paramValue,
                                                parsed,
                                                weaponData: weaponData,
                                                weaponDataRange:
                                                  weaponData?.range,
                                                weaponDataAmmoType:
                                                  weaponData?.ammunition_type,
                                              },
                                            );
                                          }

                                          // Für Wurfwaffen (thrown)
                                          if (propId === "thrown") {
                                            let range = null;
                                            const p = parsed as ParsedParam;
                                            if (p?.range) {
                                              range = p.range;
                                            } else if (
                                              p &&
                                              typeof p === "object" &&
                                              "normal" in p &&
                                              "max" in p
                                            ) {
                                              range = p as {
                                                normal: number;
                                                max: number;
                                              };
                                            } else if (
                                              weaponData?.thrown_range
                                            ) {
                                              range =
                                                weaponData.thrown_range as {
                                                  normal: number;
                                                  max: number;
                                                };
                                            }

                                            if (
                                              range &&
                                              (range.normal || range.max)
                                            ) {
                                              const normal = range.normal || 0;
                                              const max = range.max || 0;
                                              return `${normal}/${max} m`;
                                            }
                                          }

                                          // Für Fernkampfwaffen (range)
                                          if (propId === "range") {
                                            if (hasAmmunition) {
                                              return null;
                                            }

                                            const p = parsed as ParsedParam;
                                            const range =
                                              p?.range ||
                                              (typeof p !== "string"
                                                ? p
                                                : null) ||
                                              weaponData?.range;

                                            if (
                                              range &&
                                              typeof range === "object" &&
                                              ("normal" in range ||
                                                "max" in range)
                                            ) {
                                              const r = range as {
                                                normal?: number;
                                                max?: number;
                                              };
                                              const normal = r.normal || 0;
                                              const max = r.max || 0;
                                              return `${normal}/${max} m`;
                                            }
                                          }

                                          // Für Geschosse (ammunition)
                                          if (propId === "ammunition") {
                                            const parts: string[] = [];
                                            const p = parsed as ParsedParam;

                                            const ammoType =
                                              p?.ammunition_type ||
                                              (weaponData?.ammunition_type as string);
                                            if (ammoType) {
                                              parts.push(ammoType);
                                            }

                                            let range = null;
                                            if (p?.range) {
                                              range = p.range;
                                            } else if (
                                              p &&
                                              typeof p === "object" &&
                                              "normal" in p &&
                                              "max" in p
                                            ) {
                                              range = p;
                                            } else if (weaponData?.range) {
                                              range = weaponData.range;
                                            }

                                            if (
                                              range &&
                                              typeof range === "object" &&
                                              ("normal" in range ||
                                                "max" in range)
                                            ) {
                                              const r = range as {
                                                normal?: number;
                                                max?: number;
                                              };
                                              const normal = r.normal || 0;
                                              const max = r.max || 0;
                                              parts.push(`${normal}/${max} m`);
                                            }

                                            return parts.length > 0
                                              ? parts.join(", ")
                                              : null;
                                          }

                                          // Für versatile
                                          if (propId === "versatile") {
                                            const p = parsed as ParsedParam;
                                            const damage =
                                              p?.damage ||
                                              (weaponData?.versatile_damage as string);
                                            if (damage) {
                                              return damage;
                                            }
                                          }

                                          // Fallback
                                          if (
                                            parsed &&
                                            typeof parsed === "object"
                                          ) {
                                            const entries =
                                              Object.entries(parsed);
                                            if (entries.length > 0) {
                                              return entries
                                                .map(([k, v]) => {
                                                  if (
                                                    k === "normal" ||
                                                    k === "max"
                                                  )
                                                    return `${k}: ${v}`;
                                                  if (k === "unit") return null;
                                                  return `${k}: ${v}`;
                                                })
                                                .filter(Boolean)
                                                .join(", ");
                                            }
                                          }

                                          if (parsed) {
                                            return String(parsed);
                                          }

                                          return null;
                                        };

                                        const weaponProp =
                                          prop as import("../lib/types/weapons").WeaponProperty;
                                        const paramDisplay =
                                          formatParameterValue(
                                            weaponProp.parameter_value,
                                            weaponProp.id,
                                            weapon.data,
                                          );

                                        // Überspringe "range" Property komplett, wenn bereits bei "ammunition" angezeigt
                                        if (
                                          prop.id === "range" &&
                                          hasAmmunition
                                        ) {
                                          return null;
                                        }

                                        return (
                                          <div
                                            key={prop.id}
                                            className="space-y-3 group"
                                          >
                                            <span className="text-base font-black text-primary uppercase tracking-widest block group-hover:translate-x-1 transition-transform">
                                              {prop.name}
                                              {paramDisplay && (
                                                <span className="text-sm text-muted-foreground normal-case ml-2 font-medium">
                                                  ({paramDisplay})
                                                </span>
                                              )}
                                            </span>
                                            <p className="text-sm text-muted-foreground italic leading-relaxed pl-6 border-l-2 border-primary/20 group-hover:border-primary transition-colors">
                                              {prop.description ||
                                                "Keine Beschreibung im PHB."}
                                            </p>
                                          </div>
                                        );
                                      })
                                      .filter(Boolean)}
                                  </div>
                                </div>
                              );
                            })()}

                          {/* Mastery Details for Weapons */}
                          {weapon.mastery && (
                            <div className="glass-panel p-6 rounded-[2.5rem] space-y-6 animate-reveal">
                              <h4 className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                                <Award size={18} /> Meisterschaft
                              </h4>
                              <div className="space-y-3">
                                <span className="text-base font-black text-primary uppercase tracking-widest block">
                                  {weapon.mastery.name}
                                </span>
                                <p className="text-sm text-muted-foreground italic leading-relaxed pl-6 border-l-2 border-primary/20">
                                  {weapon.mastery.description}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                </aside>
              </div>
            </div>
          )}
        </section>
      </main>

      {isEditorOpen && (
        <CompendiumEditor
          type={activeTab}
          initialData={selectedItem}
          onClose={() => setIsEditorOpen(false)}
          onSave={() => {
            setIsEditorOpen(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight = false,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  icon?: IconType;
}) {
  return (
    <div className="flex flex-col gap-4 group">
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            size={16}
            className="text-primary/30 group-hover:text-primary transition-all group-hover:scale-110"
          />
        )}
        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] leading-none">
          {label}
        </span>
      </div>
      <span
        className={cn(
          "text-lg font-bold tracking-tighter transition-all leading-none",
          highlight
            ? "text-primary selection:bg-primary/20"
            : "text-foreground opacity-90",
        )}
      >
        {value || "—"}
      </span>
      <div
        className={cn(
          "h-px w-full bg-gradient-to-r from-border/50 to-transparent",
          highlight && "from-primary/20",
        )}
      />
    </div>
  );
}

function ClickableStatRow({
  label,
  items,
  itemsData,
  onItemClick,
  highlight = false,
  icon: Icon,
}: {
  label: string;
  items: string[];
  itemsData: ClickableItem[];
  onItemClick: (id: string) => void;
  highlight?: boolean;
  icon?: IconType;
}) {
  const findItemId = (itemName: string): string | null => {
    const found = itemsData.find((item) => item.name === itemName);
    return found?.id || null;
  };

  return (
    <div className="flex flex-col gap-4 group">
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            size={16}
            className="text-primary/30 group-hover:text-primary transition-all group-hover:scale-110"
          />
        )}
        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] leading-none">
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((itemName, idx) => {
          const itemId = findItemId(itemName);
          const isClickable = itemId !== null;

          return (
            <span
              key={idx}
              onClick={() => {
                if (isClickable) {
                  onItemClick(itemId);
                }
              }}
              className={cn(
                "text-lg font-bold tracking-tighter transition-all leading-none",
                highlight
                  ? "text-primary selection:bg-primary/20"
                  : "text-foreground opacity-90",
                isClickable &&
                  "cursor-pointer hover:text-primary hover:underline decoration-primary/50 decoration-2 underline-offset-2",
              )}
            >
              {itemName}
              {idx < items.length - 1 && (
                <span className="text-muted-foreground/40 mx-1">,</span>
              )}
            </span>
          );
        })}
      </div>
      <div
        className={cn(
          "h-px w-full bg-gradient-to-r from-border/50 to-transparent",
          highlight && "from-primary/20",
        )}
      />
    </div>
  );
}

// Virtualisierte Liste für bessere Performance bei großen Datensätzen
function VirtualizedList({
  parentRef,
  data,
  selectedId,
  activeTab,
  onSelect,
  renderSourceBadge,
}: {
  parentRef: React.RefObject<HTMLDivElement | null>;
  data: CompendiumEntry[];
  selectedId: string | null;
  activeTab: Tab;
  onSelect: (id: string) => void;
  renderSourceBadge: (source: string) => React.ReactNode;
}) {
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => COMPENDIUM_ROW_ESTIMATED_HEIGHT_PX,
    overscan: COMPENDIUM_OVERSCAN_ROWS,
  });

  const getSecondaryLabel = (item: CompendiumEntry): string => {
    switch (activeTab) {
      case "spells":
        return (item as import("../lib/types").Spell).school || "PHB";
      case "classes": {
        const cls = item as Class;
        return cls.data?.hit_die ? `W${cls.data.hit_die} Hit Die` : "PHB";
      }
      case "weapons":
        return (item as Weapon).damage_dice || "PHB";
      case "armor": {
        const a = item as Armor;
        if (a.ac_formula) return a.ac_formula;
        if (a.base_ac !== null && a.base_ac !== undefined)
          return `RK ${a.base_ac}`;
        return "RK —";
      }
      case "backgrounds": {
        const bg = item as Background;
        const featureName = bg.data?.["feature_name"];
        return typeof featureName === "string" && featureName
          ? featureName
          : "PHB";
      }
      case "items":
        return (item as import("../lib/types").Item).category || "PHB";
      case "equipment": {
        const eq = item as Equipment;
        return eq.total_cost_gp !== undefined
          ? `${eq.total_cost_gp} GM`
          : "PHB";
      }
      case "magic-items": {
        const mi = item as import("../lib/types").MagicItem;
        const rarityMap: Record<string, string> = {
          gewöhnlich: "G",
          ungewöhnlich: "U",
          selten: "S",
          "sehr selten": "SS",
          legendär: "L",
          artefakt: "A",
        };
        return rarityMap[mi.rarity.toLowerCase()] || mi.rarity;
      }
      case "tools":
        return (item as import("../lib/types").Tool).category || "PHB";
      case "feats":
        return (item as import("../lib/types").Feat).category || "PHB";
      default:
        return "PHB";
    }
  };

  return (
    <div
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: "100%",
        position: "relative",
      }}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const item = data[virtualItem.index];
        return (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
            className="px-0 py-2"
          >
            <button
              onClick={() => onSelect(item.id)}
              className={cn(
                "w-full text-left px-5 py-4 rounded-2xl transition-all group relative overflow-hidden",
                selectedId === item.id
                  ? "bg-card border-2 border-primary shadow-xl shadow-primary/5"
                  : "hover:bg-card hover:border-border border-2 border-transparent",
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center overflow-hidden flex-1">
                  <span
                    className={cn(
                      "text-base font-black truncate leading-none",
                      selectedId === item.id
                        ? "text-primary"
                        : "text-foreground group-hover:text-primary transition-colors",
                    )}
                  >
                    {item.name}
                  </span>
                  {renderSourceBadge(item.source)}
                </div>
                {activeTab === "spells" &&
                  "level" in item &&
                  typeof (item as { level?: unknown }).level === "number" && (
                    <span
                      className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-md",
                        selectedId === item.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      G{(item as { level: number }).level}
                    </span>
                  )}
              </div>
              <div className="flex gap-3 items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {getSecondaryLabel(item)}
                </span>
                <div className="flex-1 h-px bg-border/50" />
                <ChevronRight
                  size={14}
                  className={cn(
                    "transition-transform",
                    selectedId === item.id
                      ? "translate-x-1 text-primary"
                      : "text-muted-foreground/30",
                  )}
                />
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
