import React, { useEffect, useRef } from 'react';

export default function OrchestratorTerminal({ lines }: { lines: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="w-full mt-10 px-6 max-w-[1280px] mx-auto flex-1 min-h-0 flex flex-col mb-12">
      <div className="
        bg-[#0C0C0F] 
        border border-mat-outline 
        rounded-[16px] 
        shadow-[0_0_28px_rgba(112,103,255,0.15)]
        flex flex-col flex-1 min-h-[300px] overflow-hidden
      ">

        {/* Terminal Header */}
        <div className="px-5 py-3 bg-[#16161A] border-b border-mat-outline flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="text-mat-text-secondary text-xs font-mono tracking-wide">root@mintify-ai:~/orchestrator</span>
          </div>
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-mat-danger transition-colors cursor-pointer"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-mat-warning transition-colors cursor-pointer"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-mat-success transition-colors cursor-pointer"></div>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto font-mono text-[14px] leading-[1.65] bg-[#0C0C0F] text-[#80FFB3]"
        >
          <div className="text-mat-text-tertiary mb-4 select-none">
            {'>'} Initializing connection...<br />
            {'>'} Secure channel established (TLS 1.3).<br />
            {'>'} Awaiting agent sequence...<br />
          </div>

          {lines.map((l, idx) => (
            <div key={idx} className="animate-in fade-in slide-in-from-left-1 duration-200 break-words">
              {l.includes('Starting') ? (
                <span className="text-mat-text-secondary mr-2">{'>'}</span>
              ) : l.includes('Finished') ? (
                <span className="text-mat-success mr-2">✔</span>
              ) : l.includes('Error') ? (
                <span className="text-mat-danger mr-2">✖</span>
              ) : (
                <span className="text-mat-primary mr-2">$</span>
              )}
              {l}
            </div>
          ))}

          <div className="inline-block w-2.5 h-5 bg-mat-primary align-middle ml-1 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}