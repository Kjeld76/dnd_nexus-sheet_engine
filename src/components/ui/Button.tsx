import React from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}) => {
  const baseStyles =
    "font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: cn(
      "bg-accent shadow-lg shadow-accent/30 dark:shadow-accent/50",
      "hover:scale-105 hover:shadow-xl hover:shadow-accent/40 dark:hover:shadow-accent/60",
      "border border-transparent",
      // Text color based on theme
      "text-[hsl(var(--bg))] dark:text-[hsl(var(--bg))]",
    ),
    secondary: cn(
      "bg-transparent text-foreground border-2 border-accent/50",
      "hover:bg-accent/10 hover:border-accent",
      "relative overflow-hidden group",
      // Nexus-Ecken (magische Linien-Elemente)
      "before:absolute before:top-0 before:left-0 before:w-4 before:h-4 before:border-t-2 before:border-l-2 before:border-accent/30 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity",
      "after:absolute after:bottom-0 after:right-0 after:w-4 after:h-4 after:border-b-2 after:border-r-2 after:border-accent/30 after:opacity-0 group-hover:after:opacity-100 after:transition-opacity",
    ),
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-xs rounded-lg",
    md: "px-6 py-3 text-sm rounded-xl",
    lg: "px-10 py-5 text-base rounded-2xl",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
