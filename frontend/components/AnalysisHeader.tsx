import React from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  idea: string;
  isSaved: boolean;
  onBack: () => void;
  onSave: () => void;
  onExport: () => void;
}

const AnalysisHeader: React.FC<Props> = ({ idea, isSaved, onBack, onSave, onExport }) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> New Analysis
        </button>
        <div className="flex items-center gap-3 no-print">
          <button
            onClick={onSave}
            disabled={isSaved}
            aria-label={isSaved ? "Analysis archived" : "Save analysis to battle room"}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all text-sm font-black ${isSaved
              ? 'bg-green-500/10 border-green-500/50 text-green-400'
              : 'bg-purple-600 hover:bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20'
              }`}
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            {isSaved ? 'ARCHIVED' : 'SAVE TO BATTLE ROOM'}
          </button>
          <button
            onClick={onExport}
            aria-label="Export analysis as PDF"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-sm font-bold"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-xl md:text-3xl font-black text-white tracking-tight leading-snug">{idea}</h1>
      </div>
    </div>
  );
};

export default AnalysisHeader;
