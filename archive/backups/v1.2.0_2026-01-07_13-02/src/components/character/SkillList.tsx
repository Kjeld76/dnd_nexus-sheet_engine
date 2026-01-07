import React from 'react';
import { Character } from '../../lib/types';
import { Users } from 'lucide-react';
import { calculateModifier, formatModifier } from '../../lib/math';

interface Props {
  character: Character;
  onToggleProficiency: (skillName: string) => void;
}

const SKILLS = [
  { name: 'Acrobatics', attr: 'dex' },
  { name: 'Animal Handling', attr: 'wis' },
  { name: 'Arcana', attr: 'int' },
  { name: 'Athletics', attr: 'str' },
  { name: 'Deception', attr: 'cha' },
  { name: 'History', attr: 'int' },
  { name: 'Insight', attr: 'wis' },
  { name: 'Intimidation', attr: 'cha' },
  { name: 'Investigation', attr: 'int' },
  { name: 'Medicine', attr: 'wis' },
  { name: 'Nature', attr: 'int' },
  { name: 'Perception', attr: 'wis' },
  { name: 'Performance', attr: 'cha' },
  { name: 'Persuasion', attr: 'cha' },
  { name: 'Religion', attr: 'int' },
  { name: 'Sleight of Hand', attr: 'dex' },
  { name: 'Stealth', attr: 'dex' },
  { name: 'Survival', attr: 'wis' },
];

export const SkillList: React.FC<Props> = ({ character, onToggleProficiency }) => {
  const calculateBonus = (skill: typeof SKILLS[0]) => {
    const attrValue = character.attributes[skill.attr as keyof typeof character.attributes];
    const attrMod = calculateModifier(attrValue);
    // Dummy check for proficiency
    return attrMod;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
        <Users className="w-5 h-5 text-primary-500" />
        <h2 className="text-xl font-bold">Fertigkeiten</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
        {SKILLS.map((skill) => (
          <div
            key={skill.name}
            className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                onChange={() => onToggleProficiency(skill.name)}
                className="w-4 h-4 rounded border-gray-600 text-primary-600 focus:ring-primary-500 bg-gray-900"
              />
              <span className="text-sm font-medium">{skill.name}</span>
              <span className="text-xs text-gray-500 uppercase">({skill.attr})</span>
            </div>
            <span className="font-bold text-secondary-400">
              {formatModifier(calculateBonus(skill))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

