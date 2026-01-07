import React, { useState } from 'react';
import { X, Save, Trash2, Code, Layout, Copy, Download, Upload } from 'lucide-react';
import { homebrewApi } from '../lib/api';
import { CustomSpell, CustomWeapon, CustomArmor, CustomItem } from '../lib/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  type: string;
  initialData?: any;
  onClose: () => void;
  onSave: () => void;
}

export function CompendiumEditor({ type, initialData, onClose, onSave }: Props) {
  const [viewMode, setViewMode] = useState<'form' | 'json'>('form');
  const [formData, setFormData] = useState<any>(initialData || {
    name: '',
    description: '',
    level: 0,
    school: '',
    casting_time: '',
    range: '',
    components: '',
    material_components: '',
    duration: '',
    classes: '',
    is_homebrew: true,
    data: {}
  });
  const [jsonValue, setJsonValue] = useState(JSON.stringify(initialData || {}, null, 2));

  const handleSave = async () => {
    try {
      let dataToSave = viewMode === 'json' ? JSON.parse(jsonValue) : formData;
      
      // Ensure IDs and parent relation
      const finalData = {
        ...dataToSave,
        parent_id: initialData?.source === 'core' ? initialData.id : initialData?.parent_id,
        id: initialData?.source !== 'core' ? initialData?.id : undefined,
      };

      if (type === 'spells') {
        await homebrewApi.upsertSpell(finalData as CustomSpell);
      } else if (type === 'weapons') {
        await homebrewApi.upsertWeapon(finalData as CustomWeapon);
      } else if (type === 'armor') {
        await homebrewApi.upsertArmor(finalData as CustomArmor);
      } else if (['gear', 'tool'].includes(type)) {
        await homebrewApi.upsertItem({ ...finalData, item_type: type } as CustomItem);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Fehler beim Speichern: ' + (error as Error).message);
    }
  };

  const handleJsonSync = () => {
    if (viewMode === 'form') {
      setJsonValue(JSON.stringify(formData, null, 2));
      setViewMode('json');
    } else {
      try {
        setFormData(JSON.parse(jsonValue));
        setViewMode('form');
      } catch (e) {
        alert('Ungültiges JSON-Format');
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonValue);
    alert('JSON in Zwischenablage kopiert');
  };

  const handleDelete = async () => {
    if (!initialData?.id || initialData.source === 'core') return;
    if (!confirm('Eintrag wirklich löschen?')) return;
    try {
      const tableType = type.endsWith('s') ? type.slice(0, -1) : type;
      await homebrewApi.deleteEntry(initialData.id, tableType);
      onSave();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-indigo-600/10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black uppercase tracking-tight">
              {initialData ? `${formData.name || 'Eintrag'} bearbeiten` : 'Neu hinzufügen'}
            </h2>
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
              <button 
                onClick={() => setViewMode('form')}
                className={cn("px-3 py-1 rounded text-[10px] font-black uppercase flex items-center gap-2 transition-all", viewMode === 'form' ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300")}
              >
                <Layout size={12} /> Formular
              </button>
              <button 
                onClick={() => setViewMode('json')}
                className={cn("px-3 py-1 rounded text-[10px] font-black uppercase flex items-center gap-2 transition-all", viewMode === 'json' ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300")}
              >
                <Code size={12} /> JSON
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {viewMode === 'form' ? (
            <div className="space-y-8">
              {/* Basis-Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</label>
                  <input 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 transition-all outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quelle / Typ</label>
                  <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 h-[46px]">
                    <button 
                      onClick={() => setFormData({...formData, is_homebrew: false})}
                      className={cn("flex-1 rounded-lg text-[10px] font-black uppercase transition-all", !formData.is_homebrew ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-400")}
                    >
                      Core (PHB)
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, is_homebrew: true})}
                      className={cn("flex-1 rounded-lg text-[10px] font-black uppercase transition-all", formData.is_homebrew ? "bg-amber-600/20 text-amber-400" : "text-slate-600 hover:text-slate-400")}
                    >
                      Custom (Homebrew)
                    </button>
                  </div>
                </div>
                {type === 'spells' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Level</label>
                      <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none" value={formData.level} onChange={e => setFormData({...formData, level: parseInt(e.target.value)})}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Schule</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})}/>
                    </div>
                  </div>
                )}
              </div>

              {/* Beschreibung */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Beschreibung</label>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm h-40 outline-none focus:border-indigo-500 transition-all resize-none custom-scrollbar"
                  value={formData.description || formData.data?.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Statistik-Block */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Layout size={14} /> Statistik & Metadaten
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {type === 'spells' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Zeit</label>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={formData.casting_time} onChange={e => setFormData({...formData, casting_time: e.target.value})}/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Reichweite</label>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={formData.range} onChange={e => setFormData({...formData, range: e.target.value})}/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Dauer</label>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Komponenten</label>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={formData.components} onChange={e => setFormData({...formData, components: e.target.value})}/>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Materialkomponenten</label>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={formData.material_components} onChange={e => setFormData({...formData, material_components: e.target.value})} placeholder="z.B. eine Prise Salz..."/>
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Klassen</label>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={formData.classes} onChange={e => setFormData({...formData, classes: e.target.value})}/>
                      </div>
                    </>
                  )}
                  {(type === 'weapons' || type === 'armor' || type === 'gear' || type === 'tools') && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Preis (GM)</label>
                        <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={formData.cost_gp} onChange={e => setFormData({...formData, cost_gp: parseFloat(e.target.value)})}/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Gewicht (KG)</label>
                        <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: parseFloat(e.target.value)})}/>
                      </div>
                      {type === 'weapons' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Schaden</label>
                            <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={formData.damage_dice} onChange={e => setFormData({...formData, damage_dice: e.target.value})}/>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Schadenstyp</label>
                            <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={formData.damage_type} onChange={e => setFormData({...formData, damage_type: e.target.value})}/>
                          </div>
                        </>
                      )}
                      {type === 'armor' && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Rüstungsklasse</label>
                          <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={formData.base_ac} onChange={e => setFormData({...formData, base_ac: parseInt(e.target.value)})}/>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-4">
              <div className="flex justify-between items-center px-2">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Rohdaten Editor (JSON)</p>
                <div className="flex gap-2">
                  <button onClick={copyToClipboard} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all flex items-center gap-2 text-[10px] uppercase font-black">
                    <Copy size={14} /> Kopieren
                  </button>
                </div>
              </div>
              <textarea 
                className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-xs font-mono text-indigo-300 outline-none focus:border-indigo-500 transition-all resize-none custom-scrollbar leading-relaxed h-[500px]"
                value={jsonValue}
                onChange={e => setJsonValue(e.target.value)}
                placeholder="{ ... }"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-between gap-4 bg-slate-950/50">
          {initialData?.source !== 'core' && initialData?.id && (
            <button 
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-black uppercase text-xs tracking-widest border border-red-500/20"
            >
              <Trash2 size={16} /> Löschen
            </button>
          )}
          <div className="flex gap-4 ml-auto">
            <button onClick={onClose} className="px-6 py-2 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-white">Abbrechen</button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/20"
            >
              <Save size={18} /> Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

