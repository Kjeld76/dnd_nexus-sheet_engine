import { useEffect } from 'react';
import { useCharacterStore } from '../lib/store';
import { Plus, User } from 'lucide-react';
import { Character } from '../lib/types';

export function CharacterList() {
  const { characters, loadCharacterList, setCurrentCharacter, isLoading } = useCharacterStore();

  useEffect(() => {
    loadCharacterList();
  }, [loadCharacterList]);

  const handleCreate = () => {
    const newChar: Character = {
      id: crypto.randomUUID(),
      meta: {
        name: 'Neuer Held',
        level: 1,
        use_metric: true,
      },
      attributes: {
        str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
      },
      modifiers: [],
    };
    setCurrentCharacter(newChar);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-primary-500">D&D Nexus</h1>
            <p className="text-gray-400 mt-2">Wähle einen Charakter oder erstelle einen neuen.</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-900/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Neuer Charakter
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {characters.map((char) => (
              <div
                key={char.id}
                onClick={() => setCurrentCharacter(char)}
                className="group bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-primary-500 transition-all cursor-pointer shadow-xl relative"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-700 group-hover:bg-primary-600/20 rounded-xl transition-colors">
                    <User className="w-8 h-8 text-gray-400 group-hover:text-primary-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold group-hover:text-primary-400 transition-colors">{char.meta.name}</h2>
                    <p className="text-gray-500">Level {char.meta.level}</p>
                  </div>
                </div>
              </div>
            ))}
            {characters.length === 0 && (
              <div className="col-span-full py-20 text-center bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-700">
                <p className="text-gray-500 italic">Noch keine Charaktere vorhanden.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

