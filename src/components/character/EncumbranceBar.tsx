import React, { useMemo } from "react";
import { Weight, AlertTriangle } from "lucide-react";
import { useCharacterStore } from "../../lib/store";
import { AutomatedHelper } from "../ui/AutomatedHelper";

export const EncumbranceBar: React.FC = () => {
  const { currentCharacter } = useCharacterStore();

  const weightInfo = useMemo(() => {
    if (!currentCharacter) return null;

    const str = currentCharacter.attributes.str || 10;
    const totalWeight = currentCharacter.meta.total_weight_kg || 0;
    const useMetric = currentCharacter.meta.use_metric ?? true;

    let capacityKg = 0;
    let encumberedKg = 0;
    let heavilyEncumberedKg = 0;

    if (useMetric) {
      // Metric Variant (Project Standard):
      // Capacity: STR * 7.5 kg (Encumbered threshold)
      // Heavily Encumbered: > Encumbered (Project logic: > capacity is encumbered, > lift is heavily)
      // Max Lift: STR * 15.0 kg (Heavily Encumbered / Push/Drag limit)
      capacityKg = str * 7.5;
      // In our project logic (calculator.rs):
      // > Capacity (7.5) = Encumbered
      // > Max Lift (15.0) = Heavily Encumbered
      encumberedKg = capacityKg;
      heavilyEncumberedKg = str * 15.0;
    } else {
      // Imperial (Standard 5e)
      // Capacity: STR * 15 lbs
      const capacityLbs = str * 15;
      capacityKg = capacityLbs / 2.20462;

      // Project Standard mapping for Imperial (approximate match to metric tiers logic if we want consistency)
      // Or stick to 5e Variant Encumbrance?
      // User requested: "UI-Berechnung exakt die Werte liefert, die wir in der Rust-'calculator.rs' validiert haben."
      // Rust calculator.rs uses:
      // capacity = str * STR_CAPACITY_FACTOR_KG (7.5)
      // fit = str * STR_MAX_LIFT_FACTOR_KG (15.0)
      // if > lift -> Heavily
      // else if > capacity -> Encumbered

      // So we should just use the derived kg values regardless of display mode,
      // but for imperial display we might want lbs.
      // However, the store calculates in kg.
      // Let's stick to the metric logic as the source of truth.

      encumberedKg = capacityKg;
      heavilyEncumberedKg = (str * 30) / 2.20462; // Lift is 30x Str in lbs
    }

    const percentage = Math.min(100, (totalWeight / capacityKg) * 100);

    let status: "normal" | "encumbered" | "heavily" | "over" = "normal";
    if (totalWeight > capacityKg) status = "over";
    else if (totalWeight > heavilyEncumberedKg) status = "heavily";
    else if (totalWeight > encumberedKg) status = "encumbered";

    return {
      totalWeight,
      capacityKg,
      encumberedKg,
      heavilyEncumberedKg,
      percentage,
      status,
      useMetric,
    };
  }, [currentCharacter]);

  if (!weightInfo) return null;

  const getStatusColor = () => {
    switch (weightInfo.status) {
      case "over":
        return "bg-red-600";
      case "heavily":
        return "bg-orange-600";
      case "encumbered":
        return "bg-amber-400";
      default:
        return "bg-primary";
    }
  };

  const getStatusText = () => {
    switch (weightInfo.status) {
      case "over":
        return "Überladen";
      case "heavily":
        return "Schwer belastet";
      case "encumbered":
        return "Belastet";
      default:
        return "Normal";
    }
  };

  const getMovementText = (type: "encumbered" | "heavily" | "over") => {
    if (weightInfo.useMetric) {
      switch (type) {
        case "encumbered":
          return "Bewegungsrate -3m";
        case "heavily":
          return "Bewegungsrate -6m";
        case "over":
          return "Bewegungsrate sinkt auf 1,5m";
      }
    } else {
      switch (type) {
        case "encumbered":
          return "Bewegungsrate -10 Fuß";
        case "heavily":
          return "Bewegungsrate -20 Fuß";
        case "over":
          return "Bewegungsrate sinkt auf 5 Fuß";
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <Weight size={14} className="text-primary" />
          <span>Tragelast</span>
          <AutomatedHelper size={10} />
          <span
            className={`px-2 py-0.5 rounded-full ${getStatusColor()} text-white ml-2`}
          >
            {getStatusText()}
          </span>
        </div>
        <div className="text-muted-foreground">
          <span className="text-foreground font-serif text-sm">
            {weightInfo.totalWeight.toFixed(1)}
          </span>
          <span className="mx-1">/</span>
          <span>{weightInfo.capacityKg.toFixed(1)} kg</span>
        </div>
      </div>

      <div className="relative h-3 bg-muted rounded-full overflow-hidden border border-border shadow-inner">
        {/* Encumbered Marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-amber-400/50 z-10"
          style={{
            left: `${(weightInfo.encumberedKg / weightInfo.capacityKg) * 100}%`,
          }}
        />
        {/* Heavily Encumbered Marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-orange-600/50 z-10"
          style={{
            left: `${(weightInfo.heavilyEncumberedKg / weightInfo.capacityKg) * 100}%`,
          }}
        />

        <div
          className={`absolute top-0 left-0 bottom-0 transition-all duration-500 ease-out shadow-sm ${getStatusColor()}`}
          style={{ width: `${weightInfo.percentage}%` }}
        />
      </div>

      {weightInfo.status !== "normal" && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 animate-in slide-in-from-top-2">
          <AlertTriangle
            size={14}
            className="text-orange-500 shrink-0 mt-0.5"
          />
          <p className="text-[10px] text-orange-200/80 italic leading-snug">
            {weightInfo.status === "encumbered" &&
              `${getMovementText("encumbered")}.`}
            {weightInfo.status === "heavily" &&
              `${getMovementText("heavily")}. Nachteil auf Attributsprüfungen, Angriffswürfe und Rettungswürfe (STÄ, GES, KON).`}
            {weightInfo.status === "over" &&
              `Du bist überladen! ${getMovementText("over")}.`}
          </p>
        </div>
      )}
    </div>
  );
};
