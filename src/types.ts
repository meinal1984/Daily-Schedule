export type PriorityLevel = 'high' | 'medium' | 'low';

export interface ScheduleItem {
  id: string;
  serialNo?: string;      // ক্রমিক নং (ঐচ্ছিক)
  dateAndDay: string;     // তারিখ ও বার (e.g. "১৮.০৬.২০২৫ বুধবার")
  timeOnly: string;       // সময় (e.g. "বিকাল ৪:৩০ টা")
  rawDate?: string;       // ISO date YYYY-MM-DD for precise sorting/filtering
  rawTime?: string;       // 24h time HH:mm for chronological sorting
  dateTime?: string;      // Combined/fallback
  venue: string;          // সভার স্থান (e.g. "সভাকক্ষ, তথ্য ও সম্প্রচার মন্ত্রণালয়")
  description: string;    // সভার বিষয় / বিবরণ (e.g. "প্রকল্প স্টিয়ারিং কমিটির সভা")
  chairperson: string;    // সভাপতি (e.g. "সচিব")
  remarks: string;        // মন্তব্য
  priority?: PriorityLevel; // গুরুত্ব / অগ্রাধিকার (high | medium | low)
  completed?: boolean;
  archived?: boolean;     // আর্কাইভ স্ট্যাটাস
  archivedAt?: string;    // আর্কাইভে প্রেরণের সময়কাল
}

export interface PrintMargins {
  top: number;    // mm
  bottom: number; // mm
  left: number;   // mm
  right: number;  // mm
}

export type PageSize = 'A4' | 'Legal' | 'Letter';
export type PageOrientation = 'portrait' | 'landscape';

export interface LetterheadConfig {
  govtTitle?: string;             // e.g. "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার"
  projectTitle?: string;          // e.g. "'দেশী ও বিদেশী উৎস থেকে মুক্তিযুদ্ধের অডিও ভিজ্যুয়াল দলিল সংগ্রহ ও সংরক্ষণ এবং বাংলাদেশ ফিল্ম আর্কাইভের সক্ষমতা বৃদ্ধি' শীর্ষক প্রকল্প"
  officeName: string;             // e.g. "বাংলাদেশ ফিল্ম আর্কাইভ, তথ্য ও সম্প্রচার মন্ত্রণালয়"
  address?: string;               // e.g. "এফ-০৫, আগারগাঁও প্রশাসনিক এলাকা, ঢাকা"
  phone?: string;                 // e.g. "৫৮১৫৭৯৮৮"
  email?: string;                 // e.g. "bfalwfproject@bfa.gov.bd"
  website?: string;               // e.g. "www.bfa.gov.bd"
  branchName?: string;            // e.g. "সাধারণ শাখা"
  memoNo?: string;                // e.g. "০৫.৪১.২৬০০.০১১.২৪.০০২.২৬.১৫০"
  issueDate?: string;             // e.g. "১৬ শ্রাবণ ১৪ ৩৩ / ১ আগস্ট ২০২৬"
  subject?: string;               // e.g. "দৈনন্দিন কর্মসূচি"
  showRefSection?: boolean;       // স্মারক নম্বর, তারিখ ও বিষয় সেকশন প্রদর্শন অপশন
  docHeading: string;             // e.g. "প্রকল্প পরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি"
  docSubheading: string;          // e.g. "জুন ২০২৫ খ্রি."
  signatoryName?: string;         // e.g. "মো: রফিকুল ইসলাম"
  signatoryDesignation?: string;  // e.g. "প্রকল্প পরিচালক / উপসচিব"
  signatoryPhone?: string;        // e.g. "০২-৯৫৫১২২১"
  signatoryEmail?: string;        // e.g. "dc.dhaka@mopa.gov.bd"
  customFooterText?: string;      // e.g. "বিশেষ দ্রষ্টব্য / অনুলিপি সদয় অবগতির জন্য:"
  showSignatory?: boolean;
  showEmblem?: boolean;
  emblemPreset?: 'bd_crest' | 'golden_seal' | 'green_seal' | 'none';
  showRightLogo?: boolean;
  rightLogoPreset?: 'bfa_logo' | 'dc_seal' | 'govt_crest' | 'none';
  customLogoUrl?: string;
  customRightLogoUrl?: string;
  layoutStyle?: 'official_project_image' | 'classic_letterhead';
  printMargins?: PrintMargins;
  pageSize?: PageSize;
  pageOrientation?: PageOrientation;
}

export interface ScheduleTemplateItem {
  serialNo?: string;
  dateAndDay: string;
  timeOnly: string;
  venue: string;
  description: string;
  chairperson: string;
  remarks: string;
}

export interface ScheduleTemplate {
  id: string;
  title: string;
  category?: string;
  description?: string;
  isBuiltIn?: boolean;
  letterhead?: Partial<LetterheadConfig>;
  items: ScheduleTemplateItem[];
  createdAt?: string;
}

export interface ScheduleDocument {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  letterhead: LetterheadConfig;
  items: ScheduleItem[];
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'table' | 'letterhead' | 'preview' | 'all';
