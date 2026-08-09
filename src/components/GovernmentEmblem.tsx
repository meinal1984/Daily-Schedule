import React from 'react';
import { GOVT_EMBLEM_SVG_BASE64, GOVT_EMBLEM_URL } from '../utils/logoAssets';

interface EmblemProps {
  size?: number;
  variant?: 'bd_crest' | 'golden_seal' | 'green_seal' | 'monochrome';
  className?: string;
}

export const GovernmentEmblem: React.FC<EmblemProps> = ({
  size = 64,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={GOVT_EMBLEM_SVG_BASE64 || GOVT_EMBLEM_URL}
        alt="গণপ্রজাতন্ত্রী বাংলাদেশ সরকার সিল"
        className="object-contain drop-shadow-2xs select-none pointer-events-none"
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
          // Fallback if data URI or local url has any issue
          e.currentTarget.src = GOVT_EMBLEM_URL;
        }}
      />
    </div>
  );
};


