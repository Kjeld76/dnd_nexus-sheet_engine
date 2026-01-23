import { useEffect, useState } from "react";
import { useCharacterStore } from "../lib/store";
import { Plus, User, ChevronRight, Trash2 } from "lucide-react";
import { Character } from "../lib/types";
import { NexusLogo } from "../components/NexusLogo";
import { Button } from "../components/ui/Button";
import { ConfirmDeleteDialog } from "../components/character/ConfirmDeleteDialog";
import { CharacterCreationModeDialog } from "../components/character/CharacterCreationModeDialog";

export function CharacterList() {
  const {
    characters,
    loadCharacterList,
    setCurrentCharacter,
    saveCharacter,
    deleteCharacter,
    isLoading,
  } = useCharacterStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(
    null,
  );
  const [creationModeDialogOpen, setCreationModeDialogOpen] = useState(false);

  useEffect(() => {
    loadCharacterList();
  }, [loadCharacterList]);

  const handleCreate = () => {
    setCreationModeDialogOpen(true);
  };

  const createEmptyCharacter = (): Character => {
    return {
      id: crypto.randomUUID(),
      meta: {
        name: "Neuer Held",
        level: 1,
        xp: 0,
        use_metric: true,
      },
      attributes: {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      },
      health: {
        current: 10,
        max: 10,
        temp: 0,
        hit_dice_max: 1,
        hit_dice_used: 0,
        death_saves: { successes: 0, failures: 0 },
      },
      proficiencies: {
        skills: [],
        saving_throws: [],
        weapons: [],
        armor: [],
        tools: [],
        languages: ["Common"],
      },
      inventory: [],
      spells: [],
      modifiers: [],
      feats: [],
    };
  };

  const handleManualCreation = async () => {
    setCreationModeDialogOpen(false);
    const newChar = createEmptyCharacter();
    setCurrentCharacter(newChar);
    setTimeout(async () => {
      await saveCharacter();
    }, 100);
  };

  const handleWizardCreation = async () => {
    setCreationModeDialogOpen(false);
    const newChar = createEmptyCharacter();
    setCurrentCharacter(newChar);
    setTimeout(async () => {
      await saveCharacter();
    }, 100);
  };

  const handleDeleteClick = (e: React.MouseEvent, character: Character) => {
    e.stopPropagation();
    setCharacterToDelete(character);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (characterToDelete) {
      await deleteCharacter(characterToDelete.id);
      setDeleteDialogOpen(false);
      setCharacterToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setCharacterToDelete(null);
  };

  return (
    <div className="h-full bg-background text-foreground p-12 transition-colors duration-300 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-20 gap-12">
          <div className="flex items-start gap-8">
            <NexusLogo size="large" variant="full" className="shrink-0 mt-2" />
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-accent/40" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent/80">
                  NEXUS V1.4.5
                </span>
              </div>
              <h1 className="text-7xl lg:text-8xl font-black text-foreground tracking-tighter font-display leading-none">
                D&D <span className="text-accent">NEXUS</span>
              </h1>
              <p className="text-muted-foreground text-base font-medium max-w-lg italic border-l-2 border-accent/30 pl-6 mt-2">
                Deine Schaltzentrale für epische Abenteuer und unsterbliche
                Helden.
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            variant="primary"
            size="lg"
            className="flex items-center gap-4 group"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-90 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            Neuer Held
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent shadow-2xl shadow-primary/20"></div>
            <p className="text-xs font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse">
              Erschaffe Welt...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {characters.map((char) => (
              <div
                key={char.id}
                className="group text-left bg-card p-10 rounded-[3.5rem] border border-border hover:border-primary/50 transition-all cursor-pointer shadow-xl shadow-foreground/[0.02] relative overflow-hidden"
              >
                <button
                  onClick={() => setCurrentCharacter(char)}
                  className="w-full h-full text-left absolute inset-0 z-0"
                  aria-label={`Charakter ${char.meta.name} öffnen`}
                />
                <div className="absolute top-0 left-0 w-3 h-full bg-primary/10 group-hover:bg-primary transition-colors duration-500" />
                <button
                  onClick={(e) => handleDeleteClick(e, char)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive/60 hover:text-destructive transition-all opacity-0 group-hover:opacity-100 z-10 relative"
                  title="Held löschen"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-8">
                  <div className="relative">
                    <div className="p-6 bg-muted rounded-[2rem] group-hover:bg-primary/10 transition-all group-hover:rotate-3">
                      <User className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="text-3xl font-black group-hover:text-accent transition-colors tracking-tighter font-display">
                      {char.meta.name}
                    </h2>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest bg-muted px-3 py-1 rounded-lg">
                        Stufe {char.meta.level}
                      </span>
                      <div className="flex-1 h-px bg-border/50" />
                      <ChevronRight className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {characters.length === 0 && (
              <div className="col-span-full py-32 text-center bg-card/40 rounded-[4rem] border-4 border-dashed border-border flex flex-col items-center gap-8 group hover:border-primary/20 transition-all">
                <div className="p-10 bg-muted rounded-[3rem] shadow-inner">
                  <User className="w-20 h-20 text-muted-foreground/20" />
                </div>
                <div className="space-y-3">
                  <p className="text-2xl font-black uppercase tracking-widest text-muted-foreground/30">
                    Keine Legenden gefunden
                  </p>
                  <p className="text-sm font-medium text-muted-foreground/50 italic">
                    Klicke oben auf "Neuer Held", um dein Abenteuer zu beginnen.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {deleteDialogOpen && characterToDelete && (
        <ConfirmDeleteDialog
          characterName={characterToDelete.meta.name}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {creationModeDialogOpen && (
        <CharacterCreationModeDialog
          onManual={handleManualCreation}
          onWizard={handleWizardCreation}
          onCancel={() => setCreationModeDialogOpen(false)}
        />
      )}
    </div>
  );
}
