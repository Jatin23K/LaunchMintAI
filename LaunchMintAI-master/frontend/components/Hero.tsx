import React, { useState } from 'react';
import TemplateChips from './TemplateChips';
import FeatureCards from './FeatureCards';
import { Icon } from './Icons';

export default function Hero({ onLaunch }: { onLaunch: (idea: string) => void }) {
  const [input, setInput] = useState('');

  const handleLaunch = () => {
    if (input.trim()) onLaunch(input);
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 md:px-6 pt-20 pb-10 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none opacity-40 mix-blend-screen animate-pulse"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <h1 className="font-medium text-zinc-300 text-3xl md:text-5xl tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          Ask LaunchMint Agents to
        </h1>
        <h2 className="font-extrabold text-[56px] md:text-[96px] leading-[1.05] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 drop-shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
          validate your startup.
        </h2>

        <p className="mt-8 text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          Describe any idea. Our 18 AI Agents will assign a "Success Probability" score,
          check 150+ competitors, and design your unit economics in 30 seconds.
        </p>

        {/* Input Wrapper */}
        <div className="mt-12 flex justify-center w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="relative w-full max-w-3xl group">
            {/* Outer Glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-30 blur-xl group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative rounded-2xl p-2 bg-[#0c0c12]/90 ring-1 ring-white/10 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Inner Purple Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10 pointer-events-none"></div>

              <div className="flex items-center gap-4 px-4 py-2">
                <span className="text-zinc-500">
                  <Icon name="microphone" className="w-6 h-6" />
                </span>
                <input
                  id="idea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLaunch()}
                  placeholder="Ask LaunchMint Agents to analyze 'Uber for Dogs'..."
                  className="flex-1 bg-transparent outline-none text-zinc-100 placeholder:text-zinc-600 text-lg md:text-xl h-12"
                />
                <button
                  onClick={handleLaunch}
                  disabled={!input.trim()}
                  className="rounded-xl px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                >
                  Generate Report <Icon name="arrow" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <TemplateChips className="mt-8" onSelect={(val) => setInput(val)} />
        </div>
      </div>

      <div className="mt-20 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
        <FeatureCards />
      </div>
    </section>
  );
}