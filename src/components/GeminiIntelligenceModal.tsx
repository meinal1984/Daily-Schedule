import React, { useState, useEffect } from 'react';
import { ScheduleItem, LetterheadConfig, ScheduleDocument } from '../types';
import {
  checkGeminiStatus,
  parseScheduleWithGemini,
  formalizeScheduleWithGemini,
  smartSortScheduleWithGemini,
  generateBriefingWithGemini,
  chatWithGeminiAssistant,
  ParsedScheduleResult,
  FormalizedScheduleResult,
  SmartSortResult,
} from '../utils/geminiApi';
import {
  Sparkles,
  Wand2,
  FileText,
  Clock,
  MessageSquare,
  Check,
  Copy,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  X,
  Layers,
  Send,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  Printer,
  FileSpreadsheet,
  ChevronRight,
  Zap,
  Info,
} from 'lucide-react';
import { toBengaliNumerals, formatBengaliDateAndDay } from '../utils/bengaliUtils';

interface GeminiIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDoc: ScheduleDocument;
  onApplyParsedSchedule: (parsedData: ParsedScheduleResult, mode: 'append' | 'replace') => void;
  onApplyFormalizedSchedule: (formalizedItems: ScheduleItem[]) => void;
  onApplySortedSchedule: (sortedItems: ScheduleItem[]) => void;
  initialTab?: 'parser' | 'formalizer' | 'briefing' | 'conflicts' | 'chat';
}

type ModelType = 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite';

export function GeminiIntelligenceModal({
  isOpen,
  onClose,
  activeDoc,
  onApplyParsedSchedule,
  onApplyFormalizedSchedule,
  onApplySortedSchedule,
  initialTab = 'parser',
}: GeminiIntelligenceModalProps) {
  const [activeTab, setActiveTab] = useState<'parser' | 'formalizer' | 'briefing' | 'conflicts' | 'chat'>(initialTab);
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-3.5-flash');
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean>(true);

  // Tab 1: Parser State
  const [rawText, setRawText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParsedScheduleResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Tab 2: Formalizer State
  const [isFormalizing, setIsFormalizing] = useState<boolean>(false);
  const [formalizeResult, setFormalizeResult] = useState<FormalizedScheduleResult | null>(null);
  const [formalizeError, setFormalizeError] = useState<string | null>(null);
  const [appliedFormalize, setAppliedFormalize] = useState<boolean>(false);

  // Tab 3: Briefing Generator State
  const [briefingFormat, setBriefingFormat] = useState<'meeting_notice' | 'executive_summary' | 'chairperson_speech' | 'press_release'>('meeting_notice');
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState<boolean>(false);
  const [generatedBriefingDoc, setGeneratedBriefingDoc] = useState<string | null>(null);
  const [copiedBriefing, setCopiedBriefing] = useState<boolean>(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  // Tab 4: Smart Sort & Conflicts State
  const [isSorting, setIsSorting] = useState<boolean>(false);
  const [sortResult, setSortResult] = useState<SmartSortResult | null>(null);
  const [sortError, setSortError] = useState<string | null>(null);
  const [appliedSort, setAppliedSort] = useState<boolean>(false);

  // Tab 5: Assistant Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'আসসালামু আলাইকুম! আমি আপনার **Gemini AI সূচি সহকারী**। আজকের কর্মসূচি বিশ্লেষণ, কোনো মিটিংয়ের বিবরণ উন্নতকরণ, সভার নোটিশ তৈরি কিংবা যেকোনো প্রশাসনিক জিজ্ঞাসায় আমি সাহায্য করতে প্রস্তুত।',
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      checkGeminiStatus().then((status) => {
        setApiKeyAvailable(status.available);
      });
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Sample templates for easy testing
  const sampleTemplates = [
    {
      title: 'জেলা উন্নয়ন ও ডিজিটাল মেলা সমন্বয়',
      text: `আগামী ১৮ আগস্ট ২০২৬ জেলা প্রশাসকের কার্যালয়ে ডিজিটাল মেলা উপলক্ষে কিছু জরুরি বৈঠক হবে:
১. সকাল ৯:৩০ টায় ২য় তলার কনফারেন্স রুমে মেলা প্রস্তুতি সভা হবে। ডিসি স্যার সভাপতিত্ব করবেন। সকল এডিসি ও ইউএনওরা থাকবেন।
২. বেলা ১১ টায় শহীদ আলতাফ অডিটোরিয়ামে আইন শৃঙ্খলা কমিটির মাসিক মিটিং। পুলিশ সুপার ও সংশ্লিষ্ট অফিসাররা থাকবেন।
৩. দুপুর ২:৩০ টায় জুমের মাধ্যমে উপজেলা উন্নয়ন অগ্রগতি পর্যালোচনা করবেন এডিসি জেনারেল।
৪. বিকাল ৪ টায় সাধারণ মানুষের গণশুনানি ও স্মারকলিপি গ্রহণ করবেন ডিসি স্যার।`,
    },
    {
      title: 'মন্ত্রণালয় প্রকল্প স্টিয়ারিং ও অডিট',
      text: `বাংলাদেশ ফিল্ম আর্কাইভ অডিটোরিয়াম ও সম্মেলন কক্ষে আগামী বুধবার:
- সকাল ১০:০০ টা: প্রজেক্ট স্টিয়ারিং কমিটির ৫ম সভা, সচিব মহোদয় সভাপতিত্ব করবেন, স্থান সভাকক্ষ ১
- দুপুর ১২:৩০ টা: অডিট আপত্তি নিষ্পত্তি ও আর্থিক পর্যালোচনা, প্রকল্প পরিচালক মহোদয় সভাপতিত্ব করবেন
- বিকাল ৩:০০ টা: মুক্তিযুদ্ধ বিষয়ক অডিও-ভিজ্যুয়াল দলিল সংরক্ষণ কারিগরি কমিটির বিশেষ সভা`,
    },
  ];

  // Handle parsing
  const handleParse = async () => {
    if (!rawText.trim()) {
      setParseError('অনুগ্রহ করে পার্স করার জন্য কিছু টেক্সট বা খসড়া নোট দিন।');
      return;
    }
    setIsParsing(true);
    setParseError(null);
    try {
      const result = await parseScheduleWithGemini(rawText, activeDoc.date, selectedModel);
      setParseResult(result);
    } catch (err: any) {
      setParseError(err.message || 'শিডিউল পার্স করতে ত্রুটি হয়েছে।');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle formalization
  const handleFormalize = async () => {
    if (!activeDoc.items || activeDoc.items.length === 0) {
      setFormalizeError('প্রমিত করার জন্য কোনো সূচি আইটেম পাওয়া যায়নি।');
      return;
    }
    setIsFormalizing(true);
    setFormalizeError(null);
    setAppliedFormalize(false);
    try {
      const result = await formalizeScheduleWithGemini(activeDoc.items, activeDoc.letterhead, selectedModel);
      setFormalizeResult(result);
    } catch (err: any) {
      setFormalizeError(err.message || 'প্রমিত করতে ত্রুটি হয়েছে।');
    } finally {
      setIsFormalizing(false);
    }
  };

  // Handle smart sort & conflicts
  const handleSmartSort = async () => {
    if (!activeDoc.items || activeDoc.items.length === 0) {
      setSortError('বিশ্লেষণের জন্য কোনো সূচি আইটেম পাওয়া যায়নি।');
      return;
    }
    setIsSorting(true);
    setSortError(null);
    setAppliedSort(false);
    try {
      const result = await smartSortScheduleWithGemini(activeDoc.items, selectedModel);
      setSortResult(result);
    } catch (err: any) {
      setSortError(err.message || 'অটো-সর্ট করতে ত্রুটি হয়েছে।');
    } finally {
      setIsSorting(false);
    }
  };

  // Handle briefing generation
  const handleGenerateBriefing = async () => {
    setIsGeneratingBriefing(true);
    setBriefingError(null);
    try {
      const result = await generateBriefingWithGemini(activeDoc.items, activeDoc.letterhead, briefingFormat, selectedModel);
      setGeneratedBriefingDoc(result.document);
    } catch (err: any) {
      setBriefingError(err.message || 'নথি জেনারেট করতে ত্রুটি হয়েছে।');
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  // Handle chat submission
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim()) return;

    const newHistory = [...chatMessages, { role: 'user' as const, text: textToSend }];
    setChatMessages(newHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const reply = await chatWithGeminiAssistant(
        textToSend,
        {
          items: activeDoc.items,
          letterhead: activeDoc.letterhead,
          title: activeDoc.title,
          date: activeDoc.date,
        },
        chatMessages,
        selectedModel
      );
      setChatMessages([...newHistory, { role: 'assistant' as const, text: reply }]);
    } catch (err: any) {
      setChatMessages([
        ...newHistory,
        { role: 'assistant' as const, text: `⚠️ ত্রুটি: ${err.message || 'উত্তর আনতে সমস্যা হয়েছে।'}` },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBriefing(true);
    setTimeout(() => setCopiedBriefing(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Title & Model Selector */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Gemini AI বুদ্ধিমত্তা ও সূচি সহকারী</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                বাংলাদেশ সরকারি প্রমিতকরণ, টেক্সট থেকে শিডিউল রূপান্তর, কার্যবিবরণী ও নোটিশ জেনারেটর
              </p>
            </div>
          </div>

          {/* Model Selector and Close */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">মডেল:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                className="bg-transparent text-emerald-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="gemini-3.5-flash" className="bg-slate-800 text-white">
                  gemini-3.5-flash (দ্রুত ও প্রমিত)
                </option>
                <option value="gemini-3.1-pro-preview" className="bg-slate-800 text-white">
                  gemini-3.1-pro-preview (জটিল বিশ্লেষণ)
                </option>
                <option value="gemini-3.1-flash-lite" className="bg-slate-800 text-white">
                  gemini-3.1-flash-lite (অতি দ্রুত)
                </option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('parser')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'parser'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800/60'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            টেক্সট থেকে শিডিউল তৈরি (Parser)
          </button>

          <button
            onClick={() => setActiveTab('formalizer')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'formalizer'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800/60'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            সরকারি প্রমিতকরণ ও প্রুফরিডিং (Polisher)
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'conflicts'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800/60'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            স্মার্ট রিঅর্ডার ও কনফ্লিক্ট যাচাই
          </button>

          <button
            onClick={() => setActiveTab('briefing')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'briefing'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800/60'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            কার্যবিবরণী ও নোটিশ জেনারেটর
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800/60'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            এআই সহকারী চ্যাট
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
          {/* TAB 1: Text-to-Schedule Parser */}
          {activeTab === 'parser' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-emerald-600" />
                      অসংগঠিত টেক্সট, ইমেইল বা নোটিশ থেকে অটো-শিডিউল তৈরি
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      যেকোনো সভার খসড়া নোট, হোয়াটসঅ্যাপ বার্তা, পরিপত্র বা নোটিশ পেস্ট করুন। Gemini AI স্বয়ংক্রিয়ভাবে প্রমিত সরকারি ফরম্যাটে রূপান্তর করবে।
                    </p>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">নমুনা উদাহরণ:</span>
                    {sampleTemplates.map((tpl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setRawText(tpl.text)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-md border border-slate-300 dark:border-slate-600 transition-colors"
                      >
                        {tpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="এখানে আপনার সভার খসড়া টেক্সট বা নোটিশ পেস্ট করুন (বাংলা বা ইংরেজি)..."
                  className="w-full h-44 p-3.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800 dark:text-slate-200 font-sans"
                />

                {parseError && (
                  <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {parseError}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-600" />
                    তারিখ, সময়, স্থান, সভাপতি ও মন্তব্য স্বয়ংক্রিয়ভাবে আলাদা হয়ে যাবে
                  </span>

                  <button
                    onClick={handleParse}
                    disabled={isParsing || !rawText.trim()}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md flex items-center gap-2 transition-all transform active:scale-95"
                  >
                    {isParsing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        AI পার্স করছে...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Gemini দিয়ে রূপান্তর করুন
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Parsed Result Preview */}
              {parseResult && parseResult.items && parseResult.items.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-emerald-200 dark:border-emerald-900/50 shadow-sm animate-in fade-in duration-300">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                          সফলভাবে রূপান্তর সম্পন্ন! ({toBengaliNumerals(parseResult.items.length)}টি কর্মসূচি পাওয়া গেছে)
                        </h4>
                      </div>
                      {parseResult.subject && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">বিষয়:</span> {parseResult.subject}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onApplyParsedSchedule(parseResult, 'append');
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                      >
                        বর্তমান তালিকায় যোগ করুন
                      </button>
                      <button
                        onClick={() => {
                          onApplyParsedSchedule(parseResult, 'replace');
                          onClose();
                        }}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        নতুন সূচি হিসেবে প্রতিস্থাপন করুন
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {parseResult.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                            {item.serialNo || toBengaliNumerals(idx + 1)}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{item.description}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 dark:text-slate-400 mt-1">
                              <span>⏰ {item.timeOnly || 'নির্ধারিত নয়'}</span>
                              <span>📍 {item.venue || 'সভাকক্ষ'}</span>
                              <span>👤 সভাপতি: {item.chairperson || 'নির্ধারিত কর্মকর্তা'}</span>
                            </div>
                            {item.remarks && (
                              <p className="text-slate-500 dark:text-slate-400 mt-1 italic">
                                💬 মন্তব্য: {item.remarks}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold self-start md:self-center shrink-0 ${
                          item.priority === 'high'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            : item.priority === 'medium'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {item.priority === 'high' ? 'উচ্চ অগ্রাধিকার' : item.priority === 'medium' ? 'সাধারণ' : 'রুটিন'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Government Polisher & Proofreader */}
          {activeTab === 'formalizer' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      বাংলাদেশ সচিবালয় ও জেলা প্রশাসন প্রমিত নথি সম্পাদক
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      বর্তমানের {toBengaliNumerals(activeDoc.items.length)}টি কর্মসূচিকে প্রমিত সরকারি ভাষায় রূপান্তর, বানান ও প্রটোকল যাচাই এবং প্রাতিষ্ঠানিক শৈলী নিশ্চিত করুন।
                    </p>
                  </div>

                  <button
                    onClick={handleFormalize}
                    disabled={isFormalizing || activeDoc.items.length === 0}
                    className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md flex items-center gap-2 transition-all"
                  >
                    {isFormalizing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        প্রমিতকরণ হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        সকল কর্মসূচি প্রমিত করুন
                      </>
                    )}
                  </button>
                </div>

                {formalizeError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formalizeError}
                  </div>
                )}

                {/* Improvements Result */}
                {formalizeResult && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {formalizeResult.improvementsList && formalizeResult.improvementsList.length > 0 && (
                      <div className="p-4 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-lg">
                        <h5 className="text-xs font-bold text-teal-900 dark:text-teal-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          Gemini AI দ্বারা কৃত প্রধান উন্নয়নসমূহ:
                        </h5>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-teal-800 dark:text-teal-200">
                          {formalizeResult.improvementsList.map((imp, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-teal-500 font-bold">•</span>
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        প্রমিতকৃত সূচির খসড়া ({toBengaliNumerals(formalizeResult.formalizedItems.length)}টি আইটেম):
                      </span>

                      <button
                        onClick={() => {
                          onApplyFormalizedSchedule(formalizeResult.formalizedItems);
                          setAppliedFormalize(true);
                        }}
                        disabled={appliedFormalize}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
                      >
                        {appliedFormalize ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-200" />
                            পরিবর্তন সফলভাবে সংরক্ষিত!
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            সকল প্রমিত পরিবর্তন সূচিতে প্রয়োগ করুন
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {formalizeResult.formalizedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-teal-700 dark:text-teal-400">
                              {item.serialNo || toBengaliNumerals(idx + 1)}. {item.description}
                            </span>
                            <span className="text-slate-500 shrink-0 font-medium">{item.timeOnly}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 dark:text-slate-400 mt-1">
                            <span>📍 {item.venue}</span>
                            <span>👤 {item.chairperson}</span>
                          </div>
                          {item.remarks && (
                            <p className="text-slate-500 mt-1 italic bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded">
                              {item.remarks}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Smart Sort & Conflicts */}
          {activeTab === 'conflicts' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      স্মার্ট রিঅর্ডার ও সময়সূচির দ্বন্দ্ব নিরোধ (Smart Chronology & Conflicts)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      সকাল থেকে রাত পর্যন্ত সূচির ধারাবাহিকতা বিশ্লেষণ, যাতায়াতের সময় বিবেচনা ও একই সময়ে একাধিক মিটিংয়ের দ্বন্দ্ব শনাক্তকরণ।
                    </p>
                  </div>

                  <button
                    onClick={handleSmartSort}
                    disabled={isSorting || activeDoc.items.length === 0}
                    className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md flex items-center gap-2 transition-all"
                  >
                    {isSorting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        যাচাই হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        সময়সূচি বিশ্লেষণ ও সাজান
                      </>
                    )}
                  </button>
                </div>

                {sortError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {sortError}
                  </div>
                )}

                {sortResult && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {/* Conflict Alert Box */}
                    {sortResult.hasConflicts ? (
                      <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg">
                        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm mb-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          সময়সূচির সম্ভাব্য দ্বন্দ্ব বা সংঘাত শনাক্ত হয়েছে!
                        </div>
                        <ul className="space-y-1 text-xs text-rose-700 dark:text-rose-300">
                          {sortResult.conflicts.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="font-bold">•</span>
                              {c.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        কোনো সময়সূচির দ্বন্দ্ব পাওয়া যায়নি! দিনের সূচি সুসংগঠিত ও নিরবচ্ছিন্ন।
                      </div>
                    )}

                    {/* Suggestions */}
                    {sortResult.suggestions && sortResult.suggestions.length > 0 && (
                      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-xs text-amber-900 dark:text-amber-200">
                        <span className="font-bold block mb-1">💡 এআই সূচি সমন্বয় পরামর্শ:</span>
                        <ul className="space-y-1">
                          {sortResult.suggestions.map((sug, i) => (
                            <li key={i}>• {sug}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        ধারাবাহিকভাবে সাজানো সূচি:
                      </span>

                      <button
                        onClick={() => {
                          onApplySortedSchedule(sortResult.sortedItems);
                          setAppliedSort(true);
                        }}
                        disabled={appliedSort}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
                      >
                        {appliedSort ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-200" />
                            সাজানো সূচি সংরক্ষিত হয়েছে!
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            সাজানো সূচি ডকুমেন্টে প্রয়োগ করুন
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sortResult.sortedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold flex items-center justify-center text-slate-700 dark:text-slate-300">
                              {item.serialNo || toBengaliNumerals(idx + 1)}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.description}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-medium">
                            {item.timeOnly}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Official Briefing & Notice Generator */}
          {activeTab === 'briefing' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      কার্যবিবরণী, সভার নোটিশ ও ব্রিফিং নোট জেনারেটর
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      বর্তমান কর্মসূচি ও সভার তালিকার ভিত্তিতে পূর্ণাঙ্গ সরকারি নোটিশ, অনুলিপিসহ মেমো কিংবা প্রেস বিজ্ঞপ্তি তৈরি করুন।
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateBriefing}
                    disabled={isGeneratingBriefing || activeDoc.items.length === 0}
                    className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md flex items-center gap-2 transition-all"
                  >
                    {isGeneratingBriefing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        নথি তৈরি হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        নথি জেনারেট করুন
                      </>
                    )}
                  </button>
                </div>

                {/* Format selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                  {[
                    { id: 'meeting_notice', label: '📌 সভার সরকারি নোটিশ / পরিপত্র', desc: 'স্মারক নম্বর ও অনুলিপিসহ' },
                    { id: 'executive_summary', label: '📋 নির্বাহী সারসংক্ষেপ ও ব্রিফিং', desc: 'সচিব / জেলা প্রশাসকের জন্য' },
                    { id: 'chairperson_speech', label: '🎙️ সভাপতির প্রারম্ভিক বক্তব্য', desc: 'দিকনির্দেশনামূলক পয়েন্টস' },
                    { id: 'press_release', label: '📰 প্রেস বিজ্ঞপ্তি ও মিডিয়া রিলিজ', desc: 'আনুষ্ঠানিক গণমাধ্যম ব্রিফ' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setBriefingFormat(fmt.id as any)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        briefingFormat === fmt.id
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-xs">{fmt.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{fmt.desc}</div>
                    </button>
                  ))}
                </div>

                {briefingError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {briefingError}
                  </div>
                )}

                {generatedBriefingDoc && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        উৎপাদিত সরকারি নথি:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(generatedBriefingDoc)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors"
                        >
                          {copiedBriefing ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedBriefing ? 'কপি হয়েছে!' : 'কপি করুন'}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {generatedBriefingDoc}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AI Assistant Chat */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[520px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Preset prompt pills */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-2 text-xs">
                <span className="text-slate-400 flex items-center gap-1">💡 দ্রুত জিজ্ঞাসা:</span>
                {[
                  'আজকের সভার মূল উদ্দেশ্য কী?',
                  'কোন কোন মিটিংয়ে জেলা প্রশাসক সভাপতিত্ব করবেন?',
                  'উপস্থিত সকলের জন্য একটি সংক্ষিপ্ত নোটিশ ড্রাফট করুন',
                  'কোন মিটিংয়ের সময়সূচিতে কোনো সমস্যা আছে কি?',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChatMessage(prompt)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 rounded-full border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-700 text-white rounded-br-none shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-600/80 shadow-2xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-2xl rounded-bl-none text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                      Gemini AI উত্তর লিখছে...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  placeholder="আজকের সূচি বা সরকারি নথি সম্পর্কিত যেকোনো প্রশ্ন লিখুন..."
                  className="flex-1 px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
                />
                <button
                  onClick={() => handleSendChatMessage()}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  পাঠান
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Gemini 3 Series Models: {selectedModel}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
