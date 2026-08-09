import React, { useState, useEffect } from 'react';
import { ScheduleDocument } from '../types';
import { generateShareableText, toBengaliNumerals } from '../utils/bengaliUtils';
import { generateScheduleHtmlEmail } from '../utils/emailTemplate';
import {
  initDriveAuth,
  signInWithDrive,
  logoutDrive,
  uploadToGoogleDrive,
  listDriveFiles,
  downloadDriveFileContent,
  deleteDriveFile,
  DriveFileItem,
} from '../utils/driveService';
import { User } from 'firebase/auth';
import {
  X,
  HardDrive,
  UploadCloud,
  FolderDown,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  FileCode,
  FileText,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  Download,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: ScheduleDocument;
  onImportDocument?: (importedDoc: ScheduleDocument) => void;
}

export const DriveModal: React.FC<Props> = ({
  isOpen,
  onClose,
  document: scheduleDoc,
  onImportDocument,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'backup' | 'explorer'>('backup');

  // Form State
  const [exportFormat, setExportFormat] = useState<'json' | 'html' | 'text'>('json');
  const [customFileName, setCustomFileName] = useState<string>('');

  // Confirmation Modal State (MANDATORY per Workspace integration guidelines)
  const [showConfirmAction, setShowConfirmAction] = useState<false | 'upload' | 'delete'>(false);
  const [selectedFileForDelete, setSelectedFileForDelete] = useState<DriveFileItem | null>(null);

  // Statuses
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drive Files List State
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // Initialize Auth
  useEffect(() => {
    if (!isOpen) return;

    setIsAuthChecking(true);
    const unsubscribe = initDriveAuth(
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

  // Default File Name
  useEffect(() => {
    if (scheduleDoc && isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const safeTitle = (scheduleDoc.title || 'সূচি_ব্যাকআপ').replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_');
      setCustomFileName(`${safeTitle}_${today}`);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [scheduleDoc, isOpen]);

  // Fetch Drive files when explorer tab becomes active
  useEffect(() => {
    if (activeTab === 'explorer' && currentUser) {
      loadDriveFiles();
    }
  }, [activeTab, currentUser]);

  const loadDriveFiles = async () => {
    setIsLoadingFiles(true);
    setErrorMessage(null);
    try {
      const files = await listDriveFiles();
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Fetch Drive files error:', err);
      setErrorMessage('গুগল ড্রাইভের ফাইল তালিকা দেখা সম্ভব হয়নি।');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  if (!isOpen || !scheduleDoc) return null;

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await signInWithDrive();
      if (result) {
        setCurrentUser(result.user);
      } else {
        setErrorMessage('সাইন-ইন উইন্ডোটি বন্ধ করা হয়েছে। কানেক্ট করতে পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'গুগল ড্রাইভে সাইন-ইন ব্যর্থ হয়েছে।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutDrive();
    setCurrentUser(null);
  };

  // Trigger Upload Confirmation
  const handleInitiateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFileName.trim()) {
      setErrorMessage('অনুগ্রহ করে ফাইলের নাম প্রদান করুন।');
      return;
    }
    setErrorMessage(null);
    setShowConfirmAction('upload');
  };

  // Execute Upload
  const handleConfirmedUpload = async () => {
    setShowConfirmAction(false);
    setIsUploading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let content = '';
      let mimeType: 'application/json' | 'text/html' | 'text/plain' = 'application/json';
      let extension = 'json';

      if (exportFormat === 'json') {
        content = JSON.stringify(scheduleDoc, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else if (exportFormat === 'html') {
        content = generateScheduleHtmlEmail(scheduleDoc);
        mimeType = 'text/html';
        extension = 'html';
      } else {
        content = generateShareableText(scheduleDoc);
        mimeType = 'text/plain';
        extension = 'txt';
      }

      const fullFileName = customFileName.endsWith(`.${extension}`)
        ? customFileName
        : `${customFileName}.${extension}`;

      const res = await uploadToGoogleDrive({
        fileName: fullFileName,
        fileContent: content,
        mimeType: mimeType,
      });

      setSuccessMessage(`সফলভাবে গুগল ড্রাইভের "সরকারি সূচি ব্যাকআপ" ফোল্ডারে '${res.name}' সংরক্ষিত হয়েছে!`);
      
      // Refresh list if user goes to explorer
      loadDriveFiles();
    } catch (err: any) {
      console.error('Drive upload error:', err);
      setErrorMessage(err.message || 'গুগল ড্রাইভে ফাইল আপলোড করতে ব্যর্থ।');
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger Delete Confirmation
  const handleInitiateDelete = (file: DriveFileItem) => {
    setSelectedFileForDelete(file);
    setShowConfirmAction('delete');
  };

  // Execute Delete
  const handleConfirmedDelete = async () => {
    if (!selectedFileForDelete) return;
    const targetFile = selectedFileForDelete;
    setShowConfirmAction(false);
    setSelectedFileForDelete(null);

    try {
      await deleteDriveFile(targetFile.id);
      setSuccessMessage(`'${targetFile.name}' ফাইলটি গুগল ড্রাইভ থেকে মুছে ফেলা হয়েছে।`);
      loadDriveFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'ফাইল মোছা সম্ভব হয়নি।');
    }
  };

  // Import JSON Schedule file from Drive
  const handleImportFile = async (file: DriveFileItem) => {
    setDownloadingFileId(file.id);
    setErrorMessage(null);
    try {
      const textContent = await downloadDriveFileContent(file.id);
      const parsedDoc = JSON.parse(textContent);
      
      if (!parsedDoc.title && !parsedDoc.items) {
        throw new Error('ফাইলটি সঠিক সূচির ডেটা ফরম্যাটে নেই।');
      }

      if (onImportDocument) {
        onImportDocument({
          ...parsedDoc,
          id: `imported_${Date.now()}`,
          updatedAt: Date.now(),
        });
        setSuccessMessage(`'${file.name}' সফলভাবে অ্যাপে ইম্পোর্ট করা হয়েছে!`);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage('ফাইল ইম্পোর্ট করা সম্ভব হয়নি। এটি কোনো বৈধ JSON ব্যাকআপ ফাইল নয়।');
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between shrink-0 border-b border-emerald-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700 rounded-lg text-white">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif-bn flex items-center gap-2">
                <span>গুগল ড্রাইভ ইন্টিগ্রেশন (Google Drive Sync & Cloud Storage)</span>
              </h3>
              <p className="text-xs text-emerald-200 font-sans">
                গুগল ক্লাউড ড্রাইভে নিরাপদে ক্লাউড ব্যাকআপ রাখুন ও প্রয়োজনে পুনরায় ইম্পোর্ট করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Auth Banner */}
        <div className="bg-emerald-50/70 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
          {isAuthChecking ? (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              <span>গুগল ড্রাইভ সংযোগ স্ট্যাটাস চেক করা হচ্ছে...</span>
            </div>
          ) : currentUser ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User"
                    className="w-6 h-6 rounded-full border border-emerald-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                )}
                <span className="font-semibold text-slate-800">
                  {currentUser.displayName || 'গুগল ব্যবহারকারী'} ({currentUser.email})
                </span>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full text-[10px] font-bold border border-emerald-300">
                  ড্রাইভ সংযুক্ত
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-slate-600 hover:text-rose-600 font-medium transition-colors cursor-pointer"
                title="ড্রাইভ লগআউট করুন"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-amber-800 font-medium">
                ক্লাউড ব্যাকআপের জন্য আপনার গুগল একাউন্টে সাইন-ইন করুন
              </span>
              <span className="text-[10px] text-slate-500">(Google Drive OAuth)</span>
            </div>
          )}
        </div>

        {/* Nav Tabs */}
        {currentUser && (
          <div className="flex border-b border-slate-200 bg-white px-6 shrink-0">
            <button
              onClick={() => setActiveTab('backup')}
              className={`py-2.5 px-4 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'backup'
                  ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>ড্রাইভে সেভ ও ব্যাকআপ (Backup to Drive)</span>
            </button>

            <button
              onClick={() => setActiveTab('explorer')}
              className={`py-2.5 px-4 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'explorer'
                  ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>ড্রাইভ ফাইলসমূহ ও ইম্পোর্ট (Drive Explorer)</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans flex-1">
          {/* Status Messages */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-3 text-xs text-emerald-900 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">সফল হয়েছে!</p>
                <p className="mt-0.5 text-emerald-800">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3 text-xs text-rose-900 font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">সমস্যা দেখা দিয়েছে</p>
                <p className="mt-0.5 text-rose-800">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Login prompt if not signed in */}
          {!currentUser ? (
            <div className="py-8 text-center space-y-5 bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 shadow-inner">
                <HardDrive className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-lg font-bold text-slate-900 font-serif-bn">
                  গুগল ড্রাইভ কানেক্ট করুন
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  আপনার দৈনন্দিন সরকারী সূচির যাবতীয় ফাইল সরাসরি আপনার গুগল ড্রাইভে "সরকারি সূচি ব্যাকআপ" ফোল্ডারে সেভ করে রাখতে পারেন।
                </p>
              </div>

              {/* Standard Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-sm transition-all active:scale-98 disabled:opacity-70 cursor-pointer"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
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
                <span>Sign in with Google (Google Drive)</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>গুগল সিকিউর OAuth ২.০ ভেরিফাইড ইন্টিগ্রেশন</span>
              </div>
            </div>
          ) : activeTab === 'backup' ? (
            /* Upload Form */
            <form onSubmit={handleInitiateUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ফাইল ফরম্যাট নির্বাচন করুন (Export Format):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setExportFormat('json')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      exportFormat === 'json'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <FileCode className="w-4 h-4 text-emerald-700" />
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-sm">
                        JSON
                      </span>
                    </div>
                    <span className="text-xs">অ্যাপ ব্যাকআপ ফরম্যাট</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      পরবর্তীতে ড্রাইভে সেভ রেখে পুনরায় ইম্পোর্ট করা যাবে
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('html')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      exportFormat === 'html'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-sm">
                        HTML
                      </span>
                    </div>
                    <span className="text-xs">ফরম্যাটকৃত ওয়েব ডকুমেন্ট</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      অফিশিয়াল টেবিল ও সরকারি প্যাড সহ প্রিন্টযোগ্য ফাইল
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('text')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      exportFormat === 'text'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded-sm">
                        TXT
                      </span>
                    </div>
                    <span className="text-xs">প্লেন টেক্সট সামারি</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      সহজ পঠনযোগ্য বাংলা টেক্সট ফরম্যাট
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ফাইলের নাম (File Name):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-slate-100 px-2.5 py-2 rounded-lg border border-slate-200">
                    .{exportFormat}
                  </span>
                </div>
              </div>

              {/* Information Note */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  ফাইলটি আপনার ড্রাইভের <strong>"সরকারি সূচি ব্যাকআপ"</strong> নামক অটোমেটিক ফোল্ডারে সেভ হবে।
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>গুগল ড্রাইভে আপলোড হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>গুগল ড্রাইভে সেভ করুন (Save to Drive)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Drive Files Explorer Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderDown className="w-4 h-4 text-emerald-700" />
                  <span>ড্রাইভে রক্ষিত সূচি ফাইলসমূহ ("সরকারি সূচি ব্যাকআপ")</span>
                </h4>
                <button
                  onClick={loadDriveFiles}
                  disabled={isLoadingFiles}
                  className="flex items-center gap-1 text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  <span>রিফ্রেশ</span>
                </button>
              </div>

              {isLoadingFiles ? (
                <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>গুগল ড্রাইভ থেকে ফাইলসমূহ লোড হচ্ছে...</span>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="font-semibold text-slate-700">ড্রাইভে সংরক্ষিত কোনো সূচি ফাইল পাওয়া যায়নি</p>
                  <p className="text-[11px] text-slate-500">"ড্রাইভে সেভ ও ব্যাকআপ" ট্যাব থেকে প্রথম ব্যাকআপ ফাইল আপলোড করুন।</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {driveFiles.map((file) => {
                    const isJson = file.name.endsWith('.json') || file.mimeType === 'application/json';
                    const isHtml = file.name.endsWith('.html') || file.mimeType === 'text/html';

                    return (
                      <div
                        key={file.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-emerald-400 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isJson
                                ? 'bg-emerald-100 text-emerald-800'
                                : isHtml
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {isJson ? (
                              <FileCode className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>

                          <div className="overflow-hidden">
                            <h5 className="font-bold text-xs text-slate-900 truncate">
                              {file.name}
                            </h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              আপডেট: {new Date(file.modifiedTime || file.createdTime).toLocaleString('bn-BD')}
                              {file.size && ` • ${(parseInt(file.size) / 1024).toFixed(1)} KB`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isJson && (
                            <button
                              onClick={() => handleImportFile(file)}
                              disabled={downloadingFileId === file.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer"
                              title="এই ফাইলটি অ্যাপে লোড করুন"
                            >
                              {downloadingFileId === file.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>ইম্পোর্ট</span>
                            </button>
                          )}

                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="গুগল ড্রাইভে সরাসরি খুলুন"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={() => handleInitiateDelete(file)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="ফাইল মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Explicit User Confirmation Dialog (MANDATORY per Workspace guidelines) */}
      {showConfirmAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-center gap-3 text-emerald-800">
              <div className="p-2 bg-emerald-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-emerald-700" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-serif-bn">
                {showConfirmAction === 'upload'
                  ? 'গুগল ড্রাইভে ফাইল সেভ করার নিশ্চিতকরণ'
                  : 'ড্রাইভ থেকে ফাইল মোছার নিশ্চিতকরণ'}
              </h4>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {showConfirmAction === 'upload'
                ? `আপনি কি আপনার কানেক্টেড গুগল ড্রাইভে '${customFileName}.${exportFormat}' ফাইলটি আপলোড করতে সম্মত আছেন?`
                : `'${selectedFileForDelete?.name}' ফাইলটি ড্রাইভ থেকে স্থায়ীভাবে মুছে ফেলা হবে। আপনি কি নিশ্চিত?`}
            </p>

            <p className="text-[11px] text-slate-500">
              * আপনি অনুমোদন প্রদান করলে গুগল ড্রাইভ REST API এর মাধ্যমে সরাসরি ক্লাউডে প্রক্রিয়াটি সম্পাদিত হবে।
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmAction(false);
                  setSelectedFileForDelete(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                বাতিল (Cancel)
              </button>

              <button
                type="button"
                onClick={
                  showConfirmAction === 'upload' ? handleConfirmedUpload : handleConfirmedDelete
                }
                className={`px-5 py-2 font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 text-white ${
                  showConfirmAction === 'upload'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <span>
                  {showConfirmAction === 'upload'
                    ? 'হ্যাঁ, আপলোড করুন (Confirm Upload)'
                    : 'হ্যাঁ, মুছে ফেলুন (Confirm Delete)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
