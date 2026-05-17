import React from 'react';
import { FeatureCard } from './FeatureCard';

export default function FeatureCards({className=''}: {className?: string}) {
  const data = [
    {
      type: "market",
      title: "Market Analysis",
      description: "TAM, SAM, SOM insights",
    },
    {
      type: "competitor",
      title: "Competitor Intel",
      description: "Moats, SWOT, OSINT",
    },
    {
      type: "revenue",
      title: "Revenue Models",
      description: "Monetization + Economics",
    },
    {
      type: "genui",
      title: "GenUI Prototypes",
      description: "Wireframes & Visuals",
    },
  ] as const;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
      {data.map((d) => (
        <FeatureCard 
            key={d.title}
            type={d.type}
            title={d.title}
            description={d.description}
        />
      ))}
    </div>
  );
}