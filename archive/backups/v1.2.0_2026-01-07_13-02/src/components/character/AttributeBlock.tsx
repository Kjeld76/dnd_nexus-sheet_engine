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
    <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-md transition-all hover:border-primary-500 w-full max-w-[120px]">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
        {name}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        onBlur={onBlur}
        className="w-16 text-2xl font-bold bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
      />
      <div className="mt-2 text-xl font-bold text-secondary-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-700 min-w-[50px] text-center">
        {modifierText}
      </div>
    </div>
  );
};

