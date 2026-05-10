import React, { useState } from 'react';
import { Clock, X, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RealData } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  archive: RealData[];
  onSelect: (report: RealData) => void;
  onDelete: (idea: string) => void;
}

const HistoryDrawer: React.FC<Props> = ({ isOpen, onClose, archive, onSelect, onDelete }) => {
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(archive.length / itemsPerPage);
  const currentItems = archive.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const handleSelect = (report: RealData) => {
    onSelect(report);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] no-print"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full max-w-[380px] bg-[#0B1221] border-l border-white/10 shadow-2xl z-[101] flex flex-col no-print"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase italic">War Chest</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {archive.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <Clock className="w-12 h-12 text-slate-600 mb-4 animate-pulse" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-sm italic">
                    NO INTELLIGENCE ARCHIVED
                  </p>
                </div>
              ) : (
                currentItems.map((report, idx) => (
                  <motion.div
                    key={report.idea}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-4 transition-all cursor-pointer"
                    onClick={() => handleSelect(report)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white text-sm line-clamp-1 italic tracking-tight group-hover:text-purple-400 transition-colors pr-8">
                        "{report.idea}"
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(report.idea!);
                        }}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-slate-600 hover:text-red-500 transition-all rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                          report.god_mode?.risk_score.includes('Low') 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          {report.god_mode?.risk_score || 'UNKNOWN'}
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                          {report.timestamp ? new Date(report.timestamp).toLocaleDateString() : 'LEGACY'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> PREV
                </button>
                <div className="text-[10px] font-black text-slate-600">
                  {page + 1} / {totalPages}
                </div>
                <button
                  disabled={page === totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  NEXT <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HistoryDrawer;
