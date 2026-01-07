import { useEffect } from 'react';
import { useCharacterStore } from '../lib/store';
import { Plus, User, Sparkles, ChevronRight } from 'lucide-react';
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
        xp: 0,
        use_metric: true,
      },
      attributes: {
        str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
      },
      health: {
        current: 10,
        max: 10,
        temp: 0,
        hit_dice_max: 1,
        hit_dice_used: 0,
        death_saves: { successes: 0, failures: 0 }
      },
      proficiencies: {
        skills: [],
        saving_throws: [],
        weapons: [],
        armor: [],
        tools: [],
        languages: ['Common']
      },
      inventory: [],
      modifiers: [],
    };
    setCurrentCharacter(newChar);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 lg:p-16 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-20 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-primary/30" />
              <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">Nexus v1.2.0</span>
            </div>
            <h1 className="text-7xl lg:text-8xl font-black text-foreground tracking-tighter italic font-serif leading-none">
              D&D <span className="text-primary">Nexus</span>
            </h1>
            <p className="text-muted-foreground text-lg font-medium max-w-md italic border-l-2 border-primary/20 pl-6">
              Deine Schaltzentrale für epische Abenteuer und unsterbliche Helden.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="group flex items-center gap-4 bg-primary text-primary-foreground px-10 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.1em] transition-all shadow-2xl shadow-primary/30 active:scale-95 hover:shadow-primary/40"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-90 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            Neuer Held
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent shadow-2xl shadow-primary/20"></div>
            <p className="text-xs font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse">Erschaffe Welt...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => setCurrentCharacter(char)}
                className="group text-left bg-card p-10 rounded-[3.5rem] border border-border hover:border-primary/50 transition-all cursor-pointer shadow-xl shadow-foreground/[0.02] relative overflow-hidden active:scale-[0.98]"
              >
                <div className="absolute top-0 left-0 w-3 h-full bg-primary/10 group-hover:bg-primary transition-colors duration-500" />
                <div className="flex items-center gap-8">
                  <div className="relative">
                    <div className="p-6 bg-muted rounded-[2rem] group-hover:bg-primary/10 transition-all group-hover:rotate-3">
                      <User className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <Sparkles size={24} className="absolute -top-2 -right-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="text-3xl font-black group-hover:text-primary transition-colors tracking-tighter font-serif italic">{char.meta.name}</h2>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest bg-muted px-3 py-1 rounded-lg">Stufe {char.meta.level}</span>
                      <div className="flex-1 h-px bg-border/50" />
                      <ChevronRight className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {characters.length === 0 && (
              <div className="col-span-full py-32 text-center bg-card/40 rounded-[4rem] border-4 border-dashed border-border flex flex-col items-center gap-8 group hover:border-primary/20 transition-all">
                <div className="p-10 bg-muted rounded-[3rem] shadow-inner">
                  <User className="w-20 h-20 text-muted-foreground/20" />
                </div>
                <div className="space-y-3">
                  <p className="text-2xl font-black uppercase tracking-widest text-muted-foreground/30">Keine Legenden gefunden</p>
                  <p className="text-sm font-medium text-muted-foreground/50 italic">Klicke oben auf "Neuer Held", um dein Abenteuer zu beginnen.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
