import React from 'react';

export default function TemplateChips({className='', onSelect}: {className?: string, onSelect: (idea: string) => void}) {
  const chips = ["Uber for Dog Walking","AI Legal Assistant","SaaS CRM for Plumbers","Sustainable Fashion Marketplace"];
  return (
    <div className={`flex flex-wrap justify-center gap-3 mt-8 ${className}`}>
      {chips.map(c => (
        <button 
            key={c} 
            onClick={() => onSelect(c)}
            className="text-sm rounded-full px-4 py-2 bg-white/5 border border-white/8 text-zinc-300 hover:bg-white/10 hover:border-indigo-500/30 hover:text-white transition-all shadow-sm"
        >
            {c}
        </button>
      ))}
    </div>
  );
}
