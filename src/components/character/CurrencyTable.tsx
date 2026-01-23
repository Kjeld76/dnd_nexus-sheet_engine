import React from "react";
import { Coins, Circle } from "lucide-react";
import { useCharacterStore } from "../../lib/store";

export const CurrencyTable: React.FC = () => {
  const { currentCharacter, updateMeta } = useCharacterStore();

  if (!currentCharacter) return null;

  const currencies = [
    {
      key: "currency_platinum",
      label: "Platin",
      abbr: "PP",
      color: "text-slate-300",
      bg: "bg-slate-300/10",
      border: "border-slate-300/30",
    },
    {
      key: "currency_gold",
      label: "Gold",
      abbr: "GP",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/30",
    },
    {
      key: "currency_electrum",
      label: "Elektrum",
      abbr: "EP",
      color: "text-blue-300",
      bg: "bg-blue-300/10",
      border: "border-blue-300/30",
    },
    {
      key: "currency_silver",
      label: "Silber",
      abbr: "SP",
      color: "text-slate-400",
      bg: "bg-slate-400/10",
      border: "border-slate-400/30",
    },
    {
      key: "currency_copper",
      label: "Kupfer",
      abbr: "CP",
      color: "text-orange-600",
      bg: "bg-orange-600/10",
      border: "border-orange-600/30",
    },
  ] as const;

  const handleChange = (key: string, value: string) => {
    const numValue = parseInt(value) || 0;
    updateMeta({ [key]: numValue });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Coins size={20} className="text-primary" />
        <h3 className="text-lg font-black italic font-serif">Währung</h3>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {currencies.map((c) => (
          <div
            key={c.key}
            className={`flex flex-col gap-1.5 p-3 rounded-xl border-2 transition-all ${c.bg} ${c.border}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${c.color}`}
              >
                {c.label}
              </span>
              <Circle size={10} className={`fill-current ${c.color}`} />
            </div>
            <div className="relative group">
              <input
                type="number"
                min="0"
                value={
                  (currentCharacter.meta[
                    c.key as keyof typeof currentCharacter.meta
                  ] as number) || 0
                }
                onChange={(e) => handleChange(c.key, e.target.value)}
                className="w-full bg-transparent text-lg font-black font-serif focus:outline-none focus:ring-0 text-foreground"
              />
              <span className="absolute bottom-0 right-0 text-[10px] font-black text-muted-foreground/30 uppercase group-hover:text-primary transition-colors pointer-events-none">
                {c.abbr}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
