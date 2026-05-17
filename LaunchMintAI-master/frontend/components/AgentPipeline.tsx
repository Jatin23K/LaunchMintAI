import React, { useEffect, useRef } from 'react';
import AgentCard, { AgentMeta } from './AgentCard';

export default function AgentPipeline({agents}: {agents: AgentMeta[]}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll logic
  useEffect(() => {
    const runningIndex = agents.findIndex(a => a.status === 'running');
    if (runningIndex !== -1 && scrollRef.current) {
        const cardWidth = 200 + 16; 
        const scrollPos = (runningIndex * cardWidth) - (scrollRef.current.clientWidth / 2) + (cardWidth / 2);
        scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, [agents]);

  return (
    <div className="w-full px-6 mt-10 max-w-[1280px] mx-auto">
      
      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-8 pt-4 no-scrollbar mask-gradient"
      >
        {agents.map(a => <AgentCard key={a.name} meta={a} />)}
      </div>

      {/* Google Glow Pulse Line */}
      <div className="relative h-[3px] w-full bg-white/5 rounded-full overflow-hidden mt-2">
         <div className="absolute inset-0 w-full h-full">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-mat-primary to-transparent animate-sweep"></div>
         </div>
      </div>
    </div>
  );
}