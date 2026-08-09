import React, { useState } from 'react';
import { ScheduleDocument } from '../types';
import { GovernmentEmblem } from './GovernmentEmblem';
import { DepartmentLogo } from './DepartmentLogo';
import { Printer, Download, X, Loader2, ExternalLink } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { getCurrentBengaliMonthYear } from '../utils/bengaliUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: ScheduleDocument;
}

export const PrintPDFModal: React.FC<Props> = ({ isOpen, onClose, document: scheduleDoc }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !scheduleDoc) return null;

  const { letterhead, items } = scheduleDoc;

  const pdfFormat = (letterhead?.pageSize || 'A4').toLowerCase();
  const pdfOrientation = letterhead?.pageOrientation || 'portrait';
  const topMargin = letterhead?.printMargins?.top ?? 10;
  const bottomMargin = letterhead?.printMargins?.bottom ?? 10;
  const leftMargin = letterhead?.printMargins?.left ?? 12;
  const rightMargin = letterhead?.printMargins?.right ?? 12;

  const getNoticeMaxWidth = () => {
    if (pdfOrientation === 'landscape') return '297mm';
    if (letterhead?.pageSize === 'Legal') return '216mm';
    if (letterhead?.pageSize === 'Letter') return '216mm';
    return '210mm';
  };
  const noticeMaxWidth = getNoticeMaxWidth();

  const handleDownloadPDF = async () => {
    const element = window.document.getElementById('printable-notice-area');
    if (!element) return;

    setIsGeneratingPdf(true);

    const docTitle = letterhead?.docHeading || 'কর্মসূচি-বিজ্ঞপ্তি';
    const cleanFileName = `সরকারি-নোটিশ-${docTitle.replace(/\s+/g, '-')}.pdf`;

    const opt = {
      margin: [0, 0, 0, 0] as [number, number, number, number],
      filename: cleanFileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc: Document) => {
          // Helper function to sanitize any modern CSS color functions from style strings
          const sanitizeText = (txt: string) => {
            if (!txt) return txt;
            return txt
              .replace(/color-mix\s*\([^;}\n]+\)/gi, '#1e293b')
              .replace(/color-mix\s*\([^}]*/gi, '#1e293b')
              .replace(/oklab\s*\([^;}\n]+\)/gi, '#1e293b')
              .replace(/oklab\s*\([^}]*/gi, '#1e293b')
              .replace(/oklch\s*\([^;}\n]+\)/gi, '#1e293b')
              .replace(/oklch\s*\([^}]*/gi, '#1e293b')
              .replace(/lab\s*\([^;}\n]+\)/gi, '#1e293b')
              .replace(/lab\s*\([^}]*/gi, '#1e293b')
              .replace(/light-dark\s*\([^;}\n]+\)/gi, '#1e293b')
              .replace(/light-dark\s*\([^}]*/gi, '#1e293b')
              .replace(/color\s*\([^;}\n]+\)/gi, '#1e293b')
              .replace(/in\s+oklab/gi, 'in srgb')
              .replace(/in\s+oklch/gi, 'in srgb');
          };

          // 1. Clear adoptedStyleSheets if present in cloned document
          try {
            if ((clonedDoc as any).adoptedStyleSheets) {
              (clonedDoc as any).adoptedStyleSheets = [];
            }
          } catch (e) {
            console.warn('Could not clear adoptedStyleSheets:', e);
          }

          // 2. Sanitize all <style> tag contents in cloned document to prevent html2canvas color parsing errors
          const styleElements = clonedDoc.querySelectorAll('style');
          styleElements.forEach((s) => {
            if (s.textContent) {
              s.textContent = sanitizeText(s.textContent);
            }
          });

          // 3. Sanitize inline styles across all elements in clonedDoc
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((node) => {
            const el = node as HTMLElement;
            if (el.style && el.style.cssText) {
              if (/oklab|oklch|color-mix|lab|light-dark/i.test(el.style.cssText)) {
                el.style.cssText = sanitizeText(el.style.cssText);
              }
              ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'].forEach((p) => {
                const val = el.style.getPropertyValue(p);
                if (val && /oklab|oklch|color-mix|lab|light-dark/i.test(val)) {
                  el.style.removeProperty(p);
                }
              });
            }
          });

          // 4. Inject explicit high-contrast print styling for printable notice area
          const clonedElem = clonedDoc.getElementById('printable-notice-area');
          if (clonedElem) {
            clonedElem.style.width = noticeMaxWidth;
            clonedElem.style.maxWidth = noticeMaxWidth;
            clonedElem.style.minHeight = '0';
            clonedElem.style.height = 'auto';

            const overrideStyle = clonedDoc.createElement('style');
            overrideStyle.textContent = `
              #printable-notice-area {
                width: ${noticeMaxWidth} !important;
                max-width: ${noticeMaxWidth} !important;
                box-sizing: border-box !important;
                background-color: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                border: none !important;
                min-height: 0 !important;
                height: auto !important;
                padding: ${topMargin}mm ${rightMargin}mm ${bottomMargin}mm ${leftMargin}mm !important;
                margin: 0 auto !important;
              }
              #printable-notice-area * {
                box-shadow: none !important;
                text-shadow: none !important;
              }
              #printable-notice-area .text-center,
              .text-center {
                text-align: center !important;
              }
              #printable-notice-area h1,
              #printable-notice-area h2 {
                text-align: center !important;
                font-weight: 700 !important;
              }
              #printable-notice-area h3 {
                text-align: center !important;
                font-weight: 800 !important;
                color: #000000 !important;
              }
              #printable-notice-area .header-underline {
                border-bottom: 2px solid #000000 !important;
                display: block !important;
                width: 100% !important;
                margin-top: 12px !important;
                margin-bottom: 16px !important;
                height: 0px !important;
              }
              #printable-notice-area .notice-heading-block {
                margin-top: 20px !important;
                margin-bottom: 28px !important;
                text-align: center !important;
                display: block !important;
              }
              #printable-notice-area .signature-section {
                display: flex !important;
                flex-direction: row !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-top: 36px !important;
                padding-top: 16px !important;
              }
              #printable-notice-area svg {
                max-width: 80px !important;
                max-height: 80px !important;
                display: block !important;
                margin: 0 auto !important;
              }
              #printable-notice-area img {
                max-width: 80px !important;
                max-height: 80px !important;
                object-fit: contain !important;
                display: block !important;
              }
              #printable-notice-area table {
                width: 100% !important;
                border-collapse: collapse !important;
                border: 1px solid #000000 !important;
              }
              #printable-notice-area th,
              #printable-notice-area td {
                border: 1px solid #000000 !important;
                padding: 8px 6px !important;
                color: #000000 !important;
              }
              #printable-notice-area th {
                background-color: #e0f2fe !important;
                color: #0f172a !important;
                font-weight: bold !important;
              }
              #printable-notice-area .developer-footer-credit {
                margin-top: 32px !important;
                padding-top: 8px !important;
                border-top: 1px dashed #cbd5e1 !important;
                text-align: center !important;
                font-size: 9px !important;
                color: #64748b !important;
                font-family: sans-serif !important;
              }
            `;
            clonedDoc.head.appendChild(overrideStyle);
          }
        }
      },
      jsPDF: { unit: 'mm', format: pdfFormat, orientation: pdfOrientation as 'portrait' | 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to print dialog if html2pdf fails
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    // Direct window print opens native browser printer selection & Save as PDF dialog
    window.print();
  };

  const handlePrintInNewWindow = () => {
    const element = window.document.getElementById('printable-notice-area');
    if (!element) {
      window.print();
      return;
    }

    try {
      const printWin = window.open('', '_blank', 'width=1000,height=900,scrollbars=yes');
      if (!printWin) {
        window.print();
        return;
      }

      const styleSheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(s => s.outerHTML)
        .join('\n');

      printWin.document.write(`
        <!DOCTYPE html>
        <html lang="bn">
          <head>
            <meta charset="utf-8" />
            <title>${letterhead?.docHeading || 'কর্মসূচি-বিজ্ঞপ্তি'}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@400;600;700&family=Tiro+Bangla&display=swap" rel="stylesheet">
            ${styleSheets}
            <style>
              @page {
                size: ${pdfFormat} ${pdfOrientation};
                margin: ${topMargin}mm ${rightMargin}mm ${bottomMargin}mm ${leftMargin}mm;
              }
              body {
                background-color: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 15px !important;
                font-family: 'Tiro Bangla', 'Noto Serif Bengali', 'Hind Siliguri', serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              #printable-notice-area {
                width: 100% !important;
                max-width: 100% !important;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
              }
              th, td {
                border: 1px solid #000000 !important;
              }
              th {
                background-color: #e0f2fe !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            </style>
          </head>
          <body>
            <div style="margin-bottom: 20px; text-align: center;" class="no-print">
              <button onclick="window.print()" style="padding: 10px 24px; background: #0284c7; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                🖨️ প্রিন্ট ও প্রিন্টার সিলেক্ট করুন (Print / Save as PDF)
              </button>
            </div>
            ${element.outerHTML}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 400);
              };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    } catch (e) {
      console.error('New window print error:', e);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs transition-opacity modal-backdrop font-serif-bn">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col h-[95vh]">
        {/* Modal Header */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm sm:text-base">
              সরকারি নোটিশ ও কর্মসূচি প্রিন্ট প্রিভিউ (Official Print Preview)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-sans">
            {/* PDF Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              title="পিডিএফ ফাইল ডাউনলোড ও সংরক্ষণ করুন"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-medium text-xs sm:text-sm rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>পিডিএফ তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>পিডিএফ (PDF)</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrintInNewWindow}
              title="প্রিন্ট করুন বা প্রিন্টার সিলেক্ট করুন"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs sm:text-sm rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-100" />
              <span>প্রিন্ট (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Preview Canvas */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-200/80 flex justify-center flex-1">
          <div
            id="printable-notice-area"
            className="printable-area bg-white text-slate-900 w-full shadow-lg font-serif-bn flex flex-col justify-between"
            style={{
              paddingTop: `${topMargin}mm`,
              paddingBottom: `${bottomMargin}mm`,
              paddingLeft: `${leftMargin}mm`,
              paddingRight: `${rightMargin}mm`,
              maxWidth: noticeMaxWidth,
            }}
          >
            <div>
              {/* Official Dual-Logo & Center Project Title Header */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: '12px' }}>
                {/* Left: Govt Crest */}
                <div style={{ width: '18%', minWidth: '70px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                  {letterhead?.showEmblem !== false && (
                    letterhead?.customLogoUrl ? (
                      <img
                        src={letterhead.customLogoUrl}
                        alt="Emblem"
                        className="h-16 w-16 object-contain"
                        style={{ width: '68px', height: '68px', maxWidth: '68px', maxHeight: '68px', objectFit: 'contain' }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <GovernmentEmblem
                        size={68}
                        variant={letterhead?.emblemPreset || 'bd_crest'}
                      />
                    )
                  )}
                </div>

                {/* Center: Title & Office Details */}
                <div style={{ width: '66%', textAlign: 'center' }} className="space-y-0.5">
                  <h2 className="text-xs sm:text-sm font-bold text-black tracking-wide">
                    {letterhead?.govtTitle || 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার'}
                  </h2>

                  {letterhead?.projectTitle && (
                    <h1 className="text-xs sm:text-sm font-bold text-black leading-tight">
                      {letterhead.projectTitle}
                    </h1>
                  )}

                  <h3 className="text-[11px] sm:text-xs font-semibold text-slate-900">
                    {letterhead?.officeName || 'বাংলাদেশ ফিল্ম আর্কাইভ, তথ্য ও সম্প্রচার মন্ত্রণালয়'}
                  </h3>

                  {letterhead?.branchName && (
                    <h4 className="text-[10.5px] sm:text-[11.5px] font-semibold text-slate-800">
                      {letterhead.branchName}
                    </h4>
                  )}

                  {letterhead?.address && (
                    <p className="text-[10px] sm:text-[11px] text-slate-800 whitespace-nowrap">
                      {letterhead.address}
                    </p>
                  )}

                  {/* Contact Line */}
                  <div className="text-[9.5px] sm:text-[10.5px] text-slate-800 flex flex-nowrap justify-center items-center gap-x-1.5 whitespace-nowrap overflow-hidden">
                    {letterhead?.phone && <span>ফোন: <span className="font-bold">{letterhead.phone}</span></span>}
                    {letterhead?.phone && letterhead?.email && <span className="text-slate-400 font-normal">|</span>}
                    {letterhead?.email && <span>E-mail: <span className="font-bold">{letterhead.email}</span></span>}
                    {(letterhead?.phone || letterhead?.email) && letterhead?.website && <span className="text-slate-400 font-normal">|</span>}
                    {letterhead?.website && <span>Website: <span className="font-bold">{letterhead.website}</span></span>}
                  </div>
                </div>

                {/* Right: Department Logo (BFA Official Logo) */}
                <div style={{ width: '18%', minWidth: '70px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {letterhead?.showRightLogo !== false && (
                    letterhead?.customRightLogoUrl ? (
                      <img
                        src={letterhead.customRightLogoUrl}
                        alt="Department Logo"
                        className="h-16 w-16 object-contain"
                        style={{ width: '68px', height: '68px', maxWidth: '68px', maxHeight: '68px', objectFit: 'contain' }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <DepartmentLogo
                        size={68}
                        variant={letterhead?.rightLogoPreset || 'bfa_logo'}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Solid Horizontal Line */}
              <div className="header-underline" style={{ borderBottom: '2px solid #000000', width: '100%', marginTop: '12px', marginBottom: '20px', display: 'block', height: '0px', clear: 'both' }}></div>

              {/* Official Ref / Memo / Date / Subject Row (Optional) */}
              {letterhead?.showRefSection !== false && (letterhead?.memoNo || letterhead?.issueDate || letterhead?.subject) && (
                <div className="text-xs sm:text-sm text-black border-b border-black/30 pb-2 mb-2 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      {letterhead?.memoNo && <span><strong>স্মারক নং:</strong> {letterhead.memoNo}</span>}
                    </div>
                    <div>
                      {letterhead?.issueDate && <span><strong>তারিখ:</strong> {letterhead.issueDate}</span>}
                    </div>
                  </div>
                  {letterhead?.subject && (
                    <div className="text-sm sm:text-base font-bold text-black pt-0.5">
                      <strong>বিষয়:</strong> {letterhead.subject}
                    </div>
                  )}
                </div>
              )}

              {/* Document Heading & Subheading */}
              <div className="notice-heading-block my-6 text-center space-y-2" style={{ textAlign: 'center', width: '100%', display: 'block', marginTop: '24px', marginBottom: '32px' }}>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight" style={{ textAlign: 'center', width: '100%', margin: '0 auto 8px auto', display: 'block', fontWeight: 800 }}>
                  {letterhead?.docHeading || 'প্রকল্প পরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি'}
                </h3>
                <p className="text-lg sm:text-xl font-bold text-slate-950" style={{ textAlign: 'center', width: '100%', margin: '0 auto', display: 'block', fontWeight: 700 }}>
                  {letterhead?.docSubheading || getCurrentBengaliMonthYear()}
                </p>
              </div>

              {/* Schedule Table (Matching Image Grid Layout) */}
              <div className="mt-8" style={{ marginTop: '32px' }}>
                <table className="w-full text-center border-collapse border border-black text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-sky-100 text-black border-b border-black font-bold">
                      <th className="p-2.5 w-32 border-r border-black">তারিখ ও বার</th>
                      <th className="p-2.5 w-28 border-r border-black">সময়</th>
                      <th className="p-2.5 w-40 sm:w-48 border-r border-black">সভার স্থান</th>
                      <th className="p-2.5 min-w-[200px] border-r border-black">সভার বিষয়</th>
                      <th className="p-2.5 w-28 border-r border-black">সভাপতি</th>
                      <th className="p-2.5 w-24">মন্তব্য</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black text-slate-950 font-medium">
                    {items && items.length > 0 ? (
                      items.map((item, idx) => (
                        <tr key={item.id || idx} className="border-b border-black">
                          <td className="p-2.5 text-center font-bold text-black border-r border-black align-middle leading-tight" style={{ fontWeight: 700 }}>
                            {item.dateAndDay || item.dateTime || '—'}
                          </td>
                          <td className="p-2.5 text-center font-medium border-r border-black align-middle leading-tight">
                            {item.timeOnly || '—'}
                          </td>
                          <td className="p-2.5 text-center border-r border-black align-middle leading-snug">
                            {item.venue || '—'}
                          </td>
                          <td className="p-2.5 text-center border-r border-black align-middle font-bold text-sm sm:text-base text-black leading-snug" style={{ fontWeight: 700 }}>
                            {item.description}
                          </td>
                          <td className="p-2.5 text-center border-r border-black align-middle">
                            {item.chairperson || '—'}
                          </td>
                          <td className="p-2.5 text-center align-middle text-xs">
                            {item.remarks || '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">
                          কোন কর্মসূচি তথ্য পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Info / Signatory Block if available */}
            {letterhead?.showSignatory !== false && (letterhead?.signatoryName || letterhead?.customFooterText) && (
              <div 
                className="signature-section mt-10 pt-6 flex justify-between items-center gap-4 font-serif-bn"
                style={{ marginTop: '36px', paddingTop: '16px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
              >
                <div 
                  className="text-xs sm:text-sm text-slate-900 font-medium whitespace-pre-line max-w-sm text-left flex items-center"
                  style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', alignSelf: 'center' }}
                >
                  {letterhead?.customFooterText}
                </div>

                {letterhead?.signatoryName && (
                  <div 
                    className="flex flex-col items-center text-center space-y-0.5 min-w-[200px]"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginLeft: 'auto' }}
                  >
                    <div 
                      className="h-10 border-b border-dashed border-slate-500 mb-1 w-44"
                      style={{ borderBottom: '1px dashed #64748b', width: '176px', height: '36px', marginBottom: '6px' }}
                    ></div>
                    <div className="font-bold text-sm sm:text-base text-black" style={{ fontWeight: 700 }}>
                      ({letterhead.signatoryName})
                    </div>
                    {letterhead.signatoryDesignation && (
                      <div className="text-xs sm:text-sm font-semibold text-slate-900">
                        {letterhead.signatoryDesignation}
                      </div>
                    )}
                    {letterhead.signatoryPhone && (
                      <div className="text-xs text-slate-800">ফোন: {letterhead.signatoryPhone}</div>
                    )}
                    {letterhead.signatoryEmail && (
                      <div className="text-xs text-slate-800">ইমেইল: {letterhead.signatoryEmail}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Developer Footer Credit */}
            <div 
              className="developer-footer-credit mt-10 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 font-sans tracking-wide"
              style={{
                marginTop: '32px',
                paddingTop: '8px',
                borderTop: '1px dashed #cbd5e1',
                textAlign: 'center',
                fontSize: '9px',
                color: '#64748b',
                fontFamily: 'sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              Developer by Mrinal Kanti Roy, Mobile: 01719205945
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
