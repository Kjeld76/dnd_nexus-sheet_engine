import React, { useState, useEffect } from 'react';
import { useCompendiumStore } from '../lib/compendiumStore';
import { Search, Book, Shield, Zap, User, Package } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'spells' | 'items' | 'species' | 'feats' | 'classes';

export function Compendium() {
  const [activeTab, setActiveTab] = useState<Tab>('spells');
  const [search, setSearch] = useState('');
  const { 
    spells, items, species, feats, classes, 
    isLoading, fetchSpells, fetchItems, fetchSpecies, fetchFeats, fetchClasses,
    importPHB 
  } = useCompendiumStore();

  useEffect(() => {
    switch (activeTab) {
      case 'spells': fetchSpells(); break;
      case 'items': fetchItems(); break;
      case 'species': fetchSpecies(); break;
      case 'feats': fetchFeats(); break;
      case 'classes': fetchClasses(); break;
    }
  }, [activeTab]);

  const getFilteredData = () => {
    const s = search.toLowerCase();
    switch (activeTab) {
      case 'spells': return spells.filter(x => x.name.toLowerCase().includes(s));
      case 'items': return items.filter(x => x.name.toLowerCase().includes(s));
      case 'species': return species.filter(x => x.name.toLowerCase().includes(s));
      case 'feats': return feats.filter(x => x.name.toLowerCase().includes(s));
      case 'classes': return classes.filter(x => x.name.toLowerCase().includes(s));
    }
  };

  const data = getFilteredData();

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Book className="w-8 h-8 text-indigo-400" />
          Kompendium
        </h1>
        <button 
          onClick={() => importPHB()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition-colors"
        >
          PHB Daten importieren
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <TabButton active={activeTab === 'spells'} onClick={() => setActiveTab('spells')} icon={<Zap className="w-4 h-4" />} label="Zauber" />
        <TabButton active={activeTab === 'items'} onClick={() => setActiveTab('items')} icon={<Package className="w-4 h-4" />} label="Gegenstände" />
        <TabButton active={activeTab === 'species'} onClick={() => setActiveTab('species')} icon={<User className="w-4 h-4" />} label="Völker" />
        <TabButton active={activeTab === 'feats'} onClick={() => setActiveTab('feats')} icon={<Shield className="w-4 h-4" />} label="Talente" />
        <TabButton active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} icon={<Book className="w-4 h-4" />} label="Klassen" />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text"
          placeholder="Suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Lädt Daten...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Keine Einträge gefunden.</div>
        ) : (
          data.map((item: any) => (
            <div key={item.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:bg-slate-800 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-indigo-300">{item.name}</h3>
                <span className="text-xs px-2 py-1 bg-slate-700 rounded-full text-slate-300 uppercase tracking-wider">
                  {item.source}
                </span>
              </div>
              
              {activeTab === 'spells' && (
                <div className="mt-4 bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 border-b border-slate-700">
                    <div className="p-3 border-r border-slate-700">
                      <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Zeitaufwand</div>
                      <div className="text-sm flex items-center gap-2">
                        {item.data.time}
                        {item.data.ritual && <span className="w-4 h-4 rounded-full border border-indigo-500 flex items-center justify-center text-[10px] text-indigo-400 font-bold" title="Ritual">R</span>}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Reichweite</div>
                      <div className="text-sm">{item.data.range}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 border-b border-slate-700">
                    <div className="p-3 border-r border-slate-700">
                      <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Komponenten</div>
                      <div className="text-sm">{item.data.components || '-'}</div>
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Wirkungsdauer</div>
                      <div className="text-sm flex items-center gap-2">
                        {item.data.duration}
                        {item.data.concentration && <span className="w-4 h-4 rounded-full border border-amber-500 flex items-center justify-center text-[10px] text-amber-400 font-bold" title="Konzentration">C</span>}
                      </div>
                    </div>
                  </div>
                  {item.data.materials && item.data.materials !== "" && (
                    <div className="p-3 bg-slate-900/30 text-[11px] text-slate-500 italic border-b border-slate-700">
                      * ({item.data.materials})
                    </div>
                  )}
                  <div className="p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap border-b border-slate-700 italic">
                    {item.data.description}
                  </div>
                  <div className="p-3 flex justify-between items-center bg-slate-900/80">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{item.school}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {item.level === 0 ? 'Zaubertrick' : `${item.level}. Grad`}
                    </div>
                  </div>
                  <div className="p-2 flex flex-wrap gap-1 bg-indigo-900/10">
                    {item.data.classes?.map((c: string) => (
                      <span key={c} className="text-[9px] uppercase font-bold text-indigo-300/70 px-1.5 py-0.5 border border-indigo-300/20 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div className="text-sm text-slate-400">
                  <div className="flex gap-4">
                    <span>Kategorie: {item.category}</span>
                    <span>Gewicht: {item.data.weight} kg</span>
                  </div>
                  {item.data.damage_dice && <div className="mt-1">Schaden: {item.data.damage_dice} ({item.data.damage_type})</div>}
                </div>
              )}

              {activeTab === 'feats' && (
                <div className="text-sm text-slate-400 italic line-clamp-3">
                  {item.data.description}
                </div>
              )}

              {activeTab === 'species' && (
                <div className="text-sm text-slate-400">
                  <div>Größe: {item.data.size} | Bewegung: {item.data.speed}m</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.data.traits?.map((t: any) => (
                      <span key={t.name} className="bg-slate-700 px-2 py-0.5 rounded text-[10px]">{t.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
        active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

