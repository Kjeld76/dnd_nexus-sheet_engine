import React from "react";
import { Character, Class, Species, Weapon, Armor } from "../../lib/types";
import { Shield, Zap, Wind, Heart, Sparkles, Sword } from "lucide-react";
import { formatModifier } from "../../lib/math";
import { calculateDerivedStats } from "../../lib/characterLogic";

interface Props {
  character: Character;
  characterClass?: Class;
  characterSpecies?: Species;
  inventoryItems: (Weapon | Armor | any)[];
}

export const CombatStats: React.FC<Props> = ({
  character,
  characterClass,
  characterSpecies,
  inventoryItems,
}) => {
  const stats = calculateDerivedStats(
    character,
    characterClass,
    inventoryItems,
  );

  // Speed comes from species, not class (PHB 2024)
  const speed = characterSpecies?.data?.speed || 9; // default 9m (30ft)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3 w-full p-2.5">
        <StatCard
          icon={Shield}
          label="Rüstungsklasse"
          value={stats.ac}
          color="primary"
        />

        <StatCard
          icon={Zap}
          label="Initiative"
          value={formatModifier(stats.initiative)}
          color="amber"
        />

        <StatCard
          icon={Wind}
          label="Bewegung"
          value={
            character.meta.use_metric
              ? `${speed}m`
              : `${Math.round(speed / 0.3)}ft`
          }
          color="blue"
        />

        <StatCard
          icon={Heart}
          label="Trefferpunkte"
          value={stats.hp_max}
          color="red"
          isMain
        />
      </div>

      {stats.weapon_attacks.length > 0 && (
        <div className="px-3 space-y-3">
          <div className="flex items-center gap-2.5">
            <Sword size={18} className="text-primary" />
            <h3 className="text-lg font-black italic font-serif">Angriffe</h3>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.weapon_attacks.map((atk, i) => (
              <div
                key={atk.name + i}
                className="bg-card p-6 rounded-[2rem] border border-border flex justify-between items-center group hover:border-primary/30 transition-all shadow-xl shadow-foreground/[0.01]"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">
                    {atk.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground italic">
                    {atk.properties.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-50">
                      Bonus
                    </p>
                    <p className="text-2xl font-black text-primary">
                      {formatModifier(atk.attack_bonus)}
                    </p>
                  </div>
                  <div className="text-center bg-muted/50 px-4 py-2 rounded-xl">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-50">
                      Schaden
                    </p>
                    <p className="text-sm font-bold">{atk.damage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isMain = false,
}: {
  icon: any;
  label: string;
  value: any;
  color: string;
  isMain?: boolean;
}) {
  const colorMap: any = {
    primary: "text-primary bg-primary/10 border-primary/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
  };

  return (
    <div
      className={cn(
        "bg-card p-3 rounded-lg border border-border flex flex-col items-center justify-center transition-all group relative overflow-hidden active:scale-95 shadow-lg shadow-foreground/[0.02]",
        isMain ? "border-b-2 border-b-red-500/20" : "",
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-0 w-full h-1 opacity-20 transition-opacity group-hover:opacity-100",
          color === "primary"
            ? "bg-primary"
            : color === "amber"
              ? "bg-amber-500"
              : color === "blue"
                ? "bg-blue-500"
                : "bg-red-500",
        )}
      />

      <div
        className={cn(
          "p-2 rounded-md mb-2 group-hover:scale-110 transition-transform relative",
          colorMap[color],
        )}
      >
        <Icon size={18} />
        {isMain && (
          <Sparkles
            size={10}
            className="absolute -top-0.5 -right-0.5 text-red-400 animate-pulse"
          />
        )}
      </div>

      <span className="text-xs font-black text-muted-foreground/80 uppercase tracking-[0.25em] mb-1.5 opacity-80 text-center">
        {label}
      </span>
      <span className="text-2xl font-black text-foreground tracking-tighter leading-none">
        {value}
      </span>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
