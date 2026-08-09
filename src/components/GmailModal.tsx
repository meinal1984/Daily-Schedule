import React, { useState, useEffect } from 'react';
import { ScheduleDocument } from '../types';
import { generateShareableText } from '../utils/bengaliUtils';
import { generateScheduleHtmlEmail } from '../utils/emailTemplate';
import {
  initGmailAuth,
  signInWithGmail,
  logoutGmail,
  sendGmailEmail,
  fetchRecentSentEmails,
} from '../utils/gmailService';
import { User } from 'firebase/auth';
import {
  X,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  History,
  Eye,
  FileText,
  UserCheck,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: ScheduleDocument;
}

export const GmailModal: React.FC<Props> = ({ isOpen, onClose, document: scheduleDoc }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Email form state
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [recipientNotes, setRecipientNotes] = useState<string>('');
  const [previewTab, setPreviewTab] = useState<'html' | 'text'>('html');

  // Confirmation modal state (MANDATORY per Workspace guidelines)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  // Sending status
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

  // Sent History
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [sentHistory, setSentHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Quick recipient pills
  const sampleRecipients = [
    'dc.comilla@mopa.gov.bd',
    'adc.gen.comilla@gmail.com',
    'uno.sadar.comilla@gmail.com',
  ];

  // Initialize Auth listener
  useEffect(() => {
    if (!isOpen) return;

    setIsAuthChecking(true);
    const unsubscribe = initGmailAuth(
      (user) => {
        setCurrentUser(user);
        setIsAuthChecking(false);
      },
      () => {
        setCurrentUser(null);
        setIsAuthChecking(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  // Sync default values when modal opens
  useEffect(() => {
    if (scheduleDoc && isOpen) {
      const lh = scheduleDoc.letterhead || {};
      const defaultSubj = lh.subject || scheduleDoc.title || 'মান্যবর জেলা প্রশাসকের দৈনন্দিন কর্মসূচি সূচি';
      setEmailSubject(defaultSubj);
      setSendSuccessMessage(null);
      setSendErrorMessage(null);
    }
  }, [scheduleDoc, isOpen]);

  // Load history when tab changes to history
  useEffect(() => {
    if (activeTab === 'history' && currentUser) {
      loadHistory();
    }
  }, [activeTab, currentUser]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await fetchRecentSentEmails(6);
      setSentHistory(history);
    } catch (e) {
      console.error('History load error:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen || !scheduleDoc) return null;

  const plainTextBody = generateShareableText(scheduleDoc);
  const htmlBody = generateScheduleHtmlEmail(scheduleDoc, recipientNotes);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setSendErrorMessage(null);
    try {
      const result = await signInWithGmail();
      if (result) {
        setCurrentUser(result.user);
      } else {
        setSendErrorMessage('সাইন-ইন উইন্ডোটি বন্ধ করা হয়েছে। কানেক্ট করতে পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setSendErrorMessage(err.message || 'জি-মেইলে লগইন ব্যর্থ হয়েছে।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGmail();
    setCurrentUser(null);
  };

  const handleAddQuickRecipient = (email: string) => {
    if (!recipientEmail.includes(email)) {
      setRecipientEmail((prev) => (prev ? `${prev}, ${email}` : email));
    }
  };

  // Trigger Send - Request Confirmation First
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) {
      setSendErrorMessage('অনুগ্রহ করে প্রাপকের ইমেইল ঠিকানা প্রদান করুন।');
      return;
    }
    setSendErrorMessage(null);
    setShowConfirmation(true);
  };

  // Execute actual send after user explicitly confirms in dialog
  const handleConfirmedSend = async () => {
    setShowConfirmation(false);
    setIsSending(true);
    setSendSuccessMessage(null);
    setSendErrorMessage(null);

    try {
      const recipientList = recipientEmail
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      for (const toEmail of recipientList) {
        await sendGmailEmail({
          to: toEmail,
          subject: emailSubject,
          bodyText: plainTextBody,
          bodyHtml: htmlBody,
        });
      }

      setSendSuccessMessage(
        `সফলভাবে ${recipientList.length} টি ইমেইল ঠিকানায় সরাসরি জি-মেইলের মাধ্যমে কর্মসূচি নোটিশ পাঠানো হয়েছে!`
      );
      setRecipientEmail('');
      setRecipientNotes('');

      // Refresh history if available
      loadHistory();
    } catch (err: any) {
      console.error('Gmail send error:', err);
      setSendErrorMessage(err.message || 'জি-মেইল API এর মাধ্যমে ইমেইল পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600 rounded-lg text-white">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif-bn flex items-center gap-2">
                <span>জি-মেইল ইন্টিগ্রেশন (Send via Official Gmail)</span>
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                গুগল ওয়ার্কস্পেস জি-মেইল API এর মাধ্যমে সরাসরি অফিশিয়াল ইমেইল পাঠান
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Auth Banner Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
          {isAuthChecking ? (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
              <span>জি-মেইল সংযোগ স্ট্যাটাস যাচাই করা হচ্ছে...</span>
            </div>
          ) : currentUser ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User Avatar"
                    className="w-6 h-6 rounded-full border border-slate-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                )}
                <span className="font-semibold text-slate-800">
                  {currentUser.displayName || 'গুগল ব্যবহারকারী'} ({currentUser.email})
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                  সংযুক্ত
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-slate-600 hover:text-red-600 font-medium transition-colors"
                title="জি-মেইল একাউন্ট লগআউট করুন"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-amber-800 font-medium">
                ইমেইল পাঠানোর জন্য আপনার গুগল ওয়ার্কস্পেস / জি-মেইল একাউন্টে সাইন-ইন করুন
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                (Google OAuth Verified)
              </span>
            </div>
          )}
        </div>

        {/* Modal Navigation Tabs */}
        {currentUser && (
          <div className="flex border-b border-slate-200 bg-white px-6 shrink-0">
            <button
              onClick={() => setActiveTab('compose')}
              className={`py-2.5 px-4 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'compose'
                  ? 'border-red-600 text-red-700 bg-red-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>ইমেইল কম্পোজ ও প্রিভিউ</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`py-2.5 px-4 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'history'
                  ? 'border-red-600 text-red-700 bg-red-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>প্রেরিত ইমেইল লগ (Sent Log)</span>
            </button>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans flex-1">
          {/* Status Messages */}
          {sendSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-3 text-xs text-emerald-900 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">ইমেইল সফলভাবে প্রেরিত হয়েছে!</p>
                <p className="mt-0.5 text-emerald-800">{sendSuccessMessage}</p>
              </div>
            </div>
          )}

          {sendErrorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3 text-xs text-rose-900 font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">সমস্যা দেখা দিয়েছে</p>
                <p className="mt-0.5 text-rose-800">{sendErrorMessage}</p>
              </div>
            </div>
          )}

          {/* Render Login Request if NOT Authenticated */}
          {!currentUser ? (
            <div className="py-8 text-center space-y-5 bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 shadow-inner">
                <Mail className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-lg font-bold text-slate-900 font-serif-bn">
                  জি-মেইল ইন্টিগ্রেশন ব্যবহার করুন
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  আপনার নিজস্ব জি-মেইল একাউন্ট দিয়ে সহজেই সরকারি দৈনন্দিন সূচির ফরম্যাটকৃত ইমেইল নোটিশ সহকর্মী, বিভাগীয় প্রধান ও প্রেস ক্লাবকে পাঠাতে পারবেন।
                </p>
              </div>

              {/* Official Standard "Sign in with Google" Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-sm transition-all active:scale-98 disabled:opacity-70 cursor-pointer"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                )}
                <span>Sign in with Google (জি-মেইল)</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>গুগল সিকিউর OAuth ২.০ ভেরিফাইড প্রোটোকল</span>
              </div>
            </div>
          ) : activeTab === 'compose' ? (
            /* Compose Form */
            <form onSubmit={handleInitiateSend} className="space-y-4">
              {/* Recipient Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  প্রাপকের ইমেইল (To Email Addresses): <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="যেমন: officer@district.gov.bd, press@media.com (কমা দিয়ে একাধিক ইমেইল দিন)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />

                {/* Quick Recipient Pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-500 font-medium">দ্রুত যোগ করুন:</span>
                  {sampleRecipients.map((email) => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => handleAddQuickRecipient(email)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-md border border-slate-200 font-mono transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5 text-slate-500" />
                      <span>{email}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ইমেইলের বিষয় (Subject):
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="ইমেইলের সাবজেক্ট লিখুন"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              {/* Optional Recipient Note */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  বিশেষ নির্দেশনা/কভার নোট (Optional Special Message):
                </label>
                <input
                  type="text"
                  value={recipientNotes}
                  onChange={(e) => setRecipientNotes(e.target.value)}
                  placeholder="যেমন: সকল শাখা প্রধানকে যথাসময়ে উপস্থিত থাকার অনুরোধ করা যাচ্ছে।"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              {/* Preview Toggle Tabs */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-red-600" />
                    <span>প্রেরণযোগ্য ইমেইল প্রিভিউ:</span>
                  </label>

                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('html')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        previewTab === 'html'
                          ? 'bg-white text-red-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      HTML Rich Email Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('text')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        previewTab === 'text'
                          ? 'bg-white text-red-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Plain Text
                    </button>
                  </div>
                </div>

                {/* Preview Box */}
                {previewTab === 'html' ? (
                  <div className="border border-slate-300 rounded-lg overflow-hidden bg-white max-h-60 overflow-y-auto">
                    <iframe
                      title="HTML Email Preview"
                      srcDoc={htmlBody}
                      className="w-full h-56 border-0"
                    />
                  </div>
                ) : (
                  <textarea
                    readOnly
                    rows={8}
                    value={plainTextBody}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 leading-relaxed"
                  />
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>জি-মেইল API পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>জি-মেইল দ্বারা পাঠান (Send Email)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Sent History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-red-600" />
                  <span>সাম্পতিক প্রেরিত ইমেইল সমূহ (Recent Sent Messages)</span>
                </h4>
                <button
                  onClick={loadHistory}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  রিফ্রেশ করুন
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                  <span>জি-মেইল সেন্ট ফোল্ডার থেকে লোড হচ্ছে...</span>
                </div>
              ) : sentHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  সাম্প্রতিক প্রেরিত ইমেইল পাওয়া যায়নি।
                </div>
              ) : (
                <div className="space-y-2">
                  {sentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-red-300 transition-colors text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">To: {item.to}</span>
                        <span className="text-[10px] text-slate-400">{item.date}</span>
                      </div>
                      <p className="font-medium text-red-700">{item.subject}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Explicit User Confirmation Modal (MANDATORY per Workspace guidelines) */}
      {showConfirmation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-amber-700" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-serif-bn">
                ইমেইল পাঠানোর জন্য নিশ্চিতকরণ
              </h4>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              আপনি আপনার জি-মেইল অ্যাকাউন্ট থেকে নিম্নলিখিত তথ্যে সরাসরি ইমেইল পাঠাতে যাচ্ছেন:
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 font-sans">
              <div>
                <span className="font-bold text-slate-600">প্রাপক:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{recipientEmail}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">বিষয়:</span>{' '}
                <span className="font-semibold text-slate-900">{emailSubject}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">সংযুক্ত বিষয়বস্তু:</span>{' '}
                <span className="text-emerald-700 font-bold">
                  {scheduleDoc.items?.length || 0} টি কর্মসূচি ফরম্যাটকৃত টেবিলে অন্তর্ভুক্ত
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              * আপনি নিশ্চিত করলে আপনার গুগল ওয়ার্কস্পেস জি-মেইল একাউন্ট ব্যবহার করে মেসেজটি সরাসরি প্রেরিত হবে।
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmedSend}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>হ্যাঁ, ইমেইল পাঠান (Confirm Send)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
