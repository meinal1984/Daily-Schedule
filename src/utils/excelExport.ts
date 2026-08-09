import * as XLSX from 'xlsx';
import { ScheduleDocument, LetterheadConfig } from '../types';
import { formatBengaliDate } from './bengaliUtils';

/**
 * Export a ScheduleDocument to a styled Excel (.xlsx) spreadsheet
 */
export function exportScheduleToExcel(scheduleDoc: ScheduleDocument): void {
  if (!scheduleDoc || !scheduleDoc.items || scheduleDoc.items.length === 0) {
    alert('রপ্তানি করার মতো কোনো কর্মসূচি পাওয়া যায়নি।');
    return;
  }

  const lh = scheduleDoc.letterhead || ({} as Partial<LetterheadConfig>);

  // Build header rows with document metadata and letterhead info
  const sheetData: (string | number)[][] = [
    [lh.govtTitle || 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার'],
    [lh.officeName || 'জেলা প্রশাসকের কার্যালয়'],
    [lh.branchName ? `${lh.branchName} শাখা` : ''],
    [lh.docHeading || scheduleDoc.title || 'দৈনন্দিন কর্মসূচি'],
    [],
    [`স্মারক নম্বর: ${lh.memoNo || '—'}`, '', '', `তারিখ: ${lh.issueDate || formatBengaliDate(scheduleDoc.date) || '—'}`],
    [`বিষয়: ${lh.subject || scheduleDoc.title || 'দৈনন্দিন কর্মসূচি'}`],
    [],
    ['ক্রমিক নং', 'তারিখ ও বার', 'সময়', 'সভার স্থান', 'সভার বিষয়', 'সভাপতি', 'মন্তব্য']
  ];

  // Active or non-archived items to export
  const activeItems = scheduleDoc.items.filter(item => !item.archived);

  activeItems.forEach((item, index) => {
    sheetData.push([
      item.serialNo || (index + 1).toString(),
      item.dateAndDay || item.dateTime || '',
      item.timeOnly || '',
      item.venue || '',
      item.description || '',
      item.chairperson || '',
      item.remarks || ''
    ]);
  });

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 12 }, // ক্রমিক নং
    { wch: 22 }, // তারিখ ও বার
    { wch: 16 }, // সময়
    { wch: 28 }, // সভার স্থান
    { wch: 48 }, // সভার বিষয়
    { wch: 28 }, // সভাপতি
    { wch: 22 }, // মন্তব্য
  ];

  // Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'দৈনন্দিন কর্মসূচি');

  // Generate filename and prompt download
  const dateStr = scheduleDoc.date || new Date().toISOString().split('T')[0];
  const fileName = `schedule_${dateStr}_${Date.now()}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
