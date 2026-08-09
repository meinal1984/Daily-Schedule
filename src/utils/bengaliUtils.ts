import { ScheduleItem } from '../types';

// Bengali numeral conversion maps
const englishToBengaliDigits: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯'
};

const bengaliToEnglishDigits: { [key: string]: string } = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9'
};

export const BENGALI_DAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

const bengaliMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

/**
 * Converts English digits in a string to Bengali digits
 */
export function toBengaliNumerals(str: string | number): string {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[0-9]/g, (digit) => englishToBengaliDigits[digit] || digit);
}

/**
 * Converts Bengali digits in a string to English digits
 */
export function toEnglishNumerals(str: string): string {
  if (!str) return '';
  return str.replace(/[০-৯]/g, (digit) => bengaliToEnglishDigits[digit] || digit);
}

/**
 * Returns Bengali day of week from Date object or ISO string
 */
export function getBengaliDayOfWeek(dateInput: Date | string): string {
  if (!dateInput) return '';
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) return '';
  const dayIndex = dateObj.getDay();
  return BENGALI_DAYS[dayIndex] || '';
}

/**
 * Formats YYYY-MM-DD into "DD.MM.YYYY বার" format (e.g. "১৮.০৬.২০২৫ বুধবার")
 */
export function formatBengaliDateAndDay(isoDateStr: string): string {
  if (!isoDateStr) return '';
  try {
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];

      const bnDay = toBengaliNumerals(day.padStart(2, '0'));
      const bnMonth = toBengaliNumerals(month.padStart(2, '0'));
      const bnYear = toBengaliNumerals(year);

      const dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
      const dayOfWeek = getBengaliDayOfWeek(dateObj);

      return `${bnDay}.${bnMonth}.${bnYear}${dayOfWeek ? ' ' + dayOfWeek : ''}`;
    }
  } catch (err) {
    console.error('Error formatting date and day:', err);
  }
  return isoDateStr;
}

/**
 * Converts 24-hour time HH:mm (e.g. "16:30", "10:00") into Bengali time representation (e.g. "বিকাল ৪:৩০ টা")
 */
export function formatBengaliTime(time24Str: string): string {
  if (!time24Str) return '';
  try {
    const [hStr, mStr] = time24Str.split(':');
    const hour = parseInt(hStr, 10);
    const minute = parseInt(mStr, 10);

    if (isNaN(hour) || isNaN(minute)) return time24Str;

    let period = '';
    if (hour >= 4 && hour < 6) period = 'ভোর';
    else if (hour >= 6 && hour < 12) period = 'সকাল';
    else if (hour >= 12 && hour < 15) period = 'দুপুর';
    else if (hour >= 15 && hour < 18) period = 'বিকাল';
    else if (hour >= 18 && hour < 20) period = 'সন্ধ্যা';
    else period = 'রাত';

    let hr12 = hour % 12;
    if (hr12 === 0) hr12 = 12;

    const bnHour = toBengaliNumerals(hr12);
    const bnMinute = toBengaliNumerals(String(minute).padStart(2, '0'));

    return `${period} ${bnHour}:${bnMinute} টা`;
  } catch (err) {
    console.error('Error formatting Bengali time:', err);
  }
  return time24Str;
}

/**
 * Formats YYYY-MM-DD into a full Bengali date string (e.g. "১ আগস্ট ২০২৬")
 */
export function formatBengaliDate(isoDateStr: string): string {
  if (!isoDateStr) return '';
  try {
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      
      const bnDay = toBengaliNumerals(parseInt(day, 10));
      const bnMonth = bengaliMonths[monthIdx] || '';
      const bnYear = toBengaliNumerals(year);
      
      return `${bnDay} ${bnMonth} ${bnYear}`;
    }
  } catch (err) {
    console.error('Error formatting Bengali date:', err);
  }
  return isoDateStr;
}

/**
 * Returns current month and year in Bengali format (e.g. "আগস্ট ২০২৬ খ্রি.")
 */
export function getCurrentBengaliMonthYear(dateInput?: Date | string): string {
  try {
    const d = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const monthIdx = validDate.getMonth(); // 0-11
    const yearStr = toBengaliNumerals(validDate.getFullYear());
    const bnMonth = bengaliMonths[monthIdx] || '';
    return `${bnMonth} ${yearStr} খ্রি.`;
  } catch (e) {
    return 'আগস্ট ২০২৬ খ্রি.';
  }
}

/**
 * Formats a schedule document into clean plain text formatted for WhatsApp, Email, or SMS sharing.
 */
export function generateShareableText(doc: any): string {
  if (!doc) return '';

  const { letterhead, items } = doc;
  let text = `🏛️ *${letterhead?.govtTitle || 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার'}*\n`;
  text += `📍 *${letterhead?.officeName || 'কার্যালয়'}*\n`;
  
  if (letterhead?.showRefSection !== false) {
    if (letterhead?.memoNo) text += `📜 স্মারক নং: ${letterhead.memoNo}\n`;
    if (letterhead?.issueDate) text += `📅 তারিখ: ${letterhead.issueDate}\n`;
    text += `\n📋 *বিষয়: ${letterhead?.subject || 'দৈনন্দিন কর্মসূচি'}*\n`;
  }
  text += `───────────────────────\n\n`;

  if (items && items.length > 0) {
    items.forEach((item: any, idx: number) => {
      const sl = item.serialNo || toBengaliNumerals(idx + 1);
      text += `*${sl}. ${item.description || 'কর্মসূচি'}*\n`;
      if (item.dateTime) text += `   ⏰ সময়: ${item.dateTime}\n`;
      if (item.venue) text += `   🏛️ স্থান: ${item.venue}\n`;
      if (item.chairperson) text += `   👤 সভাপতি: ${item.chairperson}\n`;
      if (item.remarks) text += `   📝 মন্তব্য: ${item.remarks}\n`;
      text += `\n`;
    });
  } else {
    text += `(কোন কর্মসূচি অন্তর্ভুক্ত করা হয়নি)\n\n`;
  }

  if (letterhead?.signatoryName) {
    text += `───────────────────────\n`;
    text += `✍️ *${letterhead.signatoryName}*\n`;
    if (letterhead.signatoryDesignation) text += `${letterhead.signatoryDesignation}\n`;
    if (letterhead.signatoryPhone) text += `📞 ${letterhead.signatoryPhone}\n`;
  }

  return text;
}

const BENGALI_MONTH_MAP: { [key: string]: number } = {
  'জানুয়ারি': 1, 'january': 1, 'jan': 1,
  'ফেব্রুয়ারি': 2, 'february': 2, 'feb': 2,
  'মার্চ': 3, 'march': 3, 'mar': 3,
  'এপ্রিল': 4, 'april': 4, 'apr': 4,
  'মে': 5, 'may': 5,
  'জুন': 6, 'june': 6, 'jun': 6,
  'জুলাই': 7, 'july': 7, 'jul': 7,
  'আগস্ট': 8, 'august': 8, 'aug': 8,
  'সেপ্টেম্বর': 9, 'september': 9, 'sep': 9,
  'অক্টোবর': 10, 'october': 10, 'oct': 10,
  'নভেম্বর': 11, 'november': 11, 'nov': 11,
  'ডিসেম্বর': 12, 'december': 12, 'dec': 12,
};

/**
 * Extracts comparable ISO YYYY-MM-DD string from a ScheduleItem
 */
export function parseItemDate(item: Partial<ScheduleItem>): string {
  if (item.rawDate && /^\d{4}-\d{2}-\d{2}$/.test(item.rawDate)) {
    return item.rawDate;
  }

  const rawStr = item.dateAndDay || item.dateTime || '';
  const engStr = toEnglishNumerals(rawStr);
  if (!engStr) return '9999-99-99';

  // Format 1: DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY (e.g. 09.06.2025)
  const dmyMatch = engStr.match(/(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format 2: YYYY.MM.DD or YYYY-MM-DD
  const ymdMatch = engStr.match(/(\d{4})[\.\/-](\d{1,2})[\.\/-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format 3: "15 June 2025" or "১৫ জুন ২০২৫" or "১ আগস্ট ২০২৬"
  const wordMonthMatch = rawStr.match(/(\d+|[০-৯]+)\s+([অ-হA-Za-z]+)\s+(\d+|[০-৯]+)/);
  if (wordMonthMatch) {
    const dayStr = toEnglishNumerals(wordMonthMatch[1]).padStart(2, '0');
    const monthName = wordMonthMatch[2].toLowerCase();
    const yearStr = toEnglishNumerals(wordMonthMatch[3]);
    const monthNum = BENGALI_MONTH_MAP[monthName] || BENGALI_MONTH_MAP[wordMonthMatch[2]];
    if (monthNum) {
      return `${yearStr}-${String(monthNum).padStart(2, '0')}-${dayStr}`;
    }
  }

  return '9999-99-99';
}

/**
 * Extracts 24-hr time HH:mm from a ScheduleItem
 */
export function parseItemTime(item: Partial<ScheduleItem>): string {
  if (item.rawTime && /^\d{1,2}:\d{2}$/.test(item.rawTime)) {
    const [h, m] = item.rawTime.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }

  const origStr = item.timeOnly || item.dateTime || '';
  const engStr = toEnglishNumerals(origStr);
  if (!engStr) return '00:00';

  const timeMatch = engStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2];

    const isPm = /pm|পিএম|দুপুর|বিকাল|সন্ধ্যা|রাত/i.test(origStr);
    const isAm = /am|এএম|সকাল|ভোর/i.test(origStr);

    if (isPm) {
      if (hour < 12) hour += 12;
    } else if (isAm) {
      if (hour === 12) hour = 0;
    }

    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  return '00:00';
}

/**
 * Auto-sorts schedule items chronologically by date and time, and updates serial numbers (১, ২, ৩...)
 */
export function sortScheduleItems<T extends ScheduleItem>(items: T[], reindexSerial = true): T[] {
  const sorted = [...items].sort((a, b) => {
    const dateA = parseItemDate(a);
    const dateB = parseItemDate(b);
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    const timeA = parseItemTime(a);
    const timeB = parseItemTime(b);
    return timeA.localeCompare(timeB);
  });

  if (reindexSerial) {
    return sorted.map((item, index) => ({
      ...item,
      serialNo: toBengaliNumerals(index + 1),
    }));
  }

  return sorted;
}

