import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 28 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#111D4A" />
          <stop offset="100%" stopColor="#0B122F" />
        </linearGradient>
        <linearGradient id="logoScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#006D77" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#111D4A" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Base Icon Background (Space Indigo Squircle) */}
      <rect width="512" height="512" rx="116" fill="url(#logoBgGrad)" />

      {/* Outer Film/Screen Frame */}
      <rect
        x="64"
        y="64"
        width="384"
        height="384"
        rx="48"
        fill="url(#logoScreenGrad)"
        stroke="#006D77"
        strokeWidth="14"
      />

      {/* Film Strip Sprockets */}
      <rect x="96" y="88" width="24" height="16" rx="6" fill="#006D77" opacity="0.85" />
      <rect x="156" y="88" width="24" height="16" rx="6" fill="#006D77" opacity="0.85" />
      <rect x="216" y="88" width="24" height="16" rx="6" fill="#006D77" opacity="0.85" />
      <rect x="272" y="88" width="24" height="16" rx="6" fill="#006D77" opacity="0.85" />
      <rect x="332" y="88" width="24" height="16" rx="6" fill="#006D77" opacity="0.85" />
      <rect x="392" y="88" width="24" height="16" rx="6" fill="#006D77" opacity="0.85" />

      {/* Central Video Playhead Symbol (Apricot Cream) */}
      <g transform="translate(256, 215)">
        <path
          d="M -30,-48 C -30,-54 -22,-58 -16,-54 L 46,-12 C 52,-8 52,2 46,6 L -16,48 C -22,52 -30,48 -30,42 Z"
          fill="#FFCF99"
        />
      </g>

      {/* Subtitle Lines (الترجمة - Iconic Dual Caption Bars) */}
      <rect x="116" y="324" width="280" height="26" rx="13" fill="#FFF8F0" />
      <rect x="166" y="366" width="180" height="22" rx="11" fill="#FFCF99" />
    </svg>
  );
};
