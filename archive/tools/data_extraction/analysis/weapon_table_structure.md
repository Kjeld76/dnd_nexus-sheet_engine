# Weapon Table Structure Analysis (PHB 2024)

## Source: PHB 2024 (DOCX & PDF)
- **Location**: Chapter 6: Equipment, Page 213-215 (PDF)
- **Format**: Table with columns

## Columns identified:
1. **Name**: Weapon name (e.g., "Langschwert")
2. **Schaden**: Damage dice + Damage type (e.g., "1W8 Hieb")
3. **Eigenschaften**: Comma-separated list (e.g., "Vielseitig (1W10)")
4. **Meisterung**: Single mastery trait (e.g., "Auslaugen")
5. **Gewicht**: Weight in kg (e.g., "1,5 kg")
6. **Kosten**: Cost in gold/silver pieces (e.g., "15 GM")

## Categories:
- **Einfache Nahkampfwaffen**
- **Einfache Fernkampfwaffen**
- **Nahkampf-Kriegswaffen**
- **Fernkampf-Kriegswaffen**

## Parsing Challenges:
- Ranges are in meters (6/18) in German PHB 2024.
- Versatile damage is in parentheses within the properties column.
- Thrown range is in parentheses within the properties column.
- Weight and Cost need conversion to numerical values (kg -> float, GM/SM -> integer/float).






