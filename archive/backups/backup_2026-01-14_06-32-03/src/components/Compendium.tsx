import { useState, useEffect } from "react";
import { useCompendiumStore } from "../lib/compendiumStore";
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
} from "lucide-react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CompendiumEditor } from "./CompendiumEditor";
import { Button } from "./ui/Button";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab =
  | "spells"
  | "species"
  | "classes"
  | "weapons"
  | "armor"
  | "tools"
  | "gear"
  | "feats"
  | "skills"
  | "backgrounds"
  | "items"
  | "equipment";

export function Compendium() {
  const [activeTab, setActiveTab] = useState<Tab>("spells");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSubclass, setSelectedSubclass] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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
    isLoading,
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
  } = useCompendiumStore();

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
    }
  };

  const getFilteredData = () => {
    const s = searchTerm.toLowerCase();
    let baseData: any[] = [];
    switch (activeTab) {
      case "spells":
        baseData = spells;
        break;
      case "species":
        baseData = species;
        break;
      case "classes":
        baseData = classes;
        break;
      case "weapons":
        baseData = weapons;
        break;
      case "armor":
        baseData = armor;
        break;
      case "tools":
        baseData = tools;
        break;
      case "feats":
        baseData = feats;
        break;
      case "skills":
        baseData = skills;
        break;
      case "backgrounds":
        baseData = backgrounds;
        break;
      case "items":
        baseData = items;
        break;
      case "equipment":
        baseData = equipment;
        break;
    }
    return baseData.filter((x) => x.name.toLowerCase().includes(s));
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

  const renderTabButton = (tab: Tab, label: string, Icon: any) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all relative overflow-hidden group",
        activeTab === tab
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon
        size={18}
        className={cn(
          "transition-transform group-hover:scale-110",
          activeTab === tab
            ? "text-primary-foreground"
            : "text-muted-foreground",
        )}
      />
      <span className="text-xs font-black uppercase tracking-wider">
        {label}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <header className="px-8 py-6 border-b border-border bg-card/80 backdrop-blur-xl shrink-0 z-20 sticky top-0 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 max-w-full">
            {renderTabButton("spells", "Zauber", Zap)}
            {renderTabButton("classes", "Klassen", Shield)}
            {renderTabButton("species", "Spezies", Users)}
            {renderTabButton("weapons", "Waffen", Sword)}
            {renderTabButton("armor", "Rüstungen", Shield)}
            {renderTabButton("tools", "Werkzeuge", Package)}
            {renderTabButton("items", "Gegenstände", Book)}
            {renderTabButton("equipment", "Ausrüstungspakete", Package)}
            {renderTabButton("feats", "Talente", Award)}
            {renderTabButton("skills", "Fertigkeiten", Brain)}
            {renderTabButton("backgrounds", "Hintergründe", ScrollText)}
          </div>

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
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left: Sidebar List */}
        <aside className="w-96 border-r border-border flex flex-col bg-muted/10 overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-xl shadow-primary/20"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">
                  Rufe alte Schriften auf...
                </p>
              </div>
            ) : data.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground/40 text-sm italic border-2 border-dashed border-border rounded-[2rem]">
                Keine Einträge gefunden
              </div>
            ) : (
              data.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setSelectedSubclass(null);
                  }}
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
                    {activeTab === "spells" && (
                      <span
                        className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-md",
                          selectedId === item.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        G{item.level}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {activeTab === "spells"
                        ? item.school
                        : activeTab === "classes"
                          ? `W${item.data.hit_die} Hit Die`
                          : activeTab === "weapons"
                            ? item.damage_dice
                            : activeTab === "armor"
                              ? item.ac_formula ||
                                (item.base_ac !== null
                                  ? `RK ${item.base_ac}`
                                  : "RK —")
                              : activeTab === "backgrounds"
                                ? item.data?.feature_name || "PHB"
                                : activeTab === "items"
                                  ? item.category || "PHB"
                                  : activeTab === "equipment"
                                    ? item.total_cost_gp !== undefined
                                      ? `${item.total_cost_gp} GM`
                                      : "PHB"
                                    : item.category || "PHB"}
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
              ))
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
                        {selectedItem.description ||
                          selectedItem.data?.description ||
                          "Keine Beschreibung im Archiv gefunden."}
                      </p>
                    </div>

                    {activeTab === "spells" && selectedItem.higher_levels && (
                      <div className="p-6 bg-primary/[0.02] rounded-2xl border-2 border-dashed border-primary/10 relative group">
                        <Sparkles className="absolute top-4 right-4 text-primary/20 group-hover:rotate-12 group-hover:scale-125 transition-all duration-500" />
                        <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-4 flex items-center gap-4">
                          <Zap size={18} /> Verstärkung
                        </h4>
                        <p className="text-base text-muted-foreground/80 leading-relaxed italic border-l-4 border-primary/20 pl-6">
                          {selectedItem.higher_levels}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Species Specifics */}
                  {activeTab === "species" && (
                    <div className="grid grid-cols-1 gap-6">
                      {selectedItem.data.traits?.map((trait: any) => (
                        <div
                          key={trait.name}
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
                  )}

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
                        {selectedItem.data.subclasses?.map((sc: any) => (
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
                            (selectedSubclass
                              ? selectedSubclass.features
                              : selectedItem.data.features_by_level) || {},
                          ).map(
                            ([level, features]: [string, any]) =>
                              features.length > 0 && (
                                <div
                                  key={level}
                                  className="relative pl-16 group"
                                >
                                  <div className="absolute left-[-40px] lg:left-[-56px] top-4 w-8 h-8 rounded-full bg-background border-4 border-primary shadow-2xl group-hover:scale-125 transition-transform z-10" />
                                  <span className="text-base font-black text-primary/30 uppercase tracking-[0.5em] mb-6 block">
                                    Grad {level}
                                  </span>
                                  <div className="grid gap-10">
                                    {features.map((f: any) => (
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
                              ),
                          )}
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
                      {activeTab === "spells" && (
                        <>
                          <StatRow
                            label="Zaubergrad"
                            value={`Stufe ${selectedItem.level}`}
                            highlight
                            icon={Sparkles}
                          />
                          <StatRow
                            label="Schule"
                            value={selectedItem.school}
                            icon={Brain}
                          />
                          <StatRow
                            label="Zeitaufwand"
                            value={selectedItem.casting_time}
                            icon={Clock}
                          />
                          <StatRow
                            label="Reichweite"
                            value={selectedItem.range}
                            icon={Target}
                          />
                          <StatRow
                            label="Dauer"
                            value={selectedItem.duration}
                            icon={Clock}
                          />
                          <StatRow
                            label="Komponenten"
                            value={selectedItem.components}
                            icon={ScrollText}
                          />
                          {selectedItem.material_components && (
                            <div className="bg-muted/30 p-10 rounded-[3rem] border border-border mt-10 relative group">
                              <Info
                                className="absolute top-6 right-6 text-primary/30 group-hover:text-primary transition-colors"
                                size={20}
                              />
                              <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.4em] block mb-4">
                                Materialien
                              </span>
                              <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                                {selectedItem.material_components}
                              </p>
                            </div>
                          )}
                          <StatRow
                            label="Klassen"
                            value={selectedItem.classes}
                            highlight
                            icon={Users}
                          />
                        </>
                      )}

                      {activeTab === "weapons" && (
                        <>
                          <StatRow
                            label="Schaden"
                            value={selectedItem.damage_dice}
                            highlight
                            icon={Zap}
                          />
                          <StatRow
                            label="Typ"
                            value={selectedItem.damage_type}
                          />
                          <StatRow
                            label="Eigenschaft"
                            value={
                              selectedItem.properties &&
                              selectedItem.properties.length > 0
                                ? selectedItem.properties
                                    .map((p: any) => p.name)
                                    .join(", ")
                                : selectedItem.weapon_type || "—"
                            }
                            icon={Sword}
                          />
                          <StatRow
                            label="Meisterung"
                            value={
                              selectedItem.mastery?.name ||
                              selectedItem.data.mastery_details?.name ||
                              selectedItem.data.mastery ||
                              "—"
                            }
                            highlight
                            icon={Award}
                          />
                          <div className="grid grid-cols-2 gap-8 border-t border-border pt-8 mt-8">
                            <StatRow
                              label="Gewicht"
                              value={`${selectedItem.weight_kg} kg`}
                            />
                            <StatRow
                              label="Preis"
                              value={`${selectedItem.cost_gp} GM`}
                            />
                          </div>
                        </>
                      )}

                      {activeTab === "armor" && (
                        <>
                          <StatRow
                            label="Rüstungsklasse"
                            value={
                              selectedItem.category === "schild"
                                ? `+${selectedItem.ac_bonus}`
                                : selectedItem.ac_formula ||
                                  (selectedItem.base_ac !== null
                                    ? selectedItem.base_ac.toString()
                                    : "—")
                            }
                            highlight
                            icon={Shield}
                          />
                          {selectedItem.ac_bonus > 0 &&
                            selectedItem.category !== "schild" && (
                              <StatRow
                                label="AC-Bonus"
                                value={`+${selectedItem.ac_bonus}`}
                                highlight
                              />
                            )}
                          <StatRow label="Typ" value={selectedItem.category} />
                          <StatRow
                            label="Stärke"
                            value={selectedItem.strength_requirement || "—"}
                          />
                          <StatRow
                            label="Schleichen"
                            value={
                              selectedItem.stealth_disadvantage
                                ? "Nachteil"
                                : "Normal"
                            }
                          />
                          {(selectedItem.don_time_minutes !== null ||
                            selectedItem.doff_time_minutes !== null) && (
                            <div className="grid grid-cols-2 gap-8 border-t border-border pt-8 mt-8">
                              <StatRow
                                label="Anlegezeit"
                                value={
                                  selectedItem.don_time_minutes === 0
                                    ? "1 Aktion"
                                    : selectedItem.don_time_minutes !== null
                                      ? `${selectedItem.don_time_minutes} Min.`
                                      : "—"
                                }
                              />
                              <StatRow
                                label="Ablegezeit"
                                value={
                                  selectedItem.doff_time_minutes === 0
                                    ? "1 Aktion"
                                    : selectedItem.doff_time_minutes !== null
                                      ? `${selectedItem.doff_time_minutes} Min.`
                                      : "—"
                                }
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-8 border-t border-border pt-8 mt-8">
                            <StatRow
                              label="Gewicht"
                              value={`${selectedItem.weight_kg} kg`}
                            />
                            <StatRow
                              label="Preis"
                              value={`${selectedItem.cost_gp} GM`}
                            />
                          </div>

                          {/* Properties Details für Rüstungen */}
                          {selectedItem.properties &&
                            selectedItem.properties.length > 0 && (
                              <div className="glass-panel p-6 rounded-[2.5rem] space-y-6 animate-reveal mt-8">
                                <h4 className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                                  <Info size={18} /> Eigenschaften Details
                                </h4>
                                <div className="space-y-8">
                                  {selectedItem.properties.map((prop: any) => (
                                    <div
                                      key={prop.id}
                                      className="space-y-3 group"
                                    >
                                      <span className="text-base font-black text-primary uppercase tracking-widest block group-hover:translate-x-1 transition-transform">
                                        {prop.name}
                                        {prop.parameter_value && (
                                          <span className="text-sm text-muted-foreground normal-case ml-2">
                                            {(() => {
                                              const param =
                                                prop.parameter_value;
                                              if (param.strength_requirement) {
                                                return `(STÄ ${param.strength_requirement})`;
                                              }
                                              if (param.ac_bonus) {
                                                return `(+${param.ac_bonus} RK)`;
                                              }
                                              if (param.damage_type) {
                                                return `(${param.damage_type})`;
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
                      )}

                      {activeTab === "classes" && (
                        <>
                          <StatRow
                            label="Trefferwürfel"
                            value={`W${selectedItem.data.hit_die}`}
                            highlight
                            icon={Zap}
                          />
                          <StatRow
                            label="Rettungswürfe"
                            value={selectedItem.data.saving_throws?.join(", ")}
                            icon={Shield}
                          />
                        </>
                      )}

                      {activeTab === "species" && (
                        <>
                          <StatRow
                            label="Größe"
                            value={(() => {
                              const size = selectedItem.data.size;
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
                            value={`${selectedItem.data.speed} m`}
                            highlight
                            icon={Compass}
                          />
                          <StatRow
                            label="Sprachen"
                            value={selectedItem.data.languages?.known?.join(
                              ", ",
                            )}
                          />
                        </>
                      )}

                      {(activeTab === "tools" || activeTab === "items") && (
                        <>
                          <StatRow
                            label="Preis"
                            value={`${selectedItem.cost_gp} GM`}
                          />
                          <StatRow
                            label="Gewicht"
                            value={`${selectedItem.weight_kg} kg`}
                          />
                          {activeTab === "tools" && (
                            <StatRow
                              label="Attribute"
                              value={selectedItem.data.abilities?.join(", ")}
                              highlight
                              icon={Brain}
                            />
                          )}
                          {activeTab === "items" && selectedItem.category && (
                            <StatRow
                              label="Kategorie"
                              value={selectedItem.category}
                            />
                          )}
                        </>
                      )}

                      {activeTab === "equipment" && (
                        <>
                          {selectedItem.total_cost_gp !== undefined && (
                            <StatRow
                              label="Gesamtkosten"
                              value={`${selectedItem.total_cost_gp} GM`}
                              highlight
                            />
                          )}
                          {selectedItem.total_weight_kg !== undefined && (
                            <StatRow
                              label="Gesamtgewicht"
                              value={`${selectedItem.total_weight_kg} kg`}
                            />
                          )}
                          {Array.isArray(selectedItem.items) &&
                            selectedItem.items.length > 0 && (
                              <ClickableStatRow
                                label="Enthält Gegenstände"
                                items={selectedItem.items.map((i: any) => {
                                  const item = items.find(
                                    (item: any) => item.id === i.item_id,
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
                          {Array.isArray(selectedItem.tools) &&
                            selectedItem.tools.length > 0 && (
                              <ClickableStatRow
                                label="Enthält Werkzeuge"
                                items={selectedItem.tools.map((t: any) => {
                                  const tool = tools.find(
                                    (tool: any) => tool.id === t.tool_id,
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
                      )}

                      {activeTab === "backgrounds" && (
                        <>
                          {selectedItem.data?.skills?.length > 0 && (
                            <ClickableStatRow
                              label="Fertigkeiten"
                              items={selectedItem.data.skills}
                              itemsData={skills}
                              onItemClick={(id) => {
                                setActiveTab("skills");
                                setSelectedId(id);
                              }}
                              highlight
                              icon={Brain}
                            />
                          )}
                          {selectedItem.data?.tool && (
                            <ClickableStatRow
                              label="Werkzeug"
                              items={[
                                typeof selectedItem.data.tool === "object" &&
                                selectedItem.data.tool.type === "choice"
                                  ? selectedItem.data.tool.description ||
                                    `Wähle eine Art von ${selectedItem.data.tool.category}`
                                  : typeof selectedItem.data.tool === "object"
                                    ? selectedItem.data.tool.name || ""
                                    : selectedItem.data.tool,
                              ]}
                              itemsData={tools}
                              onItemClick={(id: string) => {
                                setActiveTab("tools");
                                setSelectedId(id);
                              }}
                              icon={Package}
                            />
                          )}
                          {selectedItem.data?.feat && (
                            <ClickableStatRow
                              label="Herkunftstalent"
                              items={[selectedItem.data.feat]}
                              itemsData={feats}
                              onItemClick={(id: string) => {
                                setActiveTab("feats");
                                setSelectedId(id);
                              }}
                              highlight
                              icon={Award}
                            />
                          )}
                          {selectedItem.data?.ability_scores?.length > 0 && (
                            <StatRow
                              label="Attributs-Boni"
                              value={selectedItem.data.ability_scores.join(
                                ", ",
                              )}
                              icon={Zap}
                            />
                          )}
                          {selectedItem.data?.equipment_id && (
                            <ClickableStatRow
                              label="Ausrüstung"
                              items={[
                                equipment.find(
                                  (eq: any) =>
                                    eq.id === selectedItem.data.equipment_id,
                                )?.name || selectedItem.data.equipment_id,
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
                          {selectedItem.data?.gold && (
                            <StatRow
                              label="Startgold"
                              value={`${selectedItem.data.gold} GM`}
                              highlight
                              icon={Package}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Property Details for Weapons */}
                  {activeTab === "weapons" &&
                    selectedItem.properties &&
                    selectedItem.properties.length > 0 && (
                      <div className="glass-panel p-6 rounded-[2.5rem] space-y-6 animate-reveal">
                        <h4 className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                          <Info size={18} /> Eigenschaften
                        </h4>
                        <div className="space-y-8">
                          {selectedItem.properties.map((prop: any) => {
                            return (
                              <div key={prop.id} className="space-y-3 group">
                                <span className="text-base font-black text-primary uppercase tracking-widest block group-hover:translate-x-1 transition-transform">
                                  {prop.name}
                                  {prop.parameter_value && (
                                    <span className="text-sm text-muted-foreground normal-case ml-2">
                                      ({JSON.stringify(prop.parameter_value)})
                                    </span>
                                  )}
                                </span>
                                <p className="text-sm text-muted-foreground italic leading-relaxed pl-6 border-l-2 border-primary/20 group-hover:border-primary transition-colors">
                                  {prop.description ||
                                    "Keine Beschreibung im PHB."}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  {/* Mastery Details for Weapons */}
                  {activeTab === "weapons" && selectedItem.mastery && (
                    <div className="glass-panel p-6 rounded-[2.5rem] space-y-6 animate-reveal">
                      <h4 className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                        <Award size={18} /> Meisterschaft
                      </h4>
                      <div className="space-y-3">
                        <span className="text-base font-black text-primary uppercase tracking-widest block">
                          {selectedItem.mastery.name}
                        </span>
                        <p className="text-sm text-muted-foreground italic leading-relaxed pl-6 border-l-2 border-primary/20">
                          {selectedItem.mastery.description}
                        </p>
                      </div>
                    </div>
                  )}
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
  value: any;
  highlight?: boolean;
  icon?: any;
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
  itemsData: any[];
  onItemClick: (id: string) => void;
  highlight?: boolean;
  icon?: any;
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
