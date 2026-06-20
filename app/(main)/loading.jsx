"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Loading() {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" style={{ width: '64px', height: '64px', animationDuration: '1.5s' }} />
          {/* Inner pulsating dot */}
          <div className="h-16 w-16 flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-1 text-center">
          <h3 className="text-xl font-medium text-white tracking-tight">Loading 247care</h3>
          <p className="text-sm font-mono text-emerald-400/60 uppercase tracking-widest">
            Establishing connection...
          </p>
        </div>
      </div>
    </div>
  );
}
