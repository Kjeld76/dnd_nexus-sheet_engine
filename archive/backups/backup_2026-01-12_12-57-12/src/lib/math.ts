export const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

export const calculateLevelFromXP = (xp: number): number => {
  // Epic Tier (21-30)
  if (xp >= 1055000) return 30;
  if (xp >= 965000) return 29;
  if (xp >= 875000) return 28;
  if (xp >= 795000) return 27;
  if (xp >= 715000) return 26;
  if (xp >= 645000) return 25;
  if (xp >= 575000) return 24;
  if (xp >= 515000) return 23;
  if (xp >= 455000) return 22;
  if (xp >= 405000) return 21;

  // Core Tier (1-20)
  if (xp >= 355000) return 20;
  if (xp >= 305000) return 19;
  if (xp >= 265000) return 18;
  if (xp >= 225000) return 17;
  if (xp >= 195000) return 16;
  if (xp >= 165000) return 15;
  if (xp >= 140000) return 14;
  if (xp >= 120000) return 13;
  if (xp >= 100000) return 12;
  if (xp >= 85000) return 11;
  if (xp >= 64000) return 10;
  if (xp >= 48000) return 9;
  if (xp >= 34000) return 8;
  if (xp >= 23000) return 7;
  if (xp >= 14000) return 6;
  if (xp >= 6500) return 5;
  if (xp >= 2700) return 4;
  if (xp >= 900) return 3;
  if (xp >= 300) return 2;
  return 1;
};

export const getXPForNextLevel = (level: number): number | null => {
  const xpTable = [
    300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
    120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000, 405000,
    455000, 515000, 575000, 645000, 715000, 795000, 875000, 965000, 1055000,
  ];
  if (level >= 30) return null;
  return xpTable[level - 1];
};

export const calculateProficiencyBonus = (level: number): number => {
  if (level >= 29) return 9;
  if (level >= 25) return 8;
  if (level >= 21) return 7;
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
};

export const formatModifier = (mod: number): string => {
  return mod >= 0 ? `+${mod}` : `${mod}`;
};
