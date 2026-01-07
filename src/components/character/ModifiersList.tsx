import React from 'react';
import { Modifier } from '../../lib/types';
import { Trash2, PlusCircle } from 'lucide-react';

interface Props {
  modifiers: Modifier[];
  onRemove: (id: string) => void;
}

export const ModifiersList: React.FC<Props> = ({ modifiers, onRemove }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-bold">Modifikatoren</h2>
        </div>
      </div>
      
      {modifiers.length === 0 ? (
        <p className="text-gray-500 text-sm italic py-4">Keine aktiven Modifikatoren.</p>
      ) : (
        <div className="space-y-3">
          {modifiers.map((mod) => (
            <div
              key={mod.id}
              className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700 group hover:border-gray-500 transition-all"
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white uppercase tracking-tight">
                  {mod.target}
                </span>
                <span className="text-xs text-gray-500">{mod.source}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold ${mod.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {mod.modifier_type === 'Add' ? (mod.value >= 0 ? `+${mod.value}` : mod.value) : 
                   mod.modifier_type === 'Multiply' ? `x${mod.value}` : `Override: ${mod.value}`}
                </span>
                <button
                  onClick={() => onRemove(mod.id)}
                  className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};












