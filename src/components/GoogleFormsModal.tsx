import React, { useState, useEffect } from 'react';
import {
  initGoogleAuth,
  googleSignIn,
  googleSignOut,
  createProgramGoogleForm,
  getFormDetails,
  getFormResponses,
  listGoogleFormsFromDrive,
  GoogleFormDetails,
  FormResponseItem,
} from '../utils/googleFormsApi';
import { User } from 'firebase/auth';
import { ScheduleDocument } from '../types';
import {
  X,
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  LogIn,
  Send,
  HelpCircle,
  List,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: ScheduleDocument;
}

export const GoogleFormsModal: React.FC<Props> = ({ isOpen, onClose, document: scheduleDoc }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  // Active Tab: 'create' | 'responses' | 'drive'
  const [activeTab, setActiveTab] = useState<'create' | 'responses' | 'drive'>('create');

  // Form Creation State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdForm, setCreatedForm] = useState<GoogleFormDetails | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected Form & Responses State
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [selectedFormDetails, setSelectedFormDetails] = useState<GoogleFormDetails | null>(null);
  const [responses, setResponses] = useState<FormResponseItem[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Drive Forms List
  const [driveForms, setDriveForms] = useState<Array<{ id: string; name: string; createdTime: string; webViewLink?: string }>>([]);
  const [loadingDriveForms, setLoadingDriveForms] = useState(false);

  // Feedback Messages
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize Auth Listener
  useEffect(() => {
    if (isOpen) {
      setAuthLoading(true);
      const unsubscribe = initGoogleAuth(
        (authUser, authToken) => {
          setUser(authUser);
          setToken(authToken);
          setAuthLoading(false);
        },
        () => {
          setUser(null);
          setToken(null);
          setAuthLoading(false);
        }
      );
      return () => unsubscribe();
    }
  }, [isOpen]);

  // Set default title & description whenever document changes
  useEffect(() => {
    if (scheduleDoc) {
      const lh = scheduleDoc.letterhead || {};
      const subject = lh.subject || scheduleDoc.title || 'দৈনন্দিন কর্মসূচি';
      const memo = lh.memoNo ? ` (স্মারক নং: ${lh.memoNo})` : '';
      const date = lh.issueDate ? ` - তারিখ: ${lh.issueDate}` : '';

      setFormTitle(`${subject} - উপস্থিতি ও সভার সম্মতিপত্র`);
      setFormDesc(
        `মান্যবর মহোদয়ের ${subject}${memo}${date} এ অংশগ্রহণের তথ্য, কর্মকর্তা/প্রতিনিধির বিবরণ ও মতামত সংগ্রহের জন্য এই গুগল ফর্ম তৈরি করা হয়েছে।`
      );
    }
  }, [scheduleDoc]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setSigningIn(true);
    setStatusMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setStatusMsg({ type: 'success', text: 'সফলভাবে গুগল অ্যাকাউন্টে সাইন ইন করা হয়েছে!' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'সাইন ইন করা সম্ভব হয়নি।' });
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setUser(null);
    setToken(null);
    setCreatedForm(null);
    setResponses([]);
    setDriveForms([]);
    setStatusMsg({ type: 'success', text: 'সাইন আউট সম্পন্ন হয়েছে।' });
  };

  // Create Form Handler
  const handleCreateForm = async () => {
    if (!token) {
      setStatusMsg({ type: 'error', text: 'অনুগ্রহ করে প্রথমে সাইন ইন করুন।' });
      return;
    }

    setIsCreating(true);
    setStatusMsg(null);
    try {
      const newForm = await createProgramGoogleForm(formTitle, formDesc);
      setCreatedForm(newForm);
      setSelectedFormId(newForm.formId);
      setSelectedFormDetails(newForm);
      setStatusMsg({ type: 'success', text: 'গুগল ফর্ম সফলভাবে তৈরি করা হয়েছে!' });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'গুগল ফর্ম তৈরিতে সমস্যা দেখা দিয়েছে।' });
    } finally {
      setIsCreating(false);
    }
  };

  // Fetch Form Responses Handler
  const handleFetchResponses = async (fId: string) => {
    if (!fId || !token) return;
    setLoadingResponses(true);
    setStatusMsg(null);
    try {
      const details = await getFormDetails(fId);
      setSelectedFormDetails(details);
      const resps = await getFormResponses(fId);
      setResponses(resps);
      setStatusMsg({ type: 'success', text: `মোট ${resps.length} টি উত্তর পাওয়া গেছে।` });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'রেসপন্স আনতে সমস্যা হয়েছে।' });
    } finally {
      setLoadingResponses(false);
    }
  };

  // Fetch Drive Forms
  const handleFetchDriveForms = async () => {
    if (!token) return;
    setLoadingDriveForms(true);
    setStatusMsg(null);
    try {
      const files = await listGoogleFormsFromDrive();
      setDriveForms(files);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'ড্রাইভের ফর্ম আনতে সমস্যা হয়েছে।' });
    } finally {
      setLoadingDriveForms(false);
    }
  };

  const handleCopyResponderLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Compute Statistics for Selected Form Responses
  const computeStats = () => {
    let attendCount = 0;
    let onlineCount = 0;
    let repCount = 0;
    let absentCount = 0;

    responses.forEach((resp) => {
      // Look through answers
      Object.values(resp.answers || {}).forEach((ans: any) => {
        const val = ans?.textAnswers?.answers?.[0]?.value || '';
        if (val.includes('স্বশরীরে')) attendCount++;
        else if (val.includes('অনলাইনে')) onlineCount++;
        else if (val.includes('প্রতিনিধি')) repCount++;
        else if (val.includes('সম্ভব নয়')) absentCount++;
      });
    });

    return { attendCount, onlineCount, repCount, absentCount, total: responses.length };
  };

  const stats = computeStats();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base font-semibold font-serif-bn">
                গুগল ফর্ম সংযোগ ও উপস্থিতি ব্যবস্থাপনা (Google Forms Integration)
              </h3>
              <p className="text-xs text-emerald-200 font-sans">
                কর্মসূচি ও সভার উপস্থিতি, সায় এবং সম্মতিপত্র সরাসরি গুগল ফর্মের মাধ্যমে পরিচালনা করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account / Auth Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 font-sans">
          {authLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              <span>গুগল অ্যাকাউন্ট যাচাই করা হচ্ছে...</span>
            </div>
          ) : user ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-7 h-7 rounded-full border border-emerald-600" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    {user.email?.[0].toUpperCase() || 'G'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-800">{user.displayName || 'গুগল ব্যবহারকারী'}</div>
                  <div className="text-[11px] text-slate-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-red-300 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>সাইন আউট</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2">
              <div className="text-xs text-slate-600">
                গুগল ফর্ম সংযোগ করতে আপনার গুগল অ্যাকাউন্টে সাইন ইন করুন:
              </div>
              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="gsi-material-button text-xs font-semibold px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 flex items-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{signingIn ? 'সাইন ইন করা হচ্ছে...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Status Alert Banner */}
        {statusMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <XCircle className="w-4 h-4 text-red-700 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="border-b border-slate-200 px-6 bg-slate-50 flex items-center gap-2 overflow-x-auto font-sans">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'create'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-700" />
            <span>নতুন উপস্থিতি গুগল ফর্ম তৈরি</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('responses');
              if (selectedFormId) handleFetchResponses(selectedFormId);
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'responses'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-700" />
            <span>রেসপন্স ও উপস্থিতি তালিকা</span>
            {responses.length > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
                {responses.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('drive');
              if (driveForms.length === 0) handleFetchDriveForms();
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'drive'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <List className="w-4 h-4 text-emerald-700" />
            <span>আমার গুগল ড্রাইভে সংরক্ষিত ফর্মসমূহ</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans flex-1">
          {!user ? (
            <div className="text-center py-10 space-y-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
              <FileSpreadsheet className="w-12 h-12 text-emerald-700 mx-auto opacity-70" />
              <h4 className="text-sm font-bold text-slate-800">গুগল ফর্ম সংযোগ সক্রিয় নয়</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                আপনার দৈনন্দিন কর্মসূচি ও সভার জন্য অটোমেটিক উপস্থিতি ফর্ম তৈরি এবং গুগল ড্রাইভ থেকে প্রাপ্ত সম্মতিপত্র দেখতে আপনার গুগল অ্যাকাউন্টে সাইন ইন করুন।
              </p>
              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Google দিয়ে সাইন ইন করুন</span>
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: CREATE FORM */}
              {activeTab === 'create' && (
                <div className="space-y-4">
                  <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span>চলতি নোটিশের উপর ভিত্তি করে তৈরিযোগ্য প্রশ্নপত্র:</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        গুগল ফর্মের শিরোনাম (Form Title)
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ফর্মের বিবরণ / বার্তা (Form Description)
                      </label>
                      <textarea
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        rows={3}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 leading-relaxed"
                      />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 text-slate-700">
                      <div className="font-bold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>অটোমেটিক যুক্ত হতে যাওয়া প্রশ্নসমূহ:</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] space-y-1 text-slate-600 pl-1">
                        <li>নাম ও পদবী (Name & Designation)</li>
                        <li>দপ্তর / সংস্থার নাম (Office/Department)</li>
                        <li>মোবাইল নম্বর (Mobile Number)</li>
                        <li>অংশগ্রহণ সম্পর্কিত সিদ্ধান্ত (In-Person / Online / Representative / Absent)</li>
                        <li>অন্যান্য মতামত বা মন্তব্য (Remarks)</li>
                      </ul>
                    </div>

                    <button
                      onClick={handleCreateForm}
                      disabled={isCreating}
                      className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {isCreating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>গুগল ফর্ম তৈরি হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>গুগল ফর্ম তৈরি করুন (Create Google Form)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Created Form Success Box */}
                  {createdForm && (
                    <div className="border border-emerald-300 bg-white rounded-xl p-4 shadow-sm space-y-3 font-sans">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>গুগল ফর্ম সফলভাবে আপনার ড্রাইভ অ্যাকাউন্টে তৈরি হয়েছে!</span>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          অংশগ্রহণকারীদের পাঠানোর জন্য শেয়ারিং লিঙ্ক (Responder URL):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={createdForm.responderUri}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden select-all"
                          />
                          <button
                            onClick={() => handleCopyResponderLink(createdForm.responderUri)}
                            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedLink ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <a
                          href={createdForm.responderUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>ফর্মটি খুলুন</span>
                        </a>

                        <a
                          href={`https://docs.google.com/forms/d/${createdForm.formId}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                          <span>গুগল ফর্মে এডিট করুন</span>
                        </a>

                        <button
                          onClick={() => {
                            setActiveTab('responses');
                            handleFetchResponses(createdForm.formId);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>রেসপন্স ও সাবমিশন দেখুন</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RESPONSES */}
              {activeTab === 'responses' && (
                <div className="space-y-4 font-sans">
                  {/* Select Form Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                        ফর্ম আইডি:
                      </label>
                      <input
                        type="text"
                        value={selectedFormId}
                        onChange={(e) => setSelectedFormId(e.target.value)}
                        placeholder="গুগল ফর্ম আইডি লিখুন বা ড্রাইভ থেকে বেছে নিন..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden"
                      />
                    </div>
                    <button
                      onClick={() => handleFetchResponses(selectedFormId)}
                      disabled={loadingResponses || !selectedFormId}
                      className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingResponses ? 'animate-spin' : ''}`} />
                      <span>রিফ্রেশ রেসপন্স</span>
                    </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <div className="text-xs text-slate-500 font-medium">মোট উত্তর</div>
                      <div className="text-xl font-extrabold text-slate-900">{stats.total}</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                      <div className="text-xs text-emerald-800 font-medium">স্বশরীরে উপস্থিত</div>
                      <div className="text-xl font-extrabold text-emerald-800">{stats.attendCount}</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                      <div className="text-xs text-blue-800 font-medium">অনলাইনে যুক্ত</div>
                      <div className="text-xl font-extrabold text-blue-800">{stats.onlineCount}</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                      <div className="text-xs text-amber-800 font-medium">প্রতিনিধি প্রেরণ</div>
                      <div className="text-xl font-extrabold text-amber-800">{stats.repCount}</div>
                    </div>
                  </div>

                  {/* Responses Table */}
                  {loadingResponses ? (
                    <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-700" />
                      <span>গুগল ফর্ম রেসপন্স লোড হচ্ছে...</span>
                    </div>
                  ) : responses.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-500 bg-slate-50 border border-dashed rounded-xl space-y-1">
                      <HelpCircle className="w-8 h-8 mx-auto text-slate-400" />
                      <div>এখন পর্যন্ত কোনো উত্তর জমা পড়েনি বা ফর্ম নির্বাচন করা হয়নি।</div>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">ক্রম</th>
                            <th className="p-2.5">জমা দেওয়ার সময়</th>
                            <th className="p-2.5">বিবরণ / উত্তরসমূহ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {responses.map((resp, idx) => (
                            <tr key={resp.responseId || idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-600">{idx + 1}</td>
                              <td className="p-2.5 text-slate-500 whitespace-nowrap">
                                {new Date(resp.createTime).toLocaleString('bn-BD')}
                              </td>
                              <td className="p-2.5 space-y-1">
                                {Object.entries(resp.answers || {}).map(([key, value]: [string, any]) => {
                                  const textVal = value?.textAnswers?.answers?.[0]?.value || '';
                                  return (
                                    <div key={key} className="text-[11px] text-slate-800">
                                      <span className="font-semibold text-slate-900">• </span>
                                      <span>{textVal}</span>
                                    </div>
                                  );
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DRIVE FORMS */}
              {activeTab === 'drive' && (
                <div className="space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">
                      আপনার গুগল ড্রাইভে প্রাপ্ত ফর্মসমূহ (Google Drive Forms)
                    </h4>
                    <button
                      onClick={handleFetchDriveForms}
                      disabled={loadingDriveForms}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingDriveForms ? 'animate-spin' : ''}`} />
                      <span>রিফ্রেশ</span>
                    </button>
                  </div>

                  {loadingDriveForms ? (
                    <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-700" />
                      <span>গুগল ড্রাইভ স্ক্যান করা হচ্ছে...</span>
                    </div>
                  ) : driveForms.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 border border-dashed rounded-xl">
                      গুগল ড্রাইভে কোনো ফর্ম খুঁজে পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {driveForms.map((file) => (
                        <div
                          key={file.id}
                          className="border border-slate-200 rounded-xl p-3 bg-white hover:border-emerald-500 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                              <span>{file.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>আইডি: {file.id}</span>
                              <span>•</span>
                              <span>তৈরি: {new Date(file.createdTime).toLocaleDateString('bn-BD')}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedFormId(file.id);
                                setActiveTab('responses');
                                handleFetchResponses(file.id);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            >
                              রেসপন্স দেখুন
                            </button>
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-slate-100"
                                title="গুগল ফর্মে খুলুন"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-sans">
          <span>গুগল ওয়ার্কস্পেস অফিশিয়াল API দ্বারা সুরক্ষিত</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
