import React, { useState, useEffect } from 'react';
import { ScheduleDocument, LetterheadConfig } from '../types';
import { generateShareableText } from '../utils/bengaliUtils';
import { exportScheduleToExcel } from '../utils/excelExport';
import { X, Share2, Copy, Check, Download, FileSpreadsheet, Edit3, RotateCcw, Award, Mail, HardDrive, FileOutput } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: ScheduleDocument;
  onSaveLetterhead?: (config: LetterheadConfig) => void;
  onOpenGmailModal?: () => void;
  onOpenDriveModal?: () => void;
}

export const ShareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  document: scheduleDoc,
  onSaveLetterhead,
  onOpenGmailModal,
  onOpenDriveModal,
}) => {
  const [copied, setCopied] = useState(false);

  // Quick edit state for email/share header fields
  const [memoNo, setMemoNo] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [branchName, setBranchName] = useState('');
  const [subject, setSubject] = useState('');
  
  // Custom edited text body
  const [customText, setCustomText] = useState('');
  const [isManualTextEdit, setIsManualTextEdit] = useState(false);

  // Sync state whenever document changes or modal opens
  useEffect(() => {
    if (scheduleDoc && isOpen) {
      const lh = scheduleDoc.letterhead || {};
      const initialMemo = lh.memoNo || '';
      const initialDate = lh.issueDate || '';
      const initialBranch = lh.branchName || '';
      const initialSubj = lh.subject || scheduleDoc.title || 'দৈনন্দিন কর্মসূচি';

      setMemoNo(initialMemo);
      setIssueDate(initialDate);
      setBranchName(initialBranch);
      setSubject(initialSubj);

      const tempDoc = {
        ...scheduleDoc,
        letterhead: {
          ...lh,
          memoNo: initialMemo,
          issueDate: initialDate,
          branchName: initialBranch,
          subject: initialSubj,
        },
      };

      setCustomText(generateShareableText(tempDoc));
      setIsManualTextEdit(false);
    }
  }, [scheduleDoc, isOpen]);

  if (!isOpen || !scheduleDoc) return null;

  // Handle updates to header fields (Memo No, Date, Branch, Subject)
  const handleHeaderFieldChange = (
    field: 'memoNo' | 'issueDate' | 'branchName' | 'subject',
    val: string
  ) => {
    let nextMemo = memoNo;
    let nextDate = issueDate;
    let nextBranch = branchName;
    let nextSubj = subject;

    if (field === 'memoNo') { nextMemo = val; setMemoNo(val); }
    if (field === 'issueDate') { nextDate = val; setIssueDate(val); }
    if (field === 'branchName') { nextBranch = val; setBranchName(val); }
    if (field === 'subject') { nextSubj = val; setSubject(val); }

    const updatedLh: LetterheadConfig = {
      ...(scheduleDoc.letterhead || {}),
      memoNo: nextMemo,
      issueDate: nextDate,
      branchName: nextBranch,
      subject: nextSubj,
    };

    if (onSaveLetterhead) {
      onSaveLetterhead(updatedLh);
    }

    if (!isManualTextEdit) {
      const updatedDoc = {
        ...scheduleDoc,
        letterhead: updatedLh,
      };
      setCustomText(generateShareableText(updatedDoc));
    }
  };

  const handleResetText = () => {
    const currentLh: LetterheadConfig = {
      ...(scheduleDoc.letterhead || {}),
      memoNo,
      issueDate,
      branchName,
      subject,
    };

    const updatedDoc = {
      ...scheduleDoc,
      letterhead: currentLh,
    };

    setCustomText(generateShareableText(updatedDoc));
    setIsManualTextEdit(false);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: scheduleDoc.title || 'দৈনন্দিন কর্মসূচি',
          text: customText,
        });
      } catch (err) {
        console.warn('Native share cancelled or failed:', err);
      }
    } else {
      handleCopyText();
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scheduleDoc, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `schedule_${scheduleDoc.id}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadCSV = () => {
    if (!scheduleDoc.items || scheduleDoc.items.length === 0) {
      alert('রপ্তানি করার মতো কোনো কর্মসূচি পাওয়া যায়নি।');
      return;
    }

    let csvContent = "\uFEFFক্রমিক নং,তারিখ ও সময়,বিবরণ,সভার স্থান,সভাপতি,মন্তব্য\n";
    scheduleDoc.items.forEach((item) => {
      const row = [
        `"${item.serialNo || ''}"`,
        `"${item.dateTime || ''}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`,
        `"${(item.venue || '').replace(/"/g, '""')}"`,
        `"${(item.chairperson || '').replace(/"/g, '""')}"`,
        `"${(item.remarks || '').replace(/"/g, '""')}"`,
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily_schedule_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity modal-backdrop">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <h3 className="text-base font-semibold font-serif-bn flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <span>দৈনন্দিন কর্মসূচি শেয়ার ও ইমেইল বডি সম্পাদনা</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans">
          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {onOpenGmailModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenGmailModal();
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4 text-white" />
                <span>জি-মেইলে সরাসরি ইমেইল পাঠান</span>
              </button>
            )}

            {onOpenDriveModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDriveModal();
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <HardDrive className="w-4 h-4 text-emerald-300" />
                <span>গুগল ড্রাইভে ক্লাউড সেভ করুন</span>
              </button>
            )}

            <button
              onClick={handleCopyText}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-xs border transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white border-transparent shadow-2xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>কপি করা হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>টেক্সট কপি করুন</span>
                </>
              )}
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>শেয়ার অ্যাপে পাঠান</span>
              </button>
            )}
          </div>

          {/* Quick Header Fields Editor (Memo No, Date, Subject) */}
          <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>স্মারক নম্বর ও রেফারেন্স তথ্য সম্পাদনা (Editable Memo/Ref)</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-medium">লাইভ আপডেট হবে</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  স্মারক নম্বর (Memo No.)
                </label>
                <input
                  type="text"
                  value={memoNo}
                  onChange={(e) => handleHeaderFieldChange('memoNo', e.target.value)}
                  placeholder="যেমন: ০৫.৪১.২৬০০.০১১.২৪.০০২.২৬.১৫০"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  জারির তারিখ (Issue Date)
                </label>
                <input
                  type="text"
                  value={issueDate}
                  onChange={(e) => handleHeaderFieldChange('issueDate', e.target.value)}
                  placeholder="যেমন: ১৬ শ্রাবণ ১৪৩৩ / ১ আগস্ট ২০২৬"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                বিষয় (Subject)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => handleHeaderFieldChange('subject', e.target.value)}
                placeholder="যেমন: মান্যবর জেলা প্রশাসকের দৈনন্দিন কর্মসূচি ও নির্ধারিত সভার নোটিশ"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Formatted Text Preview & Direct Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>ইমেইল / হোয়াটসঅ্যাপের মেসেজ বডি (সরাসরি এডিটেবল):</span>
              </label>

              {isManualTextEdit && (
                <button
                  type="button"
                  onClick={handleResetText}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 hover:underline"
                  title="প্রাক-নির্ধারিত বয়ান রিসেট করুন"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>মূল ফরম্যাটে রিসেট করুন</span>
                </button>
              )}
            </div>

            <textarea
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setIsManualTextEdit(true);
              }}
              rows={9}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 leading-relaxed resize-y"
              placeholder="এখানে ইমেইল অথবা মেসেজ বডি লিখুন বা পরিবর্তন করুন..."
            />
            <p className="text-[11px] text-slate-500 mt-1">
              * স্মারক নম্বর বা যেকোনো লাইন আপনি সরাসরি এখানে বা উপরের বক্সে পরিবর্তন করতে পারবেন।
            </p>
          </div>

          {/* Additional File Export Options */}
          <div className="pt-3 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              অন্যান্য ফরম্যাটে ডাটা এক্সপোর্ট ও ব্যাকআপ ডাউনলোড:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => exportScheduleToExcel(scheduleDoc)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all shadow-2xs cursor-pointer"
                title="সম্পূর্ণ সময়সূচি এমএস এক্সেল (.xlsx) ফরম্যাটে ডাউনলোড করুন"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Excel (.xlsx) রপ্তানি</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                <FileOutput className="w-4 h-4 text-emerald-700" />
                <span>CSV ফাইল</span>
              </button>

              <button
                onClick={handleDownloadJSON}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-700" />
                <span>JSON ব্যাকআপ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
