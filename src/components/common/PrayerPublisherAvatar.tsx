import React, { useState } from 'react';
import { User, Shield } from 'lucide-react';

interface PrayerPublisherAvatarProps {
  authorName?: string;
  authorAvatar?: string;
  isAnonymous?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const GRADIENTS = [
  'from-purple-600 to-indigo-700',
  'from-sky-600 to-blue-700',
  'from-emerald-600 to-teal-700',
  'from-amber-500 to-rose-600',
  'from-violet-600 to-fuchsia-700',
];

export const PrayerPublisherAvatar: React.FC<PrayerPublisherAvatarProps> = ({
  authorName = 'Faithful Believer',
  authorAvatar,
  isAnonymous = false,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (isAnonymous) {
    return (
      <div
        className={`rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center shrink-0 shadow-inner ${sizeClasses[size]} ${className}`}
        title="Anonymous Listener"
      >
        <Shield className={iconSizes[size]} />
      </div>
    );
  }

  if (authorAvatar && !imgError) {
    return (
      <img
        src={authorAvatar}
        alt={authorName}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover border border-purple-500/30 shrink-0 shadow-sm ${sizeClasses[size]} ${className}`}
      />
    );
  }

  // Derive stable initials
  const initials = authorName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('') || '🙏';

  // Deterministic gradient based on author name
  const charSum = authorName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = GRADIENTS[charSum % GRADIENTS.length];

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${gradient} text-white font-extrabold flex items-center justify-center shrink-0 shadow-sm border border-white/20 select-none ${sizeClasses[size]} ${className}`}
      title={authorName}
    >
      <span>{initials}</span>
    </div>
  );
};
