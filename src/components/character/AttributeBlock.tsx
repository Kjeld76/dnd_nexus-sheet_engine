import React from 'react';
import { calculateModifier, formatModifier } from '../../lib/math';

interface Props {
  name: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
}

export const AttributeBlock: React.FC<Props> = ({ name, value, onChange, onBlur }) => {
  const modifier = calculateModifier(value);
  const modifierText = formatModifier(modifier);

  return (
    <div className="flex flex-col items-center p-6 bg-card rounded-[2rem] border border-border shadow-xl shadow-foreground/[0.02] transition-all hover:border-primary/40 w-full group relative overflow-hidden active:scale-[0.98]">
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/10 group-hover:bg-primary/40 transition-all duration-500" />
      
      <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] mb-4">
        {name}
      </span>

      <div className="relative w-full">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          onBlur={onBlur}
          className="w-full text-4xl font-black bg-transparent text-center focus:outline-none transition-all tracking-tighter text-foreground selection:bg-primary/20"
        />
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none" />
      </div>

      <div className="mt-4 w-full flex justify-center">
        <div className="text-xl font-black text-primary bg-muted/50 px-6 py-2 rounded-2xl border border-border min-w-[70px] text-center shadow-inner tracking-tight group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
          {modifierText}
        </div>
      </div>
    </div>
  );
}
