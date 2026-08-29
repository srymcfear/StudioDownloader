import React from 'react';

interface QualityBadgeProps {
  label: string;
  variant?: '4k' | '8k' | 'fhd' | 'audio' | 'hdr' | 'fps' | 'lossless' | 'default';
}

export const QualityBadge: React.FC<QualityBadgeProps> = React.memo(({ label, variant = 'default' }) => {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';

  if (variant === '8k') {
    badgeStyle = 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold border-purple-400 shadow-sm shadow-purple-500/20';
  } else if (variant === '4k') {
    badgeStyle = 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold border-amber-300 shadow-sm shadow-amber-500/20';
  } else if (variant === 'fhd') {
    badgeStyle = 'bg-blue-600/30 text-blue-300 border-blue-500/40 font-semibold';
  } else if (variant === 'audio' || variant === 'lossless') {
    badgeStyle = 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40 font-semibold';
  } else if (variant === 'hdr') {
    badgeStyle = 'bg-rose-600/30 text-rose-300 border-rose-500/40 font-semibold';
  } else if (variant === 'fps') {
    badgeStyle = 'bg-cyan-600/30 text-cyan-300 border-cyan-500/40 font-semibold';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${badgeStyle}`}>
      {label}
    </span>
  );
});
