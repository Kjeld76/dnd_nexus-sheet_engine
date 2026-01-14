import React from "react";
import { Wand2, PenTool, X } from "lucide-react";
import { Button } from "../ui/Button";

interface Props {
  onManual: () => void;
  onWizard: () => void;
  onCancel: () => void;
}

export const CharacterCreationModeDialog: React.FC<Props> = ({
  onManual,
  onWizard,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-[3rem] shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200">
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Wand2 className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-black text-foreground tracking-tighter">
                Wie möchtest du deinen Helden erstellen?
              </h2>
              <p className="text-muted-foreground">
                Wähle eine Methode zur Erstellung deines neuen Helden.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 pt-4">
            <button
              onClick={onWizard}
              className="w-full group text-left bg-muted/50 hover:bg-muted border-2 border-border hover:border-primary/50 rounded-2xl p-6 transition-all active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Wand2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-black text-foreground tracking-tighter">
                    Wizard verwenden
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Lass dich Schritt für Schritt durch die Erstellung führen.
                    Ideal für Anfänger.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={onManual}
              className="w-full group text-left bg-muted/50 hover:bg-muted border-2 border-border hover:border-primary/50 rounded-2xl p-6 transition-all active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                  <PenTool className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-black text-foreground tracking-tighter">
                    Manuell erstellen
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Erstelle deinen Helden komplett selbst. Volle Kontrolle über
                    alle Eigenschaften.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="pt-4">
            <Button
              variant="secondary"
              size="md"
              onClick={onCancel}
              className="w-full"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
