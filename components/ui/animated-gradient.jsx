"use client";

import { cn } from "@/lib/utils";

export const AnimatedGradient = ({ className, children }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 animate-gradient-x" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
