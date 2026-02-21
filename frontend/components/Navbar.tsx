

import React from 'react';
import { Icons } from './Icons';

export default function Navbar({ onReset, onTestMode, onToolsMode }: { onReset?: () => void, onTestMode?: () => void, onToolsMode?: () => void }){
  return (
    <nav className="w-full px-6 py-5 flex items-center justify-between absolute top-0 z-50 pointer-events-none">
      <div 
        className="flex items-center gap-1.5 select-none pointer-events-auto cursor-pointer"
        onClick={onReset}
      >
        <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-white drop-shadow-md">
            LaunchMint
            </span>
            <span className="text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.8)]">
            AI
            </span>
        </h1>
      </div>
      
      {/* ──────────────────────── TOP RIGHT CONTROLS ──────────────────────── */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Tools Button */}
        <button
          onClick={onToolsMode}
          className="
            group
            flex items-center gap-2
            px-4 py-1.5
            rounded-full
            border border-white/10
            bg-black/40
            hover:bg-white/5
            transition-all
            text-zinc-400 hover:text-white
            text-sm font-medium
          "
        >
          <Icons.LayoutTemplate className="w-3.5 h-3.5" />
          <span>Tools</span>
        </button>

        {/* Test Suite Button */}
        <button
          onClick={onTestMode}
          className="
            group
            flex items-center gap-2
            px-4 py-1.5
            bg-indigo-600/20
            hover:bg-indigo-600/40
            border border-indigo-500/50
            rounded-full
            text-indigo-200
            text-sm font-medium
            transition-all
            shadow-[0_0_15px_rgba(99,102,241,0.3)]
            hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]
          "
        >
          <Icons.zap className="w-3.5 h-3.5 group-hover:text-white transition-colors" />
          <span>Test Suite</span>
        </button>

        {/* History Button */}
        <button
          className="
            px-4 py-1.5
            rounded-full
            border border-white/10
            bg-black/40
            hover:bg-white/5
            transition-colors
            text-zinc-400 hover:text-white
            text-sm font-medium
          "
        >
          History
        </button>
      </div>
    </nav>
  );
}
