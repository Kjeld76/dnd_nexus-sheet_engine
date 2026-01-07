import React, { useState, useEffect } from 'react';
import { compendiumApi, homebrewApi } from '../lib/api';
import { Spell, Species, Class, Gear, Tool, Feat, Weapon, Armor } from '../lib/types';
import { Book, Zap, Users, Shield, Sword, Package, Award, Search, Info, Plus, Edit2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CompendiumEditor } from '../components/CompendiumEditor';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'spells' | 'species' | 'classes' | 'weapons' | 'armor' | 'gear' | 'feats';

export function Compendium() {
  const [activeTab, setActiveTab] = useState<Tab>('spells');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  
  const [spells, setSpells] = useState<Spell[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [armor, setArmor] = useState<Armor[]>([]);
  const [gear, setGear] = useState<Gear[]>([]);
  const [feats, setFeats] = useState<Feat[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'spells': setSpells(await compendiumApi.getSpells()); break;
        case 'species': setSpecies(await compendiumApi.getSpecies()); break;
        case 'classes': setClasses(await compendiumApi.getClasses()); break;
        case 'weapons': setWeapons(await compendiumApi.getWeapons()); break;
        case 'armor': setArmor(await compendiumApi.getArmor()); break;
        case 'gear': setGear(await compendiumApi.getGear()); break;
        case 'feats': setFeats(await compendiumApi.getFeats()); break;
      }
    } catch (error) {
      console.error('Failed to load compendium data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (entry: any = null) => {
    setSelectedEntry(entry);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setSelectedEntry(null);
  };

  const handleSave = () => {
    closeEditor();
    loadData();
  };

  const renderSourceBadge = (source: string) => {
    if (source === 'core') return null;
    return (
      <span className={cn(
        "text-[9px] px-1.5 py-0.5 rounded font-black uppercase ml-2",
        source === 'homebrew' ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
      )}>
        {source === 'homebrew' ? 'Custom' : 'Edit'}
      </span>
    );
  };

  const renderEditButton = (entry: any) => (
    <button 
      onClick={(e) => { e.stopPropagation(); openEditor(entry); }}
      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
    >
      <Edit2 size={14} />
    </button>
  );

  const renderTabButton = (tab: Tab, label: string, Icon: any) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
        activeTab === tab 
          ? "bg-indigo-600 text-white shadow-md" 
          : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
      )}
    >
      <Icon size={18} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-200 p-6">
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-indigo-600">
              <Book size={32} strokeWidth={2.5} />
              <h1 className="text-2xl font-bold text-slate-900">Kompendium</h1>
            </div>
            
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={`${activeTab === 'spells' ? 'Zauber' : 'Einträge'} suchen...`}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            <Plus size={18} /> Neu hinzufügen
          </button>
        </div>

        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 max-w-7xl mx-auto w-full">
          {renderTabButton('spells', 'Zauber', Zap)}
          {renderTabButton('species', 'Spezies', Users)}
          {renderTabButton('classes', 'Klassen', Shield)}
          {renderTabButton('weapons', 'Waffen', Sword)}
          {renderTabButton('armor', 'Rüstungen', Shield)}
          {renderTabButton('gear', 'Ausrüstung', Package)}
          {renderTabButton('feats', 'Talente', Award)}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTab === 'spells' && spells.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(spell => (
                <div key={spell.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wide">{spell.name}</h3>
                      {renderSourceBadge(spell.source)}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderEditButton(spell)}
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-1 rounded font-bold">
                        G{spell.level}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-[10px] italic mb-2">{spell.school}</p>
                  <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">{spell.description}</p>
                </div>
              ))}

              {activeTab === 'species' && species.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wide">{s.name}</h3>
                      {renderSourceBadge(s.source)}
                    </div>
                    {renderEditButton(s)}
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-tight">Größe: {s.data.size}</span>
                    <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-tight">Speed: {s.data.speed}m</span>
                  </div>
                  <div className="space-y-2">
                    {s.data.traits?.slice(0, 3).map((t: any) => (
                      <div key={t.name}>
                        <p className="text-[10px] font-bold text-slate-700">{t.name}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {activeTab === 'classes' && classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wide">{c.name}</h3>
                      {renderSourceBadge(c.source)}
                    </div>
                    {renderEditButton(c)}
                  </div>
                  <p className="text-slate-500 text-[10px] mb-3 font-medium uppercase tracking-wider">Trefferwürfel: W{c.data.hit_die}</p>
                  <div className="text-[10px] text-slate-600">
                    <p className="font-bold text-indigo-600 mb-1 uppercase text-[9px]">Unterklassen:</p>
                    <div className="flex flex-wrap gap-1">
                      {c.data.subclasses?.map((sc: any) => (
                        <span key={sc.name} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[9px] uppercase font-bold">
                          {sc.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {activeTab === 'weapons' && weapons.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase())).map(w => (
                <div key={w.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wide">{w.name}</h3>
                      {renderSourceBadge(w.source)}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderEditButton(w)}
                      <span className="bg-red-50 text-red-700 text-[10px] px-2 py-1 rounded font-bold uppercase">{w.damage_dice}</span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-[9px] uppercase font-bold mb-2 tracking-tighter">{w.damage_type}schaden</p>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 border-t pt-2 border-slate-100">
                    <span>{w.cost_gp} GM</span>
                    <span>{w.weight_kg} KG</span>
                  </div>
                </div>
              ))}

              {activeTab === 'armor' && armor.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                <div key={a.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wide">{a.name}</h3>
                      {renderSourceBadge(a.source)}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderEditButton(a)}
                      <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded font-bold uppercase">RK {a.base_ac}</span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-[9px] uppercase font-bold mb-2 tracking-tighter">{a.category}</p>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 border-t pt-2 border-slate-100">
                    <span>{a.cost_gp} GM</span>
                    <span>{a.weight_kg} KG</span>
                  </div>
                </div>
              ))}

              {activeTab === 'gear' && gear.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).map(g => (
                <div key={g.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                   <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wide">{g.name}</h3>
                      {renderSourceBadge(g.source)}
                    </div>
                    {renderEditButton(g)}
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 border-t pt-2 border-slate-100">
                    <span>{g.cost_gp} GM</span>
                    <span>{g.weight_kg} KG</span>
                  </div>
                </div>
              ))}

              {activeTab === 'feats' && feats.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).map(f => (
                <div key={f.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center">
                      <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wide">{f.name}</h3>
                      {renderSourceBadge(f.source)}
                    </div>
                    {renderEditButton(f)}
                  </div>
                  <p className="text-indigo-600 text-[9px] font-bold uppercase mb-2 tracking-tight">{f.category}</p>
                  {f.data.prerequisite && (
                    <p className="text-[9px] text-slate-500 mb-2 font-medium">Voraussetzung: {f.data.prerequisite}</p>
                  )}
                  <p className="text-slate-600 text-[10px] line-clamp-3 leading-relaxed">{f.data.description || f.data.benefits?.[0]?.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {isEditorOpen && (
        <CompendiumEditor 
          type={activeTab} 
          initialData={selectedEntry} 
          onClose={closeEditor}
          onSave={handleSave}
        />
      )}
    </div>
  );
}






