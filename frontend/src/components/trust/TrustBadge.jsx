import React from 'react';
import { ShieldCheck, ShieldAlert, Shield, Award, HelpCircle } from 'lucide-react';

/**
 * TrustBadge Component
 * Displays user's trust tier with color coding, icons, and optional score value.
 */
export const calculateTrustLevel = (score) => {
  const numeric = typeof score === 'number' ? score : 50;
  if (numeric >= 80) return 'exemplary';
  if (numeric >= 60) return 'trusted';
  if (numeric >= 35) return 'neutral';
  return 'restricted';
};

const TIER_CONFIG = {
  exemplary: {
    label: 'Exemplary Contributor',
    shortLabel: 'Exemplary',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    badgeGradient: 'from-emerald-600 to-teal-700 text-white',
    icon: Award,
    description: 'High reputation standing, top contributions & community trust.',
  },
  trusted: {
    label: 'Trusted Member',
    shortLabel: 'Trusted',
    bg: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    badgeGradient: 'from-blue-600 to-indigo-700 text-white',
    icon: ShieldCheck,
    description: 'Reliable contributor with consistent verified positive activity.',
  },
  neutral: {
    label: 'Neutral Standing',
    shortLabel: 'Neutral',
    bg: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    badgeGradient: 'from-stone-600 to-stone-700 text-white',
    icon: Shield,
    description: 'Standard baseline community account standing.',
  },
  restricted: {
    label: 'Restricted Standing',
    shortLabel: 'Restricted',
    bg: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    badgeGradient: 'from-rose-600 to-red-700 text-white',
    icon: ShieldAlert,
    description: 'Under policy review or elevated violation penalties.',
  },
};

const TrustBadge = ({
  score = 50,
  level = null,
  showScore = true,
  size = 'md',
  variant = 'pill',
  className = '',
}) => {
  const currentLevel = level || calculateTrustLevel(score);
  const config = TIER_CONFIG[currentLevel] || TIER_CONFIG.neutral;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  if (variant === 'compact') {
    return (
      <span
        title={`${config.label} (${score} pts)`}
        className={`inline-flex items-center rounded-full border font-semibold ${config.bg} ${sizeClasses[size]} ${className}`}
      >
        <Icon className={iconSizes[size]} />
        {showScore && <span>{score}</span>}
      </span>
    );
  }

  return (
    <span
      title={config.description}
      className={`inline-flex items-center rounded-full border font-semibold transition-all ${config.bg} ${sizeClasses[size]} ${className}`}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.shortLabel}</span>
      {showScore && (
        <span className="opacity-75 font-mono text-[11px] ml-0.5">
          • {score} pts
        </span>
      )}
    </span>
  );
};

export default TrustBadge;
