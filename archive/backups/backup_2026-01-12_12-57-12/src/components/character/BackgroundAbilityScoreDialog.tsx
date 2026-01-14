import React, { useState } from "react";
import { Attributes } from "../../lib/types";
import { X, Plus, Minus } from "lucide-react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  backgroundName: string;
  abilityScores: string[];
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

const ATTRIBUTE_NAME_TO_KEY: Record<string, keyof Attributes> = {
  Stärke: "str",
  Geschick: "dex",
  Geschicklichkeit: "dex",
  Konstitution: "con",
  Intelligenz: "int",
  Weisheit: "wis",
  Charisma: "cha",
};

export const BackgroundAbilityScoreDialog: React.FC<Props> = ({
  backgroundName,
  abilityScores,
  currentAttributes,
  onConfirm,
  onCancel,
}) => {
  const [mode, setMode] = useState<"plus2plus1" | "allplus1">("plus2plus1");
  const [choices, setChoices] = useState<Record<string, number>>({});

  const availableAttributes = abilityScores
    .map((name) => ATTRIBUTE_NAME_TO_KEY[name] || null)
    .filter((key): key is keyof Attributes => key !== null);

  const selectedCount = Object.values(choices).reduce(
    (sum, val) => sum + val,
    0,
  );

  const isValid =
    mode === "plus2plus1"
      ? selectedCount === 3 &&
        Object.values(choices).filter((v) => v === 2).length === 1 &&
        Object.values(choices).filter((v) => v === 1).length === 1 &&
        Object.values(choices).filter((v) => v > 0).length === 2
      : mode === "allplus1"
        ? selectedCount === 3 &&
          Object.values(choices).filter((v) => v > 0).length === 3 &&
          Object.values(choices).every((v) => v === 0 || v === 1)
        : false;

  const handleIncrement = (attr: keyof Attributes) => {
    const currentValue = choices[attr] || 0;

    if (mode === "plus2plus1") {
      const hasPlus2 = Object.values(choices).some((v) => v === 2);
      const hasPlus1 = Object.values(choices).some((v) => v === 1);
      const selectedAttributeCount = Object.values(choices).filter(
        (v) => v > 0,
      ).length;

      if (!hasPlus2 && currentValue === 0 && selectedAttributeCount < 2) {
        // Erste Wahl: +2
        setChoices({ ...choices, [attr]: 2 });
      } else if (
        hasPlus2 &&
        !hasPlus1 &&
        currentValue === 0 &&
        selectedAttributeCount < 2
      ) {
        // Nach +2: +1 (nur ein anderes Attribut)
        setChoices({ ...choices, [attr]: 1 });
      }
    } else {
      // Mode: allplus1
      const selectedAttributeCount = Object.values(choices).filter(
        (v) => v > 0,
      ).length;
      if (currentValue === 0 && selectedAttributeCount < 3) {
        setChoices({ ...choices, [attr]: 1 });
      }
    }
  };

  const handleDecrement = (attr: keyof Attributes) => {
    const currentValue = choices[attr] || 0;
    if (currentValue > 0) {
      setChoices({ ...choices, [attr]: currentValue - 1 });
    }
  };

  const handleModeChange = (newMode: "plus2plus1" | "allplus1") => {
    setMode(newMode);
    if (newMode === "allplus1") {
      // Automatically select all three attributes with +1
      const autoChoices: Record<string, number> = {};
      availableAttributes.forEach((attr) => {
        autoChoices[attr] = 1;
      });
      setChoices(autoChoices);
    } else {
      // Reset choices for +2/+1 mode
      setChoices({});
    }
  };

  const handleConfirm = () => {
    const finalChoices: Record<string, number> = {};
    Object.entries(choices).forEach(([attr, value]) => {
      if (value > 0) {
        finalChoices[attr] = value;
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
              Attributswerte wählen
            </h2>
            <p className="text-sm text-muted-foreground">
              {backgroundName} - Wähle eine Option
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
          <div className="flex gap-4 p-4 bg-muted/20 rounded-2xl border border-border">
            <button
              onClick={() => handleModeChange("plus2plus1")}
              className={cn(
                "flex-1 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-wider border transition-all",
                mode === "plus2plus1"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:bg-card",
              )}
            >
              +2 / +1
            </button>
            <button
              onClick={() => handleModeChange("allplus1")}
              className={cn(
                "flex-1 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-wider border transition-all",
                mode === "allplus1"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:bg-card",
              )}
            >
              Alle +1
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {mode === "plus2plus1"
                ? "Erhöhe einen Attributswert um 2 und einen anderen um 1 (2 Attribute, 3 Punkte)"
                : "Erhöhe alle drei Attributswerte um 1 (3 Attribute, 3 Punkte)"}
            </p>

            <div className="grid grid-cols-1 gap-4">
              {availableAttributes.map((attr) => {
                const value = choices[attr] || 0;
                const currentValue = currentAttributes[attr];
                const newTotal = Math.min(currentValue + value, 20);
                const isMax = currentValue >= 20;

                return (
                  <div
                    key={attr}
                    className="bg-muted/30 p-6 rounded-2xl border border-border"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-lg font-black text-foreground">
                          {ATTRIBUTE_NAMES[attr]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Aktuell: {currentAttributes[attr]} →{" "}
                          <span
                            className={cn(
                              "font-bold",
                              isMax ? "text-primary" : "text-foreground",
                            )}
                          >
                            {newTotal}
                          </span>
                          {isMax && " (Max)"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDecrement(attr)}
                          disabled={value === 0}
                          className={cn(
                            "p-2 rounded-lg border transition-all",
                            value === 0
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-card active:scale-90",
                          )}
                        >
                          <Minus size={20} />
                        </button>
                        <span className="text-2xl font-black text-primary min-w-[3rem] text-center">
                          {value > 0 ? `+${value}` : "0"}
                        </span>
                        <button
                          onClick={() => handleIncrement(attr)}
                          disabled={
                            isMax ||
                            value > 0 ||
                            selectedCount >= 3 ||
                            (mode === "plus2plus1" &&
                              Object.values(choices).some((v) => v === 2) &&
                              Object.values(choices).filter((v) => v === 1)
                                .length >= 2)
                          }
                          className={cn(
                            "p-2 rounded-lg border transition-all",
                            isMax ||
                              (mode === "plus2plus1" && value >= 2) ||
                              (mode === "allplus1" && value >= 1) ||
                              selectedCount >= 3
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-card active:scale-90",
                          )}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-wider border border-border hover:bg-muted transition-all"
            >
              Abbrechen
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValid}
              className={cn(
                "flex-1 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all",
                isValid
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "opacity-50 cursor-not-allowed bg-muted",
              )}
            >
              Bestätigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
