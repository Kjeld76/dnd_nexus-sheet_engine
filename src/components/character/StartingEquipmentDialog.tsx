import { useState } from "react";
import { X } from "lucide-react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StructuredItem {
  name: string;
  quantity: number;
  unit: string | null;
  variant: string | null;
}

interface EquipmentOption {
  label: string;
  items: Array<string | StructuredItem> | null;
  gold: number | null;
}

interface Props {
  backgroundName: string;
  options: EquipmentOption[];
  onConfirm: (selectedOption: EquipmentOption) => void;
  onCancel: () => void;
}

export const StartingEquipmentDialog: React.FC<Props> = ({
  backgroundName,
  options,
  onConfirm,
  onCancel,
}) => {
  const [selectedOption, setSelectedOption] = useState<EquipmentOption | null>(
    options[0] || null,
  );

  const handleConfirm = () => {
    if (selectedOption) {
      onConfirm(selectedOption);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-border flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm">
          <div>
            <h2 className="text-3xl font-black italic font-serif text-foreground mb-2">
              Startausrüstung wählen
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
          <div className="space-y-4">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(option)}
                className={cn(
                  "w-full p-6 rounded-2xl border transition-all text-left",
                  selectedOption === option
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 border-border hover:bg-muted/50",
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-lg">Option {option.label}</div>
                  {selectedOption === option && (
                    <div className="text-sm opacity-80">✓ Ausgewählt</div>
                  )}
                </div>

                <div className="space-y-2">
                  {option.items && option.items.length > 0 ? (
                    <div>
                      <div className="text-sm font-semibold mb-1 opacity-80">
                        Gegenstände:
                      </div>
                      <div className="text-sm opacity-70 space-y-1">
                        {option.items.map((item, idx) => {
                          if (typeof item === "string") {
                            return <div key={idx}>{item}</div>;
                          } else {
                            // StructuredItem format
                            let displayText = item.name;
                            if (item.variant) {
                              displayText += ` (${item.variant})`;
                            }
                            if (item.quantity > 1) {
                              displayText = `${item.quantity}x ${displayText}`;
                            }
                            if (item.unit) {
                              displayText += ` (${item.quantity} ${item.unit})`;
                            }
                            return <div key={idx}>{displayText}</div>;
                          }
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm opacity-60">Keine Gegenstände</div>
                  )}

                  {option.gold !== null && option.gold > 0 && (
                    <div className="text-sm font-semibold opacity-80">
                      Gold: {option.gold} GM
                    </div>
                  )}

                  {(!option.items || option.items.length === 0) &&
                    (!option.gold || option.gold === 0) && (
                      <div className="text-sm opacity-60">
                        Nur {option.gold || 50} GM
                      </div>
                    )}
                </div>
              </button>
            ))}
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
              disabled={!selectedOption}
              className={cn(
                "flex-1 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all",
                selectedOption
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
