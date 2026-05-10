import React from 'react';

interface Props {
  riskScore: string;
  className?: string;
}

const RiskBadge: React.FC<Props> = ({ riskScore, className = "" }) => {
  const getColors = () => {
    const s = riskScore.toLowerCase();
    if (s.includes('low') || s.includes('safe')) return 'bg-green-500/20 border-green-500 text-green-400';
    if (s.includes('medium')) return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
    return 'bg-red-500/20 border-red-500 text-red-400';
  };

  return (
    <div className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl border-2 md:border-4 font-black text-lg md:text-2xl shadow-xl transition-all ${getColors()} ${className}`}>
      {riskScore}
    </div>
  );
};

export default RiskBadge;
