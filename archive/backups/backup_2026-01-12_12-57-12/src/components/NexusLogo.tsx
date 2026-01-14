import React from "react";

interface NexusLogoProps {
  size?: "small" | "medium" | "large";
  variant?: "icon" | "full";
  className?: string;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
  size = "medium",
  variant = "icon",
  className = "",
}) => {
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
  };

  const iconSize = sizeMap[size];

  if (variant === "icon") {
    // Icon version: d20 in stone-like frame for sidebar
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Stone-like frame with spikes */}
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="3"
          fill="hsl(var(--surface))"
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
        {/* Top spikes */}
        <path
          d="M32 2 L28 8 L30 8 L32 4 L34 8 L36 8 Z"
          fill="hsl(var(--border))"
        />
        <path
          d="M60 32 L54 28 L54 30 L58 32 L54 34 L54 36 Z"
          fill="hsl(var(--border))"
        />
        {/* Bottom spikes */}
        <path
          d="M32 62 L28 56 L30 56 L32 60 L34 56 L36 56 Z"
          fill="hsl(var(--border))"
        />
        <path
          d="M4 32 L10 28 L10 30 L6 32 L10 34 L10 36 Z"
          fill="hsl(var(--border))"
        />

        {/* D20 dice - icosahedron shape */}
        <g transform="translate(32, 32)">
          {/* Top face - pentagon */}
          <polygon
            points="-8,-10 -2.5,-12.5 2.5,-12.5 8,-10 5,0 -5,0"
            fill="hsl(var(--muted))"
            stroke="hsl(var(--accent))"
            strokeWidth="1.5"
            filter="url(#glowIcon)"
          />
          {/* Left side face */}
          <polygon
            points="-8,-10 -5,0 -2.5,8 -8,6"
            fill="hsl(var(--muted) / 0.7)"
            stroke="hsl(var(--accent) / 0.8)"
            strokeWidth="1"
          />
          {/* Right side face */}
          <polygon
            points="8,-10 5,0 2.5,8 8,6"
            fill="hsl(var(--muted) / 0.7)"
            stroke="hsl(var(--accent) / 0.8)"
            strokeWidth="1"
          />
          {/* Number 20 on top face */}
          <text
            x="0"
            y="-4"
            fontSize="10"
            fill="hsl(var(--accent))"
            textAnchor="middle"
            fontWeight="900"
            fontFamily="Inter, sans-serif"
            filter="url(#glowIcon)"
          >
            20
          </text>
        </g>

        <defs>
          <filter id="glowIcon" x="-200%" y="-200%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    );
  }

  // Full logo version: Two d20 cards side by side
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Left d20 card */}
      <svg
        width={iconSize}
        height={iconSize * 0.8}
        viewBox="0 0 64 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Card background */}
        <rect
          x="2"
          y="2"
          width="60"
          height="44"
          rx="2"
          fill="hsl(var(--surface))"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />

        {/* D20 dice */}
        <g transform="translate(32, 24)">
          <polygon
            points="-10,-8 -3,-10 3,-10 10,-8 6,2 -6,2"
            fill="hsl(var(--muted))"
            stroke="hsl(var(--accent))"
            strokeWidth="1.5"
            filter="url(#glowFull)"
          />
          <text
            x="0"
            y="-2"
            fontSize="12"
            fill="hsl(var(--accent))"
            textAnchor="middle"
            fontWeight="900"
            fontFamily="Inter, sans-serif"
          >
            20
          </text>
        </g>

        <defs>
          <filter id="glowFull" x="-200%" y="-200%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Right d20 card */}
      <svg
        width={iconSize}
        height={iconSize * 0.8}
        viewBox="0 0 64 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Card background */}
        <rect
          x="2"
          y="2"
          width="60"
          height="44"
          rx="2"
          fill="hsl(var(--surface))"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />

        {/* D20 dice */}
        <g transform="translate(32, 24)">
          <polygon
            points="-10,-8 -3,-10 3,-10 10,-8 6,2 -6,2"
            fill="hsl(var(--muted))"
            stroke="hsl(var(--accent))"
            strokeWidth="1.5"
            filter="url(#glowFull2)"
          />
          <text
            x="0"
            y="-2"
            fontSize="12"
            fill="hsl(var(--accent))"
            textAnchor="middle"
            fontWeight="900"
            fontFamily="Inter, sans-serif"
          >
            20
          </text>
        </g>

        <defs>
          <filter id="glowFull2" x="-200%" y="-200%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
};
