import React, { useState } from "react";
import { Character, Class, Species } from "../../lib/types";
import { Heart, Plus, Minus, RotateCcw, Check, X } from "lucide-react";
import { calculateDerivedStats } from "../../lib/characterLogic";
import { useCharacterStore } from "../../lib/store";

interface Props {
  character: Character;
  characterClass?: Class;
  characterSpecies?: Species;
}

export const HPManagement: React.FC<Props> = ({
  character,
  characterClass,
  characterSpecies,
}) => {
  const { saveCharacter } = useCharacterStore();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const stats = calculateDerivedStats(
    character,
    characterClass,
    characterSpecies,
  );
  const health = character.health;
  const hitDie = (characterClass?.data?.hit_die as number) || 8;
  const conMod = Math.floor((character.attributes.con - 10) / 2);
  const useRolledHP = health.use_rolled_hp ?? false;

  // Auto-update hit_dice_max based on level if needed
  React.useEffect(() => {
    const expectedHitDiceMax = character.meta.level;
    if (health.hit_dice_max !== expectedHitDiceMax) {
      const { currentCharacter } = useCharacterStore.getState();
      if (currentCharacter && currentCharacter.id === character.id) {
        useCharacterStore.setState({
          currentCharacter: {
            ...currentCharacter,
            health: {
              ...currentCharacter.health,
              hit_dice_max: expectedHitDiceMax,
            },
          },
        });
        saveCharacter();
      }
    }
  }, [character.meta.level, health.hit_dice_max, character.id, saveCharacter]);

  // Auto-update max HP if using average calculation and it changed
  React.useEffect(() => {
    if (!useRolledHP && health.max !== stats.hp_max) {
      const { currentCharacter } = useCharacterStore.getState();
      if (currentCharacter && currentCharacter.id === character.id) {
        useCharacterStore.setState({
          currentCharacter: {
            ...currentCharacter,
            health: {
              ...currentCharacter.health,
              max: stats.hp_max,
            },
          },
        });
        saveCharacter();
      }
    }
  }, [useRolledHP, stats.hp_max, character.id, saveCharacter]);

  // Calculate HP breakdown for transparency
  const hpBreakdown = {
    base: hitDie,
    conBonus: conMod,
    levelBonus:
      character.meta.level > 1
        ? (character.meta.level - 1) *
          (Math.floor((hitDie as number) / 2) + 1 + conMod)
        : 0,
    calculated: stats.hp_max,
  };

  const toggleHPCalculationMethod = () => {
    const { currentCharacter } = useCharacterStore.getState();
    if (!currentCharacter) return;

    const newUseRolledHP = !useRolledHP;
    const newMax = newUseRolledHP ? health.max : stats.hp_max;

    useCharacterStore.setState({
      currentCharacter: {
        ...currentCharacter,
        health: {
          ...currentCharacter.health,
          use_rolled_hp: newUseRolledHP,
          max: newMax,
        },
      },
    });
    saveCharacter();
  };

  const handleUpdateHP = (field: "current" | "max" | "temp", value: number) => {
    const { currentCharacter } = useCharacterStore.getState();
    if (!currentCharacter) return;

    const newHealth = { ...currentCharacter.health };
    if (field === "current") {
      newHealth.current = Math.max(
        0,
        Math.min(value, newHealth.max + newHealth.temp),
      );
    } else if (field === "max") {
      newHealth.max = Math.max(1, value);
      if (newHealth.current > newHealth.max) {
        newHealth.current = newHealth.max;
      }
    } else if (field === "temp") {
      newHealth.temp = Math.max(0, value);
    }

    useCharacterStore.setState({
      currentCharacter: {
        ...currentCharacter,
        health: newHealth,
      },
    });
    saveCharacter();
    setEditingField(null);
  };

  const handleUpdateHitDice = (used: number) => {
    const { currentCharacter } = useCharacterStore.getState();
    if (!currentCharacter) return;

    const newHealth = {
      ...currentCharacter.health,
      hit_dice_used: Math.max(
        0,
        Math.min(used, currentCharacter.health.hit_dice_max),
      ),
    };

    useCharacterStore.setState({
      currentCharacter: {
        ...currentCharacter,
        health: newHealth,
      },
    });
    saveCharacter();
  };

  const handleUpdateDeathSave = (
    type: "successes" | "failures",
    value: number,
  ) => {
    const { currentCharacter } = useCharacterStore.getState();
    if (!currentCharacter) return;

    const newHealth = {
      ...currentCharacter,
      health: {
        ...currentCharacter.health,
        death_saves: {
          ...currentCharacter.health.death_saves,
          [type]: Math.max(0, Math.min(3, value)),
        },
      },
    };

    useCharacterStore.setState({
      currentCharacter: newHealth,
    });
    saveCharacter();
  };

  const resetDeathSaves = () => {
    const { currentCharacter } = useCharacterStore.getState();
    if (!currentCharacter) return;

    const newHealth = {
      ...currentCharacter.health,
      death_saves: { successes: 0, failures: 0 },
    };

    useCharacterStore.setState({
      currentCharacter: {
        ...currentCharacter,
        health: newHealth,
      },
    });
    saveCharacter();
  };

  const startEdit = (field: string, currentValue: number) => {
    setEditingField(field);
    setEditValue(currentValue.toString());
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const confirmEdit = (field: string) => {
    const numValue = parseInt(editValue, 10);
    if (!isNaN(numValue)) {
      if (field.startsWith("hp_")) {
        const hpField = field.replace("hp_", "") as "current" | "max" | "temp";
        handleUpdateHP(hpField, numValue);
      } else if (field === "hit_dice_used") {
        handleUpdateHitDice(numValue);
      } else if (field.startsWith("death_")) {
        const deathType = field.replace("death_", "") as
          | "successes"
          | "failures";
        handleUpdateDeathSave(deathType, numValue);
      }
    }
  };

  const quickAdjustHP = (field: "current" | "temp", delta: number) => {
    const currentValue = field === "current" ? health.current : health.temp;
    handleUpdateHP(field, currentValue + delta);
  };

  const hpPercentage =
    health.max > 0 ? Math.min(100, (health.current / health.max) * 100) : 0;
  const isLowHP = hpPercentage < 25;
  const isCriticalHP = hpPercentage < 10;

  return (
    <div className="bg-card p-4 md:p-5 rounded-lg border-2 border-border shadow-lg h-fit">
      {/* Titel */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <Heart size={18} className="text-red-500" />
        <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-muted-foreground">
          Trefferpunkte
        </h3>
      </div>

      {/* Hauptbereich: HP Anzeige */}
      <div className="mb-4 space-y-3">
        {/* Große HP-Zahlen: 147 / 183 */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {editingField === "hp_current" ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmEdit("hp_current");
                  if (e.key === "Escape") cancelEdit();
                }}
                className="w-24 px-2 py-1 text-xl font-bold border border-border rounded bg-muted/50 text-foreground text-center"
                autoFocus
              />
              <button
                onClick={() => confirmEdit("hp_current")}
                className="p-1 rounded hover:bg-primary/20 text-primary"
              >
                <Check size={14} />
              </button>
              <button
                onClick={cancelEdit}
                className="p-1 rounded hover:bg-red-500/20 text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <span
              className={`text-3xl sm:text-4xl md:text-5xl font-black whitespace-nowrap ${
                isCriticalHP
                  ? "text-red-500"
                  : isLowHP
                    ? "text-amber-500"
                    : "text-foreground"
              }`}
            >
              {health.current}
            </span>
          )}

          <span className="text-2xl sm:text-3xl text-muted-foreground/50 font-bold">
            /
          </span>

          {editingField === "hp_max" ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmEdit("hp_max");
                  if (e.key === "Escape") cancelEdit();
                }}
                className="w-24 px-2 py-1 text-xl font-bold border border-border rounded bg-muted/50 text-foreground text-center"
                autoFocus
              />
              <button
                onClick={() => confirmEdit("hp_max")}
                className="p-1 rounded hover:bg-primary/20 text-primary"
              >
                <Check size={14} />
              </button>
              <button
                onClick={cancelEdit}
                className="p-1 rounded hover:bg-red-500/20 text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground whitespace-nowrap">
              {health.max}
            </span>
          )}

          <span className="text-xs sm:text-sm text-muted-foreground">TP</span>

          {editingField !== "hp_current" && editingField !== "hp_max" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => startEdit("hp_current", health.current)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Aktuell bearbeiten"
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={() => startEdit("hp_max", health.max)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Maximum bearbeiten"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}
        </div>

        {/* HP Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => quickAdjustHP("current", -1)}
            className="p-2 rounded-lg border border-border bg-muted/50 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
            title="TP -1"
          >
            <Minus size={14} />
          </button>
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all ${
                isCriticalHP
                  ? "bg-red-500"
                  : isLowHP
                    ? "bg-amber-500"
                    : "bg-primary"
              }`}
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
          <button
            onClick={() => quickAdjustHP("current", +1)}
            className="p-2 rounded-lg border border-border bg-muted/50 hover:bg-primary/20 hover:border-primary/30 transition-all"
            title="TP +1"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Temp HP & Berechnung kompakt */}
        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
          {health.temp > 0 && (
            <div className="flex items-center gap-1 text-blue-500">
              <span className="font-bold">Temp:</span>
              {editingField === "hp_temp" ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmEdit("hp_temp");
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="w-12 px-1 py-0.5 text-xs font-bold border border-border rounded bg-muted/50 text-foreground text-center"
                    autoFocus
                  />
                  <button
                    onClick={() => confirmEdit("hp_temp")}
                    className="p-0.5 rounded hover:bg-primary/20 text-primary"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-0.5 rounded hover:bg-red-500/20 text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-bold">{health.temp}</span>
                  <button
                    onClick={() => startEdit("hp_temp", health.temp)}
                    className="p-0.5 rounded hover:bg-muted"
                    title="Bearbeiten"
                  >
                    <RotateCcw size={10} />
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={toggleHPCalculationMethod}
            className={`px-2 py-1 rounded border text-xs font-bold transition-all ${
              useRolledHP
                ? "bg-primary/20 border-primary text-primary"
                : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {useRolledHP ? "Gewürfelt" : "Durchschnitt"}
          </button>
        </div>
      </div>

      {/* Sekundärbereich: Hit Dice & Death Saves */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
        {/* Hit Dice */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-black text-muted-foreground/70 uppercase tracking-wider block">
            Trefferwürfel
          </label>
          {editingField === "hit_dice_used" ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmEdit("hit_dice_used");
                  if (e.key === "Escape") cancelEdit();
                }}
                className="w-14 px-2 py-1 text-sm font-bold border border-border rounded bg-muted/50 text-foreground text-center"
                autoFocus
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                / {health.hit_dice_max}
              </span>
              <button
                onClick={() => confirmEdit("hit_dice_used")}
                className="p-1 rounded hover:bg-primary/20 text-primary"
              >
                <Check size={14} />
              </button>
              <button
                onClick={cancelEdit}
                className="p-1 rounded hover:bg-red-500/20 text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-black text-foreground whitespace-nowrap">
                W{hitDie} × {health.hit_dice_used}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                / {health.hit_dice_max}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    startEdit("hit_dice_used", health.hit_dice_used)
                  }
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Bearbeiten"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  onClick={() => handleUpdateHitDice(health.hit_dice_used - 1)}
                  disabled={health.hit_dice_used <= 0}
                  className="p-1.5 rounded border border-border bg-muted/50 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="-1"
                >
                  <Minus size={12} />
                </button>
                <button
                  onClick={() => handleUpdateHitDice(health.hit_dice_used + 1)}
                  disabled={health.hit_dice_used >= health.hit_dice_max}
                  className="p-1.5 rounded border border-border bg-muted/50 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="+1"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Death Saves */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs sm:text-sm font-black text-muted-foreground/70 uppercase tracking-wider">
              Todesrettungen
            </label>
            {(health.death_saves.successes > 0 ||
              health.death_saves.failures > 0) && (
              <button
                onClick={resetDeathSaves}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Zurücksetzen"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="text-xs font-black text-green-500/80">
                Erfolge
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() =>
                      handleUpdateDeathSave(
                        "successes",
                        health.death_saves.successes === num ? num - 1 : num,
                      )
                    }
                    className={`flex-1 h-9 rounded border-2 transition-all ${
                      health.death_saves.successes >= num
                        ? "bg-green-500/20 border-green-500 text-green-500"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-green-500/30"
                    }`}
                  >
                    <Check size={16} className="mx-auto" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-black text-red-500/80">
                Fehlschläge
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() =>
                      handleUpdateDeathSave(
                        "failures",
                        health.death_saves.failures === num ? num - 1 : num,
                      )
                    }
                    className={`flex-1 h-9 rounded border-2 transition-all ${
                      health.death_saves.failures >= num
                        ? "bg-red-500/20 border-red-500 text-red-500"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-red-500/30"
                    }`}
                  >
                    <X size={16} className="mx-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HP Breakdown (optional, in Details) */}
      {!useRolledHP && (
        <div className="mt-3 pt-3 border-t border-border">
          <details className="group">
            <summary className="text-xs font-black text-muted-foreground/70 uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors">
              TP-Berechnung anzeigen
            </summary>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Basis (Würfel):</span>
                <span className="font-semibold">{hpBreakdown.base}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Konstitutionsmodifikator:
                </span>
                <span className="font-semibold">
                  {hpBreakdown.conBonus >= 0 ? "+" : ""}
                  {hpBreakdown.conBonus}
                </span>
              </div>
              {hpBreakdown.levelBonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Stufen-Bonus ({character.meta.level - 1} Stufen):
                  </span>
                  <span className="font-semibold">
                    +{hpBreakdown.levelBonus}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-border/50 font-bold">
                <span>Berechnete Max TP:</span>
                <span className="text-primary">{hpBreakdown.calculated}</span>
              </div>
            </div>
          </details>
        </div>
      )}
      {useRolledHP && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground italic">
            Gewürfelte TP - Max TP werden nicht automatisch berechnet.
          </p>
        </div>
      )}
    </div>
  );
};
