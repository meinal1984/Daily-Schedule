import { ScheduleDocument, LetterheadConfig } from '../types';
import { toBengaliNumerals } from './bengaliUtils';

/**
 * Generates responsive inline-styled HTML email template for Google Gmail API
 */
export function generateScheduleHtmlEmail(doc: ScheduleDocument, recipientNotes?: string): string {
  const lh: LetterheadConfig = doc.letterhead || ({} as LetterheadConfig);
  const govtName = lh.govtTitle || 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার';
  const officeName = lh.officeName || 'জেলা প্রশাসকের কার্যালয়';
  const branchName = lh.branchName || 'সাধারণ শাখা';
  const website = lh.website || 'www.mopa.gov.bd';
  const memoNo = lh.memoNo || '';
  const issueDate = lh.issueDate || '';
  const subject = lh.subject || doc.title || 'দৈনন্দিন কর্মসূচি ও নির্ধারিত সভার নোটিশ';

  const items = doc.items || [];
  const signatory = {
    name: lh.signatoryName || 'মো: আব্দুল মালেক',
    designation: lh.signatoryDesignation || 'সহকারী কমিশনার (সাধারণ শাখা)',
    officeName: lh.officeName || 'জেলা প্রশাসকের কার্যালয়',
    phone: lh.signatoryPhone || '০১৭০০-০০০০০০',
    email: lh.signatoryEmail || 'acgen@mopa.gov.bd',
  };

  const tableRows = items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #cbd5e1; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 10px 8px; text-align: center; font-weight: bold; font-size: 13px; color: #0f172a; border-right: 1px solid #cbd5e1;">
          ${toBengaliNumerals((idx + 1).toString())}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-weight: bold; font-size: 13px; color: #000000; border-right: 1px solid #cbd5e1;">
          ${item.dateAndDay || item.dateTime || '—'}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-size: 13px; color: #0f172a; border-right: 1px solid #cbd5e1;">
          ${item.timeOnly || '—'}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-size: 13px; color: #0f172a; border-right: 1px solid #cbd5e1;">
          ${item.venue || '—'}
        </td>
        <td style="padding: 10px 10px; text-align: left; font-weight: bold; font-size: 14px; color: #020617; border-right: 1px solid #cbd5e1; font-family: 'Tiro Bangla', 'Noto Serif Bengali', serif;">
          ${item.description || ''}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-size: 13px; color: #0f172a; border-right: 1px solid #cbd5e1;">
          ${item.chairperson || '—'}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-size: 12px; color: #334155;">
          ${item.remarks || '—'}
        </td>
      </tr>
    `
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Tiro Bangla', 'Noto Serif Bengali', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 16px; color: #0f172a; }
        .container { max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #064e3b; color: #ffffff; padding: 24px 20px; text-align: center; border-bottom: 4px solid #10b981; }
        .body { padding: 24px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 20px; border: 1px solid #cbd5e1; }
        .th { background-color: #0f766e; color: #ffffff; padding: 10px 6px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #0d9488; }
        .signatory { margin-top: 32px; text-align: right; border-top: 2px dashed #e2e8f0; padding-top: 20px; }
        .footer { background-color: #0f172a; color: #94a3b8; font-size: 11px; padding: 16px; text-align: center; border-top: 1px solid #1e293b; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Official Government Header -->
        <div class="header">
          <div style="font-size: 15px; font-weight: bold; letter-spacing: 0.5px;">${govtName}</div>
          <div style="font-size: 20px; font-weight: bold; margin-top: 4px; color: #ecfdf5;">${officeName}</div>
          <div style="font-size: 13px; color: #a7f3d0; margin-top: 2px;">${branchName} | ${website}</div>
        </div>

        <div class="body">
          <!-- Memo & Subject -->
          <table style="width: 100%; margin-bottom: 16px; font-size: 13px;">
            <tr>
              <td style="font-weight: bold; color: #047857;">স্মারক নং: ${memoNo || '—'}</td>
              <td style="text-align: right; color: #475569;">তারিখ: ${issueDate || '—'}</td>
            </tr>
          </table>

          <div style="font-size: 16px; font-weight: bold; color: #020617; background-color: #f0fdf4; padding: 12px 16px; border-left: 4px solid #059669; border-radius: 4px; margin-bottom: 20px;">
            বিষয়: ${subject}
          </div>

          ${
            recipientNotes
              ? `<div style="font-size: 13px; color: #334155; margin-bottom: 16px; background-color: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <strong>বিশেষ বার্তা:</strong> ${recipientNotes}
                </div>`
              : ''
          }

          <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #0f172a;">
            📋 নির্ধারিত কর্মসূচি সূচি:
          </div>

          <!-- Schedule Table -->
          <table class="table">
            <thead>
              <tr>
                <th class="th" style="width: 35px;">ক্র:</th>
                <th class="th" style="width: 90px;">তারিখ</th>
                <th class="th" style="width: 70px;">সময়</th>
                <th class="th" style="width: 90px;">স্থান</th>
                <th class="th">সভার বিষয়</th>
                <th class="th" style="width: 90px;">সভাপতি</th>
                <th class="th" style="width: 75px;">মন্তব্য</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <!-- Official Signatory -->
          <div class="signatory">
            <div style="font-size: 15px; font-weight: bold; color: #020617;">${signatory.name}</div>
            <div style="font-size: 13px; color: #047857; font-weight: 600; margin-top: 2px;">${signatory.designation}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 1px;">${signatory.officeName}</div>
            ${signatory.phone ? `<div style="font-size: 12px; color: #475569;">ফোন: ${signatory.phone}</div>` : ''}
            ${signatory.email ? `<div style="font-size: 12px; color: #475569;">ইমেইল: ${signatory.email}</div>` : ''}
          </div>
        </div>

        <div class="footer">
          এটি ${officeName} এর ডিজিটাল সার্ভিসেস ম্যানেজমেন্ট সিস্টেম থেকে গুগল জি-মেইল API এর মাধ্যমে সরাসরি পাঠানো সরকারী বিজ্ঞপ্তি।
        </div>
      </div>
    </body>
  </html>
  `;
}
