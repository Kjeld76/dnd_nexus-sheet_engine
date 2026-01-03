export const SpellSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    level: { type: 'integer' },
    school: { type: 'string' },
    casting_time: { type: 'string' },
    range: { type: 'string' },
    components: { type: 'string' },
    duration: { type: 'string' },
    description: { type: 'string' },
  },
  required: ['name', 'level', 'school', 'description'],
};

export const SpeciesSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    traits: { type: 'array', items: { type: 'object' } },
  },
  required: ['name'],
};



