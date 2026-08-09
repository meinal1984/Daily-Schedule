import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AutoSaveIndicatorProps {
  status: 'saved' | 'syncing' | 'error';
  lastSavedTime?: string | null;
  compact?: boolean;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSavedTime,
  compact = false,
}) => {
  if (status === 'syncing') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all animate-pulse ${
          compact ? 'text-[11px] px-2 py-0.5' : ''
        }`}
        title="পরিবর্তনগুলো সেভ হচ্ছে..."
      >
        <Loader2 className={`animate-spin text-amber-600 dark:text-amber-400 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
        <span>Syncing...</span>
        {!compact && <span className="text-[10px] font-normal opacity-80">(সংরক্ষণ হচ্ছে)</span>}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 transition-all ${
          compact ? 'text-[11px] px-2 py-0.5' : ''
        }`}
        title="সেভ করতে সমস্যা হয়েছে"
      >
        <AlertCircle className={`text-rose-600 dark:text-rose-400 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
        <span>Sync Error</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 transition-all ${
        compact ? 'text-[11px] px-2 py-0.5' : ''
      }`}
      title={lastSavedTime ? `সর্বশেষ সেভ: ${lastSavedTime}` : 'স্বয়ংক্রিয়ভাবে সংরক্ষিত'}
    >
      <CheckCircle2 className={`text-emerald-600 dark:text-emerald-400 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      <span>Saved</span>
      {lastSavedTime && (
        <span className="text-[10px] font-normal opacity-80">[{lastSavedTime}]</span>
      )}
    </div>
  );
};
