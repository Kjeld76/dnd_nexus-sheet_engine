import React from "react";
import { Feat } from "../../lib/types";
import { Award, X } from "lucide-react";

interface Props {
  feats: Feat[];
  characterFeats: string[];
  onRemove: (featId: string) => void;
}

export const FeatsList: React.FC<Props> = ({
  feats,
  characterFeats,
  onRemove,
}) => {
  const activeFeats = feats.filter((f) => characterFeats.includes(f.id));

  return (
    <div className="bg-card p-10 rounded-[3.5rem] border-2 border-border shadow-2xl shadow-foreground/[0.02] h-full flex flex-col">
      <div className="flex items-center justify-between mb-10 border-b-2 border-border pb-8">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-primary/10 rounded-2xl shadow-inner relative group">
            <Award className="w-8 h-8 text-primary group-hover:rotate-12 transition-transform" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter italic font-serif">
              Talente
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
              Character Feats
            </p>
          </div>
        </div>
      </div>

      {activeFeats.length === 0 ? (
        <div className="flex-1 py-20 text-center bg-muted/30 rounded-[3rem] border border-dashed border-border flex flex-col items-center justify-center gap-6 group hover:border-primary/20 transition-all">
          <div className="p-6 bg-background rounded-full shadow-inner opacity-20 group-hover:opacity-40 transition-opacity">
            <Award size={40} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm italic font-medium max-w-[180px]">
            Noch keine Talente erworben.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeFeats.map((feat) => (
            <div
              key={feat.id}
              className="flex flex-col gap-3 p-6 bg-background rounded-[2rem] border-2 border-border group hover:border-primary/40 transition-all shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors mb-2">
                    {feat.name}
                  </h3>
                  {feat.category && (
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                      {feat.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRemove(feat.id)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90 ml-4"
                  title="Talent entfernen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {feat.data?.description && (
                <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-4">
                  {feat.data.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
