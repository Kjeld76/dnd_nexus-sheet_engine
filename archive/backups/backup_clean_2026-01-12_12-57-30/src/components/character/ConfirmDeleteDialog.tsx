import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "../ui/Button";

interface Props {
  characterName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteDialog: React.FC<Props> = ({
  characterName,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-[3rem] shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-destructive/10 rounded-2xl">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-black text-foreground tracking-tighter">
                Held löschen?
              </h2>
              <p className="text-muted-foreground">
                Möchtest du{" "}
                <span className="font-bold text-foreground">
                  "{characterName}"
                </span>{" "}
                wirklich löschen?
              </p>
              <p className="text-sm text-destructive/80 font-medium">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              variant="secondary"
              size="md"
              onClick={onCancel}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onConfirm}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Löschen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
