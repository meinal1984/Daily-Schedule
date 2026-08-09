import React, { useState } from 'react';
import { ScheduleItem } from '../types';
import { formatBengaliDate, toBengaliNumerals } from '../utils/bengaliUtils';
import {
  X,
  Archive,
  RotateCcw,
  Trash2,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  RefreshCw,
  Info,
  Layers,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  archivedItems: ScheduleItem[];
  onRestoreItem: (id: string) => void;
  onRestoreAll: () => void;
  onDeleteArchivedItem: (id: string) => void;
  onClearArchive: () => void;
}

export const ArchiveModal: React.FC<Props> = ({
  isOpen,
  onClose,
  archivedItems,
  onRestoreItem,
  onRestoreAll,
  onDeleteArchivedItem,
  onClearArchive,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'manual'>('all');
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  if (!isOpen) return null;

  const filteredItems = archivedItems.filter((item) => {
    const matchesSearch =
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.venue || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.chairperson || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.dateAndDay || item.dateTime || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.remarks || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'completed') return item.completed === true;
    if (filterType === 'manual') return !item.completed;
    return true;
  });

  const handleClearAllConfirm = () => {
    onClearArchive();
    setConfirmClearAll(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity modal-backdrop font-sans">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600/30 text-amber-400 rounded-lg border border-amber-500/30">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif-bn flex items-center gap-2">
                <span>আর্কাইভকৃত কর্মসূচি সংরাক্ষণাগার (Schedule Archive)</span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-mono font-bold rounded-full border border-amber-400/30">
                  {toBengaliNumerals(archivedItems.length.toString())} টি
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                সম্পন্ন বা পুরনো কর্মসূচিসমূহ প্রধান তালিকা থেকে পৃথকভাবে এখানে সংরক্ষিত রয়েছে
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Action Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="আর্কাইভে খুঁজুন (বিষয়, স্থান, সভাপতি)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Batch Action Buttons */}
            {archivedItems.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={onRestoreAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-2xs transition-all active:scale-98 cursor-pointer"
                  title="আর্কাইভের সবগুলো কর্মসূচি পুনরায় মূল তালিকায় ফেরত পাঠান"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>সবগুলো পুনরুদ্ধার করুন</span>
                </button>

                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-lg transition-all active:scale-98 cursor-pointer"
                  title="আর্কাইভের সব তথ্য স্থায়ীভাবে মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>আর্কাইভ খালি করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* Sub Filter Tags */}
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="font-semibold text-slate-500 text-[11px]">ফিল্টার:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              সকল ({toBengaliNumerals(archivedItems.length.toString())})
            </button>
            <button
              onClick={() => setFilterType('completed')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                filterType === 'completed'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              সম্পন্নকৃত (
              {toBengaliNumerals(
                archivedItems.filter((i) => i.completed).length.toString()
              )}
              )
            </button>
            <button
              onClick={() => setFilterType('manual')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                filterType === 'manual'
                  ? 'bg-amber-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              ম্যানুয়ালি আর্কাইভকৃত (
              {toBengaliNumerals(
                archivedItems.filter((i) => !i.completed).length.toString()
              )}
              )
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 font-sans">
          {archivedItems.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                <Archive className="w-7 h-7" />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h4 className="font-bold text-slate-800 text-base font-serif-bn">
                  আর্কাইভে কোনো কর্মসূচি নেই
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  মূল সভার তালিকা থেকে যে কোনো সম্পন্ন বা পুরনো কর্মসূচি আর্কাইভ বাটনে ক্লিক করে এখানে রাখতে পারেন।
                </p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              সন্ধানের সাথে মিলে যাওয়া কোনো আর্কাইভকৃত কর্মসূচি পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-4 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2 flex-1">
                    {/* Header line: Badges & Date */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[11px] rounded border border-slate-300 font-mono">
                        #{toBengaliNumerals((idx + 1).toString())}
                      </span>

                      {item.completed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>সম্পন্নকৃত</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full border border-amber-300">
                          <Archive className="w-3 h-3 text-amber-600" />
                          <span>আর্কাইভ সংরক্ষিত</span>
                        </span>
                      )}

                      {item.priority && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          item.priority === 'high'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : item.priority === 'low'
                            ? 'bg-sky-100 text-sky-800 border-sky-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.priority === 'high' ? 'bg-rose-600' : item.priority === 'low' ? 'bg-sky-600' : 'bg-amber-600'
                          }`} />
                          <span>{item.priority === 'high' ? 'উচ্চ' : item.priority === 'low' ? 'সাধারণ' : 'মাঝারি'}</span>
                        </span>
                      )}

                      <span className="text-xs font-bold text-slate-900 font-serif-bn flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {item.dateAndDay || item.dateTime || '—'}
                      </span>

                      {item.timeOnly && (
                        <span className="text-xs text-slate-600 font-serif-bn flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {item.timeOnly}
                        </span>
                      )}
                    </div>

                    {/* Description / Subject */}
                    <h5 className="font-bold text-slate-900 text-sm font-serif-bn leading-snug">
                      {item.description}
                    </h5>

                    {/* Details row: Venue & Chairperson */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1 border-t border-slate-100">
                      {item.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>স্থান: <strong>{item.venue}</strong></span>
                        </span>
                      )}

                      {item.chairperson && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>সভাপতি: <strong>{item.chairperson}</strong></span>
                        </span>
                      )}

                      {item.archivedAt && (
                        <span className="text-[10px] text-slate-400 ml-auto">
                          আর্কাইভ সময়: {new Date(item.archivedAt).toLocaleDateString('bn-BD')}
                        </span>
                      )}
                    </div>

                    {item.remarks && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-200 mt-1">
                        <strong>মন্তব্য:</strong> {item.remarks}
                      </p>
                    )}
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-end">
                    <button
                      onClick={() => onRestoreItem(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-all active:scale-98 cursor-pointer"
                      title="এই কর্মসূচিটি মূল তালিকায় পুনর্সংযুক্ত করুন"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>পুনরুদ্ধার করুন</span>
                    </button>

                    <button
                      onClick={() => onDeleteArchivedItem(item.id)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="স্থায়ীভাবে মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between shrink-0 font-sans px-6">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>
              আর্কাইভের কর্মসূচিগুলো প্রিন্ট বা শেয়ার ডকুমেন্টে অন্তর্ভুক্ত থাকে না।
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Clearing Entire Archive */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-2 bg-rose-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-serif-bn">
                সম্পূর্ণ আর্কাইভ খালি করার নিশ্চিতকরণ
              </h4>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              আপনি কি নিশ্চিত যে আর্কাইভে থাকা সকল (<strong>{toBengaliNumerals(archivedItems.length.toString())}টি</strong>) কর্মসূচি স্থায়ীভাবে মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                বাতিল (Cancel)
              </button>

              <button
                type="button"
                onClick={handleClearAllConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                হ্যাঁ, আর্কাইভ খালি করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
