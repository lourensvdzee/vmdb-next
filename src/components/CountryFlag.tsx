"use client";

import React from 'react';

interface CountryFlagProps {
  code: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
}

// Simple SVG flags for reliable cross-platform rendering (no OS emoji fallback)
// Each flag maintains a 3:2 aspect ratio (width:height)
const CountryFlag: React.FC<CountryFlagProps> = ({ code, className, style }) => {
  if (!code) return null;
  const upper = code.toUpperCase();
  switch (upper) {
    case 'NL':
      return (
        <svg viewBox="0 0 3 2" className={className} style={style} aria-label="Netherlands flag">
          <rect width="3" height="2" fill="#FFF" />
          <rect width="3" height="0.666" y="0" fill="#AE1C28" />
          <rect width="3" height="0.666" y="0.666" fill="#FFF" />
          <rect width="3" height="0.666" y="1.334" fill="#21468B" />
        </svg>
      );
    case 'DE':
      return (
        <svg viewBox="0 0 3 2" className={className} style={style} aria-label="Germany flag">
          <rect width="3" height="2" fill="#FFCE00" />
          <rect width="3" height="0.666" y="0" fill="#000" />
          <rect width="3" height="0.666" y="0.666" fill="#DD0000" />
        </svg>
      );
    case 'FR':
      return (
        <svg viewBox="0 0 3 2" className={className} style={style} aria-label="France flag">
          <rect width="1" height="2" x="0" fill="#0055A4" />
          <rect width="1" height="2" x="1" fill="#FFF" />
          <rect width="1" height="2" x="2" fill="#EF4135" />
        </svg>
      );
    case 'BE':
      return (
        <svg viewBox="0 0 3 2" className={className} style={style} aria-label="Belgium flag">
          <rect width="1" height="2" x="0" fill="#000" />
          <rect width="1" height="2" x="1" fill="#FDDA24" />
          <rect width="1" height="2" x="2" fill="#EF3340" />
        </svg>
      );
    case 'ES':
      return (
        <svg viewBox="0 0 3 2" className={className} style={style} aria-label="Spain flag">
          <rect width="3" height="2" fill="#AA151B" />
          <rect width="3" height="0.8" y="0.6" fill="#F1BF00" />
        </svg>
      );
    case 'IT':
      return (
        <svg viewBox="0 0 3 2" className={className} style={style} aria-label="Italy flag">
          <rect width="1" height="2" x="0" fill="#009246" />
          <rect width="1" height="2" x="1" fill="#FFF" />
          <rect width="1" height="2" x="2" fill="#CE2B37" />
        </svg>
      );
    case 'GB':
    case 'UK':
      // Simplified Union Jack (not perfectly accurate ratio but recognizable)
      return (
        <svg viewBox="0 0 30 20" className={className} style={style} aria-label="United Kingdom flag">
          <rect width="30" height="20" fill="#012169" />
          <path d="M0 0 L30 20 M30 0 L0 20" stroke="#FFF" strokeWidth="4" />
          <path d="M0 0 L30 20 M30 0 L0 20" stroke="#C8102E" strokeWidth="2" />
          <rect x="13" width="4" height="20" fill="#FFF" />
          <rect y="8" width="30" height="4" fill="#FFF" />
          <rect x="14" width="2" height="20" fill="#C8102E" />
          <rect y="9" width="30" height="2" fill="#C8102E" />
        </svg>
      );
    case 'US':
      return (
        <svg viewBox="0 0 19 10" className={className} style={style} aria-label="United States flag">
          <rect width="19" height="10" fill="#B22234" />
          {[1,3,5,7,9].map(y => <rect key={y} y={y} width="19" height="1" fill="#FFF" />)}
          <rect width="7" height="5" fill="#3C3B6E" />
          {/* Simplified stars */}
          {[0,2,4].map((row) => (
            <circle key={row} cx={1.2+row} cy={1.2} r={0.3} fill="#FFF" />
          ))}
        </svg>
      );
    case 'CA':
      return (
        <svg viewBox="0 0 3 2" className={className} style={style} aria-label="Canada flag">
          <rect width="3" height="2" fill="#FFF" />
          <rect width="0.75" height="2" x="0" fill="#D52B1E" />
          <rect width="0.75" height="2" x="2.25" fill="#D52B1E" />
          <path d="M1.5 0.3 L1.3 0.9 L0.9 0.9 L1.2 1.1 L1.1 1.7 L1.5 1.3 L1.9 1.7 L1.8 1.1 L2.1 0.9 L1.7 0.9 Z" fill="#D52B1E" />
        </svg>
      );
    case 'AU':
      return (
        <svg viewBox="0 0 30 20" className={className} style={style} aria-label="Australia flag">
          <rect width="30" height="20" fill="#002868" />
          {/* Union Jack corner simplified */}
          <rect width="12" height="6" fill="#012169" />
          <path d="M0 0 L12 6 M12 0 L0 6" stroke="#FFF" strokeWidth="2" />
          <path d="M0 0 L12 6 M12 0 L0 6" stroke="#C8102E" strokeWidth="1" />
        </svg>
      );
    case 'WORLD':
    case 'EU':
      return (
        <svg viewBox="0 0 20 20" className={className} style={style} aria-label="World icon">
          <circle cx="10" cy="10" r="9" fill="#1E88E5" stroke="#0D47A1" strokeWidth="1" />
          <path d="M3 10h14M10 3v14" stroke="#FFF" strokeWidth="1" />
          <path d="M5 5c2 1 4 1 5 0 2 1 4 1 5 0" stroke="#FFF" strokeWidth="1" fill="none" />
          <path d="M5 15c2-1 4-1 5 0 2-1 4-1 5 0" stroke="#FFF" strokeWidth="1" fill="none" />
        </svg>
      );
    default:
      return null;
  }
};

export default CountryFlag;
