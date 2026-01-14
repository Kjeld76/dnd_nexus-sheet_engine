import { useState } from "react";
import { Tool } from "../../lib/types";
import { X } from "lucide-react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  backgroundName: string;
  toolCategory: string; // "spielset" | "handwerkszeug" | "musikinstrument"
  availableTools: Tool[];
  onConfirm: (selectedTool: Tool) => void;
  onCancel: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  spielset: "Spielset",
  handwerkszeug: "Handwerkszeug",
  musikinstrument: "Musikinstrument",
};

export const ToolChoiceDialog = ({
  backgroundName,
  toolCategory,
  availableTools,
  onConfirm,
  onCancel,
}: Props) => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  // Helper function to check if tool matches category
  const toolMatchesCategory = (tool: Tool): boolean => {
    const toolCategoryLower = tool.category.toLowerCase();
    const targetCategoryLower = toolCategory.toLowerCase();
    const toolNameLower = tool.name.toLowerCase();
    const variantOf = (tool.data as any)?.variant_of?.toLowerCase() || "";

    // Direktes Matching
    if (
      toolCategoryLower.includes(targetCategoryLower) ||
      targetCategoryLower.includes(toolCategoryLower)
    ) {
      return true;
    }

    // Spezial-Matching für Spielset
    if (targetCategoryLower === "spielset") {
      // Basis-Tool "Spielset" finden
      if (toolNameLower === "spielset" || toolNameLower.includes("spielset")) {
        return true;
      }
      // Varianten finden (haben variant_of im data)
      if (variantOf.includes("spielset")) {
        return true;
      }
      // Spezifische Spielset-Varianten finden
      if (
        toolCategoryLower === "anderes werkzeug" &&
        (toolNameLower.includes("drachenschach") ||
          toolNameLower.includes("drei-drachen") ||
          toolNameLower.includes("spielkarten") ||
          toolNameLower.includes("würfel"))
      ) {
        return true;
      }
    }

    // Spezial-Matching für Musikinstrument
    if (targetCategoryLower === "musikinstrument") {
      return (
        toolNameLower.includes("musikinstrument") ||
        variantOf.includes("musikinstrument") ||
        (toolCategoryLower === "anderes werkzeug" &&
          (toolNameLower.includes("dudelsack") ||
            toolNameLower.includes("flöte") ||
            toolNameLower.includes("gambe") ||
            toolNameLower.includes("hackbrett") ||
            toolNameLower.includes("horn") ||
            toolNameLower.includes("laute") ||
            toolNameLower.includes("leier") ||
            toolNameLower.includes("panflöte") ||
            toolNameLower.includes("schalmei") ||
            toolNameLower.includes("trommel")))
      );
    }

    return false;
  };

  // Filter tools by category
  const filteredTools = availableTools.filter(toolMatchesCategory);

  // Gruppiere Tools: Basis-Tools und ihre Varianten
  const toolGroups = filteredTools.reduce(
    (groups, tool) => {
      const variantOf = (tool.data as any)?.variant_of;

      if (variantOf) {
        // Dies ist eine Variante
        const baseToolName = variantOf.toLowerCase();
        if (!groups[baseToolName]) {
          // Finde das Basis-Tool (auch in allen Tools, nicht nur gefilterten)
          const baseTool =
            availableTools.find(
              (t) =>
                t.name.toLowerCase() === baseToolName &&
                !(t.data as any)?.variant_of,
            ) ||
            filteredTools.find(
              (t) =>
                t.name.toLowerCase() === baseToolName &&
                !(t.data as any)?.variant_of,
            );
          if (baseTool) {
            groups[baseToolName] = {
              base: baseTool,
              variants: [],
            };
          } else {
            // Basis-Tool nicht gefunden, erstelle eine virtuelle Gruppe
            groups[baseToolName] = {
              base: null,
              variants: [],
            };
          }
        }
        groups[baseToolName].variants.push(tool);
      } else {
        // Dies ist ein Basis-Tool
        const toolName = tool.name.toLowerCase();
        if (!groups[toolName]) {
          groups[toolName] = {
            base: tool,
            variants: [],
          };
        }
      }

      return groups;
    },
    {} as Record<string, { base: Tool | null; variants: Tool[] }>,
  );

  // Konvertiere Gruppen in eine flache Liste für die Anzeige
  const displayTools: Array<{ tool: Tool; groupName?: string }> = [];

  Object.values(toolGroups).forEach((group) => {
    if (group.base) {
      const baseIsFiltered = filteredTools.some((t) => t.id === group.base?.id);

      // Wenn Varianten vorhanden sind, zeige nur die Varianten an (nicht das Basis-Tool)
      if (group.variants.length > 0) {
        group.variants.forEach((variant) => {
          displayTools.push({
            tool: variant,
            groupName: group.base?.name,
          });
        });
      } else {
        // Keine Varianten - zeige Basis-Tool an
        if (baseIsFiltered) {
          displayTools.push({ tool: group.base });
        }
      }
    } else {
      // Nur Varianten, kein Basis-Tool - zeige alle Varianten an
      group.variants.forEach((variant) => {
        displayTools.push({
          tool: variant,
          groupName: (variant.data as any)?.variant_of as string,
        });
      });
    }
  });

  // Falls keine Tools gefunden wurden, verwende die gefilterten Tools direkt
  if (displayTools.length === 0 && filteredTools.length > 0) {
    filteredTools.forEach((tool) => {
      displayTools.push({ tool });
    });
  }

  const handleConfirm = () => {
    if (selectedTool) {
      onConfirm(selectedTool);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-border flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm">
          <div>
            <h2 className="text-3xl font-black italic font-serif text-foreground mb-2">
              Werkzeug wählen
            </h2>
            <p className="text-sm text-muted-foreground">
              {backgroundName} - {CATEGORY_LABELS[toolCategory] || toolCategory}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {filteredTools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Keine Werkzeuge in dieser Kategorie gefunden.</p>
              <p className="text-sm mt-2">
                Kategorie: {CATEGORY_LABELS[toolCategory] || toolCategory}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayTools.map(({ tool, groupName }) => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool)}
                    className={cn(
                      "w-full p-6 rounded-2xl border transition-all text-left",
                      selectedTool?.id === tool.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/30 border-border hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-lg">{tool.name}</div>
                      {groupName && groupName !== tool.name && (
                        <span className="text-xs opacity-60">
                          ({groupName})
                        </span>
                      )}
                    </div>
                    {!!tool.data?.verwenden &&
                      Array.isArray(tool.data.verwenden) &&
                      tool.data.verwenden.length > 0 && (
                        <div className="text-sm mt-2 opacity-80">
                          <div className="font-semibold mb-1">Verwenden:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {(tool.data.verwenden as string[])
                              .slice(0, 2)
                              .map((use: string, idx: number) => (
                                <li key={idx} className="text-xs">
                                  {use}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    <div className="text-xs mt-2 opacity-60">
                      {tool.cost_gp} GM • {tool.weight_kg} kg
                      {(tool.data as any)?.attribute &&
                        ` • ${(tool.data as any).attribute}`}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-border">
                <button
                  onClick={onCancel}
                  className="flex-1 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-wider border border-border hover:bg-muted transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedTool}
                  className={cn(
                    "flex-1 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all",
                    selectedTool
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "opacity-50 cursor-not-allowed bg-muted",
                  )}
                >
                  Bestätigen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
