import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';

export interface AgentMeta {
  name: string;
  status: 'queued'|'running'|'completed'|'failed'|'repaired';
  durationMs?: number;
  startTime?: number;
  message?: string;
}

export const formatMs = (ms?: number) => {
  if (ms === undefined || ms === null) return '00s';
  const s = (ms/1000).toFixed(1);
  return `${s.padStart(2, '0')}s`;
};

const AgentCard: React.FC<{ meta: AgentMeta }> = ({ meta }) => {
  const isActive = meta.status === 'running';
  const isCompleted = meta.status === 'completed' || meta.status === 'repaired';
  const isFailed = meta.status === 'failed';

  // Live Timer State
  const [elapsedMs, setElapsedMs] = useState<number>(meta.durationMs || 0);

  useEffect(() => {
    let interval: any;

    if (isActive && meta.startTime) {
      // Immediate update to prevent initial lag
      setElapsedMs(Date.now() - meta.startTime);
      
      // Update frequently for smooth UI (100ms), though we display seconds
      interval = setInterval(() => {
        setElapsedMs(Date.now() - meta.startTime!);
      }, 100);
    } else if (meta.durationMs !== undefined) {
      // If completed/failed, ensure we show the final fixed duration
      setElapsedMs(meta.durationMs);
    } else {
      setElapsedMs(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, meta.startTime, meta.durationMs]);

  // Base styles for Material 3 Surface
  let containerClasses = "bg-mat-surface-variant border-mat-outline shadow-none translate-y-0 opacity-60";
  let statusText = "QUEUED";
  let statusColor = "text-mat-text-tertiary";
  
  if (isActive) {
      containerClasses = "border-mat-primary/40 shadow-glow-indigo -translate-y-1 opacity-100 ring-1 ring-mat-primary/20";
      statusText = "RUNNING";
      statusColor = "text-mat-primary animate-pulse";
  } else if (isCompleted) {
      containerClasses = "border-mat-success shadow-glow-success opacity-100";
      statusText = "COMPLETE";
      statusColor = "text-mat-success";
  } else if (isFailed) {
      containerClasses = "border-mat-danger shadow-glow-danger opacity-100";
      statusText = "FAILED";
      statusColor = "text-mat-danger";
  }

  return (
    <div 
        className={`
            relative flex-shrink-0 w-[200px] p-[18px] rounded-[16px] border
            transition-all duration-300 ease-[cubic-bezier(0.2,0.0,0,1)]
            ${containerClasses} bg-[#16161A]
        `}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className={`font-medium text-[15px] truncate max-w-[110px] ${isCompleted || isActive ? 'text-mat-text-primary' : 'text-mat-text-secondary'}`}>
            {meta.name.replace('Agent','')}
        </span>
        <span className={`text-[10px] tracking-wider font-bold ${statusColor}`}>
            {statusText}
        </span>
      </div>

      {/* Progress / Status Indicator */}
      <div className="h-[6px] w-full bg-mat-outline rounded-full overflow-hidden relative">
        {isActive && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-mat-primary to-[#AA8FFF] animate-[shimmer_1.4s_infinite_ease-out] bg-[length:200%_100%] rounded-full"></div>
        )}
        {isCompleted && (
            <div className="w-full h-full bg-mat-success rounded-full"></div>
        )}
        {isFailed && (
            <div className="w-full h-full bg-mat-danger rounded-full"></div>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="mt-3 flex justify-between items-center">
         <span className={`text-[12px] font-mono tracking-tight ${isActive ? 'text-mat-primary' : 'text-mat-text-tertiary'}`}>
            {meta.status === 'queued' ? '--' : formatMs(elapsedMs)}
         </span>
         
         <div className="flex items-center">
            {isCompleted && <Icon name="check-circle" className="w-4 h-4 text-mat-success" />}
            {isFailed && <Icon name="alert-triangle" className="w-4 h-4 text-mat-danger" />}
            {isActive && <div className="w-2 h-2 rounded-full bg-mat-primary animate-ping" />}
         </div>
      </div>
    </div>
  );
};

export default AgentCard;