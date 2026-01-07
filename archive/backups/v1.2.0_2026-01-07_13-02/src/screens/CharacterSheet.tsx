import React, { useEffect } from 'react';
import { useCharacterStore } from '../lib/store';
import { AttributeBlock } from '../components/character/AttributeBlock';
import { SkillList } from '../components/character/SkillList';
import { CombatStats } from '../components/character/CombatStats';
import { ModifiersList } from '../components/character/ModifiersList';
import { Save, User, Swords, Wand2, Backpack, Book, ChevronLeft } from 'lucide-react';

export function CharacterSheet() {
  const { 
    currentCharacter, 
    setCurrentCharacter,
    updateAttribute, 
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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 italic">Kein Charakter geladen.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pb-24">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-8 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentCharacter(null)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 border-l border-gray-700 pl-6">
            <div className="p-3 bg-primary-600 rounded-xl shadow-lg shadow-primary-900/20">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{currentCharacter.meta.name}</h1>
              <p className="text-gray-400">Level {currentCharacter.meta.level} • Waldläufer (Gloom Stalker) • Elfe</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => saveCharacter()}
          disabled={isLoading}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          <Save className="w-5 h-5" />
          {isLoading ? 'Speichert...' : 'Speichern'}
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Attributes */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <AttributeBlock name="Stärke" value={currentCharacter.attributes.str} onChange={(v) => updateAttribute('str', v)} onBlur={saveCharacter} />
          <AttributeBlock name="Geschick" value={currentCharacter.attributes.dex} onChange={(v) => updateAttribute('dex', v)} onBlur={saveCharacter} />
          <AttributeBlock name="Konstitution" value={currentCharacter.attributes.con} onChange={(v) => updateAttribute('con', v)} onBlur={saveCharacter} />
          <AttributeBlock name="Intelligenz" value={currentCharacter.attributes.int} onChange={(v) => updateAttribute('int', v)} onBlur={saveCharacter} />
          <AttributeBlock name="Weisheit" value={currentCharacter.attributes.wis} onChange={(v) => updateAttribute('wis', v)} onBlur={saveCharacter} />
          <AttributeBlock name="Charisma" value={currentCharacter.attributes.cha} onChange={(v) => updateAttribute('cha', v)} onBlur={saveCharacter} />
        </div>

        {/* Center Column: Combat & Skills */}
        <div className="xl:col-span-7 flex flex-col gap-8">
          <CombatStats character={currentCharacter} />
          <SkillList character={currentCharacter} onToggleProficiency={(s) => console.log('Toggle skill:', s)} />
        </div>

        {/* Right Column: Modifiers */}
        <div className="xl:col-span-3">
          <ModifiersList modifiers={currentCharacter.modifiers} onRemove={removeModifier} />
        </div>
      </main>

      {/* Navigation Tabs (Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800/80 backdrop-blur-md border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex justify-around items-center">
          <TabItem icon={<Swords className="w-5 h-5" />} label="Kampf" active />
          <TabItem icon={<Wand2 className="w-5 h-5" />} label="Zauber" />
          <TabItem icon={<Backpack className="w-5 h-5" />} label="Inventar" />
          <TabItem icon={<Book className="w-5 h-5" />} label="Notizen" />
        </div>
      </nav>
    </div>
  );
}

function TabItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-all ${active ? 'text-primary-500' : 'text-gray-500 hover:text-gray-300'}`}>
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
    </button>
  );
}

