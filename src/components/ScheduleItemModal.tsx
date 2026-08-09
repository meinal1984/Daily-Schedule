import React, { useState, useEffect } from 'react';
import { ScheduleItem, PriorityLevel } from '../types';
import { X, Save, Clock, MapPin, User, FileText, Calendar, Sparkles, Check, ChevronRight, AlertCircle, Flag } from 'lucide-react';
import {
  toBengaliNumerals,
  formatBengaliDateAndDay,
  formatBengaliTime,
  getBengaliDayOfWeek,
} from '../utils/bengaliUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ScheduleItem) => void;
  itemToEdit: ScheduleItem | null;
  suggestedSerialNo: number;
}

const TIME_PRESETS = [
  { time24: '10:00', label: 'সকাল ১০:০০ টা' },
  { time24: '11:00', label: 'সকাল ১১:০০ টা' },
  { time24: '12:00', label: 'দুপুর ১২:০০ টা' },
  { time24: '14:30', label: 'দুপুর ২:৩০ টা' },
  { time24: '16:30', label: 'বিকাল ৪:৩০ টা' },
  { time24: '18:00', label: 'সন্ধ্যা ৬:০০ টা' },
];

const DESCRIPTION_PRESETS = [
  'প্রকল্প স্টিয়ারিং কমিটির (PSC) সভা',
  'প্রকল্প বাস্তবায়ন কমিটির (PIC) সভা',
  'এডিপি/আরএডিপিভুক্ত প্রকল্প সমূহের বাস্তবায়ন অগ্রগতি পর্যালোচনা সভা',
  'মাসিক সমন্বয় সভা',
  'দরপত্র মূল্যায়ন কমিটির (TEC) সভা',
  'আইন-শৃঙ্খলা সংক্রান্ত জেলা কমিটির মাসিক সভা',
  'বার্ষিক কর্মসম্পাদন চুক্তি (APA) বিষয়ক সভা',
  'জাতীয় দিবস উদ্‌যাপন সংক্রান্ত প্রস্তুতিমূলক সভা',
  'বিভাগীয় কর্মকর্তা ও দপ্তর প্রধানদের সমন্বয় সভা',
  'ডিজিটাল উদ্ভাবনী মেলার আয়োজনের প্রস্তুতি সভা',
  'সাধারণ জনগণের গণশুনানি ও স্মারকলিপি গ্রহণ',
  'বাজেট ও অর্থ কমিটির সমন্বয় বৈঠক',
];

const VENUE_PRESETS = [
  'সম্মেলন কক্ষ (২য় তলা)',
  'মন্ত্রণালয়ের সভাকক্ষ',
  'প্রকল্প পরিচালকের কক্ষ',
  'জেলা প্রশাসকের সম্মেলন কক্ষ',
  'অনলাইন (জুম প্ল্যাটফর্ম)',
  'উপজেলা পরিষদ মিলনায়তন',
  'অফিস কক্ষ',
];

const CHAIRPERSON_PRESETS = [
  'সচিব মহোদয়',
  'প্রকল্প পরিচালক',
  'জেলা প্রশাসক ও জেলা ম্যাজিস্ট্রেট',
  'মহাপরিচালক (অতিরিক্ত সচিব)',
  'অতিরিক্ত জেলা প্রশাসক (সার্বিক)',
  'উপজেলা নির্বাহী অফিসার (ইউএনও)',
  'উপ-প্রকল্প পরিচালক',
];

const REMARKS_PRESETS = [
  'সম্পন্ন',
  'উপস্থিতি আবশ্যিক',
  'মাননীয় মন্ত্রী মহোদয় উপস্থিত থাকবেন',
  'সচিব মহোদয় উপস্থিত থাকবেন',
  'মহাপরিচালক মহোদয় উপস্থিত থাকবেন',
  'প্রকল্প পরিচালক মহোদয় উপস্থিত থাকবেন',
  'অনলাইনে (জুম/গুগল মিট) যুক্ত হবেন',
  'বিশেষ অনুরোধক্রমে',
  'স্থান পরিবর্তনযোগ্য',
  'যথা সময়ে উপস্থিত থাকার অনুরোধ',
  'জরুরি বিষয়াদি আলোচনা',
  'ভিডিও কনফারেন্সের মাধ্যমে',
  'পরবর্তী নির্দেশ না দেওয়া পর্যন্ত স্থগিত',
];

export const ScheduleItemModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  suggestedSerialNo,
}) => {
  // Calendar and Time Picker Raw values
  const [rawDate, setRawDate] = useState<string>('');
  const [rawTime, setRawTime] = useState<string>('16:30');

  // Formatted Output text values
  const [dateAndDay, setDateAndDay] = useState('');
  const [timeOnly, setTimeOnly] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [chairperson, setChairperson] = useState('');
  const [remarks, setRemarks] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');

  useEffect(() => {
    if (itemToEdit) {
      setDateAndDay(itemToEdit.dateAndDay || itemToEdit.dateTime || '');
      setTimeOnly(itemToEdit.timeOnly || '');
      setDescription(itemToEdit.description || '');
      setVenue(itemToEdit.venue || '');
      setChairperson(itemToEdit.chairperson || '');
      setRemarks(itemToEdit.remarks || '');
      setPriority(itemToEdit.priority || 'medium');
    } else {
      const todayIso = new Date().toISOString().split('T')[0];
      setRawDate(todayIso);
      setDateAndDay(formatBengaliDateAndDay(todayIso));
      setRawTime('16:30');
      setTimeOnly('বিকাল ৪:৩০ টা');
      setDescription('');
      setVenue('সভাকক্ষ, তথ্য ও সম্প্রচার মন্ত্রণালয়');
      setChairperson('সচিব');
      setRemarks('');
      setPriority('medium');
    }
  }, [itemToEdit, suggestedSerialNo, isOpen]);

  if (!isOpen) return null;

  // Handle Date Selection from Calendar
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedIso = e.target.value;
    setRawDate(selectedIso);
    if (selectedIso) {
      const formatted = formatBengaliDateAndDay(selectedIso);
      setDateAndDay(formatted);
    }
  };

  // Quick Today & Tomorrow Selectors
  const handleSelectQuickDate = (type: 'today' | 'tomorrow') => {
    const d = new Date();
    if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    const iso = d.toISOString().split('T')[0];
    setRawDate(iso);
    setDateAndDay(formatBengaliDateAndDay(iso));
  };

  // Handle Time Selection from Time Picker
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time24 = e.target.value;
    setRawTime(time24);
    if (time24) {
      const formatted = formatBengaliTime(time24);
      setTimeOnly(formatted);
    }
  };

  // Handle Preset Time Selection
  const handleSelectPresetTime = (preset: { time24: string; label: string }) => {
    setRawTime(preset.time24);
    setTimeOnly(preset.label);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('অনুগ্রহ করে সভার বিষয় উল্লেখ করুন।');
      return;
    }

    const newItem: ScheduleItem = {
      id: itemToEdit ? itemToEdit.id : 'item-' + Date.now(),
      serialNo: itemToEdit?.serialNo || toBengaliNumerals(suggestedSerialNo),
      dateAndDay: dateAndDay.trim(),
      timeOnly: timeOnly.trim(),
      rawDate: rawDate || itemToEdit?.rawDate,
      rawTime: rawTime || itemToEdit?.rawTime,
      dateTime: `${dateAndDay.trim()} ${timeOnly.trim()}`.trim(),
      description: description.trim(),
      venue: venue.trim(),
      chairperson: chairperson.trim(),
      remarks: remarks.trim(),
      priority,
      completed: itemToEdit ? itemToEdit.completed : false,
    };

    onSave(newItem);
    onClose();
  };

  // Calculate detected Bengali day of week for badge preview
  const detectedDay = rawDate ? getBengaliDayOfWeek(rawDate) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity modal-backdrop font-serif-bn">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>{itemToEdit ? 'কর্মসূচি সংশোধন করুন' : 'নতুন কর্মসূচি যোগ করুন'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* SECTION 1: Date Selection with Calendar & Auto Day */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between font-sans">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>তারিখ নির্বাচন ও স্বয়ংক্রিয় বার নির্ধারণ (Date & Auto Day)</span>
              </label>

              {detectedDay && (
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 font-serif-bn">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  <span>বার: {detectedDay}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ক্যালেন্ডার হতে তারিখ সিলেক্ট করুন:
                </label>
                <input
                  type="date"
                  value={rawDate}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  চূড়ান্ত তারিখ ও বার (বাংলা টেক্সট):
                </label>
                <input
                  type="text"
                  value={dateAndDay}
                  onChange={(e) => setDateAndDay(e.target.value)}
                  placeholder="যেমন: ১৮.০৬.২০২৫ বুধবার"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 font-serif-bn shadow-2xs"
                  required
                />
              </div>
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-2 pt-1 font-sans">
              <span className="text-[11px] text-slate-500">দ্রুত নির্বাচন:</span>
              <button
                type="button"
                onClick={() => handleSelectQuickDate('today')}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-300 rounded-md text-xs font-semibold transition-colors shadow-2xs"
              >
                আজ
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickDate('tomorrow')}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-300 rounded-md text-xs font-semibold transition-colors shadow-2xs"
              >
                আগামীকাল
              </button>
            </div>
          </div>

          {/* SECTION 2: Time Selection with Time Picker & Presets */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between font-sans">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>সময় নির্বাচন (Time Picker & Presets)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ঘড়ি হতে সময় সিলেক্ট করুন:
                </label>
                <input
                  type="time"
                  value={rawTime}
                  onChange={handleTimeChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  চূড়ান্ত বাংলা সময় টেক্সট:
                </label>
                <input
                  type="text"
                  value={timeOnly}
                  onChange={(e) => setTimeOnly(e.target.value)}
                  placeholder="যেমন: বিকাল ৪:৩০ টা"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 font-serif-bn shadow-2xs"
                  required
                />
              </div>
            </div>

            {/* Quick Time Presets */}
            <div className="space-y-1 font-sans">
              <span className="text-[11px] text-slate-500 block">সময় প্রিসেট নির্বাচন করুন:</span>
              <div className="flex flex-wrap gap-1.5 font-serif-bn">
                {TIME_PRESETS.map((p) => (
                  <button
                    key={p.time24}
                    type="button"
                    onClick={() => handleSelectPresetTime(p)}
                    className={`px-2.5 py-1 border rounded-lg text-xs font-medium transition-all shadow-2xs ${
                      timeOnly === p.label
                        ? 'bg-emerald-700 text-white border-emerald-800 font-bold'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description / Subject */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-sans">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>সভার বিষয় / বিবরণ *</span>
              </label>
              <span className="text-[11px] text-slate-500 font-normal">দ্রুত প্রিসেট নির্বাচন করুন</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="যেমন: প্রকল্প স্টিয়ারিং কমিটির সভা..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold font-serif-bn text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white leading-relaxed"
              required
            />

            {/* Description / Topic Presets */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-600 block mb-1 font-sans">
                প্রিসেট সভার নাম / বিষয়:
              </span>
              <div className="flex flex-wrap gap-1.5 font-serif-bn">
                {DESCRIPTION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDescription(preset)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer shadow-2xs ${
                      description === preset
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Venue & Chairperson Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1 font-sans">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>সভার স্থান</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="যেমন: সভাকক্ষ, তথ্য ও সম্প্রচার মন্ত্রণালয়"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white font-serif-bn"
              />
              <div className="pt-0.5">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1 font-sans">
                  প্রিসেট স্থান:
                </span>
                <div className="flex flex-wrap gap-1 font-serif-bn">
                  {VENUE_PRESETS.map((vPreset) => (
                    <button
                      key={vPreset}
                      type="button"
                      onClick={() => setVenue(vPreset)}
                      className={`px-2 py-0.5 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                        venue === vPreset
                          ? 'bg-emerald-700 text-white border-emerald-800 font-semibold'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {vPreset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1 font-sans">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>সভাপতি</span>
              </label>
              <input
                type="text"
                value={chairperson}
                onChange={(e) => setChairperson(e.target.value)}
                placeholder="যেমন: সচিব"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white font-serif-bn"
              />
              <div className="pt-0.5">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1 font-sans">
                  প্রিসেট সভাপতি:
                </span>
                <div className="flex flex-wrap gap-1 font-serif-bn">
                  {CHAIRPERSON_PRESETS.map((cPreset) => (
                    <button
                      key={cPreset}
                      type="button"
                      onClick={() => setChairperson(cPreset)}
                      className={`px-2 py-0.5 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                        chairperson === cPreset
                          ? 'bg-emerald-700 text-white border-emerald-800 font-semibold'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {cPreset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 font-sans">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>গুরুত্ব / অগ্রাধিকার (Priority Level)</span>
            </label>
            <div className="grid grid-cols-3 gap-2 font-serif-bn">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-3 rounded-lg border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  priority === 'high'
                    ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${priority === 'high' ? 'bg-white' : 'bg-rose-600'}`} />
                <span>উচ্চ (High)</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 px-3 rounded-lg border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  priority === 'medium'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-300'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${priority === 'medium' ? 'bg-slate-950' : 'bg-amber-600'}`} />
                <span>মাঝারি (Medium)</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 px-3 rounded-lg border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  priority === 'low'
                    ? 'bg-sky-600 text-white border-sky-700 ring-2 ring-sky-300'
                    : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${priority === 'low' ? 'bg-white' : 'bg-sky-600'}`} />
                <span>সাধারণ (Low)</span>
              </button>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 font-sans">
              মন্তব্য (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="বিশেষ কোনো মন্তব্য বা অতিরিক্ত বিবরণ..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white font-serif-bn"
            />
            <div className="pt-0.5">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1 font-sans">
                প্রিসেট মন্তব্য:
              </span>
              <div className="flex flex-wrap gap-1 font-serif-bn">
                {REMARKS_PRESETS.map((rPreset) => (
                  <button
                    key={rPreset}
                    type="button"
                    onClick={() => setRemarks(rPreset)}
                    className={`px-2 py-0.5 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                      remarks === rPreset
                        ? 'bg-emerald-700 text-white border-emerald-800 font-semibold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {rPreset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-100 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-lg shadow-xs transition-all"
            >
              <Save className="w-4 h-4" />
              <span>সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

