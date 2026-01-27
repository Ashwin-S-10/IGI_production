"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type MissionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

const baseStyles = "inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-300 uppercase tracking-wider rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transform hover:scale-105 active:scale-95";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[#FF6B00] to-[#FF8533] text-white shadow-lg shadow-[#FF6B00]/40 border border-[#FF6B00]/30 hover:shadow-xl hover:shadow-[#FF6B00]/60 hover:border-[#FF6B00]/50 focus-visible:outline-[#FF6B00] backdrop-blur-sm",
  secondary:
    "border-2 border-[#FF6B00]/50 text-white bg-black/40 backdrop-blur-md hover:border-[#FF6B00] hover:bg-[#FF6B00]/20 hover:shadow-lg hover:shadow-[#FF6B00]/30 focus-visible:outline-[#FF6B00]",
  ghost: "text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20",
  danger:
    "bg-gradient-to-r from-[#DC2626] to-[#991B1B] text-white shadow-lg shadow-red-500/40 border border-red-500/30 hover:shadow-xl hover:shadow-red-500/60 hover:border-red-500/50 focus-visible:outline-red-500 backdrop-blur-sm",
};

export const MissionButton = forwardRef<HTMLButtonElement, MissionButtonProps>(
  ({ className, variant = "primary", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className, {
          "pointer-events-none opacity-70": disabled || loading,
        })}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);

MissionButton.displayName = "MissionButton";
