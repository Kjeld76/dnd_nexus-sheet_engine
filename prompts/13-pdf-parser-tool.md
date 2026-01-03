# Prompt 13: PDF Parser Tool

```
Create PDF parser in tools/parser/:

1. tools/parser/extract.ts:
   - parseDOCX(filePath: string): Promise<Spell[]>
     - Use mammoth to extract text
     - Regex patterns for spell format
     - Extract: name, level, school, casting time, range, components, duration, description
   - parsePDF(filePath: string): Promise<Spell[]>
     - Use pdf-parse
     - Fallback if DOCX fails
   - validateSpell(spell: Spell): boolean
     - Check against JSON schema

2. tools/parser/schemas.ts:
   - Export JSON schemas for validation
   - Spell, Species, Class schemas

3. tools/parser/cli.ts:
   - CLI interface for running parser
   - Arguments: input file, output JSON
   - Progress logging
   - Error reporting

4. Add npm script: "parse": "tsx tools/parser/cli.ts"
```



