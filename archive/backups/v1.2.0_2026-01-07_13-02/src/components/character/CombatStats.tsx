import React from 'react';
import { Character } from '../../lib/types';
import { Shield, Zap, Wind, Heart } from 'lucide-react';
import { calculateModifier, formatModifier } from '../../lib/math';

interface Props {
  character: Character;
}

export const CombatStats: React.FC<Props> = ({ character }) => {
  const dexMod = calculateModifier(character.attributes.dex);
  const conMod = calculateModifier(character.attributes.con);
  
  // Dummy calculations
  const ac = 10 + dexMod;
  const initiative = dexMod;
  const speed = 30; // ft
  const hp = 10 + conMod;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center shadow-lg hover:border-primary-500 transition-all">
        <Shield className="w-6 h-6 text-primary-500 mb-2" />
        <span className="text-xs text-gray-500 uppercase font-bold">Rüstungsklasse</span>
        <span className="text-3xl font-bold text-white">{ac}</span>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center shadow-lg hover:border-primary-500 transition-all">
        <Zap className="w-6 h-6 text-yellow-500 mb-2" />
        <span className="text-xs text-gray-500 uppercase font-bold">Initiative</span>
        <span className="text-3xl font-bold text-white">
          {formatModifier(initiative)}
        </span>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center shadow-lg hover:border-primary-500 transition-all">
        <Wind className="w-6 h-6 text-blue-400 mb-2" />
        <span className="text-xs text-gray-500 uppercase font-bold">Bewegung</span>
        <span className="text-3xl font-bold text-white">
          {character.meta.use_metric ? `${(speed * 0.3).toFixed(1)}m` : `${speed}ft`}
        </span>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center shadow-lg hover:border-primary-500 transition-all border-b-4 border-b-red-600">
        <Heart className="w-6 h-6 text-red-500 mb-2" />
        <span className="text-xs text-gray-500 uppercase font-bold">Trefferpunkte</span>
        <span className="text-3xl font-bold text-white">{hp}</span>
      </div>
    </div>
  );
};

