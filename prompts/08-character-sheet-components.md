# Prompt 8: Character Sheet Components

```
Create Character Sheet components in src/components/character/:

1. AttributeBlock.tsx:
   - Props: attribute name, value, onChange
   - Display: attribute name, score input, calculated modifier
   - Styling: Tailwind with dark theme
   - Show modifier as +X or -X

2. SkillList.tsx:
   - Props: character, onToggleProficiency
   - Display all 18 skills grouped by attribute
   - Show checkboxes for proficiency/expertise
   - Calculate and display total bonus
   - Use lucide-react for icons

3. ModifiersList.tsx:
   - Props: modifiers, onRemove
   - Display each modifier with source, target, type, value
   - Delete button for each
   - Group by target

4. CombatStats.tsx:
   - Display AC, Initiative, Speed, HP
   - Calculate from character attributes
   - Responsive grid layout

5. Common styling pattern:
   - Dark theme (bg-gray-900, text-white)
   - Card-based layout with rounded corners
   - Hover effects on interactive elements
```




