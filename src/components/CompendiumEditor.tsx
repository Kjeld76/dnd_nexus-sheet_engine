import { useState } from "react";
import {
  X,
  Save,
  Trash2,
  Code,
  Layout,
  Copy,
  Info,
  Sparkles,
} from "lucide-react";
import { homebrewApi } from "../lib/api";
import {
  CustomSpell,
  CustomWeapon,
  CustomArmor,
  CustomItem,
} from "../lib/types";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Button } from "./ui/Button";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type EditorType =
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
  | "tool";

type EditorInitialData = unknown;

type EditorFormData = Record<string, unknown> & {
  name?: string;
  description?: string;
  level?: number;
  school?: string;
  casting_time?: string;
  range?: string;
  components?: string;
  material_components?: string;
  duration?: string;
  classes?: string;
  cost_gp?: number;
  weight_kg?: number;
  damage_dice?: string;
  damage_type?: string;
  base_ac?: number;
  is_homebrew?: boolean;
  data?: Record<string, unknown>;
};

interface Props {
  type: EditorType;
  initialData?: EditorInitialData;
  onClose: () => void;
  onSave: () => void;
}

export function CompendiumEditor({
  type,
  initialData,
  onClose,
  onSave,
}: Props) {
  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;

  const initialObj = isRecord(initialData) ? initialData : undefined;
  const initialId =
    typeof initialObj?.id === "string" ? initialObj.id : undefined;
  const initialSource =
    typeof initialObj?.source === "string" ? initialObj.source : undefined;
  const initialParentId =
    typeof initialObj?.parent_id === "string"
      ? initialObj.parent_id
      : undefined;

  const [viewMode, setViewMode] = useState<"form" | "json">("form");
  const [formData, setFormData] = useState<EditorFormData>(() => ({
    ...(initialObj || {}),
    ...(initialData
      ? {}
      : {
          name: "",
          description: "",
          level: 0,
          school: "",
          casting_time: "",
          range: "",
          components: "",
          material_components: "",
          duration: "",
          classes: "",
          is_homebrew: true,
          data: {},
        }),
  }));
  const [jsonValue, setJsonValue] = useState(
    JSON.stringify(initialData || {}, null, 2),
  );

  const getDataDescription = (fd: EditorFormData): string => {
    if (typeof fd.description === "string" && fd.description)
      return fd.description;
    const d = fd.data;
    if (!d) return "";
    return typeof d.description === "string" ? d.description : "";
  };

  const handleSave = async () => {
    try {
      const parsed =
        viewMode === "json" ? (JSON.parse(jsonValue) as unknown) : formData;
      const dataToSave: Record<string, unknown> =
        typeof parsed === "object" && parsed !== null
          ? (parsed as Record<string, unknown>)
          : {};

      const finalData = {
        ...dataToSave,
        parent_id: initialSource === "core" ? initialId : initialParentId,
        id: initialSource !== "core" ? initialId : undefined,
      };

      if (type === "spells") {
        await homebrewApi.upsertSpell(finalData as CustomSpell);
      } else if (type === "weapons") {
        await homebrewApi.upsertWeapon(finalData as CustomWeapon);
      } else if (type === "armor") {
        await homebrewApi.upsertArmor(finalData as CustomArmor);
      } else if (["gear", "tool"].includes(type)) {
        await homebrewApi.upsertItem({
          ...finalData,
          item_type: type,
        } as CustomItem);
      }
      onSave();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Fehler beim Speichern: " + (error as Error).message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonValue);
    alert("JSON kopiert");
  };

  const handleDelete = async () => {
    if (!initialId || initialSource === "core") return;
    if (!confirm("Eintrag wirklich löschen?")) return;
    try {
      const tableType = type.endsWith("s") ? type.slice(0, -1) : type;
      await homebrewApi.deleteEntry(initialId, tableType);
      onSave();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-[3.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col text-foreground relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/20 via-primary to-primary/20 opacity-50" />

        {/* Header */}
        <div className="p-10 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-8">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter italic font-serif">
                {initialData
                  ? `${formData.name || "Eintrag"} anpassen`
                  : "Neue Legende erschaffen"}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
                Editor & Repository
              </p>
            </div>

            <div className="flex bg-muted/50 rounded-[1.25rem] p-1.5 border border-border">
              <button
                onClick={() => setViewMode("form")}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all",
                  viewMode === "form"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Layout size={14} /> Formular
              </button>
              <button
                onClick={() => setViewMode("json")}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all",
                  viewMode === "json"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Code size={14} /> JSON
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-4 rounded-2xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all active:scale-90"
          >
            <X size={32} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {viewMode === "form" ? (
            <div className="space-y-12">
              {/* Basis-Info Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-2">
                    Identität
                  </label>
                  <input
                    className="w-full bg-muted/30 border-2 border-border rounded-[1.5rem] px-8 py-5 text-xl font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Name des Eintrags..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-2">
                    Ursprung
                  </label>
                  <div className="flex bg-muted/30 rounded-[1.5rem] p-2 border-2 border-border h-[72px]">
                    <button
                      onClick={() =>
                        setFormData({ ...formData, is_homebrew: false })
                      }
                      className={cn(
                        "flex-1 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        !formData.is_homebrew
                          ? "bg-card text-foreground shadow-xl border border-border"
                          : "text-muted-foreground/50 hover:text-foreground",
                      )}
                    >
                      Core (PHB)
                    </button>
                    <button
                      onClick={() =>
                        setFormData({ ...formData, is_homebrew: true })
                      }
                      className={cn(
                        "flex-1 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        formData.is_homebrew
                          ? "bg-primary text-primary-foreground shadow-xl"
                          : "text-muted-foreground/50 hover:text-foreground",
                      )}
                    >
                      Custom
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Section for Spells */}
              {type === "spells" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-2">
                      Zaubergrad
                    </label>
                    <input
                      type="number"
                      className="w-full bg-muted/30 border-2 border-border rounded-[1.5rem] px-8 py-5 text-xl font-bold focus:border-primary outline-none"
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-2">
                      Schule
                    </label>
                    <input
                      className="w-full bg-muted/30 border-2 border-border rounded-[1.5rem] px-8 py-5 text-xl font-bold focus:border-primary outline-none"
                      value={formData.school}
                      onChange={(e) =>
                        setFormData({ ...formData, school: e.target.value })
                      }
                      placeholder="z.B. Evokation"
                    />
                  </div>
                </div>
              )}

              {/* Description Card */}
              <div className="space-y-4">
                <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-2">
                  Wissens-Text
                </label>
                <div className="relative group">
                  <textarea
                    className="w-full bg-muted/30 border-2 border-border rounded-[2.5rem] px-10 py-8 text-lg h-64 outline-none focus:border-primary transition-all resize-none custom-scrollbar leading-relaxed italic font-medium"
                    value={getDataDescription(formData)}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Schreibe die Geschichte oder Wirkung auf..."
                  />
                  <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="text-primary" />
                  </div>
                </div>
              </div>

              {/* Detail Stats Grid */}
              <div className="bg-card p-10 rounded-[3rem] border border-border shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Info size={120} />
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tighter mb-10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Layout size={20} className="text-primary" />
                  </div>
                  Technische Daten
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                  {type === "spells" && (
                    <>
                      <EditorInput
                        label="Zeit"
                        value={formData.casting_time}
                        onChange={(v) =>
                          setFormData({ ...formData, casting_time: v })
                        }
                      />
                      <EditorInput
                        label="Reichweite"
                        value={formData.range}
                        onChange={(v) => setFormData({ ...formData, range: v })}
                      />
                      <EditorInput
                        label="Dauer"
                        value={formData.duration}
                        onChange={(v) =>
                          setFormData({ ...formData, duration: v })
                        }
                      />
                      <EditorInput
                        label="Komponenten"
                        value={formData.components}
                        onChange={(v) =>
                          setFormData({ ...formData, components: v })
                        }
                      />
                      <div className="md:col-span-2">
                        <EditorInput
                          label="Materialien"
                          value={formData.material_components}
                          onChange={(v) =>
                            setFormData({ ...formData, material_components: v })
                          }
                          placeholder="Optionale Komponenten..."
                        />
                      </div>
                      <div className="md:col-span-3">
                        <EditorInput
                          label="Klassen"
                          value={formData.classes}
                          onChange={(v) =>
                            setFormData({ ...formData, classes: v })
                          }
                          placeholder="Magier, Hexenmeister..."
                        />
                      </div>
                    </>
                  )}
                  {(type === "weapons" ||
                    type === "armor" ||
                    type === "gear" ||
                    type === "tools") && (
                    <>
                      <EditorInput
                        label="Preis (GM)"
                        type="number"
                        value={formData.cost_gp}
                        onChange={(v) =>
                          setFormData({ ...formData, cost_gp: parseFloat(v) })
                        }
                      />
                      <EditorInput
                        label="Gewicht (KG)"
                        type="number"
                        value={formData.weight_kg}
                        onChange={(v) =>
                          setFormData({ ...formData, weight_kg: parseFloat(v) })
                        }
                      />
                      {type === "weapons" && (
                        <>
                          <EditorInput
                            label="Schaden"
                            value={formData.damage_dice}
                            onChange={(v) =>
                              setFormData({ ...formData, damage_dice: v })
                            }
                          />
                          <EditorInput
                            label="Schadenstyp"
                            value={formData.damage_type}
                            onChange={(v) =>
                              setFormData({ ...formData, damage_type: v })
                            }
                          />
                        </>
                      )}
                      {type === "armor" && (
                        <EditorInput
                          label="RK"
                          type="number"
                          value={formData.base_ac}
                          onChange={(v) =>
                            setFormData({ ...formData, base_ac: parseInt(v) })
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-8 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-black text-primary uppercase tracking-[0.3em]">
                    Code Repository
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Direkte Bearbeitung des Datenobjekts.
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-8 py-3 bg-muted hover:bg-primary hover:text-primary-foreground rounded-2xl transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest border border-border"
                >
                  <Copy size={16} /> In die Zwischenablage
                </button>
              </div>
              <textarea
                className="flex-1 w-full bg-card border-2 border-border rounded-[2.5rem] p-10 text-sm font-mono text-primary outline-none focus:border-primary transition-all resize-none custom-scrollbar leading-relaxed shadow-inner min-h-[500px]"
                value={jsonValue}
                onChange={(e) => setJsonValue(e.target.value)}
                placeholder="{ ... }"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-border flex justify-between gap-6 bg-muted/20">
          {initialSource !== "core" && initialId && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-3 px-8 py-4 text-red-500 hover:bg-red-500 hover:text-white rounded-[1.5rem] transition-all font-black uppercase text-xs tracking-[0.2em] border border-red-500/20 shadow-xl shadow-red-500/5"
            >
              <Trash2 size={20} /> Löschen
            </button>
          )}
          <div className="flex gap-6 ml-auto">
            <Button onClick={onClose} variant="secondary" size="lg">
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              size="lg"
              className="flex items-center gap-4"
            >
              <Save size={24} />
              Speichern
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">
        {label}
      </label>
      <input
        type={type}
        className="w-full bg-background border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
