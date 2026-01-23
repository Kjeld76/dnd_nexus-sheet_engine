import React from "react";
import { Bot, Sparkles, Lock } from "lucide-react";
import { UI_LOCKED_ICON_CLASS } from "../../lib/uiConstants";

interface Props {
  className?: string;
  size?: number;
  label?: string; // Optional custom text for tooltip
}

export const AutomatedHelper: React.FC<Props> = ({
  className = "",
  size = 12,
  label = "Automatischer Wert basierend auf PHB 2024",
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      title={label}
      aria-label={label}
    >
      <Bot size={size} className={UI_LOCKED_ICON_CLASS} />
    </div>
  );
};
