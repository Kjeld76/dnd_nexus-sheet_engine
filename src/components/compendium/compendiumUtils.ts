import type { LucideIcon } from "lucide-react";
import type {
  Armor,
  Background,
  Class,
  Equipment,
  Feat,
  Item,
  MagicItem,
  Skill,
  Species,
  Spell,
  Tool,
  Weapon,
} from "../../lib/types";

/** Shared helpers/types for `Compendium.tsx` to keep the component file readable. */

export type MainCategory = "magic" | "characters" | "arsenal";

export type Tab =
  | "spells"
  | "species"
  | "classes"
  | "weapons"
  | "armor"
  | "tools"
  | "gear"
  | "feats"
  | "skills"
  | "backgrounds"
  | "items"
  | "equipment"
  | "magic-items";

export type FilterChip = {
  id: string;
  label: string;
  type:
    | "level"
    | "school"
    | "class"
    | "category"
    | "rarity"
    | "source"
    | "price"
    | "weight"
    | "itemType";
  value: string | number;
  onRemove: () => void;
};

export type CompendiumEntry =
  | Spell
  | Species
  | Class
  | Weapon
  | Armor
  | Tool
  | Item
  | Equipment
  | Feat
  | Skill
  | Background
  | MagicItem;

export type Feature = { name: string; description: string };
export type FeaturesByLevel = Record<string, Feature[]>;
export type SubclassWithFeatures = { name: string; features?: FeaturesByLevel };

export type ClickableItem = { id: string; name: string };

export type IconType = LucideIcon;

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

export const asString = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

export const getTraits = (
  v: unknown,
): Array<{ name: string; description: string }> => {
  if (!Array.isArray(v)) return [];
  return v
    .map((t) => {
      if (!isRecord(t)) return null;
      const name = asString(t.name);
      const description = asString(t.description);
      if (!name && !description) return null;
      return { name, description };
    })
    .filter((x): x is { name: string; description: string } => x !== null);
};

export const getSubclasses = (v: unknown): SubclassWithFeatures[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((sc) => {
      if (!isRecord(sc)) return null;
      const name = asString(sc.name);
      const features = isRecord(sc.features)
        ? (sc.features as FeaturesByLevel)
        : undefined;
      if (!name) return null;
      return features
        ? ({ name, features } satisfies SubclassWithFeatures)
        : ({ name } satisfies SubclassWithFeatures);
    })
    .filter((x): x is SubclassWithFeatures => x !== null);
};

export const getFeaturesByLevel = (v: unknown): FeaturesByLevel => {
  if (!isRecord(v)) return {};
  const out: FeaturesByLevel = {};
  for (const [level, features] of Object.entries(v)) {
    if (!Array.isArray(features)) continue;
    const cleaned = features
      .map((f) => {
        if (!isRecord(f)) return null;
        const name = asString(f.name);
        const description = asString(f.description);
        if (!name && !description) return null;
        return { name, description };
      })
      .filter((x): x is Feature => x !== null);
    if (cleaned.length > 0) out[level] = cleaned;
  }
  return out;
};

export const getWeaponMasteryName = (weapon: Weapon): string | undefined => {
  if (weapon.mastery?.name) return weapon.mastery.name;
  const md = weapon.data?.["mastery_details"];
  if (isRecord(md) && typeof md.name === "string") return md.name;
  const m = weapon.data?.["mastery"];
  if (typeof m === "string") return m;
  return undefined;
};

export const formatBackgroundTool = (
  tool: Background["data"]["tool"],
): string => {
  if (!tool) return "";
  if (typeof tool === "string") return tool;
  if (!isRecord(tool)) return "";
  if (tool.type === "choice") {
    return (
      asString(tool.description) ||
      (tool.category ? `Wähle eine Art von ${asString(tool.category)}` : "Wahl")
    );
  }
  return asString(tool.name);
};
