export const SpellSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    level: { type: 'integer', minimum: 0, maximum: 9 },
    school: { 
      type: 'string', 
      enum: [
        'Verzauberung', 'Beschwörung', 'Verwandlung', 'Illusion',
        'Hervorrufung', 'Erkündung', 'Bannmagie', 'Nekromantie'
      ] 
    },
    casting_time: { type: 'string' },
    range: { type: 'string' },
    components: { type: 'string' },
    material_components: { type: 'string', nullable: true },
    duration: { type: 'string' },
    concentration: { type: 'boolean' },
    ritual: { type: 'boolean' },
    description: { type: 'string', minLength: 50 },
    higher_levels: { type: 'string', nullable: true },
    classes: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 12 },
    data: {
      type: 'object',
      properties: {
        scaling: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['slot_level', 'character_level'] },
            formula: { type: 'string' }
          }
        },
        attack_type: { type: 'string', enum: ['melee_spell', 'ranged_spell', 'save'] },
        save_ability: { type: 'string', enum: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] },
        damage: {
          type: 'object',
          properties: {
            dice: { type: 'string' },
            type: { type: 'string' }
          }
        }
      }
    }
  },
  required: [
    'id', 'name', 'level', 'school', 'casting_time', 'range', 
    'components', 'duration', 'concentration', 'ritual', 
    'description', 'classes', 'data'
  ]
};

export const ClassSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    hit_die: { type: 'integer', enum: [6, 8, 10, 12] },
    primary_ability: { type: 'array', items: { type: 'string' } },
    saving_throws: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 },
    proficiencies: {
      type: 'object',
      properties: {
        armor: { type: 'array', items: { type: 'string' } },
        weapons: { type: 'array', items: { type: 'string' } },
        tools: { type: 'array', items: { type: 'string' } },
        skills: {
          type: 'object',
          properties: {
            choose: { type: 'integer' },
            from: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    features_by_level: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            grants: { type: 'object' }
          },
          required: ['name', 'description']
        }
      }
    },
    subclasses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          features: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        required: ['name', 'features']
      }
    },
    spellcasting: {
      type: 'object',
      properties: {
        ability: { type: 'string', enum: ['INT', 'WIS', 'CHA'] },
        slots_by_level: { type: 'array', items: { type: 'array', items: { type: 'integer' } } },
        cantrips_known: { type: 'array', items: { type: 'integer' } },
        spells_known: { type: 'array', items: { type: 'integer' } },
        ritual_casting: { type: 'boolean' },
        spell_list: { type: 'array', items: { type: 'string' } }
      }
    },
    data: {
      type: 'object',
      properties: {
        hp_formula: {
          type: 'object',
          properties: {
            base: { type: 'string' },
            per_level: { type: 'string' }
          }
        },
        multiclass_requirements: {
          type: 'object',
          additionalProperties: { type: 'integer' }
        }
      }
    }
  },
  required: ['id', 'name', 'hit_die', 'primary_ability', 'saving_throws', 'proficiencies', 'features_by_level', 'data']
};

export const SpeciesSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    size: { type: 'string', enum: ['Small', 'Medium'] },
    speed: { type: 'integer' },
    ability_score_increase: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['fixed', 'choice'] },
        fixed: { type: 'object', additionalProperties: { type: 'integer' } },
        choice: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
            amount: { type: 'integer' }
          }
        }
      }
    },
    traits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          mechanical_effect: { type: 'object' }
        },
        required: ['name', 'description']
      }
    },
    languages: {
      type: 'object',
      properties: {
        known: { type: 'array', items: { type: 'string' } },
        choose: { type: 'integer' }
      }
    },
    data: {
      type: 'object',
      properties: {
        darkvision: { type: 'integer' },
        flying_speed: { type: 'integer' },
        swimming_speed: { type: 'integer' }
      }
    }
  },
  required: ['id', 'name', 'size', 'speed', 'ability_score_increase', 'traits', 'languages', 'data']
};

