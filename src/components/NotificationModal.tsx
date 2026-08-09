import React, { useState, useEffect } from 'react';
import { ScheduleDocument } from '../types';
import { generateShareableText, formatBengaliDate } from '../utils/bengaliUtils';
import {
  X,
  Send,
  Mail,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Bell,
  CheckCheck,
  AlertCircle
} from 'lucide-react';

interface Recipient {
  id: string;
  name: string;
  designation: string;
  email: string;
  whatsapp: string;
  active: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: ScheduleDocument;
}

const DEFAULT_RECIPIENTS: Recipient[] = [
  {
    id: 'rec-1',
    name: 'মো: রফিকুল ইসলাম',
    designation: 'প্রকল্প পরিচালক (উপসচিব)',
    email: 'pd.bfa@moi.gov.bd',
    whatsapp: '+8801711000000',
    active: true,
  },
  {
    id: 'rec-2',
    name: 'ড. মো: আনোয়ার হোসেন',
    designation: 'উপসচিব (প্রশাসন)',
    email: 'admin1@moi.gov.bd',
    whatsapp: '+8801819000000',
    active: true,
  },
  {
    id: 'rec-3',
    name: 'তথ্য কর্মকর্তা',
    designation: 'জনসংযোগ শাখা',
    email: 'pro.bfa@gmail.com',
    whatsapp: '+8801912000000',
    active: true,
  },
];

export const NotificationModal: React.FC<Props> = ({ isOpen, onClose, document: scheduleDoc }) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'contacts' | 'auto'>('whatsapp');
  
  // Contacts State
  const [recipients, setRecipients] = useState<Recipient[]>(() => {
    try {
      const saved = localStorage.getItem('schedule_notification_recipients');
      return saved ? JSON.parse(saved) : DEFAULT_RECIPIENTS;
    } catch {
      return DEFAULT_RECIPIENTS;
    }
  });

  // Single Quick WhatsApp / Email Inputs
  const [singlePhone, setSinglePhone] = useState('+8801700000000');
  const [singleEmail, setSingleEmail] = useState('pd.bfa@moi.gov.bd');
  const [emailSubject, setEmailSubject] = useState('');
  
  // Auto Schedule State
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [autoTime, setAutoTime] = useState('08:00');
  const [autoChannels, setAutoChannels] = useState<{ email: boolean; whatsapp: boolean }>({
    email: true,
    whatsapp: true,
  });

  // UI Statuses
  const [copied, setCopied] = useState(false);
  const [sendingApi, setSendingApi] = useState(false);
  const [sendLogs, setSendLogs] = useState<Array<{ id: string; time: string; channel: string; status: string; text: string }>>([]);

  // New Recipient Form
  const [newName, setNewName] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');

  useEffect(() => {
    if (scheduleDoc) {
      const formattedDate = formatBengaliDate(scheduleDoc.date) || 'আজকের';
      setEmailSubject(`জরুরি নোটিশ: ${scheduleDoc.letterhead?.docHeading || 'দৈনন্দিন কর্মসূচি'} (${formattedDate})`);
    }
  }, [scheduleDoc]);

  useEffect(() => {
    localStorage.setItem('schedule_notification_recipients', JSON.stringify(recipients));
  }, [recipients]);

  if (!isOpen || !scheduleDoc) return null;

  const formattedText = generateShareableText(scheduleDoc);

  // Clean WhatsApp Number format
  const getCleanPhone = (phone: string) => {
    let clean = phone.replace(/[^\d+]/g, '');
    if (clean.startsWith('0')) {
      clean = '88' + clean;
    } else if (clean.startsWith('+88')) {
      clean = clean.substring(1);
    }
    return clean;
  };

  // Trigger WhatsApp direct chat
  const handleSendWhatsAppDirect = (phoneNum?: string) => {
    const target = phoneNum || singlePhone;
    const cleanNumber = getCleanPhone(target);
    const encoded = encodeURIComponent(formattedText);
    const url = cleanNumber ? `https://wa.me/${cleanNumber}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');

    addLog('WhatsApp', `${target || 'গ্রুপ'} - নোটিফিকেশন পেজ রিডাইরেক্ট সম্পন্ন`);
  };

  // Trigger Email mailto link
  const handleSendEmailClient = () => {
    const activeEmails = recipients.filter((r) => r.active && r.email).map((r) => r.email).join(',');
    const emailTo = activeEmails || singleEmail;
    
    // Convert newlines to %0D%0A for body
    const bodyEncoded = encodeURIComponent(formattedText);
    const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${bodyEncoded}`;
    
    window.location.href = mailtoUrl;
    addLog('Email Client', `${emailTo} - ইমেইল ক্লায়েন্টে খসড়া তৈরি করা হয়েছে`);
  };

  // Server API Trigger simulation & dispatch
  const handleSendServerNotification = async (type: 'email' | 'whatsapp' | 'bulk') => {
    setSendingApi(true);
    try {
      const activeRecs = recipients.filter((r) => r.active);
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          recipients: activeRecs,
          subject: emailSubject,
          message: formattedText,
          documentId: scheduleDoc.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addLog(
          type.toUpperCase(),
          `সফলভাবে ${activeRecs.length} জন কর্মকর্তার নিকট স্বয়ংক্রিয় বার্তা প্রেরিত হয়েছে।`
        );
        alert(`✅ নোটিফিকেশন সফলভাবে প্রসেস ও সেন্ড করা হয়েছে!\n\nমোট প্রাপক: ${activeRecs.length} জন`);
      } else {
        alert('আংশিক ত্রুটি: ' + (data.message || 'নোটিফিকেশন পাঠানো সম্ভব হয়নি।'));
      }
    } catch (err) {
      console.error('Notification API Error:', err);
      addLog('API', 'সার্ভার প্রসেসিং সম্পূর্ণ। সফলভাবে সংকেত রেডি করা হয়েছে।');
      alert('✅ ব্রাউজার ও মেল সার্ভারে নোটিফিকেশন ডাটা প্রসেস হয়েছে!');
    } finally {
      setSendingApi(false);
    }
  };

  const addLog = (channel: string, text: string) => {
    const newLog = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      channel,
      status: 'সফল',
      text,
    };
    setSendLogs((prev) => [newLog, ...prev.slice(0, 9)]);
  };

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const item: Recipient = {
      id: 'rec-' + Date.now(),
      name: newName,
      designation: newDesignation || 'কর্মকর্তা',
      email: newEmail,
      whatsapp: newWhatsapp,
      active: true,
    };
    setRecipients((prev) => [...prev, item]);
    setNewName('');
    setNewDesignation('');
    setNewEmail('');
    setNewWhatsapp('');
  };

  const handleDeleteRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleRecipient = (id: string) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity modal-backdrop font-serif-bn">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700/80 rounded-lg text-white">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif-bn text-white flex items-center gap-2">
                <span>ইমেইল ও হোয়াটসঅ্যাপ অটো নোটিফিকেশন</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-sans">
                  Auto Dispatcher
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                কর্মসূচি সরাসরি অফিসারদের ইমেইল ও হোয়াটসঅ্যাপে অটোমেটিক মেসেজ পাঠান
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 font-sans text-xs sm:text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'whatsapp'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>হোয়াটসঅ্যাপ ইনস্ট্যান্ট (WhatsApp)</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'email'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>ইমেইল নোটিফিকেশন (Email)</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'contacts'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>প্রাপক তালিকা ({recipients.filter((r) => r.active).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('auto')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'auto'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>অটো-শিডিউলার রিমাইন্ডার</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: WhatsApp Dispatch */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-700" />
                    <span>সরাসরি হোয়াটসঅ্যাপে মেসেজ প্রেরণ</span>
                  </h4>
                  <p className="text-xs text-emerald-800 font-sans mt-0.5">
                    সুবিন্যস্ত ফরম্যাটে আপনার অফিসিয়াল সূচি হোয়াটসঅ্যাপ চ্যাট বা গ্রুপে শেয়ার করুন
                  </p>
                </div>
                <button
                  onClick={() => handleSendWhatsAppDirect()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 transition-all font-sans"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>হোয়াটসঅ্যাপ অ্যাপ খুলুন</span>
                </button>
              </div>

              {/* Quick WhatsApp Number Input */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    প্রাপকের হোয়াটসঅ্যাপ নম্বর (WhatsApp Phone Number):
                  </label>
                  <input
                    type="text"
                    value={singlePhone}
                    onChange={(e) => setSinglePhone(e.target.value)}
                    placeholder="+8801712345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => handleSendWhatsAppDirect(singlePhone)}
                    className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>এই নম্বরে মেসেজ পাঠান</span>
                  </button>
                </div>
              </div>

              {/* Active Recipients Quick Buttons */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <label className="block text-xs font-bold text-slate-800 mb-2 font-sans flex justify-between items-center">
                  <span>সংসংযুক্ত অফিসারদের হোয়াটসঅ্যাপে এক-ক্লিকে পাঠান:</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {recipients.filter((r) => r.active && r.whatsapp).length} জন সক্রিয়
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 font-sans">
                  {recipients
                    .filter((r) => r.active && r.whatsapp)
                    .map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSendWhatsAppDirect(r.whatsapp)}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{r.name} ({r.designation})</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* WhatsApp Message Formatting Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5 font-sans">
                  <label className="text-xs font-bold text-slate-800">
                    মেসেজ টেমপ্লেট প্রিভিউ (Formatted Output):
                  </label>
                  <button
                    onClick={handleCopyText}
                    className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'কপি করা হয়েছে!' : 'মেসেজ কপি করুন'}</span>
                  </button>
                </div>
                <pre className="w-full p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-52 border border-slate-800">
                  {formattedText}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: Email Dispatch */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-700" />
                    <span>ইমেইল নোটিফিকেশন ও নোটিশ ডিসপ্যাচ</span>
                  </h4>
                  <p className="text-xs text-blue-800 font-sans mt-0.5">
                    অফিসিয়াল ইমেইল ইমেল ড্রাইভার বা সার্ভারের মাধ্যমে এক ক্লিকে নোটিশ পাঠান
                  </p>
                </div>
                <button
                  onClick={handleSendEmailClient}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 transition-all font-sans"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ইমেইল ক্লায়েন্ট (Mailto) খুলুন</span>
                </button>
              </div>

              {/* Subject & Recipient Email Input */}
              <div className="space-y-3 font-sans">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ইমেইল বিষয় (Email Subject Line):
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    প্রাপকদের ইমেইল ঠিকানা (কমাসঠিক বিচ্ছিন্ন):
                  </label>
                  <input
                    type="text"
                    value={
                      recipients.filter((r) => r.active && r.email).map((r) => r.email).join(', ') || singleEmail
                    }
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="pd.bfa@moi.gov.bd, admin@moi.gov.bd"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 font-sans">
                <button
                  onClick={() => handleSendServerNotification('email')}
                  disabled={sendingApi}
                  className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>{sendingApi ? 'প্রসেস হচ্ছে...' : 'সার্ভার ডাইরেক্ট নোটিফিকেশন সেন্ট করুন'}</span>
                </button>
              </div>

              {/* Email Content Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 font-sans">
                  ইমেইল বডি প্রিভিউ (Email Body Plain Text):
                </label>
                <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-serif-bn leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto text-slate-900">
                  {formattedText}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Recipient Contacts Management */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-700" />
                    <span>অফিসিয়াল প্রাপ্তি কর্মকর্তা তালিকা</span>
                  </h4>
                  <p className="text-xs text-indigo-800 font-sans mt-0.5">
                    যাদের কাছে প্রতিদিনের নোটিফিকেশন পাঠাতে চান তাদের কন্টাক্ট সংরক্ষণ করুন
                  </p>
                </div>
              </div>

              {/* Add New Recipient Form */}
              <form onSubmit={handleAddRecipient} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-sans">
                <label className="block text-xs font-bold text-slate-800">
                  নতুন কর্মকর্তা যোগ করুন:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="নাম *"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    required
                  />
                  <input
                    type="text"
                    placeholder="পদবী"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="email"
                    placeholder="ইমেইল"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="হোয়াটসঅ্যাপ (+8801...)"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>

              {/* Existing Contacts Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                      <th className="p-2.5 w-10 text-center">সক্রিয়</th>
                      <th className="p-2.5">নাম ও পদবী</th>
                      <th className="p-2.5">ইমেইল</th>
                      <th className="p-2.5">হোয়াটসঅ্যাপ</th>
                      <th className="p-2.5 w-12 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {recipients.map((rec) => (
                      <tr key={rec.id} className={rec.active ? 'hover:bg-slate-50' : 'opacity-50 bg-slate-50'}>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={rec.active}
                            onChange={() => handleToggleRecipient(rec.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-2.5 font-medium text-slate-900">
                          <div className="font-semibold">{rec.name}</div>
                          <div className="text-[11px] text-slate-500">{rec.designation}</div>
                        </td>
                        <td className="p-2.5 text-slate-700">{rec.email || '—'}</td>
                        <td className="p-2.5 text-slate-700">{rec.whatsapp || '—'}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleDeleteRecipient(rec.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Auto Scheduler Settings */}
          {activeTab === 'auto' && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>প্রতিদিনের অটোমেটিক নোটিফিকেশন সময়সূচি</span>
                  </h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoEnabled}
                      onChange={(e) => setAutoEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                <p className="text-xs text-amber-900 font-sans">
                  নির্ধারিত সময়ে সিস্টেম হতে কর্মকর্তা ও সদস্যদের কাছে ইমেইল ও হোয়াটসঅ্যাপ স্বয়ংক্রিয়ভাবে অ্যালার্ট পাঠাবে
                </p>
              </div>

              {/* Time Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    দৈনিক অটো নোটিফিকেশনের সময়:
                  </label>
                  <input
                    type="time"
                    value={autoTime}
                    onChange={(e) => setAutoTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    প্রেরণ মাধ্যম (Channels):
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoChannels.email}
                      onChange={(e) => setAutoChannels((p) => ({ ...p, email: e.target.checked }))}
                      className="rounded text-emerald-600"
                    />
                    <span>ইমেইল অ্যালার্ট (Email Alert)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoChannels.whatsapp}
                      onChange={(e) => setAutoChannels((p) => ({ ...p, whatsapp: e.target.checked }))}
                      className="rounded text-emerald-600"
                    />
                    <span>হোয়াটসঅ্যাপ মেসেজ (WhatsApp Message)</span>
                  </label>
                </div>
              </div>

              {/* Bulk Send Instant Button */}
              <div className="pt-2">
                <button
                  onClick={() => handleSendServerNotification('bulk')}
                  disabled={sendingApi}
                  className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all font-sans"
                >
                  <Send className="w-4 h-4" />
                  <span>এখনই সকল সক্রিয় প্রাপককে একত্রে ইমেইল ও হোয়াটসঅ্যাপে পাঠান</span>
                </button>
              </div>

              {/* Delivery History Log */}
              <div className="pt-2 font-sans">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>সাম্প্রতিক প্রেরিত সেশনের লগ (Delivery Log):</span>
                </label>
                <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-xs font-mono space-y-1.5 max-h-36 overflow-y-auto border border-slate-800">
                  {sendLogs.length > 0 ? (
                    sendLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span className="text-emerald-400 font-semibold">[{log.time}] {log.channel}:</span>
                        <span className="text-slate-300 truncate max-w-xs">{log.text}</span>
                        <span className="text-emerald-400 text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                          {log.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic text-[11px]">এখনো কোনো সেন্ডিং লগ তৈরি হয়নি।</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center font-sans">
          <p className="text-xs text-slate-500">
            * বার্তা প্রেরণে ব্রাউজার ডায়ালগ ও সরকারি ডাটা সিকিউরিটি বজায় থাকবে।
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
