// Lookup-Tabelle für Hintergrund-Identifikation
// Basierend auf eindeutigen Kombinationen von Attributswerten, Talent und erster Fertigkeit

export const backgroundLookup: Record<string, string> = {
  // Format: "Attribut1,Attribut2,Attribut3|Talent|ErsteFertigkeit"
  
  // Adeliger
  "Stärke,Intelligenz,Charisma|Begabt|Geschichte": "Adeliger",
  "Stärke,Intelligenz,Charisma|Begabt|Überzeugen": "Adeliger",
  
  // Akolyth
  "Intelligenz,Weisheit,Charisma|Eingeweihter der Magie|Motiv erkennen": "Akolyth",
  "Intelligenz,Weisheit,Charisma|Eingeweihter der Magie|Religion": "Akolyth",
  
  // Bauer
  "Stärke,Konstitution,Weisheit|Zäh|Mit Tieren umgehen": "Bauer",
  "Stärke,Konstitution,Weisheit|Zäh|Naturkunde": "Bauer",
  
  // Einsiedler
  "Konstitution,Weisheit,Intelligenz|Heiler|Heilkunde": "Einsiedler",
  "Konstitution,Weisheit,Intelligenz|Heiler|Religion": "Einsiedler",
  
  // Händler
  "Geschicklichkeit,Intelligenz,Charisma|Glückspilz|Einschüchtern": "Händler",
  "Geschicklichkeit,Intelligenz,Charisma|Glückspilz|Überzeugen": "Händler",
  
  // Handwerker
  "Stärke,Geschicklichkeit,Intelligenz|Handwerker|Nachforschungen": "Handwerker",
  "Stärke,Geschicklichkeit,Intelligenz|Handwerker|Überzeugen": "Handwerker",
  
  // Krimineller
  "Geschicklichkeit,Konstitution,Intelligenz|Wachsam|Fingerfertigkeit": "Krimineller",
  "Geschicklichkeit,Konstitution,Intelligenz|Wachsam|Heimlichkeit": "Krimineller",
  
  // Reisender
  "Geschicklichkeit,Weisheit,Charisma|Glückspilz|Motiv erkennen": "Reisender",
  "Geschicklichkeit,Weisheit,Charisma|Glückspilz|Überzeugen": "Reisender",
  
  // Scharlatan
  "Geschicklichkeit,Weisheit,Charisma|Glückspilz|Täuschen": "Scharlatan",
  "Geschicklichkeit,Weisheit,Charisma|Glückspilz|Fingerfertigkeit": "Scharlatan",
  
  // Schreiber
  "Intelligenz,Weisheit,Charisma|Wachsam|Geschichte": "Schreiber",
  "Intelligenz,Weisheit,Charisma|Wachsam|Untersuchen": "Schreiber",
  
  // Seemann
  "Geschicklichkeit,Weisheit,Charisma|Zäh|Athletik": "Seemann",
  "Geschicklichkeit,Weisheit,Charisma|Zäh|Wahrnehmung": "Seemann",
  
  // Soldat
  "Stärke,Konstitution,Intelligenz|Wilder Angreifer|Athletik": "Soldat",
  "Stärke,Konstitution,Intelligenz|Wilder Angreifer|Einschüchtern": "Soldat",
  
  // Unterhaltungskünstler
  "Geschicklichkeit,Intelligenz,Charisma|Begabt|Akrobatik": "Unterhaltungskünstler",
  "Geschicklichkeit,Intelligenz,Charisma|Begabt|Aufführung": "Unterhaltungskünstler",
  
  // Wache
  "Geschicklichkeit,Weisheit,Intelligenz|Wachsam|Einschüchtern": "Wache",
  "Geschicklichkeit,Weisheit,Intelligenz|Wachsam|Wahrnehmung": "Wache",
  
  // Wegfinder
  "Geschicklichkeit,Weisheit,Intelligenz|Wachsam|Überleben": "Wegfinder",
  "Geschicklichkeit,Weisheit,Intelligenz|Wachsam|Wahrnehmung": "Wegfinder",
  
  // Weiser
  "Intelligenz,Weisheit,Charisma|Heiler|Geschichte": "Weiser",
  "Intelligenz,Weisheit,Charisma|Heiler|Untersuchen": "Weiser",
};

export function identifyBackground(
  abilityScores: string[] | undefined,
  feat: string | undefined,
  firstSkill: string | undefined
): string | null {
  if (!abilityScores || abilityScores.length !== 3 || !feat || !firstSkill) {
    return null;
  }
  
  // Normalisiere Werte
  const normalizedScores = abilityScores
    .map(s => s.trim())
    .sort()
    .join(',');
  
  const normalizedFeat = feat
    .replace(/\s*\(siehe.*?\)/gi, '')
    .trim();
  
  const normalizedSkill = firstSkill.trim();
  
  // Versuche exakte Übereinstimmung
  const key1 = `${normalizedScores}|${normalizedFeat}|${normalizedSkill}`;
  if (backgroundLookup[key1]) {
    return backgroundLookup[key1];
  }
  
  // Versuche ohne erste Fertigkeit (nur Attributswerte + Talent)
  const key2 = `${normalizedScores}|${normalizedFeat}|`;
  for (const [lookupKey, name] of Object.entries(backgroundLookup)) {
    if (lookupKey.startsWith(key2)) {
      return name;
    }
  }
  
  // Versuche nur mit Attributswerten + Talent (erste Fertigkeit variabel)
  for (const [lookupKey, name] of Object.entries(backgroundLookup)) {
    const [scores, lookupFeat] = lookupKey.split('|');
    if (scores === normalizedScores && lookupFeat === normalizedFeat) {
      return name;
    }
  }
  
  return null;
}
