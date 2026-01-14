import React, { useState } from "react";
import { Character, Class } from "../../lib/types";
import { Heart, Plus, Minus, RotateCcw, Check, X } from "lucide-react";
import { calculateDerivedStats } from "../../lib/characterLogic";
import { useCharacterStore } from "../../lib/store";

interface Props {
  character: Character;
  characterClass?: Class;
}

export const HPManagement: React.FC<Props> = ({
  character,
  characterClass,
}) => {
  const { saveCharacter } = useCharacterStore();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const stats = calculateDerivedStats(character, characterClass, []);
  const health = character.health;
  const hitDie = characterClass?.data?.hit_die || 8;
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
        ? (character.meta.level - 1) * (Math.floor(hitDie / 2) + 1 + conMod)
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart size={20} className="text-red-500" />
        <h3 className="text-base font-black italic font-serif">
          Trefferpunkte
        </h3>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "2fr 1fr 1.2fr" }}
      >
        {/* HP Display */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xl shadow-foreground/[0.02]">
          <div className="space-y-3">
            {/* Current HP, Max HP and HP Calculation side by side */}
            <div className="grid grid-cols-3 gap-4">
              {/* Current HP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-muted-foreground/70 uppercase tracking-wider">
                    Aktuelle TP
                  </label>
                  <div className="flex items-center gap-2">
                    {editingField === "hp_current" ? (
                      <>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmEdit("hp_current");
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-20 px-2 py-1 text-sm font-bold border border-border rounded bg-muted/50 text-foreground"
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
                      </>
                    ) : (
                      <>
                        <span
                          className={`text-3xl font-black ${
                            isCriticalHP
                              ? "text-red-500"
                              : isLowHP
                                ? "text-amber-500"
                                : "text-foreground"
                          }`}
                        >
                          {health.current}
                        </span>
                        <button
                          onClick={() =>
                            startEdit("hp_current", health.current)
                          }
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Bearbeiten"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Max HP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-muted-foreground/70 uppercase tracking-wider">
                    Maximale TP
                  </label>
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
                        className="w-20 px-2 py-1 text-sm font-bold border border-border rounded bg-muted/50 text-foreground"
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
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-foreground">
                        {health.max}
                      </span>
                      <button
                        onClick={() => startEdit("hp_max", health.max)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Bearbeiten"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* HP Calculation Method Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-muted-foreground/70 uppercase tracking-wider">
                    TP-Berechnung
                  </label>
                  <button
                    onClick={toggleHPCalculationMethod}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${
                      useRolledHP
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {useRolledHP ? "Gewürfelt" : "Durchschnitt"}
                  </button>
                </div>
              </div>
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

            {/* Temp HP */}
            {health.temp > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-border gap-4">
                <label className="text-xs font-black text-muted-foreground/70 uppercase tracking-wider whitespace-nowrap">
                  Temporäre TP
                </label>
                {editingField === "hp_temp" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEdit("hp_temp");
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="w-16 px-2 py-1 text-sm font-bold border border-border rounded bg-muted/50 text-foreground"
                      autoFocus
                    />
                    <button
                      onClick={() => confirmEdit("hp_temp")}
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
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-500">
                      {health.temp}
                    </span>
                    <button
                      onClick={() => startEdit("hp_temp", health.temp)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Bearbeiten"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={() => quickAdjustHP("temp", -1)}
                      className="p-1 rounded hover:bg-red-500/20 text-red-500"
                      title="Temp TP -1"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={() => quickAdjustHP("temp", +1)}
                      className="p-1 rounded hover:bg-blue-500/20 text-blue-500"
                      title="Temp TP +1"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* HP Breakdown (Transparency) */}
            {!useRolledHP && (
              <div className="pt-4 border-t border-border">
                <details className="group">
                  <summary className="text-sm font-black text-muted-foreground/70 uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors">
                    TP-Berechnung anzeigen
                  </summary>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Basis (Würfel):
                      </span>
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
                    <div className="flex justify-between pt-2 border-t border-border/50 font-bold">
                      <span>Berechnete Max TP:</span>
                      <span className="text-primary">
                        {hpBreakdown.calculated}
                      </span>
                    </div>
                  </div>
                </details>
              </div>
            )}
            {useRolledHP && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground italic">
                  Du verwendest gewürfelte TP. Die Max TP werden nicht
                  automatisch berechnet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hit Dice */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xl shadow-foreground/[0.02]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-muted-foreground/70 uppercase tracking-wider">
                Trefferwürfel
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-foreground">
                  W{hitDie}
                </span>
                <span className="text-muted-foreground">×</span>
                {editingField === "hit_dice_used" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEdit("hit_dice_used");
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="w-16 px-2 py-1 text-sm font-bold border border-border rounded bg-muted/50 text-foreground"
                      autoFocus
                    />
                    <span className="text-sm text-muted-foreground">
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
                  <>
                    <span
                      className="text-2xl font-black text-foreground"
                      onClick={() =>
                        startEdit("hit_dice_used", health.hit_dice_used)
                      }
                    >
                      {health.hit_dice_used}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {health.hit_dice_max}
                    </span>
                    <button
                      onClick={() =>
                        startEdit("hit_dice_used", health.hit_dice_used)
                      }
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-2"
                      title="Bearbeiten"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateHitDice(health.hit_dice_used - 1)}
                  disabled={health.hit_dice_used <= 0}
                  className="p-2 rounded-lg border border-border bg-muted/50 hover:bg-primary/20 hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Verwendet -1"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => handleUpdateHitDice(health.hit_dice_used + 1)}
                  disabled={health.hit_dice_used >= health.hit_dice_max}
                  className="p-2 rounded-lg border border-border bg-muted/50 hover:bg-primary/20 hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Verwendet +1"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Death Saves */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xl shadow-foreground/[0.02]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-muted-foreground/70 uppercase tracking-wider">
                Todesrettungen
              </span>
              <div className="flex-1 h-px bg-border" />
              {(health.death_saves.successes > 0 ||
                health.death_saves.failures > 0) && (
                <button
                  onClick={resetDeathSaves}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title="Zurücksetzen"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Successes */}
              <div className="space-y-2">
                <label className="text-sm font-black text-green-500/70 uppercase tracking-wider">
                  Erfolge
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() =>
                        handleUpdateDeathSave(
                          "successes",
                          health.death_saves.successes === num ? num - 1 : num,
                        )
                      }
                      className={`flex-1 h-12 rounded-lg border-2 transition-all ${
                        health.death_saves.successes >= num
                          ? "bg-green-500/20 border-green-500 text-green-500"
                          : "bg-muted/50 border-border text-muted-foreground hover:border-green-500/30"
                      }`}
                    >
                      <Check size={20} className="mx-auto" />
                    </button>
                  ))}
                </div>
              </div>
              {/* Failures */}
              <div className="space-y-2">
                <label className="text-sm font-black text-red-500/70 uppercase tracking-wider">
                  Fehlschläge
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() =>
                        handleUpdateDeathSave(
                          "failures",
                          health.death_saves.failures === num ? num - 1 : num,
                        )
                      }
                      className={`flex-1 h-12 rounded-lg border-2 transition-all ${
                        health.death_saves.failures >= num
                          ? "bg-red-500/20 border-red-500 text-red-500"
                          : "bg-muted/50 border-border text-muted-foreground hover:border-red-500/30"
                      }`}
                    >
                      <X size={20} className="mx-auto" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
