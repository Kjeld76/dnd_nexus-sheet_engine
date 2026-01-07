import React, { useState, useEffect } from 'react';
import { useCompendiumStore } from '../lib/compendiumStore';
import { compendiumApi, homebrewApi } from '../lib/api';
import { Book, Zap, Users, Shield, Sword, Package, Award, Search, Info, Brain, Plus, Edit2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CompendiumEditor } from './CompendiumEditor';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'spells' | 'species' | 'classes' | 'weapons' | 'armor' | 'tools' | 'gear' | 'feats' | 'skills';

export function Compendium() {
  const [activeTab, setActiveTab] = useState<Tab>('spells');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSubclass, setSelectedSubclass] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const { 
    spells, species, classes, weapons, armor, tools, gear, feats, skills,
    isLoading, fetchSpells, fetchSpecies, fetchClasses, fetchWeapons, fetchArmor, fetchTools, fetchGear, fetchFeats, fetchSkills
  } = useCompendiumStore();

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = () => {
    setSelectedId(null);
    setSelectedSubclass(null);
    switch (activeTab) {
      case 'spells': fetchSpells(); break;
      case 'species': fetchSpecies(); break;
      case 'classes': fetchClasses(); break;
      case 'weapons': fetchWeapons(); break;
      case 'armor': fetchArmor(); break;
      case 'tools': fetchTools(); break;
      case 'gear': fetchGear(); break;
      case 'feats': fetchFeats(); break;
      case 'skills': fetchSkills(); break;
    }
  };

  const getFilteredData = () => {
    const s = searchTerm.toLowerCase();
    let baseData: any[] = [];
    switch (activeTab) {
      case 'spells': baseData = spells; break;
      case 'species': baseData = species; break;
      case 'classes': baseData = classes; break;
      case 'weapons': baseData = weapons; break;
      case 'armor': baseData = armor; break;
      case 'tools': baseData = tools; break;
      case 'gear': baseData = gear; break;
      case 'feats': baseData = feats; break;
      case 'skills': baseData = skills; break;
    }
    return baseData.filter(x => x.name.toLowerCase().includes(s));
  };

  const data = getFilteredData();
  const selectedItem = data.find(x => x.id === selectedId);

  const renderSourceBadge = (source: string) => {
    if (source === 'core' || !source) return null;
    return (
      <span className={cn(
        "text-[8px] px-1 py-0.5 rounded font-black uppercase ml-1.5",
        source === 'homebrew' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
      )}>
        {source === 'homebrew' ? 'Custom' : 'Edit'}
      </span>
    );
  };

  const renderTabButton = (tab: Tab, label: string, Icon: any) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap",
        activeTab === tab 
          ? "bg-indigo-600 text-white shadow-sm" 
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      )}
    >
      <Icon size={16} />
      <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {renderTabButton('spells', 'Zauber', Zap)}
            {renderTabButton('classes', 'Klassen', Shield)}
            {renderTabButton('species', 'Spezies', Users)}
            {renderTabButton('weapons', 'Waffen', Sword)}
            {renderTabButton('armor', 'Rüstungen', Shield)}
            {renderTabButton('tools', 'Werkzeuge', Package)}
            {renderTabButton('gear', 'Ausrüstung', Package)}
            {renderTabButton('feats', 'Talente', Award)}
            {renderTabButton('skills', 'Fertigkeiten', Brain)}
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={() => {
                setSelectedId(null);
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
            >
              <Plus size={16} /> Neu
            </button>

            <button
              onClick={async () => {
                try {
                  await compendiumApi.importPhbData();
                  refreshData();
                  alert('Daten erfolgreich synchronisiert!');
                } catch (err) {
                  alert('Fehler beim Synchronisieren: ' + err);
                }
              }}
              className="px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
            >
              PHB Daten synchronisieren
            </button>

            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Suchen..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left: Master List */}
        <div className="w-96 border-r border-slate-800 flex flex-col bg-slate-900/20 overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
            ) : data.length === 0 ? (
              <div className="p-10 text-center text-slate-600 text-sm italic">Nichts gefunden</div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {data.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setSelectedSubclass(null);
                    }}
                    className={cn(
                      "w-full text-left px-6 py-4 transition-all hover:bg-indigo-600/5 group",
                      selectedId === item.id ? "bg-indigo-600/10 border-r-2 border-indigo-500" : ""
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center overflow-hidden">
                        <span className={cn(
                          "text-sm font-black uppercase tracking-wide truncate transition-colors",
                          selectedId === item.id ? "text-indigo-400" : "text-slate-300 group-hover:text-slate-100"
                        )}>
                          {item.name}
                        </span>
                        {renderSourceBadge(item.source)}
                      </div>
                      {activeTab === 'spells' && (
                        <span className="text-xs font-bold text-slate-600 ml-2">G{item.level}</span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        {activeTab === 'spells' ? item.school : 
                         activeTab === 'classes' ? `W${item.data.hit_die}` :
                         activeTab === 'weapons' ? item.damage_dice :
                         activeTab === 'armor' ? `RK ${item.base_ac}` :
                         item.category || ''}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950/50 relative custom-scrollbar">
          {!selectedItem ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 space-y-4">
              <Book size={64} strokeWidth={1} />
              <p className="text-lg font-medium tracking-widest uppercase">Wähle einen Eintrag aus</p>
            </div>
          ) : (
            <div className="w-full p-12 max-w-6xl mx-auto">
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col lg:flex-row gap-8 items-start mb-12 pb-10 border-b border-slate-800/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-5 mb-5">
                      <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-sm">
                        {selectedSubclass ? selectedSubclass.name : selectedItem.name}
                      </h1>
                      <button 
                        onClick={() => setIsEditorOpen(true)}
                        className="p-3 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-all border border-transparent hover:border-indigo-500/20"
                        title="Eintrag bearbeiten"
                      >
                        <Edit2 size={24} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-black uppercase rounded-lg tracking-widest shadow-lg shadow-indigo-900/20">
                        {activeTab.slice(0, -1)}
                      </span>
                      {selectedItem.source === 'core' ? (
                        <span className="px-4 py-1.5 bg-slate-800/50 text-slate-500 border border-slate-700/50 text-[10px] font-black uppercase rounded-lg tracking-widest">
                          PHB 2024
                        </span>
                      ) : (
                        renderSourceBadge(selectedItem.source)
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
                  {/* Left: Main Content */}
                  <div className="xl:col-span-8 space-y-12">
                    {activeTab === 'spells' && (
                      <div className="space-y-10">
                        <div className="bg-slate-900/30 p-10 rounded-[2rem] border border-slate-800/50 relative overflow-hidden group shadow-inner">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-600 to-transparent opacity-50" />
                          <p className="text-slate-200 leading-relaxed text-xl whitespace-pre-wrap font-medium italic opacity-90">
                            {selectedItem.description}
                          </p>
                        </div>
                        {selectedItem.higher_levels && (
                          <div className="p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 shadow-sm">
                            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-4">Auf höheren Stufen</h4>
                            <p className="text-base text-slate-400 leading-relaxed italic border-l-2 border-indigo-500/20 pl-6">
                              {selectedItem.higher_levels}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {/* ... Rest of the tab content ... */}

                    {activeTab === 'species' && (
                      <div className="space-y-10">
                        <div className="grid grid-cols-1 gap-8">
                          {selectedItem.data.traits?.map((trait: any) => (
                            <div key={trait.name} className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800/50 shadow-sm hover:border-indigo-500/30 transition-colors">
                              <h4 className="text-base font-black text-white uppercase tracking-widest mb-4 flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                  <Zap size={18} className="text-amber-500" />
                                </div>
                                {trait.name}
                              </h4>
                              <p className="text-base text-slate-400 leading-relaxed italic border-l-2 border-slate-800 pl-6">{trait.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'skills' && (
                      <div className="space-y-10">
                        <div className="bg-slate-900/30 p-10 rounded-[2rem] border border-slate-800/50 shadow-inner">
                          <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-6">Anwendung</h4>
                          <p className="text-slate-200 leading-relaxed text-xl whitespace-pre-wrap font-medium italic opacity-90 border-l-4 border-indigo-500/20 pl-8">
                            {selectedItem.description}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'classes' && (
                      <div className="space-y-12">
                        <div className="flex flex-wrap gap-3 p-2 bg-slate-900/50 rounded-2xl border border-slate-800/50 w-fit">
                          {selectedItem.data.subclasses?.map((sc: any) => (
                            <button
                              key={sc.name}
                              onClick={() => setSelectedSubclass(selectedSubclass?.name === sc.name ? null : sc)}
                              className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                                selectedSubclass?.name === sc.name
                                  ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                                  : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-indigo-300"
                              )}
                            >
                              {sc.name}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-10">
                          <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                              <Award size={22} className="text-indigo-500" />
                            </div>
                            {selectedSubclass ? 'Unterklassenmerkmale' : 'Klassenmerkmale'}
                          </h3>
                          
                          <div className="space-y-10 relative pl-4">
                            <div className="absolute left-0 top-0 w-1 h-full bg-slate-800/50 rounded-full" />
                            {Object.entries((selectedSubclass ? selectedSubclass.features : selectedItem.data.features_by_level) || {}).map(([level, features]: [string, any]) => (
                              features.length > 0 && (
                                <div key={level} className="relative pl-10">
                                  <div className="absolute left-[-22px] top-1.5 w-5 h-5 rounded-full bg-indigo-500 border-4 border-slate-950 shadow-sm" />
                                  <span className="text-xs font-black text-indigo-400/60 uppercase tracking-widest mb-6 block">Stufe {level}</span>
                                  <div className="grid gap-6">
                                    {features.map((f: any) => (
                                      <div key={f.name} className="bg-slate-900/30 p-8 rounded-[2rem] border border-slate-800/50 shadow-sm hover:border-indigo-500/20 transition-all">
                                        <h5 className="text-base font-black text-white uppercase tracking-wide mb-4">{f.name}</h5>
                                        <p className="text-base text-slate-400 italic leading-relaxed border-l-2 border-slate-800 pl-6">{f.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'feats' && (
                      <div className="space-y-10">
                        <div className="bg-slate-900/30 p-10 rounded-[2rem] border border-slate-800/50 shadow-inner">
                          {selectedItem.data.prerequisite && (
                            <div className="mb-8 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 inline-block">
                              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Voraussetzung</h4>
                              <p className="text-lg font-bold text-white italic">{selectedItem.data.prerequisite}</p>
                            </div>
                          )}
                          <p className="text-slate-200 leading-relaxed text-xl whitespace-pre-wrap font-medium italic opacity-90 border-l-4 border-indigo-500/20 pl-8">
                            {selectedItem.data.description}
                          </p>
                        </div>
                      </div>
                    )}

                    {['gear', 'tools', 'weapons', 'armor'].includes(activeTab) && (
                      <div className="space-y-10">
                        <div className="bg-slate-900/30 p-10 rounded-[2rem] border border-slate-800/50 shadow-inner">
                          <p className="text-slate-200 leading-relaxed text-xl whitespace-pre-wrap font-medium italic opacity-90 border-l-4 border-indigo-500/20 pl-8">
                            {selectedItem.description || selectedItem.data?.description || 'Keine Beschreibung verfügbar.'}
                          </p>
                        </div>
                        
                        {activeTab === 'tools' && selectedItem.data.use_actions?.length > 0 && (
                          <div className="space-y-6">
                            <h4 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                <Zap size={20} className="text-indigo-500" />
                              </div>
                              Verwendung
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {selectedItem.data.use_actions.map((ua: any, idx: number) => (
                                <div key={idx} className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/50 flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                                  <span className="text-slate-300 text-base italic">{ua.action}</span>
                                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-4 py-2 rounded-lg font-black border border-emerald-500/20 shadow-sm">SG {ua.dc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'skills' && (
                      <div className="space-y-10">
                        <div className="bg-slate-900/30 p-10 rounded-[2rem] border border-slate-800/50 shadow-inner">
                          <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-6">Anwendung</h4>
                          <p className="text-slate-200 leading-relaxed text-xl whitespace-pre-wrap font-medium italic opacity-90 border-l-4 border-indigo-500/20 pl-8">
                            {selectedItem.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Stats/Meta */}
                  <div className="xl:col-span-4 space-y-8">
                    <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl backdrop-blur-md">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10 border-b border-slate-800/50 pb-5 text-center">Eigenschaften</h4>
                      
                      <div className="space-y-8">
                        {activeTab === 'spells' && (
                          <>
                            <StatRow label="Zaubergrad" value={`Stufe ${selectedItem.level}`} highlight />
                            <StatRow label="Zauberschule" value={selectedItem.school} />
                            <StatRow label="Zeitaufwand" value={selectedItem.casting_time} />
                            <StatRow label="Reichweite" value={selectedItem.range} />
                            <StatRow label="Wirkungsdauer" value={selectedItem.duration} />
                            <StatRow label="Komponenten" value={selectedItem.components} />
                            {selectedItem.material_components && (
                              <div className="bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/10 mt-4">
                                <span className="text-[9px] font-black text-indigo-400/60 uppercase tracking-[0.25em] block mb-2">Materialien</span>
                                <p className="text-xs text-slate-400 italic leading-relaxed">{selectedItem.material_components}</p>
                              </div>
                            )}
                            <StatRow label="Verfügbare Klassen" value={selectedItem.classes} highlight />
                          </>
                        )}
                        {/* ... Rest of Stats logic remains similar but with new StatRow ... */}
                        {activeTab === 'weapons' && (
                          <>
                            <StatRow label="Schaden" value={selectedItem.damage_dice} highlight />
                            <StatRow label="Typ" value={selectedItem.damage_type} />
                            <StatRow label="Eigenschaft" value={selectedItem.weapon_type} />
                            <StatRow label="Kategorie" value={selectedItem.category} />
                            <StatRow label="Meisterung" value={selectedItem.data.mastery_details?.name || selectedItem.data.mastery} highlight />
                            <StatRow label="Gewicht" value={`${selectedItem.weight_kg} kg`} />
                            <StatRow label="Preis" value={`${selectedItem.cost_gp} GM`} />
                          </>
                        )}
                        {activeTab === 'armor' && (
                          <>
                            <StatRow label="Rüstungsklasse" value={selectedItem.base_ac} highlight />
                            <StatRow label="AC-Formel" value={selectedItem.data.ac_formula} />
                            <StatRow label="Kategorie" value={selectedItem.category} />
                            <StatRow label="Max. GES-Bonus" value={selectedItem.data.dex_bonus?.max === null ? 'Unbegrenzt' : selectedItem.data.dex_bonus?.max || 'Keiner'} />
                            <StatRow label="Stärke" value={selectedItem.strength_requirement || '-'} />
                            <StatRow label="Schleichen" value={selectedItem.stealth_disadvantage ? 'Nachteil' : 'Normal'} />
                            <StatRow label="Gewicht" value={`${selectedItem.weight_kg} kg`} />
                            <StatRow label="Preis" value={`${selectedItem.cost_gp} GM`} />
                          </>
                        )}
                        {activeTab === 'classes' && (
                          <>
                            <StatRow label="Trefferwürfel" value={`W${selectedItem.data.hit_die}`} />
                            <StatRow label="Rettungswürfe" value={selectedItem.data.saving_throws?.join(', ')} />
                          </>
                        )}
                        {activeTab === 'species' && (
                          <>
                            <StatRow label="Größe" value={selectedItem.data.size === 'Medium' ? 'Mittelgroß' : selectedItem.data.size === 'Small' ? 'Klein' : selectedItem.data.size} />
                            <StatRow label="Bewegung" value={`${selectedItem.data.speed} m`} highlight />
                            <StatRow label="Sprachen" value={selectedItem.data.languages?.known?.join(', ')} />
                          </>
                        )}
                        {activeTab === 'feats' && (
                          <>
                            <StatRow label="Kategorie" value={selectedItem.category} highlight />
                          </>
                        )}
                        {activeTab === 'skills' && (
                          <>
                            <StatRow label="Attribut" value={selectedItem.ability} highlight />
                          </>
                        )}
                        {(activeTab === 'gear' || activeTab === 'tools') && (
                          <>
                            <StatRow label="Preis" value={`${selectedItem.cost_gp} GM`} />
                            <StatRow label="Gewicht" value={`${selectedItem.weight_kg} kg`} />
                            {activeTab === 'tools' && (
                              <StatRow label="Attribut" value={selectedItem.data.abilities?.join(', ')} highlight />
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {activeTab === 'weapons' && selectedItem.data.properties?.length > 0 && (
                      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Eigenschaften</h4>
                        <div className="flex flex-wrap gap-3">
                          {selectedItem.data.properties.map((p: string) => {
                            const detail = selectedItem.data.property_details?.[p.toLowerCase()];
                            return (
                              <div key={p} className="w-full space-y-2 mb-3 last:mb-0">
                                <span className="px-3 py-1 bg-slate-800 text-indigo-300 text-[10px] font-black uppercase rounded border border-slate-700 inline-block">
                                  {detail?.name || p}
                                </span>
                                <p className="text-xs text-slate-500 italic leading-snug pl-1">{detail?.description}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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

function StatRow({ label, value, highlight = false }: { label: string, value: any, highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] leading-none">{label}</span>
      <span className={cn(
        "text-base font-bold tracking-tight transition-all leading-snug",
        highlight ? "text-indigo-400" : "text-slate-200"
      )}>
        {value || '—'}
      </span>
    </div>
  );
}
