import React from 'react';
import { Character } from '../../lib/types';
import { Shield, Zap, Wind, Heart, Sparkles } from 'lucide-react';
import { formatModifier } from '../../lib/math';
import { calculateDerivedStats } from '../../lib/characterLogic';

interface Props {
  character: Character;
}

export const CombatStats: React.FC<Props> = ({ character }) => {
  const stats = calculateDerivedStats(character);
  
  const speed = 30; // ft (In Phase 4 we will get this from Species)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 w-full p-6">
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
        value={character.meta.use_metric ? `${(speed * 0.3).toFixed(1)}m` : `${speed}ft`} 
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
  );
}

function StatCard({ icon: Icon, label, value, color, isMain = false }: { icon: any, label: string, value: any, color: string, isMain?: boolean }) {
  const colorMap: any = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20'
  };

  return (
    <div className={cn(
      "bg-card p-8 rounded-[2.5rem] border border-border flex flex-col items-center justify-center transition-all group relative overflow-hidden active:scale-95 shadow-xl shadow-foreground/[0.02]",
      isMain ? "border-b-8 border-b-red-500/20" : ""
    )}>
      <div className={cn("absolute top-0 left-0 w-full h-1 opacity-20 transition-opacity group-hover:opacity-100", color === 'primary' ? 'bg-primary' : color === 'amber' ? 'bg-amber-500' : color === 'blue' ? 'bg-blue-500' : 'bg-red-500')} />
      
      <div className={cn("p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform relative", colorMap[color])}>
        <Icon size={32} />
        {isMain && <Sparkles size={16} className="absolute -top-1 -right-1 text-red-400 animate-pulse" />}
      </div>

      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 opacity-50 text-center">{label}</span>
      <span className="text-5xl font-black text-foreground tracking-tighter leading-none">{value}</span>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
