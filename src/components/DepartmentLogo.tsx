import React from 'react';
import { BFA_LOGO_BASE64, BFA_LOGO_URL } from '../utils/logoAssets';
import { GovernmentEmblem } from './GovernmentEmblem';

interface DepartmentLogoProps {
  size?: number;
  variant?: 'bfa_logo' | 'dc_seal' | 'govt_crest' | 'none';
  className?: string;
}

export const DepartmentLogo: React.FC<DepartmentLogoProps> = ({
  size = 64,
  variant = 'bfa_logo',
  className = '',
}) => {
  if (variant === 'none') return null;

  if (variant === 'govt_crest') {
    return <GovernmentEmblem size={size} className={className} />;
  }

  if (variant === 'dc_seal') {
    return (
      <div className={`inline-flex flex-col items-center justify-center ${className}`}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            maxWidth: `${size}px`,
            maxHeight: `${size}px`,
            minWidth: `${size}px`,
            minHeight: `${size}px`,
            display: 'block',
          }}
        >
          <circle cx="60" cy="60" r="56" fill="#047857" />
          <circle cx="60" cy="60" r="50" fill="#ffffff" stroke="#eab308" strokeWidth="2" />
          <circle cx="60" cy="60" r="42" fill="#065f46" />
          <text x="60" y="52" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
            জেলা প্রশাসন
          </text>
          <text x="60" y="70" textAnchor="middle" fill="#fef08a" fontSize="10" fontFamily="sans-serif">
            ঢাকা
          </text>
          <path d="M40 82 L80 82" stroke="#eab308" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  // Default: BFA Bangladesh Film Archive Official Logo
  return (
    <div className={`inline-flex flex-col items-center justify-center text-center ${className}`}>
      <img
        src={BFA_LOGO_BASE64 || BFA_LOGO_URL}
        alt="বাংলাদেশ ফিল্ম আর্কাইভ লোগো"
        className="object-contain select-none pointer-events-none"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          maxWidth: `${size}px`,
          maxHeight: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          display: 'block',
          objectFit: 'contain',
        }}
        referrerPolicy="no-referrer"
        onError={(e) => {
          e.currentTarget.src = BFA_LOGO_URL;
        }}
      />
    </div>
  );
};



