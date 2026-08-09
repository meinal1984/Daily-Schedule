import React from 'react';
import { LetterheadConfig } from '../types';
import { GovernmentEmblem } from './GovernmentEmblem';
import { DepartmentLogo } from './DepartmentLogo';
import { Edit3 } from 'lucide-react';
import { getCurrentBengaliMonthYear } from '../utils/bengaliUtils';

interface Props {
  config: LetterheadConfig;
  onEditClick?: () => void;
  isEditable?: boolean;
}

export const GovernmentLetterhead: React.FC<Props> = ({
  config,
  onEditClick,
  isEditable = true,
}) => {
  return (
    <div className="relative bg-white border border-slate-200 rounded-xl p-6 sm:p-8 lg:p-10 shadow-sm transition-all font-serif-bn">
      {isEditable && onEditClick && (
        <button
          onClick={onEditClick}
          className="no-print absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-200 transition-colors shadow-2xs z-10"
          title="লেটারহেড এডিট করুন"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>লেটারহেড এডিট</span>
        </button>
      )}

      {/* Official Top Header Row with Dual Logos and Center Project Title */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: '12px' }}>
        {/* Left: Govt Crest Emblem */}
        <div style={{ width: '18%', minWidth: '70px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          {config?.showEmblem !== false && (
            config?.customLogoUrl ? (
              <img
                src={config.customLogoUrl}
                alt="Government Emblem"
                className="h-16 w-16 object-contain"
                style={{ width: '68px', height: '68px', maxWidth: '68px', maxHeight: '68px', objectFit: 'contain' }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <GovernmentEmblem
                size={68}
                variant={config?.emblemPreset || 'bd_crest'}
              />
            )
          )}
        </div>

        {/* Center: Govt Header, Project Title, Office & Contact Info */}
        <div style={{ width: '66%', textAlign: 'center' }} className="space-y-0.5">
          <h2 className="text-xs sm:text-sm font-bold text-black tracking-wide">
            {config?.govtTitle || 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার'}
          </h2>

          {config?.projectTitle && (
            <h1 className="text-xs sm:text-sm font-bold text-black leading-tight">
              {config.projectTitle}
            </h1>
          )}

          <h3 className="text-[11px] sm:text-xs font-semibold text-slate-900">
            {config?.officeName || 'বাংলাদেশ ফিল্ম আর্কাইভ, তথ্য ও সম্প্রচার মন্ত্রণালয়'}
          </h3>

          {config?.branchName && (
            <h4 className="text-[10.5px] sm:text-[11.5px] font-semibold text-slate-800">
              {config.branchName}
            </h4>
          )}

          {config?.address && (
            <p className="text-[10px] sm:text-[11px] text-slate-800 whitespace-nowrap">
              {config.address}
            </p>
          )}

          {/* Contact Line (Phone, Email, Website) */}
          <div className="text-[9.5px] sm:text-[10.5px] text-slate-800 flex flex-nowrap justify-center items-center gap-x-1.5 whitespace-nowrap overflow-hidden">
            {config?.phone && (
              <span>ফোন: <span className="font-bold">{config.phone}</span></span>
            )}
            {config?.phone && config?.email && <span className="text-slate-400 font-normal">|</span>}
            {config?.email && (
              <span>E-mail: <span className="font-bold">{config.email}</span></span>
            )}
            {(config?.phone || config?.email) && config?.website && <span className="text-slate-400 font-normal">|</span>}
            {config?.website && (
              <span>Website: <span className="font-bold">{config.website}</span></span>
            )}
          </div>
        </div>

        {/* Right: Department/Project Logo (BFA Official Logo) */}
        <div style={{ width: '18%', minWidth: '70px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {config?.showRightLogo !== false && (
            config?.customRightLogoUrl ? (
              <img
                src={config.customRightLogoUrl}
                alt="Department Logo"
                className="h-16 w-16 object-contain"
                style={{ width: '68px', height: '68px', maxWidth: '68px', maxHeight: '68px', objectFit: 'contain' }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <DepartmentLogo
                size={68}
                variant={config?.rightLogoPreset || 'bfa_logo'}
              />
            )
          )}
        </div>
      </div>

      {/* Solid Black Horizontal Line (exact match to uploaded image) */}
      <div className="header-underline" style={{ borderBottom: '2px solid #000000', width: '100%', marginTop: '12px', marginBottom: '20px', display: 'block', height: '0px', clear: 'both' }}></div>

      {/* Official Ref / Memo / Date / Subject Row (Optional) */}
      {config?.showRefSection !== false && (config?.memoNo || config?.issueDate || config?.subject) && (
        <div className="font-serif-bn text-xs sm:text-sm text-slate-900 border-b border-slate-200 pb-2 mb-2 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              {config?.memoNo && <span><strong>স্মারক নং:</strong> {config.memoNo}</span>}
            </div>
            <div>
              {config?.issueDate && <span><strong>তারিখ:</strong> {config.issueDate}</span>}
            </div>
          </div>
          {config?.subject && (
            <div className="text-sm sm:text-base font-bold text-slate-950 pt-0.5">
              <strong>বিষয়:</strong> {config.subject}
            </div>
          )}
        </div>
      )}

      {/* Main Notice Heading & Subtitle */}
      <div className="notice-heading-block my-6 text-center space-y-2" style={{ textAlign: 'center', width: '100%', display: 'block', marginTop: '24px', marginBottom: '32px' }}>
        <h3 className="font-serif-bn text-2xl sm:text-3xl font-extrabold text-black tracking-tight" style={{ textAlign: 'center', width: '100%', margin: '0 auto 8px auto', display: 'block', fontWeight: 800 }}>
          {config?.docHeading || 'প্রকল্প পরিচালক মহোদয়ের দৈনন্দিন কর্মসূচি'}
        </h3>
        <p className="font-serif-bn text-lg sm:text-xl font-bold text-slate-950" style={{ textAlign: 'center', width: '100%', margin: '0 auto', display: 'block', fontWeight: 700 }}>
          {config?.docSubheading || getCurrentBengaliMonthYear()}
        </p>
      </div>
    </div>
  );
};
