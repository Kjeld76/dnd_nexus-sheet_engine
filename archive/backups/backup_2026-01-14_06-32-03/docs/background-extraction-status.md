# Status: Hintergrund-Extraktion

## Aktueller Stand

**Gefunden:** 15 von 16 Hintergründen im Text
**Extrahiert:** 9 eindeutige Hintergründe
**Korrigiert:** 8 Hintergründe haben korrekte Namen

## Problem-Analyse

### Gefundene Hintergründe (15 Marker):

1. ✅ Akolyth - Intelligenz, Weisheit, Charisma | Eingeweihter der Magie
2. ✅ Adeliger - Stärke, Intelligenz, Charisma | Begabt
3. ✅ Bauer - Stärke, Konstitution, Weisheit | Zäh
4. ✅ Einsiedler - Konstitution, Weisheit, Charisma | Heiler
5. ✅ Händler - Konstitution, Intelligenz, Charisma | Glückspilz
6. ✅ Handwerker - Stärke, Geschicklichkeit, Intelligenz | Handwerker
7. ✅ Krimineller - Geschicklichkeit, Konstitution, Intelligenz | Wachsam
8. ✅ Reisender - Geschicklichkeit, Weisheit, Charisma | Glückspilz
9. ✅ Scharlatan - Geschicklichkeit, Konstitution, Charisma | Begabt
10. ❓ Unbekannt - Geschicklichkeit, Intelligenz, Weisheit | Begabt
11. ❓ Unbekannt - Stärke, Geschicklichkeit, Weisheit | Kneipenschläger (FALSCH - sollte "Wachsam" sein?)
12. ❓ Unbekannt - Stärke, Geschicklichkeit, Konstitution | Wilder Angreifer (Soldat?)
13. ❓ Unbekannt - Stärke, Geschicklichkeit, Charisma | Musiker (FALSCH - sollte "Begabt" sein? Unterhaltungskünstler?)
14. ❓ Unbekannt - Stärke, Intelligenz, Weisheit | Wachsam
15. ❓ Unbekannt - Geschicklichkeit, Konstitution, Weisheit | Eingeweihter der Magie (Wegfinder?)

### Fehlende Hintergründe (1):

- ❌ Einer der 16 Hintergründe wird nicht gefunden

## Probleme

1. **Falsche Talent-Erkennung**: 
   - Hintergrund 11: "Kneipenschläger" statt korrektem Talent
   - Hintergrund 13: "Musiker" statt "Begabt"
   - Dies deutet auf Parsing-Fehler durch zweispaltige Anordnung hin

2. **Fehlender Hintergrund**: 
   - Nur 15 Marker gefunden, aber 16 erwartet
   - Möglicherweise wird einer übersprungen oder hat eine andere Struktur

3. **Zweispaltige Anordnung**: 
   - Text kann auseinandergerissen sein
   - Talent und Fertigkeiten können in falscher Reihenfolge erscheinen

## Lösungsansätze

### 1. Verbesserte Talent-Erkennung
- Suche nach "Talent:" in größerem Kontext (30+ Zeilen)
- Ignoriere falsche Matches (z.B. "Kneipenschläger", "Musiker")
- Nutze bekannte Hintergrund-Talente als Whitelist

### 2. Fehlenden Hintergrund finden
- Prüfe, ob einer der Hintergründe eine andere Struktur hat
- Suche nach alternativen Markern (z.B. direkt "Talent:" ohne "Attributswerte:")
- Prüfe, ob der letzte Hintergrund nach "KAPITEL 5" kommt

### 3. Manuelle Zuordnung
- Nutze `background-name-corrections.json` für die 6 unbekannten Hintergründe
- Vergleiche mit dem Buch (Seiten 178-185)

## Nächste Schritte

1. ✅ Führe `pnpm analyze:backgrounds` aus
2. ✅ Vergleiche mit Buch (PHB 2024, Seiten 178-185)
3. ✅ Trage fehlende Zuordnungen in `background-name-corrections.json` ein
4. ✅ Führe `pnpm correct:backgrounds` aus
5. ✅ Prüfe, ob alle 16 Hintergründe jetzt korrekt sind
