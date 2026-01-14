import React from "react";
import { Species } from "../../lib/types";
import { Zap, TrendingUp, Shield } from "lucide-react";
import { parseTraitEffects, TraitEffect } from "../../lib/traitParser";

interface Props {
  species?: Species;
}

const getEffectIcon = (effect: TraitEffect) => {
  switch (effect.type) {
    case "advantage":
      return <TrendingUp size={16} className="text-emerald-500" />;
    case "resistance":
      return <Shield size={16} className="text-amber-500" />;
    default:
      return <Zap size={16} className="text-primary" />;
  }
};

const getEffectLabel = (effect: TraitEffect): string => {
  switch (effect.type) {
    case "advantage":
      return "Vorteil";
    case "resistance":
      return "Resistenz";
    case "bonus":
      return `+${effect.value}`;
    default:
      return "";
  }
};

export const SpeciesTraits: React.FC<Props> = ({ species }) => {
  if (!species || !species.data?.traits || species.data.traits.length === 0) {
    return null;
  }

  const traits = Array.isArray(species.data.traits) ? species.data.traits : [];
  const asString = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : fallback;

  return (
    <div className="bg-card p-6 rounded-[3.5rem] border-2 border-border shadow-2xl shadow-foreground/[0.02]">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-border">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Zap size={24} className="text-primary" />
        </div>
        <div>
          <h3 className="text-2xl font-black italic font-serif text-foreground">
            Spezies-Merkmale
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
            {species.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {traits.map((trait, idx) => {
          const t = (trait ?? {}) as { name?: unknown; description?: unknown };
          const traitName = asString(t.name, `Trait ${idx + 1}`);
          const effects = parseTraitEffects(trait);
          return (
            <div
              key={`${traitName}-${idx}`}
              className="bg-background p-6 rounded-[2.5rem] border-2 border-border hover:border-primary/40 transition-all group relative overflow-hidden"
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-1000 opacity-0 group-hover:opacity-100" />
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform shrink-0">
                    <Zap size={20} className="text-primary" />
                  </div>
                  <h4 className="text-lg font-black text-foreground">
                    {traitName}
                  </h4>
                </div>
                {effects.length > 0 && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {effects.map((effect, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-lg border border-primary/20"
                        title={`${getEffectLabel(effect)}: ${effect.target}`}
                      >
                        {getEffectIcon(effect)}
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                          {getEffectLabel(effect)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic border-l-4 border-border/50 pl-6 group-hover:border-primary/30 transition-colors">
                {asString(t.description)}
              </p>
              {effects.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
                    Mechanische Effekte:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {effects.map((effect, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50"
                      >
                        <span className="font-bold text-primary">
                          {getEffectLabel(effect)}
                        </span>{" "}
                        <span className="opacity-80">auf {effect.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
