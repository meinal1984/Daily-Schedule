import React, { useState } from 'react';
import { ScheduleItem } from '../types';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Clock,
  MapPin,
  User,
  FileText,
  Calendar,
  CheckSquare,
  Square,
  Edit3,
  Archive,
  AlertCircle,
  ArrowUpDown,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { toBengaliNumerals } from '../utils/bengaliUtils';

interface Props {
  items: ScheduleItem[];
  onAddItem: () => void;
  onEditItem: (item: ScheduleItem) => void;
  onUpdateItem?: (updatedItem: ScheduleItem) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (item: ScheduleItem) => void;
  onMoveItem: (index: number, direction: 'up' | 'down') => void;
  onToggleComplete?: (id: string) => void;
  onArchiveItem?: (id: string) => void;
  onArchiveCompletedItems?: () => void;
  onOpenArchiveModal?: () => void;
  onAutoSort?: () => void;
  onOpenGeminiModal?: (initialTab?: 'parser' | 'formalizer' | 'briefing' | 'conflicts' | 'chat') => void;
  archivedCount?: number;
  saveStatus?: 'saved' | 'syncing' | 'error';
  lastSavedTime?: string | null;
}

export const ScheduleTable: React.FC<Props> = ({
  items,
  onAddItem,
  onEditItem,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onMoveItem,
  onToggleComplete,
  onArchiveItem,
  onArchiveCompletedItems,
  onOpenArchiveModal,
  onAutoSort,
  onOpenGeminiModal,
  archivedCount = 0,
  saveStatus = 'saved',
  lastSavedTime,
}) => {
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);

  const completedItemsCount = items.filter((i) => i.completed).length;

  const handleCellChange = (item: ScheduleItem, field: keyof ScheduleItem, value: string) => {
    if (!onUpdateItem) return;
    const updated = {
      ...item,
      [field]: value,
    };
    if (field === 'dateAndDay' || field === 'timeOnly') {
      updated.dateTime = `${updated.dateAndDay || ''} ${updated.timeOnly || ''}`.trim();
    }
    onUpdateItem(updated);
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden font-sans">
      {/* Table Action Bar */}
      <div className="no-print p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <span>কর্মসূচি তালিকা</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-mono font-bold rounded-md">
              {toBengaliNumerals(items.length.toString())} টি
            </span>
          </span>

          {/* Local Auto-Save Indicator */}
          <AutoSaveIndicator status={saveStatus} lastSavedTime={lastSavedTime} compact />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Gemini AI Intelligence Suite Button */}
          {onOpenGeminiModal && (
            <button
              onClick={() => onOpenGeminiModal('parser')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm border border-emerald-600/50 transition-all cursor-pointer ring-1 ring-emerald-400/20"
              title="Gemini AI দিয়ে টেক্সট পার্স, সরকারি প্রমিতকরণ ও নোটিশ তৈরি করুন"
            >
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>Gemini AI টুলস</span>
            </button>
          )}

          {/* Auto Sort Button */}
          {onAutoSort && (
            <button
              onClick={onAutoSort}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
              title="তারিখ ও সময় অনুযায়ী সকল কর্মসূচি স্বয়ংক্রিয়ভাবে সাজান"
            >
              <ArrowUpDown className="w-4 h-4 text-emerald-700" />
              <span>স্মার্ট রিঅর্ডার</span>
            </button>
          )}
          {completedItemsCount > 0 && onArchiveCompletedItems && (
            <button
              onClick={onArchiveCompletedItems}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
              title="সম্পন্ন চিহ্নিত কর্মসূচিগুলো আর্কাইভে পাঠান"
            >
              <Archive className="w-4 h-4 text-amber-700" />
              <span>
                সম্পন্নগুলো আর্কাইভে পাঠান ({toBengaliNumerals(completedItemsCount.toString())})
              </span>
            </button>
          )}

          {/* Open Archive Modal Button */}
          {onOpenArchiveModal && (
            <button
              onClick={onOpenArchiveModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
              title="আর্কাইভকৃত পুরনো সূচিসমূহ দেখুন"
            >
              <Archive className="w-4 h-4 text-amber-400" />
              <span>আর্কাইভ</span>
              {archivedCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-mono text-xs font-bold rounded-full">
                  {toBengaliNumerals(archivedCount.toString())}
                </span>
              )}
            </button>
          )}

          {onUpdateItem && (
            <button
              onClick={() => setIsInlineEditMode(!isInlineEditMode)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                isInlineEditMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="টেবিলে সরাসরি লিখে এডিট করুন"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isInlineEditMode ? 'সরাসরি এডিট (চালু)' : 'সরাসরি এডিট'}</span>
            </button>
          )}

          <button
            onClick={onAddItem}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন কর্মসূচি যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Main Grid Table - Matching Uploaded Image */}
      {items.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-700 font-medium text-base font-serif-bn">
            কোনো সক্রিয় কর্মসূচি নেই
          </h3>
          <p className="text-slate-500 text-xs mt-1 mb-4">
            বর্তমান তালিকা খালি রয়েছে। নতুন কর্মসূচি যোগ করুন অথবা প্রয়োজনে আর্কাইভ থেকে তথ্য পুনরুদ্ধার করুন।
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onAddItem}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-xs hover:bg-emerald-800 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>প্রথম কর্মসূচি যোগ করুন</span>
            </button>

            {archivedCount > 0 && onOpenArchiveModal && (
              <button
                onClick={onOpenArchiveModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-amber-300 text-xs font-medium rounded-lg shadow-xs hover:bg-slate-900 cursor-pointer"
              >
                <Archive className="w-4 h-4 text-amber-400" />
                <span>আর্কাইভ থেকে দেখুন ({toBengaliNumerals(archivedCount.toString())})</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-center border-collapse border border-slate-800 bg-white shadow-2xs font-serif-bn">
            <thead>
              <tr className="bg-sky-100 text-slate-900 border-b-2 border-slate-800 text-sm sm:text-base font-bold">
                <th className="py-3 px-2 sm:px-3 w-36 border-r border-slate-800">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-700 no-print" />
                    <span>তারিখ ও বার</span>
                  </div>
                </th>
                <th className="py-3 px-2 sm:px-3 w-32 border-r border-slate-800">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-700 no-print" />
                    <span>সময়</span>
                  </div>
                </th>
                <th className="py-3 px-2 sm:px-3 w-28 border-r border-slate-800">
                  <div className="flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-700 no-print" />
                    <span>গুরুত্ব</span>
                  </div>
                </th>
                <th className="py-3 px-3 sm:px-4 w-48 sm:w-56 border-r border-slate-800">
                  <div className="flex items-center justify-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-700 no-print" />
                    <span>সভার স্থান</span>
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[240px] border-r border-slate-800">
                  <div className="flex items-center justify-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-700 no-print" />
                    <span>সভার বিষয়</span>
                  </div>
                </th>
                <th className="py-3 px-3 sm:px-4 w-40 sm:w-48 border-r border-slate-800">
                  <div className="flex items-center justify-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-700 no-print" />
                    <span>সভাপতি</span>
                  </div>
                </th>
                <th className="py-3 px-3 sm:px-4 w-36 sm:w-44 border-r border-slate-800">মন্তব্য</th>
                <th className="py-3 px-3 w-36 text-center no-print border-l border-slate-800">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs sm:text-sm text-slate-950 font-medium">
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    item.completed ? 'bg-emerald-50/40 text-slate-600' : ''
                  }`}
                >
                  {/* 1. Date & Day (তারিখ ও বার) */}
                  <td className="py-2.5 px-2 text-center border-r border-slate-800 align-middle leading-tight font-bold text-black">
                    {isInlineEditMode ? (
                      <input
                        type="text"
                        value={item.dateAndDay || item.dateTime || ''}
                        onChange={(e) => handleCellChange(item, 'dateAndDay', e.target.value)}
                        className="w-full text-center bg-amber-50/70 focus:bg-white border border-amber-300 focus:border-amber-600 rounded px-1 py-0.5 text-xs sm:text-sm font-bold text-black font-serif-bn"
                      />
                    ) : (
                      item.dateAndDay || item.dateTime || '—'
                    )}
                  </td>

                  {/* 2. Time (সময়) */}
                  <td className="py-2.5 px-2 text-center border-r border-slate-800 align-middle font-medium text-slate-900 leading-tight">
                    {isInlineEditMode ? (
                      <input
                        type="text"
                        value={item.timeOnly || ''}
                        onChange={(e) => handleCellChange(item, 'timeOnly', e.target.value)}
                        className="w-full text-center bg-amber-50/70 focus:bg-white border border-amber-300 focus:border-amber-600 rounded px-1 py-0.5 text-xs sm:text-sm font-medium text-slate-900 font-serif-bn"
                      />
                    ) : (
                      item.timeOnly || '—'
                    )}
                  </td>

                  {/* Priority (গুরুত্ব) */}
                  <td className="py-2.5 px-2 text-center border-r border-slate-800 align-middle">
                    {isInlineEditMode ? (
                      <select
                        value={item.priority || 'medium'}
                        onChange={(e) => handleCellChange(item, 'priority', e.target.value)}
                        className="w-full text-center bg-amber-50/70 focus:bg-white border border-amber-300 focus:border-amber-600 rounded px-1 py-0.5 text-xs font-bold text-slate-900 font-serif-bn cursor-pointer"
                      >
                        <option value="high">উচ্চ (High)</option>
                        <option value="medium">মাঝারি (Med)</option>
                        <option value="low">সাধারণ (Low)</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${
                        item.priority === 'high'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : item.priority === 'low'
                          ? 'bg-sky-100 text-sky-900 border-sky-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          item.priority === 'high' ? 'bg-rose-600 animate-pulse' : item.priority === 'low' ? 'bg-sky-600' : 'bg-amber-600'
                        }`} />
                        <span>{item.priority === 'high' ? 'উচ্চ' : item.priority === 'low' ? 'সাধারণ' : 'মাঝারি'}</span>
                      </span>
                    )}
                  </td>

                  {/* 3. Venue (সভার স্থান) */}
                  <td className="py-2.5 px-2 text-center border-r border-slate-800 align-middle text-slate-900 leading-snug">
                    {isInlineEditMode ? (
                      <input
                        type="text"
                        value={item.venue || ''}
                        onChange={(e) => handleCellChange(item, 'venue', e.target.value)}
                        className="w-full text-center bg-amber-50/70 focus:bg-white border border-amber-300 focus:border-amber-600 rounded px-1 py-0.5 text-xs sm:text-sm text-slate-900 font-serif-bn"
                      />
                    ) : (
                      item.venue || '—'
                    )}
                  </td>

                  {/* 4. Subject / Description (সভার বিষয়) */}
                  <td className="py-2.5 px-3 text-center border-r border-slate-800 align-middle font-bold text-slate-950 text-sm sm:text-base leading-snug">
                    {isInlineEditMode ? (
                      <textarea
                        rows={2}
                        value={item.description || ''}
                        onChange={(e) => handleCellChange(item, 'description', e.target.value)}
                        className="w-full text-center bg-amber-50/70 focus:bg-white border border-amber-300 focus:border-amber-600 rounded px-1 py-0.5 text-xs sm:text-sm font-bold text-slate-900 resize-y font-serif-bn"
                      />
                    ) : (
                      <div className={item.completed ? 'line-through text-slate-400 font-normal' : ''}>
                        {item.description}
                      </div>
                    )}
                  </td>

                  {/* 5. Chairperson (সভাপতি) */}
                  <td className="py-2.5 px-2 text-center border-r border-slate-800 align-middle text-slate-900 leading-snug">
                    {isInlineEditMode ? (
                      <input
                        type="text"
                        value={item.chairperson || ''}
                        onChange={(e) => handleCellChange(item, 'chairperson', e.target.value)}
                        className="w-full text-center bg-amber-50/70 focus:bg-white border border-amber-300 focus:border-amber-600 rounded px-1 py-0.5 text-xs sm:text-sm text-slate-900 font-serif-bn"
                      />
                    ) : (
                      item.chairperson || '—'
                    )}
                  </td>

                  {/* 6. Remarks (মন্তব্য) */}
                  <td className="py-2.5 px-2 text-center border-r border-slate-800 align-middle text-slate-800 text-xs sm:text-sm leading-snug">
                    {isInlineEditMode ? (
                      <input
                        type="text"
                        value={item.remarks || ''}
                        onChange={(e) => handleCellChange(item, 'remarks', e.target.value)}
                        className="w-full text-center bg-amber-50/70 focus:bg-white border border-amber-300 focus:border-amber-600 rounded px-1 py-0.5 text-xs sm:text-sm text-slate-800 font-serif-bn"
                      />
                    ) : (
                      item.remarks || '—'
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-2.5 px-1.5 text-center align-middle no-print border-l border-slate-800 bg-slate-50/50">
                    <div className="flex items-center justify-center gap-1">
                      {/* Mark Completed Toggle */}
                      {onToggleComplete && (
                        <button
                          onClick={() => onToggleComplete(item.id)}
                          className={`p-1 rounded-md transition-colors ${
                            item.completed
                              ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={item.completed ? 'সম্পন্ন চিহ্নিতকরণ বাতিল করুন' : 'সম্পন্ন হিসেবে চিহ্নিত করুন'}
                        >
                          {item.completed ? (
                            <CheckSquare className="w-3.5 h-3.5" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* Move Up/Down */}
                      <button
                        onClick={() => onMoveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 transition-colors cursor-pointer"
                        title="উপরে নিয়ে যান"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onMoveItem(index, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 transition-colors cursor-pointer"
                        title="নিচে নিয়ে যান"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                        title="পপআপ মডালে বিস্তারিত সম্পাদন করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => onDuplicateItem(item)}
                        className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                        title="কপি করুন"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Archive Button */}
                      {onArchiveItem && (
                        <button
                          onClick={() => onArchiveItem(item.id)}
                          className="p-1 text-amber-700 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
                          title="এই কর্মসূচিটি আর্কাইভে সরান"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1 text-rose-600 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

