import React, { useState, useEffect } from 'react';
import { LetterheadConfig, PageSize, PageOrientation } from '../types';
import { X, Save, Award, Phone, Mail, Globe, Upload, Image as ImageIcon, Trash2, RotateCcw, FileText, Calendar, Printer, Sliders } from 'lucide-react';
import { getCurrentBengaliMonthYear } from '../utils/bengaliUtils';

const NOTICE_TITLE_PRESETS = [
  'দৈনন্দিন কর্মসূচি',
  'মহাপরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি',
  'পরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি',
  'প্রকল্প পরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি',
  'সচিব মহোদয়ের দৈনন্দিন কর্মসূচি',
  'দৈনন্দিন সভার সময়সূচি',
  'সাপ্তাহিক কর্মসূচি',
  'মাসিক সভার সময়সূচি',
  'জরুরি সভার নোটিশ',
  'জরুরি বিজ্ঞপ্তি',
];

const BRANCH_PRESETS = [
  'প্রশাসন শাখা',
  'সংস্থাপন শাখা',
  'সাধারণ শাখা',
  'পরিকল্পনা ও উন্নয়ন শাখা',
  'গবেষণা ও আর্কাইভ শাখা',
  'অর্থ ও হিসাব শাখা',
  'প্রকল্প বাস্তবায়ন শাখা',
  'আইসিটি শাখা',
  'প্রযুক্তি ও যান্ত্রিক শাখা',
  'সংগ্রহ ও সংরক্ষণ শাখা',
  'প্রকাশনা ও গণসংযোগ শাখা',
  'আইন শাখা',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: LetterheadConfig) => void;
  initialConfig: LetterheadConfig;
}

export const LetterheadEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}) => {
  const [config, setConfig] = useState<LetterheadConfig>(initialConfig);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof LetterheadConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const margins = config.printMargins || { top: 10, bottom: 10, left: 12, right: 12 };

  const handleMarginChange = (field: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    const newMargins = { ...margins, [field]: Math.max(0, value) };
    setConfig((prev) => ({ ...prev, printMargins: newMargins }));
  };

  const handleApplyMarginPreset = (preset: 'standard' | 'compact' | 'wide') => {
    if (preset === 'standard') {
      setConfig((prev) => ({ ...prev, printMargins: { top: 10, bottom: 10, left: 12, right: 12 } }));
    } else if (preset === 'compact') {
      setConfig((prev) => ({ ...prev, printMargins: { top: 5, bottom: 5, left: 8, right: 8 } }));
    } else if (preset === 'wide') {
      setConfig((prev) => ({ ...prev, printMargins: { top: 15, bottom: 15, left: 20, right: 20 } }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetField: 'customLogoUrl' | 'customRightLogoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ফাইল সাইজ সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে পারবে।');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleChange(targetField, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyPreset = (presetType: 'bfa_project' | 'dc_office' | 'uno_office' | 'ministry') => {
    if (presetType === 'bfa_project') {
      setConfig((prev) => ({
        ...prev,
        projectTitle: "‘দেশী ও বিদেশী উৎস থেকে মুক্তিযুদ্ধের অডিও ভিজ্যুয়াল দলিল সংগ্রহ ও সংরক্ষণ এবং বাংলাদেশ ফিল্ম আর্কাইভের সক্ষমতা বৃদ্ধি’ শীর্ষক প্রকল্প",
        officeName: "বাংলাদেশ ফিল্ম আর্কাইভ, তথ্য ও সম্প্রচার মন্ত্রণালয়",
        address: "এফ-০৫, আগারগাঁও প্রশাসনিক এলাকা, ঢাকা",
        phone: "৫৮১৫৭৯৮৮",
        email: "bfalwfproject@bfa.gov.bd",
        website: "www.bfa.gov.bd",
        docHeading: "প্রকল্প পরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি",
        docSubheading: getCurrentBengaliMonthYear(),
        signatoryName: "মো: রফিকুল ইসলাম",
        signatoryDesignation: "প্রকল্প পরিচালক (উপসচিব)",
        emblemPreset: "bd_crest",
        showRightLogo: true,
        rightLogoPreset: "bfa_logo",
      }));
    } else if (presetType === 'dc_office') {
      setConfig((prev) => ({
        ...prev,
        projectTitle: "",
        officeName: "জেলা প্রশাসকের কার্যালয়, ঢাকা",
        address: "জেলা প্রশাসক ভবন, পুরান ঢাকা",
        phone: "০২-৯৫৫১২২১",
        email: "dc.dhaka@mopa.gov.bd",
        website: "www.dhaka.gov.bd",
        docHeading: "জেলা প্রশাসক মহোদয়ের দৈনন্দিন কর্মসূচি",
        docSubheading: getCurrentBengaliMonthYear(),
        signatoryName: "মো: রফিকুল ইসলাম",
        signatoryDesignation: "সহকারী কমিশনার (সাধারণ শাখা)",
        emblemPreset: "bd_crest",
        showRightLogo: true,
        rightLogoPreset: "dc_seal",
      }));
    } else if (presetType === 'uno_office') {
      setConfig((prev) => ({
        ...prev,
        projectTitle: "",
        officeName: "উপজেলা নির্বাহী অফিসারের কার্যালয়, সাভার, ঢাকা",
        address: "উপজেলা পরিষদ কমপ্লেক্স, সাভার",
        phone: "০২-৭৭৯০১০০",
        email: "uno.savardhaka@mopa.gov.bd",
        website: "www.savar.dhaka.gov.bd",
        docHeading: "উপজেলা নির্বাহী অফিসার মহোদয়ের দৈনন্দিন কর্মসূচি",
        docSubheading: getCurrentBengaliMonthYear(),
        signatoryName: "মোছা: ফেরদৌসী বেগম",
        signatoryDesignation: "উপজেলা নির্বাহী অফিসার",
        emblemPreset: "bd_crest",
        showRightLogo: false,
      }));
    } else if (presetType === 'ministry') {
      setConfig((prev) => ({
        ...prev,
        projectTitle: "তথ্য ও সম্প্রচার মন্ত্রণালয়",
        officeName: "বাংলাদেশ সচিবালয়, ঢাকা",
        address: "ভবন নং ৪, বাংলাদেশ সচিবালয়, ঢাকা",
        phone: "০২-৯৫৪০১১১",
        email: "secretary@moi.gov.bd",
        website: "www.moi.gov.bd",
        docHeading: "মাননীয় মন্ত্রীর দৈনন্দিন কর্মসূচি",
        docSubheading: getCurrentBengaliMonthYear(),
        signatoryName: "ড. মো: আনোয়ার হোসেন",
        signatoryDesignation: "উপসচিব (প্রশাসন)",
        emblemPreset: "golden_seal",
        showRightLogo: false,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-base font-semibold font-serif-bn flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span>সরকারি লেটারহেড ও শিরোনাম সম্পাদনা</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-slate-800 text-sm font-serif-bn">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
              দ্রুত টেমপ্লেট নির্বাচন করুন (Quick Presets):
            </label>
            <div className="flex flex-wrap gap-2 font-sans">
              <button
                type="button"
                onClick={() => handleApplyPreset('bfa_project')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
              >
                📂 প্রকল্প / প্রধান শিরোনাম
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('dc_office')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                🏛️ জেলা প্রশাসকের কার্যালয়
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('uno_office')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                🏫 উপজেলা নির্বাহী অফিস
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('ministry')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                🏬 তথ্য ও সম্প্রচার মন্ত্রণালয়
              </button>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Project Title & Office Name */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                সরকারি শিরোনাম (Government Header Title)
              </label>
              <input
                type="text"
                value={config.govtTitle ?? 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার'}
                onChange={(e) => handleChange('govtTitle', e.target.value)}
                placeholder="গণপ্রজাতন্ত্রী বাংলাদেশ সরকার"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                প্রকল্প / প্রধান শিরোনাম (Project Title)
              </label>
              <input
                type="text"
                value={config.projectTitle || ''}
                onChange={(e) => handleChange('projectTitle', e.target.value)}
                placeholder="যেমন: 'দেশী ও বিদেশী উৎস থেকে মুক্তিযুদ্ধের অডিও ভিজ্যুয়াল দলিল...' শীর্ষক প্রকল্প"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                  কার্যালয় / প্রতিষ্ঠানের নাম *
                </label>
                <input
                  type="text"
                  value={config.officeName || ''}
                  onChange={(e) => handleChange('officeName', e.target.value)}
                  placeholder="যেমন: বাংলাদেশ ফিল্ম আর্কাইভ, তথ্য ও সম্প্রচার মন্ত্রণালয়"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                  প্রশাসনিক ঠিকানা (Address)
                </label>
                <input
                  type="text"
                  value={config.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="যেমন: এফ-০৫, আগারগাঁও প্রশাসনিক এলাকা, ঢাকা"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Branch / Section Field & Quick Presets */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-800 font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                  <span>শাখা / বিভাগ (Branch / Section)</span>
                </label>
                {config.branchName && (
                  <button
                    type="button"
                    onClick={() => handleChange('branchName', '')}
                    className="text-[11px] text-red-600 hover:text-red-700 hover:underline font-sans cursor-pointer"
                  >
                    শাখা মুছে ফেলুন
                  </button>
                )}
              </div>
              <input
                type="text"
                value={config.branchName || ''}
                onChange={(e) => handleChange('branchName', e.target.value)}
                placeholder="যেমন: প্রশাসন শাখা / সাধারণ শাখা / পরিকল্পনা শাখা"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />

              {/* Branch Quick Presets */}
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-slate-600 mb-1.5 font-sans">
                  শাখার প্রিসেটসমূহ (ক্লিক করে নির্বাচন করুন):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BRANCH_PRESETS.map((bPreset) => (
                    <button
                      key={bPreset}
                      type="button"
                      onClick={() => handleChange('branchName', bPreset)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                        config.branchName === bPreset
                          ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-2xs'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-slate-300 hover:border-emerald-300'
                      }`}
                    >
                      {bPreset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Line Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1 font-sans">
                <Phone className="w-3 h-3 text-slate-500" />
                <span>ফোন নম্বর</span>
              </label>
              <input
                type="text"
                value={config.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="যেমন: ৫৮১৫৭৯৮৮"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1 font-sans">
                <Mail className="w-3 h-3 text-slate-500" />
                <span>ইমেইল</span>
              </label>
              <input
                type="text"
                value={config.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="bfalwfproject@bfa.gov.bd"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1 font-sans">
                <Globe className="w-3 h-3 text-slate-500" />
                <span>ওয়েবসাইট</span>
              </label>
              <input
                type="text"
                value={config.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="www.bfa.gov.bd"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Document Main Heading & Subheading */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 font-sans">
                নোটিশ/কর্মসূচির শিরোনাম (Main Notice Title) *
              </label>
              <input
                type="text"
                value={config.docHeading || ''}
                onChange={(e) => handleChange('docHeading', e.target.value)}
                placeholder="যেমন: প্রকল্প পরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                required
              />
              <div className="pt-0.5">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1 font-sans">
                  প্রিসেট শিরোনাম:
                </span>
                <div className="flex flex-wrap gap-1 font-serif-bn">
                  {NOTICE_TITLE_PRESETS.map((tPreset) => (
                    <button
                      key={tPreset}
                      type="button"
                      onClick={() => handleChange('docHeading', tPreset)}
                      className={`px-2 py-0.5 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                        config.docHeading === tPreset
                          ? 'bg-emerald-700 text-white border-emerald-800 font-semibold'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {tPreset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 font-sans">
                  মাস ও সাল/উপ-শিরোনাম (Month/Year Subtitle) *
                </label>
                <button
                  type="button"
                  onClick={() => handleChange('docSubheading', getCurrentBengaliMonthYear())}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium font-sans flex items-center gap-1 hover:underline"
                  title="চলতি মাস ও সাল সেট করুন"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>চলতি মাস সেট করুন</span>
                </button>
              </div>
              <input
                type="text"
                value={config.docSubheading ?? getCurrentBengaliMonthYear()}
                onChange={(e) => handleChange('docSubheading', e.target.value)}
                placeholder={`যেমন: ${getCurrentBengaliMonthYear()}`}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Official Reference & Memo No Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3 font-sans">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
              <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>স্মারক নম্বর ও রেফারেন্স তথ্য (Official Ref / Memo)</span>
              </h4>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showRefSection !== false}
                  onChange={(e) => handleChange('showRefSection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-700">স্মারক ও বিষয় সেকশন দেখান</span>
              </label>
            </div>

            {config.showRefSection !== false && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      স্মারক নম্বর (Memo / Ref. No.)
                    </label>
                    <input
                      type="text"
                      value={config.memoNo || ''}
                      onChange={(e) => handleChange('memoNo', e.target.value)}
                      placeholder="যেমন: ০৫.৪১.২৬০০.০১১.২৪.০০২.২৬.১৫০"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      জারির তারিখ (Issue Date)
                    </label>
                    <input
                      type="text"
                      value={config.issueDate || ''}
                      onChange={(e) => handleChange('issueDate', e.target.value)}
                      placeholder="যেমন: ১৬ শ্রাবণ ১৪৩৩ / ১ আগস্ট ২০২৬"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বিষয় (Subject)
                  </label>
                  <input
                    type="text"
                    value={config.subject || ''}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    placeholder="যেমন: মান্যবর জেলা প্রশাসকের দৈনন্দিন কর্মসূচি ও নির্ধারিত সভার নোটিশ"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-sans"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Logo & Emblem Upload / Selection Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4 font-sans">
            <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-700" />
              <span>লেটারহেড লোগো ও প্রতীক সেটিংস (Logo Upload & Presets)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Side Emblem / Logo */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    ১. বামের লোগো / জাতীয় প্রতীক (Left Logo)
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showEmblem !== false}
                      onChange={(e) => handleChange('showEmblem', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-xs font-medium text-slate-700">প্রদর্শন করুন</span>
                  </label>
                </div>

                {config.showEmblem !== false && (
                  <>
                    {/* Custom Logo Upload Preview or File Input */}
                    {config.customLogoUrl ? (
                      <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <img
                            src={config.customLogoUrl}
                            alt="Uploaded Left Logo"
                            className="h-12 w-12 object-contain bg-white rounded-md border p-1"
                          />
                          <div>
                            <p className="text-xs font-semibold text-emerald-900">কাস্টম লোগো সংযুক্ত</p>
                            <p className="text-[10px] text-emerald-700">ফাইল বা ইউআরএল থেকে লোড করা হয়েছে</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange('customLogoUrl', '')}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                          title="কাস্টম লোগো রিমুভ করুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-medium transition-colors">
                            <Upload className="w-3.5 h-3.5 text-emerald-700" />
                            <span>লোগো আপলোড করুন</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'customLogoUrl')}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-[11px] text-slate-500">অথবা প্রস্তুতকৃত প্রতীক নির্বাচন করুন:</p>
                        <select
                          value={config.emblemPreset || 'bd_crest'}
                          onChange={(e) => handleChange('emblemPreset', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                        >
                          <option value="bd_crest">🇧🇩 জাতীয় প্রতীক (লাল-সবুজ)</option>
                          <option value="golden_seal">🏆 সোনালী সিল</option>
                          <option value="green_seal">🟢 সবুজ সিল</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Side Logo / Department Seal */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    ২. ডান পাশের লোগো / দপ্তর সিল (Right Logo)
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showRightLogo !== false}
                      onChange={(e) => handleChange('showRightLogo', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-xs font-medium text-slate-700">প্রদর্শন করুন</span>
                  </label>
                </div>

                {config.showRightLogo !== false && (
                  <>
                    {/* Custom Right Logo Upload Preview or File Input */}
                    {config.customRightLogoUrl ? (
                      <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <img
                            src={config.customRightLogoUrl}
                            alt="Uploaded Right Logo"
                            className="h-12 w-12 object-contain bg-white rounded-md border p-1"
                          />
                          <div>
                            <p className="text-xs font-semibold text-emerald-900">কাস্টম লোগো সংযুক্ত</p>
                            <p className="text-[10px] text-emerald-700">ফাইল বা ইউআরএল থেকে লোড করা হয়েছে</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange('customRightLogoUrl', '')}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                          title="কাস্টম লোগো রিমুভ করুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-medium transition-colors">
                            <Upload className="w-3.5 h-3.5 text-emerald-700" />
                            <span>লোগো আপলোড করুন</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'customRightLogoUrl')}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-[11px] text-slate-500">অথবা প্রস্তুতকৃত প্রতীক নির্বাচন করুন:</p>
                        <select
                          value={config.rightLogoPreset || 'bfa_logo'}
                          onChange={(e) => handleChange('rightLogoPreset', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                        >
                          <option value="bfa_logo">🎬 বাংলাদেশ ফিল্ম আর্কাইভ (BFA Logo)</option>
                          <option value="dc_seal">🏛️ জেলা প্রশাসন সিল</option>
                          <option value="govt_crest">🇧🇩 বাংলাদেশ সরকার প্রতীক</option>
                          <option value="none">লোগো প্রদর্শন করবেন না</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer & Signatory Configuration Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4 font-sans">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>ফুটার ও স্বাক্ষরকারীর তথ্য সম্পাদনা (Custom Footer & Signatory)</span>
              </h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showSignatory !== false}
                  onChange={(e) => handleChange('showSignatory', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-700">স্বাক্ষর অংশ প্রদর্শন করুন</span>
              </label>
            </div>

            {config.showSignatory !== false && (
              <div className="space-y-3 font-serif-bn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                      স্বাক্ষরকারীর নাম (Signatory Name)
                    </label>
                    <input
                      type="text"
                      value={config.signatoryName || ''}
                      onChange={(e) => handleChange('signatoryName', e.target.value)}
                      placeholder="যেমন: মো: রফিকুল ইসলাম"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                      পদবি (Signatory Designation)
                    </label>
                    <input
                      type="text"
                      value={config.signatoryDesignation || ''}
                      onChange={(e) => handleChange('signatoryDesignation', e.target.value)}
                      placeholder="যেমন: প্রকল্প পরিচালক (উপসচিব)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                      স্বাক্ষরকারীর ফোন (Phone - optional)
                    </label>
                    <input
                      type="text"
                      value={config.signatoryPhone || ''}
                      onChange={(e) => handleChange('signatoryPhone', e.target.value)}
                      placeholder="যেমন: ০২-৯৫৫১২২১"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                      স্বাক্ষরকারীর ইমেইল (Email - optional)
                    </label>
                    <input
                      type="text"
                      value={config.signatoryEmail || ''}
                      onChange={(e) => handleChange('signatoryEmail', e.target.value)}
                      placeholder="যেমন: pd.bfa@mopa.gov.bd"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                    কাস্টম ফুটার নোট / বিশেষ নির্দেশিকা (Custom Footer Note / Remarks)
                  </label>
                  <textarea
                    rows={2}
                    value={config.customFooterText || ''}
                    onChange={(e) => handleChange('customFooterText', e.target.value)}
                    placeholder="যেমন: বিশেষ দ্রষ্টব্য: কর্তৃপক্ষের অনুমোদনক্রমে সময়সূচি পরিবর্তনযোগ্য।"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-sans"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Custom Print Margins & Page Setup Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4 font-sans">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>প্রিন্ট মার্জিন ও পেজ লেআউট সেটিংস (Print Margins & Page Size)</span>
              </h4>
            </div>

            <div className="space-y-3">
              {/* Page Size & Orientation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পেজ সাইজ (Page Size)
                  </label>
                  <select
                    value={config.pageSize || 'A4'}
                    onChange={(e) => handleChange('pageSize', e.target.value as PageSize)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-sans"
                  >
                    <option value="A4">📄 A4 (২১০মিমি × ২৯৭মিমি - স্ট্যান্ডার্ড)</option>
                    <option value="Legal">📜 Legal (২১৬মিমি × ৩৫৬মিমি - লিগ্যাল)</option>
                    <option value="Letter">✉️ Letter (২১৬মিমি × ২৭৯মিমি - লেটার)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পেজ ওরিয়েন্টেশন (Page Orientation)
                  </label>
                  <select
                    value={config.pageOrientation || 'portrait'}
                    onChange={(e) => handleChange('pageOrientation', e.target.value as PageOrientation)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-sans"
                  >
                    <option value="portrait">📱 পোর্টেট (Portrait - খাড়া)</option>
                    <option value="landscape">🖥️ ল্যান্ডস্কেপ (Landscape - আড়াআড়ি)</option>
                  </select>
                </div>
              </div>

              {/* Margin Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    মার্জিন প্রিসেট (Quick Margin Presets):
                  </label>
                  <span className="text-[11px] text-slate-500">একক: মিলিমিটার (mm)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyMarginPreset('standard')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-800 border border-slate-300 hover:border-emerald-300 rounded-md text-xs font-medium transition-colors shadow-2xs"
                  >
                    স্ট্যান্ডার্ড (Top 10 / Left 12)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMarginPreset('compact')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-800 border border-slate-300 hover:border-emerald-300 rounded-md text-xs font-medium transition-colors shadow-2xs"
                  >
                    সংকীর্ণ (Top 5 / Left 8)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMarginPreset('wide')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-800 border border-slate-300 hover:border-emerald-300 rounded-md text-xs font-medium transition-colors shadow-2xs"
                  >
                    প্রশস্ত (Top 15 / Left 20)
                  </button>
                </div>
              </div>

              {/* Custom Margin Inputs (Top, Bottom, Left, Right) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ⬆️ উপর (Top mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={margins.top}
                    onChange={(e) => handleMarginChange('top', parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ⬇️ নিচে (Bottom mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={margins.bottom}
                    onChange={(e) => handleMarginChange('bottom', parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ⬅️ বাম (Left mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={margins.left}
                    onChange={(e) => handleMarginChange('left', parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ➡️ ডান (Right mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={margins.right}
                    onChange={(e) => handleMarginChange('right', parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 font-sans"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Buttons */}
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
              <span>লেটারহেড আপডেট করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
