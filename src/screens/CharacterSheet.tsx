import React, { useEffect } from 'react';
import { useCharacterStore } from '../lib/store';
import { AttributeBlock } from '../components/character/AttributeBlock';
import { SkillList } from '../components/character/SkillList';
import { CombatStats } from '../components/character/CombatStats';
import { ModifiersList } from '../components/character/ModifiersList';
import { Save, User, Swords, Wand2, Backpack, Book, ChevronLeft, Sparkles, Settings } from 'lucide-react';
import { calculateLevelFromXP, getXPForNextLevel } from '../lib/math';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function CharacterSheet() {
  const { 
    currentCharacter, 
    setCurrentCharacter,
    updateAttribute, 
    updateMeta,
    removeModifier, 
    saveCharacter,
    isLoading 
  } = useCharacterStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveCharacter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCharacter]);

  if (!currentCharacter) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 opacity-30">
          <User size={80} strokeWidth={1} />
          <p className="text-xl font-black uppercase tracking-widest italic">Kein Charakter geladen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 pb-32 transition-colors duration-500 overflow-y-auto custom-scrollbar">
      {/* Dynamic Header */}
      <header className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between mb-12 bg-card/60 backdrop-blur-xl p-8 rounded-[3rem] border border-border shadow-2xl shadow-foreground/[0.02] gap-8">
        <div className="flex items-center gap-8 w-full lg:w-auto">
          <button
            onClick={() => setCurrentCharacter(null)}
            className="p-5 bg-muted rounded-3xl transition-all text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border active:scale-90"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <div className="flex items-center gap-8 border-l-2 border-border pl-8 overflow-hidden">
            <div className="relative group shrink-0">
              <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-6 bg-primary text-primary-foreground rounded-[2rem] shadow-2xl shadow-primary/20 relative">
                <User className="w-10 h-10" />
                <Sparkles size={20} className="absolute -top-2 -right-2 text-white animate-pulse" />
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
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Stufe {calculateLevelFromXP(currentCharacter.meta.xp)}</span>
                  <div className="h-4 w-px bg-primary/20 mx-2" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">XP</span>
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
                  {getXPForNextLevel(calculateLevelFromXP(currentCharacter.meta.xp)) && (
                    <span className="text-[9px] font-bold text-primary/30 ml-1">
                      / {getXPForNextLevel(calculateLevelFromXP(currentCharacter.meta.xp))} bis Level Up
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground font-bold text-xs opacity-60">Waldläufer • Gloom Stalker • Elfe</span>
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
            <span>{isLoading ? 'Speichert...' : 'Sichern'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Column: Attributes */}
        <div className="xl:col-span-2 flex flex-col gap-5 animate-in slide-in-from-left-8 duration-500">
          <AttributeBlock name="Stärke" value={currentCharacter.attributes.str} onChange={(v) => updateAttribute('str', v)} onBlur={saveCharacter} />
          <AttributeBlock name="Geschick" value={currentCharacter.attributes.dex} onChange={(v) => updateAttribute('dex', v)} onBlur={saveCharacter} />
          <AttributeBlock name="Konstitution" value={currentCharacter.attributes.con} onChange={(v) => updateAttribute('con', v)} onBlur={saveCharacter} />
          <AttributeBlock name="Intelligenz" value={currentCharacter.attributes.int} onChange={(v) => updateAttribute('int', v)} onBlur={saveCharacter} />
          <AttributeBlock name="Weisheit" value={currentCharacter.attributes.wis} onChange={(v) => updateAttribute('wis', v)} onBlur={saveCharacter} />
          <AttributeBlock name="Charisma" value={currentCharacter.attributes.cha} onChange={(v) => updateAttribute('cha', v)} onBlur={saveCharacter} />
        </div>

        {/* Center Column: Combat & Skills */}
        <div className="xl:col-span-7 flex flex-col gap-10 animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-card p-2 rounded-[3rem] border border-border shadow-2xl shadow-foreground/[0.02]">
            <CombatStats character={currentCharacter} />
          </div>
          <div className="bg-card p-4 rounded-[3.5rem] border border-border shadow-2xl shadow-foreground/[0.02]">
            <SkillList character={currentCharacter} onToggleProficiency={(s) => console.log('Toggle skill:', s)} />
          </div>
        </div>

        {/* Right Column: Modifiers */}
        <div className="xl:col-span-3 animate-in slide-in-from-right-8 duration-500">
          <div className="sticky top-10">
            <ModifiersList modifiers={currentCharacter.modifiers} onRemove={removeModifier} />
          </div>
        </div>
      </main>

      {/* Navigation Tabs (Floating Bottom) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50">
        <nav className="bg-card/70 backdrop-blur-2xl border border-border px-10 py-4 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex justify-around items-center gap-4 lg:gap-8">
          <TabItem icon={<Swords className="w-6 h-6" />} label="Kampf" active />
          <TabItem icon={<Wand2 className="w-6 h-6" />} label="Zauber" />
          <TabItem icon={<Backpack className="w-6 h-6" />} label="Inventar" />
          <TabItem icon={<Book className="w-6 h-6" />} label="Notizen" />
        </nav>
      </div>
    </div>
  );
}

function TabItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className="flex flex-col items-center gap-2 group transition-all relative px-4">
      <div className={cn(
        "p-4 rounded-2xl transition-all duration-300 relative overflow-hidden",
        active 
          ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30 scale-110 -translate-y-2" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}>
        {icon}
        {active && <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20" />}
      </div>
      <span className={cn(
        "text-[10px] uppercase font-black tracking-[0.2em] transition-all",
        active ? "text-primary opacity-100 translate-y-[-4px]" : "text-muted-foreground opacity-40 group-hover:opacity-100"
      )}>{label}</span>
      {active && <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />}
    </button>
  );
}
