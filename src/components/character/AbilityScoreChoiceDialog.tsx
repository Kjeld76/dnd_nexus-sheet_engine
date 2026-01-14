import React, { useState } from "react";
import { Species, Attributes } from "../../lib/types";
import { X, Plus, Minus } from "lucide-react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  species: Species;
  currentAttributes: Attributes;
  onConfirm: (choices: Record<string, number>) => void;
  onCancel: () => void;
}

const ATTRIBUTE_NAMES: Record<keyof Attributes, string> = {
  str: "Stärke",
  dex: "Geschick",
  con: "Konstitution",
  int: "Intelligenz",
  wis: "Weisheit",
  cha: "Charisma",
};

export const AbilityScoreChoiceDialog: React.FC<Props> = ({
  species,
  currentAttributes,
  onConfirm,
  onCancel,
}) => {
  const speciesData = species.data;
  const asi = speciesData?.ability_score_increase;
  const choiceData = asi?.type === "choice" ? asi.choice : null;

  if (!choiceData) return null;

  const { count, amount } = choiceData;
  const totalPoints = count * amount;
  const [choices, setChoices] = useState<Record<string, number>>({});

  const selectedCount = Object.values(choices).reduce(
    (sum, val) => sum + val,
    0,
  );
  const remainingPoints = totalPoints - selectedCount;

  const handleIncrement = (attr: keyof Attributes) => {
    const currentValue = choices[attr] || 0;
    if (currentValue < amount && remainingPoints > 0) {
      setChoices({ ...choices, [attr]: currentValue + 1 });
    }
  };

  const handleDecrement = (attr: keyof Attributes) => {
    const currentValue = choices[attr] || 0;
    if (currentValue > 0) {
      setChoices({ ...choices, [attr]: currentValue - 1 });
    }
  };

  const handleConfirm = () => {
    const finalChoices: Record<string, number> = {};
    Object.entries(choices).forEach(([attr, value]) => {
      if (value > 0) {
        finalChoices[attr] = value * amount;
      }
    });
    onConfirm(finalChoices);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-border flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm">
          <div>
            <h2 className="text-3xl font-black italic font-serif text-foreground mb-2">
              Attribut-Boni wählen
            </h2>
            <p className="text-sm text-muted-foreground">
              {species.name} - Wähle {count} Attribut{count > 1 ? "e" : ""} für
              +{amount} {count > 1 ? `(${totalPoints} Punkte gesamt)` : ""}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(ATTRIBUTE_NAMES) as Array<keyof Attributes>).map(
              (attr) => {
                const value = choices[attr] || 0;
                const bonus = value * amount;
                const newTotal = currentAttributes[attr] + bonus;

                return (
                  <div
                    key={attr}
                    className={cn(
                      "bg-background p-6 rounded-[2rem] border transition-all",
                      bonus > 0
                        ? "border-primary/40 bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-black text-foreground uppercase tracking-tight">
                        {ATTRIBUTE_NAMES[attr]}
                      </span>
                      {bonus > 0 && (
                        <span className="text-sm font-black text-primary">
                          +{bonus}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <div>Aktuell: {currentAttributes[attr]}</div>
                        {bonus > 0 && (
                          <div className="text-primary font-bold">
                            Neu: {newTotal}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDecrement(attr)}
                          disabled={value === 0}
                          className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-2xl font-black text-foreground min-w-[2rem] text-center">
                          {value}
                        </span>
                        <button
                          onClick={() => handleIncrement(attr)}
                          disabled={remainingPoints === 0 || value >= amount}
                          className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>

          <div className="bg-muted/30 p-4 rounded-2xl border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-muted-foreground">
                Verbleibende Punkte:
              </span>
              <span
                className={cn(
                  "text-2xl font-black",
                  remainingPoints === 0 ? "text-primary" : "text-foreground",
                )}
              >
                {remainingPoints}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-border flex items-center justify-end gap-4 sticky bottom-0 bg-card/95 backdrop-blur-sm">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl bg-muted text-muted-foreground hover:text-foreground hover:bg-background transition-all font-bold"
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={remainingPoints !== 0}
            className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black uppercase tracking-wider"
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
};
