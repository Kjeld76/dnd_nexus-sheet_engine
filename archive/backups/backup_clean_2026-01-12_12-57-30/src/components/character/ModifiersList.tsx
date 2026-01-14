import React from "react";
import { Modifier } from "../../lib/types";
import { Trash2, PlusCircle, Sparkles } from "lucide-react";

interface Props {
  modifiers: Modifier[];
  onRemove: (id: string) => void;
}

export const ModifiersList: React.FC<Props> = ({ modifiers, onRemove }) => {
  return (
    <div className="bg-card p-10 rounded-[3.5rem] border border-border shadow-2xl shadow-foreground/[0.02] h-full flex flex-col">
      <div className="flex items-center justify-between mb-10 border-b border-border pb-8">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-primary/10 rounded-2xl shadow-inner relative group">
            <PlusCircle className="w-8 h-8 text-primary group-hover:rotate-90 transition-transform" />
            <Sparkles
              size={14}
              className="absolute -top-1 -right-1 text-primary opacity-40 animate-pulse"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter italic font-serif">
              Buffs
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
              Active Modifiers
            </p>
          </div>
        </div>
      </div>

      {modifiers.length === 0 ? (
        <div className="flex-1 py-20 text-center bg-muted/30 rounded-[3rem] border border-dashed border-border flex flex-col items-center justify-center gap-6 group hover:border-primary/20 transition-all">
          <div className="p-6 bg-background rounded-full shadow-inner opacity-20 group-hover:opacity-40 transition-opacity">
            <Sparkles size={40} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm italic font-medium max-w-[180px]">
            Noch keine magischen Effekte aktiv.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {modifiers.map((mod) => (
            <div
              key={mod.id}
              className="flex items-center justify-between p-6 bg-background rounded-[2rem] border border-border group hover:border-primary/40 transition-all shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col -space-y-0.5">
                <span className="text-base font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                  {mod.target}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                  {mod.source}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div
                  className={cn(
                    "font-black text-2xl tracking-tighter min-w-[60px] text-right",
                    mod.value >= 0 ? "text-emerald-500" : "text-red-500",
                  )}
                >
                  {mod.modifier_type === "Add"
                    ? mod.value >= 0
                      ? `+${mod.value}`
                      : mod.value
                    : mod.modifier_type === "Multiply"
                      ? `x${mod.value}`
                      : `→ ${mod.value}`}
                </div>
                <button
                  onClick={() => onRemove(mod.id)}
                  className="p-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all active:scale-90"
                  title="Effekt bannen"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
