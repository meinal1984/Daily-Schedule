import React, { useState, useEffect, useRef } from 'react';
import { ScheduleDocument, ScheduleItem, LetterheadConfig } from './types';
import { fetchSchedules, saveSchedule, deleteSchedule } from './utils/storage';
import { formatBengaliDate, formatBengaliDateAndDay, toBengaliNumerals, getCurrentBengaliMonthYear, sortScheduleItems } from './utils/bengaliUtils';
import { HeaderNav } from './components/HeaderNav';
import { GovernmentLetterhead } from './components/GovernmentLetterhead';
import { ScheduleTable } from './components/ScheduleTable';
import { ScheduleItemModal } from './components/ScheduleItemModal';
import { LetterheadEditorModal } from './components/LetterheadEditorModal';
import { PrintPDFModal } from './components/PrintPDFModal';
import { ShareModal } from './components/ShareModal';
import { NotificationModal } from './components/NotificationModal';
import { GoogleFormsModal } from './components/GoogleFormsModal';
import { GmailModal } from './components/GmailModal';
import { DriveModal } from './components/DriveModal';
import { ArchiveModal } from './components/ArchiveModal';
import { GeminiIntelligenceModal } from './components/GeminiIntelligenceModal';
import { AutoSaveIndicator } from './components/AutoSaveIndicator';
import { exportScheduleToExcel } from './utils/excelExport';
import { ParsedScheduleResult } from './utils/geminiApi';
import { Plus, Calendar, Trash2, Edit3, Printer, Share2, FileText, CheckCircle, Bell, FileSpreadsheet, Archive, Download, AlertTriangle, X, Sparkles, Wand2, ArrowUpDown } from 'lucide-react';

const NEW_DOC_TITLE_PRESETS = [
  'দৈনন্দিন কর্মসূচি',
  'মহাপরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি',
  'পরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি',
  'প্রকল্প পরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি',
  'সচিব মহোদয়ের দৈনন্দিন কর্মসূচি',
  'সাপ্তাহিক কর্মসূচি',
  'মাসিক কর্মসূচি',
];

export default function App() {
  const [documents, setDocuments] = useState<ScheduleDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Auto-Save status state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'syncing' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<ScheduleItem | null>(null);

  const [isLetterheadModalOpen, setIsLetterheadModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isGoogleFormsModalOpen, setIsGoogleFormsModalOpen] = useState<boolean>(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState<boolean>(false);
  const [geminiInitialTab, setGeminiInitialTab] = useState<'parser' | 'formalizer' | 'briefing' | 'conflicts' | 'chat'>('parser');
  const [notificationToast, setNotificationToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isDeleteDocModalOpen, setIsDeleteDocModalOpen] = useState<boolean>(false);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState<boolean>(false);
  const [newDocTitle, setNewDocTitle] = useState<string>('');
  const [newDocDate, setNewDocDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Format current time into Bengali numerals
  const getFormattedTime = () => {
    const now = new Date();
    const hrs = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const secs = now.getSeconds().toString().padStart(2, '0');
    return toBengaliNumerals(`${hrs}:${mins}:${secs}`);
  };

  // Initial Load from API / Storage
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      let docs = await fetchSchedules();
      if (docs && docs.length > 0) {
        // Sanitize documents to ensure left = bd_crest and right = bfa_logo if custom URLs are duplicated or stale, and sanitize item dates
        const todayISO = new Date().toISOString().split('T')[0];
        docs = docs.map((doc) => {
          let lh = doc.letterhead;
          if (lh) {
            lh = { ...lh };
            if (lh.customLogoUrl && lh.customLogoUrl === lh.customRightLogoUrl) {
              delete lh.customLogoUrl;
            }
            if (!lh.emblemPreset) lh.emblemPreset = 'bd_crest';
            if (!lh.rightLogoPreset) lh.rightLogoPreset = 'bfa_logo';
          }
          const sanitizedItems = (doc.items || []).map((item) => {
            const dateStr = doc.date || todayISO;
            const defaultDateAndDay = formatBengaliDateAndDay(dateStr);
            const isTimeOnly = (str?: string) =>
              str && (str.includes('সকাল') || str.includes('দুপুর') || str.includes('বিকাল') || str.includes('সন্ধ্যা') || str.includes('রাত') || str.includes('টা') || str.includes('মিনিট'));

            let dateAndDay = item.dateAndDay;
            let timeOnly = item.timeOnly;

            if (!dateAndDay || isTimeOnly(dateAndDay)) {
              if (isTimeOnly(item.dateTime) && !timeOnly) {
                timeOnly = item.dateTime;
              }
              dateAndDay = defaultDateAndDay;
            }

            return {
              ...item,
              dateAndDay,
              timeOnly: timeOnly || '',
            };
          });
          return { ...doc, letterhead: lh, items: sanitizedItems };
        });
        setDocuments(docs);
        setActiveDocId(docs[0].id);
      } else {
        // Create initial default document
        const initialDoc = createDefaultDocument();
        setDocuments([initialDoc]);
        setActiveDocId(initialDoc.id);
        await saveSchedule(initialDoc);
      }
      setIsLoading(false);
      setSaveStatus('saved');
      setLastSavedTime(getFormattedTime());
    }
    loadData();
  }, []);

  const activeDoc = documents.find((doc) => doc.id === activeDocId) || documents[0];

  function createDefaultDocument(): ScheduleDocument {
    const todayISO = new Date().toISOString().split('T')[0];
    return {
      id: 'doc-' + Date.now(),
      title: 'দৈনন্দিন কর্মসূচি - ' + formatBengaliDate(todayISO),
      date: todayISO,
      letterhead: {
        govtTitle: 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার',
        projectTitle: "‘দেশী ও বিদেশী উৎস থেকে মুক্তিযুদ্ধের অডিও ভিজ্যুয়াল দলিল সংগ্রহ ও সংরক্ষণ এবং বাংলাদেশ ফিল্ম আর্কাইভের সক্ষমতা বৃদ্ধি’ শীর্ষক প্রকল্প",
        officeName: 'বাংলাদেশ ফিল্ম আর্কাইভ, তথ্য ও সম্প্রচার মন্ত্রণালয়',
        address: 'এফ-০৫, আগারগাঁও প্রশাসনিক এলাকা, ঢাকা',
        phone: '৫৮১৫৭৯৮৮',
        email: 'bfalwfproject@bfa.gov.bd',
        website: 'www.bfa.gov.bd',
        docHeading: 'প্রকল্প পরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি',
        docSubheading: getCurrentBengaliMonthYear(),
        signatoryName: 'মো: রফিকুল ইসলাম',
        signatoryDesignation: 'প্রকল্প পরিচালক (উপসচিব)',
        signatoryPhone: '৫৮১৫৭৯৮৮',
        signatoryEmail: 'bfalwfproject@bfa.gov.bd',
        showEmblem: true,
        emblemPreset: 'bd_crest',
        showRightLogo: true,
        rightLogoPreset: 'bfa_logo',
      },
      items: [
        {
          id: 'item-1',
          serialNo: '১',
          dateTime: '০৯.০৬.২০২৫ খ্রি. (সোমবার)',
          dateAndDay: '০৯.০৬.২০২৫ খ্রি. (সোমবার)',
          timeOnly: 'সকাল ১০:০০ ঘটিকা',
          description: 'প্রকল্পের স্টিয়ারিং কমিটির তৃতীয় পর্যালোচনা সভা',
          venue: 'সম্মেলন কক্ষ, বাংলাদেশ ফিল্ম আর্কাইভ',
          chairperson: 'প্রকল্প পরিচালক (উপসচিব)',
          remarks: 'জরুরি উপস্থিতি কাম্য',
        },
        {
          id: 'item-2',
          serialNo: '২',
          dateTime: '১১.০৬.২০২৫ খ্রি. (বুধবার)',
          dateAndDay: '১১.০৬.২০২৫ খ্রি. (বুধবার)',
          timeOnly: 'সকাল ১১:৩০ ঘটিকা',
          description: 'মুক্তিযুদ্ধের অডিও ভিজ্যুয়াল দলিল সংরক্ষণ ও ডিজিটাল ক্যাটালগ পর্যালোচনা বৈঠক',
          venue: 'প্রকল্প পরিচালকের কক্ষ',
          chairperson: 'প্রকল্প পরিচালক মহোদয়',
          remarks: 'সংশ্লিষ্ট গবেষকগণ অংশ নেবেন',
        },
        {
          id: 'item-3',
          serialNo: '৩',
          dateTime: '১৫.০৬.২০২৫ খ্রি. (রবিবার)',
          dateAndDay: '১৫.০৬.২০২৫ খ্রি. (রবিবার)',
          timeOnly: 'দুপুর ০২:৩০ ঘটিকা',
          description: 'আন্তর্জাতিক আর্কাইভ নেটওয়ার্ক এর সাথে কারিগরি সহযোগিতা সমন্বয় সভা',
          venue: 'অনলাইন (জুম প্ল্যাটফর্ম)',
          chairperson: 'প্রকল্প পরিচালক (উপসচিব)',
          remarks: 'প্রতিবেদন উপস্থাপন করা হবে',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Save current active document changes with smooth debounced status tracking
  const updateAndSaveActiveDoc = (updatedDoc: ScheduleDocument, immediate = false) => {
    setIsSaving(true);
    setSaveStatus('syncing');

    setDocuments((prev) =>
      prev.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
    );

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const performSave = async () => {
      try {
        await saveSchedule(updatedDoc);
        setSaveStatus('saved');
        setLastSavedTime(getFormattedTime());
      } catch (err) {
        console.error('Save error:', err);
        setSaveStatus('error');
      } finally {
        setIsSaving(false);
      }
    };

    if (immediate) {
      performSave();
    } else {
      saveTimeoutRef.current = setTimeout(performSave, 350);
    }
  };

  // Add or Edit Schedule Item
  const handleSaveItem = (item: ScheduleItem) => {
    if (!activeDoc) return;

    let newItems = [...activeDoc.items];
    const existingIndex = newItems.findIndex((i) => i.id === item.id);

    if (existingIndex !== -1) {
      newItems[existingIndex] = item;
    } else {
      newItems.push(item);
    }

    const updatedDoc = {
      ...activeDoc,
      items: newItems,
      updatedAt: new Date().toISOString(),
    };

    updateAndSaveActiveDoc(updatedDoc);
  };

  // Delete Schedule Item
  const handleDeleteItem = (itemId: string) => {
    if (!activeDoc) return;

    const newItems = activeDoc.items.filter((i) => i.id !== itemId);
    const updatedDoc = {
      ...activeDoc,
      items: newItems,
      updatedAt: new Date().toISOString(),
    };

    updateAndSaveActiveDoc(updatedDoc);
  };

  // Duplicate Item
  const handleDuplicateItem = (item: ScheduleItem) => {
    if (!activeDoc) return;

    const newItem: ScheduleItem = {
      ...item,
      id: 'item-' + Date.now(),
      serialNo: toBengaliNumerals(activeDoc.items.length + 1),
      description: item.description + ' (কপি)',
    };

    const updatedDoc = {
      ...activeDoc,
      items: [...activeDoc.items, newItem],
      updatedAt: new Date().toISOString(),
    };

    updateAndSaveActiveDoc(updatedDoc);
  };

  // Reorder Items
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (!activeDoc) return;
    const itemsCopy = [...activeDoc.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= itemsCopy.length) return;

    const temp = itemsCopy[index];
    itemsCopy[index] = itemsCopy[targetIndex];
    itemsCopy[targetIndex] = temp;

    // Auto update serial numbers
    itemsCopy.forEach((it, idx) => {
      it.serialNo = toBengaliNumerals(idx + 1);
    });

    const updatedDoc = {
      ...activeDoc,
      items: itemsCopy,
      updatedAt: new Date().toISOString(),
    };

    updateAndSaveActiveDoc(updatedDoc);
  };

  // Open Create New Document Modal
  const handleCreateNewDocument = () => {
    const todayISO = new Date().toISOString().split('T')[0];
    setNewDocTitle('দৈনন্দিন কর্মসূচি - ' + formatBengaliDate(todayISO));
    setNewDocDate(todayISO);
    setIsNewDocModalOpen(true);
  };

  // Perform Create New Document
  const performCreateNewDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const newDoc: ScheduleDocument = {
      ...createDefaultDocument(),
      id: 'doc-' + Date.now(),
      title: newDocTitle.trim(),
      date: newDocDate,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setIsNewDocModalOpen(false);
    await saveSchedule(newDoc);
  };

  // Open Delete Document Confirmation Modal
  const handleDeleteDocument = () => {
    setIsDeleteDocModalOpen(true);
  };

  // Perform Delete Document
  const performDeleteDocument = async () => {
    if (!activeDoc || documents.length <= 1) return;

    const docToDeleteId = activeDoc.id;
    const remainingDocs = documents.filter((d) => d.id !== docToDeleteId);
    setDocuments(remainingDocs);
    setActiveDocId(remainingDocs[0].id);
    setIsDeleteDocModalOpen(false);

    await deleteSchedule(docToDeleteId);
  };

  // Save updated Letterhead config
  const handleSaveLetterhead = (config: LetterheadConfig) => {
    if (!activeDoc) return;
    const updatedDoc = {
      ...activeDoc,
      letterhead: config,
      updatedAt: new Date().toISOString(),
    };
    updateAndSaveActiveDoc(updatedDoc);
  };

  // Toggle item completion status
  const handleToggleComplete = (itemId: string) => {
    if (!activeDoc) return;
    const updatedItems = activeDoc.items.map((it) =>
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );
    updateAndSaveActiveDoc({
      ...activeDoc,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Archive single item
  const handleArchiveItem = (itemId: string) => {
    if (!activeDoc) return;
    const updatedItems = activeDoc.items.map((it) =>
      it.id === itemId
        ? { ...it, archived: true, archivedAt: new Date().toISOString() }
        : it
    );
    updateAndSaveActiveDoc({
      ...activeDoc,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Archive all completed items
  const handleArchiveCompletedItems = () => {
    if (!activeDoc) return;
    const updatedItems = activeDoc.items.map((it) =>
      !it.archived && it.completed
        ? { ...it, archived: true, archivedAt: new Date().toISOString() }
        : it
    );
    updateAndSaveActiveDoc({
      ...activeDoc,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Restore single item from archive
  const handleRestoreItem = (itemId: string) => {
    if (!activeDoc) return;
    const updatedItems = activeDoc.items.map((it) =>
      it.id === itemId ? { ...it, archived: false } : it
    );
    updateAndSaveActiveDoc({
      ...activeDoc,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Restore all archived items
  const handleRestoreAllArchived = () => {
    if (!activeDoc) return;
    const updatedItems = activeDoc.items.map((it) => ({
      ...it,
      archived: false,
    }));
    updateAndSaveActiveDoc({
      ...activeDoc,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Permanently delete single archived item
  const handleDeleteArchivedItem = (itemId: string) => {
    if (!activeDoc) return;
    const updatedItems = activeDoc.items.filter((it) => it.id !== itemId);
    updateAndSaveActiveDoc({
      ...activeDoc,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Permanently clear entire archive
  const handleClearArchive = () => {
    if (!activeDoc) return;
    const updatedItems = activeDoc.items.filter((it) => !it.archived);
    updateAndSaveActiveDoc({
      ...activeDoc,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Open Gemini AI Intelligence Modal
  const handleOpenGeminiModal = (tab: 'parser' | 'formalizer' | 'briefing' | 'conflicts' | 'chat' = 'parser') => {
    setGeminiInitialTab(tab);
    setIsGeminiModalOpen(true);
  };

  // Apply parsed schedule items from Gemini
  const handleApplyParsedSchedule = (parsedData: ParsedScheduleResult, mode: 'append' | 'replace') => {
    if (!activeDoc) return;
    const todayISO = activeDoc.date || new Date().toISOString().split('T')[0];
    const defaultDateAndDay = formatBengaliDateAndDay(todayISO);

    const convertedItems: ScheduleItem[] = (parsedData.items || []).map((item, idx) => ({
      id: 'item-' + Date.now() + '-' + idx,
      serialNo: toBengaliNumerals(mode === 'append' ? activeDoc.items.length + idx + 1 : idx + 1),
      dateAndDay: item.dateAndDay || defaultDateAndDay,
      timeOnly: item.timeOnly || 'নির্ধারিত নয়',
      venue: item.venue || 'সভাকক্ষ',
      description: item.description || 'কর্মসূচি',
      chairperson: item.chairperson || 'নির্ধারিত কর্মকর্তা',
      remarks: item.remarks || '',
      priority: item.priority || 'medium',
      completed: false,
      archived: false,
    }));

    const finalItems = mode === 'replace' ? convertedItems : [...activeDoc.items, ...convertedItems];

    const updatedDoc: ScheduleDocument = {
      ...activeDoc,
      title: parsedData.title || activeDoc.title,
      items: finalItems,
      letterhead: {
        ...activeDoc.letterhead,
        subject: parsedData.subject || activeDoc.letterhead?.subject,
        docHeading: parsedData.docHeading || activeDoc.letterhead?.docHeading,
        officeName: parsedData.officeName || activeDoc.letterhead?.officeName,
        branchName: parsedData.branchName || activeDoc.letterhead?.branchName,
      },
      updatedAt: new Date().toISOString(),
    };

    updateAndSaveActiveDoc(updatedDoc);
    setNotificationToast({
      message: `Gemini AI দিয়ে ${toBengaliNumerals(convertedItems.length)}টি কর্মসূচি সফলভাবে রূপান্তর ও সংরক্ষণ হয়েছে!`,
      type: 'success',
    });
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Apply formalized items from Gemini
  const handleApplyFormalizedSchedule = (formalizedItems: ScheduleItem[]) => {
    if (!activeDoc) return;
    const updatedDoc: ScheduleDocument = {
      ...activeDoc,
      items: formalizedItems,
      updatedAt: new Date().toISOString(),
    };
    updateAndSaveActiveDoc(updatedDoc);
    setNotificationToast({
      message: 'সকল কর্মসূচি সরকারি প্রমিত ভাষায় সফলভাবে সংরক্ষিত হয়েছে!',
      type: 'success',
    });
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Apply chronologically sorted items from Gemini
  const handleApplySortedSchedule = (sortedItems: ScheduleItem[]) => {
    if (!activeDoc) return;
    const updatedDoc: ScheduleDocument = {
      ...activeDoc,
      items: sortedItems,
      updatedAt: new Date().toISOString(),
    };
    updateAndSaveActiveDoc(updatedDoc);
    setNotificationToast({
      message: 'সময় ও তারিখ অনুযায়ী কর্মসূচি সফলভাবে পুনঃসাজানো হয়েছে!',
      type: 'success',
    });
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // One-click Auto Sort
  const handleAutoSortSchedule = () => {
    if (!activeDoc || !activeDoc.items || activeDoc.items.length === 0) return;
    const sorted = sortScheduleItems(activeDoc.items);
    updateAndSaveActiveDoc({
      ...activeDoc,
      items: sorted,
      updatedAt: new Date().toISOString(),
    });
    setNotificationToast({
      message: `সময় অনুযায়ী ${toBengaliNumerals(sorted.length)}টি কর্মসূচি ক্রম অনুযায়ী সাজানো হয়েছে।`,
      type: 'success',
    });
    setTimeout(() => setNotificationToast(null), 3000);
  };

  // Active vs Archived item lists
  const activeItems = activeDoc?.items ? activeDoc.items.filter((i) => !i.archived) : [];
  const archivedItems = activeDoc?.items ? activeDoc.items.filter((i) => i.archived === true) : [];

  // Filter active items by search query
  const filteredActiveItems = activeItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      (item.description || '').toLowerCase().includes(query) ||
      (item.venue || '').toLowerCase().includes(query) ||
      (item.chairperson || '').toLowerCase().includes(query) ||
      (item.dateTime || '').toLowerCase().includes(query) ||
      (item.remarks || '').toLowerCase().includes(query)
    );
  });

  // Active Doc prepared for export/print/share modals (contains only active items)
  const displayDoc: ScheduleDocument = {
    ...activeDoc,
    items: activeItems,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-800 font-medium font-serif-bn text-base">
            দৈনন্দিন কর্মসূচি ডাটাবেস লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  const printConfig = activeDoc?.letterhead;
  const topMargin = printConfig?.printMargins?.top ?? 10;
  const bottomMargin = printConfig?.printMargins?.bottom ?? 10;
  const leftMargin = printConfig?.printMargins?.left ?? 12;
  const rightMargin = printConfig?.printMargins?.right ?? 12;
  const pageSize = printConfig?.pageSize || 'A4';
  const pageOrientation = printConfig?.pageOrientation || 'portrait';

  const getMaxWidth = () => {
    if (pageOrientation === 'landscape') return '297mm';
    if (pageSize === 'Legal') return '216mm';
    if (pageSize === 'Letter') return '216mm';
    return '210mm';
  };

  const printableStyle: React.CSSProperties = {
    paddingTop: `${topMargin}mm`,
    paddingBottom: `${bottomMargin}mm`,
    paddingLeft: `${leftMargin}mm`,
    paddingRight: `${rightMargin}mm`,
    maxWidth: getMaxWidth(),
    margin: '0 auto',
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <HeaderNav
        documents={documents}
        activeDocId={activeDocId}
        onSelectDocument={(id) => setActiveDocId(id)}
        onNewDocument={handleCreateNewDocument}
        onOpenLetterheadEditor={() => setIsLetterheadModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenGoogleFormsModal={() => setIsGoogleFormsModalOpen(true)}
        onOpenGmailModal={() => setIsGmailModalOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
        onOpenGeminiModal={() => handleOpenGeminiModal('parser')}
        onExportExcel={() => exportScheduleToExcel(displayDoc)}
        archivedCount={archivedItems.length}
        isSaving={isSaving}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
      />

      {/* Floating Notification Toast */}
      {notificationToast && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 text-xs font-semibold ${
              notificationToast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : notificationToast.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationToast.message}</span>
            <button
              onClick={() => setNotificationToast(null)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Document Title Bar & Quick Actions */}
        <div className="no-print bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Calendar className="w-5 h-5 text-emerald-700 shrink-0" />
                <input
                  type="text"
                  value={activeDoc?.title || ''}
                  onChange={(e) => {
                    const updated = { ...activeDoc, title: e.target.value };
                    updateAndSaveActiveDoc(updated);
                  }}
                  className="font-serif-bn font-bold text-lg sm:text-xl text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-700 focus:outline-hidden px-1 min-w-[300px] sm:min-w-[420px] md:min-w-[520px]"
                  placeholder="সূচির শিরোনাম লিখুন"
                />
              </div>

              {/* Title Bar Auto-Save Indicator */}
              <AutoSaveIndicator status={saveStatus} lastSavedTime={lastSavedTime} compact />
            </div>
            <p className="text-xs text-slate-500 font-medium pl-7">
              সর্বশেষ আপডেট: {new Date(activeDoc?.updatedAt || Date.now()).toLocaleTimeString('bn-BD')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Gemini AI Suite Trigger Button */}
            <button
              onClick={() => handleOpenGeminiModal('parser')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm border border-emerald-600/60 transition-all active:scale-98 cursor-pointer ring-1 ring-emerald-400/20"
              title="Gemini AI: অসংগঠিত টেক্সট পার্স, সরকারি প্রমিতকরণ, কার্যবিবরণী ও নোটিশ জেনারেটর"
            >
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>Gemini AI সহকারী</span>
              <span className="px-1.5 py-0.2 bg-emerald-400 text-slate-950 font-sans text-[9px] font-black rounded-full uppercase tracking-tighter">
                AI
              </span>
            </button>

            {/* Quick Auto-Sort Button */}
            <button
              onClick={handleAutoSortSchedule}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs sm:text-sm rounded-lg shadow-2xs transition-all active:scale-98 cursor-pointer"
              title="তারিখ ও সময় অনুযায়ী স্বয়ংক্রিয়ভাবে সাজান"
            >
              <ArrowUpDown className="w-4 h-4 text-emerald-700" />
              <span>স্মার্ট রিঅর্ডার</span>
            </button>

            {/* Search Input */}
            <input
              type="text"
              placeholder="কর্মসূচি খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />

            {/* Quick Archive Drawer Button */}
            <button
              onClick={() => setIsArchiveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-amber-300 border border-slate-700 font-medium text-xs sm:text-sm rounded-lg shadow-2xs transition-all active:scale-98 cursor-pointer"
              title="আর্কাইভকৃত সূচিসমূহ দেখুন"
            >
              <Archive className="w-4 h-4 text-amber-400" />
              <span>আর্কাইভ</span>
              {archivedItems.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-mono text-[10px] font-bold rounded-full">
                  {toBengaliNumerals(archivedItems.length.toString())}
                </span>
              )}
            </button>

            {/* Excel (.xlsx) Export Button */}
            <button
              onClick={() => exportScheduleToExcel(displayDoc)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-emerald-100 border border-emerald-700 font-semibold text-xs sm:text-sm rounded-lg shadow-2xs transition-all active:scale-98 cursor-pointer"
              title="বর্তমান সূচি এক্সেল (.xlsx) স্প্রেডশিট ফাইলে ডাউনলোড করুন"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>এক্সেল (.xlsx)</span>
            </button>

            {/* Notification Button */}
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-900 text-emerald-200 hover:bg-emerald-800 border border-emerald-700 font-medium text-xs sm:text-sm rounded-lg shadow-2xs transition-all active:scale-98 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>অটো নোটিফিকেশন</span>
            </button>

            <button
              onClick={() => {
                setItemToEdit(null);
                setIsItemModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs sm:text-sm rounded-lg shadow-2xs transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>কর্মসূচি যোগ</span>
            </button>

            {/* Delete Document Option */}
            <button
              onClick={handleDeleteDocument}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
              title="এই কর্মসূচি ফাইলটি মুছে ফেলুন"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Combined Printable Document Container (Letterhead + Schedule Table + Signatory) */}
        <div
          className={!isPrintModalOpen ? "printable-area space-y-6" : "space-y-6"}
          style={!isPrintModalOpen ? printableStyle : undefined}
        >
          {/* 1. Official Government Letterhead Display */}
          <GovernmentLetterhead
            config={activeDoc?.letterhead}
            onEditClick={() => setIsLetterheadModalOpen(true)}
            isEditable={true}
          />

          {/* 2. Schedule Data Table */}
          <ScheduleTable
            items={filteredActiveItems}
            onAddItem={() => {
              setItemToEdit(null);
              setIsItemModalOpen(true);
            }}
            onEditItem={(item) => {
              setItemToEdit(item);
              setIsItemModalOpen(true);
            }}
            onUpdateItem={(updatedItem) => handleSaveItem(updatedItem)}
            onDeleteItem={handleDeleteItem}
            onDuplicateItem={handleDuplicateItem}
            onMoveItem={handleMoveItem}
            onToggleComplete={handleToggleComplete}
            onArchiveItem={handleArchiveItem}
            onArchiveCompletedItems={handleArchiveCompletedItems}
            onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
            onAutoSort={handleAutoSortSchedule}
            onOpenGeminiModal={handleOpenGeminiModal}
            archivedCount={archivedItems.length}
            saveStatus={saveStatus}
            lastSavedTime={lastSavedTime}
          />

          {/* 3. Official Signatory & Custom Footer Section */}
          {activeDoc?.letterhead?.showSignatory !== false && (activeDoc?.letterhead?.signatoryName || activeDoc?.letterhead?.customFooterText) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex justify-between items-center gap-4 font-serif-bn">
              <div className="text-xs text-slate-600 font-medium whitespace-pre-line max-w-md text-left">
                {activeDoc?.letterhead?.customFooterText}
              </div>

              {activeDoc?.letterhead?.signatoryName && (
                <div className="flex flex-col items-center text-center space-y-0.5 min-w-[200px]">
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1 w-44"></div>
                  <div className="font-bold text-sm text-slate-900">
                    ({activeDoc.letterhead.signatoryName})
                  </div>
                  {activeDoc.letterhead.signatoryDesignation && (
                    <div className="text-xs font-semibold text-slate-700">
                      {activeDoc.letterhead.signatoryDesignation}
                    </div>
                  )}
                  {activeDoc.letterhead.signatoryPhone && (
                    <div className="text-xs text-slate-600">ফোন: {activeDoc.letterhead.signatoryPhone}</div>
                  )}
                  {activeDoc.letterhead.signatoryEmail && (
                    <div className="text-xs text-slate-600">ইমেইল: {activeDoc.letterhead.signatoryEmail}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 font-serif-bn mt-8">
        গণপ্রজাতন্ত্রী বাংলাদেশ সরকার | দৈনন্দিন কর্মসূচি ও সভার সময়সূচি ব্যবস্থাপনা সিস্টেম
      </footer>

      {/* Modals */}
      <ScheduleItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
        suggestedSerialNo={activeDoc?.items ? activeDoc.items.length + 1 : 1}
      />

      <LetterheadEditorModal
        isOpen={isLetterheadModalOpen}
        onClose={() => setIsLetterheadModalOpen(false)}
        onSave={handleSaveLetterhead}
        initialConfig={activeDoc?.letterhead}
      />

      <PrintPDFModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        document={displayDoc}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={displayDoc}
        onSaveLetterhead={handleSaveLetterhead}
        onOpenGmailModal={() => setIsGmailModalOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        document={displayDoc}
      />

      <GoogleFormsModal
        isOpen={isGoogleFormsModalOpen}
        onClose={() => setIsGoogleFormsModalOpen(false)}
        document={displayDoc}
      />

      <GmailModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        document={displayDoc}
      />

      <DriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        document={displayDoc}
        onImportDocument={(importedDoc) => {
          updateAndSaveActiveDoc(importedDoc);
        }}
      />

      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        archivedItems={archivedItems}
        onRestoreItem={handleRestoreItem}
        onRestoreAll={handleRestoreAllArchived}
        onDeleteArchivedItem={handleDeleteArchivedItem}
        onClearArchive={handleClearArchive}
      />

      <GeminiIntelligenceModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        activeDoc={displayDoc}
        onApplyParsedSchedule={handleApplyParsedSchedule}
        onApplyFormalizedSchedule={handleApplyFormalizedSchedule}
        onApplySortedSchedule={handleApplySortedSchedule}
        initialTab={geminiInitialTab}
      />

      {/* Delete Document Confirmation Modal */}
      {isDeleteDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold font-serif-bn">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span>কর্মসূচি ফাইল মুছুন</span>
              </div>
              <button
                onClick={() => setIsDeleteDocModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {documents.length <= 1 ? (
                <div className="space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 font-serif-bn text-base">
                    ফাইল মুছে ফেলা সম্ভব নয়
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    সিস্টেমে সর্বনিম্ন একটি কর্মসূচি ফাইল থাকা আবশ্যক। আপনি বর্তমান ফাইলের কর্মসূচিগুলো সম্পাদন বা নতুন ফাইল তৈরি করতে পারেন।
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsDeleteDocModalOpen(false)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer font-serif-bn"
                    >
                      ঠিক আছে
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 font-serif-bn">
                  <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg border border-rose-200">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-950 font-serif-bn space-y-1">
                      <p className="font-bold text-sm">
                        আপনি কি নিশ্চিত যে এই সূচি ফাইলটি সম্পূর্ণরূপে মুছে ফেলতে চান?
                      </p>
                      <p className="text-slate-600 font-sans text-[11px] pt-1">
                        ফাইল: <strong className="text-rose-900 font-serif-bn text-xs">{activeDoc?.title}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 font-serif-bn">
                    <button
                      type="button"
                      onClick={() => setIsDeleteDocModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      onClick={performDeleteDocument}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>হ্যাঁ, ফাইলটি মুছুন</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create New Document Modal */}
      {isNewDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold font-serif-bn text-emerald-400">
                <Plus className="w-5 h-5" />
                <span>নতুন কর্মসূচি সূচি তৈরি করুন</span>
              </div>
              <button
                onClick={() => setIsNewDocModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={performCreateNewDocument} className="p-5 space-y-4 font-serif-bn">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 font-sans">
                  সূচির নাম / শিরোনাম *
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  placeholder="যেমন: দৈনন্দিন কর্মসূচি - ৩ আগস্ট ২০২৬"
                  required
                />
                <div className="pt-0.5">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1 font-sans">
                    প্রিসেট শিরোনাম:
                  </span>
                  <div className="flex flex-wrap gap-1 font-serif-bn">
                    {NEW_DOC_TITLE_PRESETS.map((pTitle) => (
                      <button
                        key={pTitle}
                        type="button"
                        onClick={() => {
                          const dateSuffix = newDocDate ? ' - ' + formatBengaliDate(newDocDate) : '';
                          setNewDocTitle(pTitle + dateSuffix);
                        }}
                        className={`px-2 py-0.5 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                          newDocTitle.startsWith(pTitle)
                            ? 'bg-emerald-700 text-white border-emerald-800 font-semibold'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {pTitle}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                  তারিখ (Date)
                </label>
                <input
                  type="date"
                  value={newDocDate}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setNewDocDate(selected);
                    if (selected) {
                      setNewDocTitle('দৈনন্দিন কর্মসূচি - ' + formatBengaliDate(selected));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewDocModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>তৈরি করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
