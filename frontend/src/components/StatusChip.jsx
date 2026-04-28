import React from 'react';

const statusVariants = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
  completed: 'success',
  cancelled: 'error',
  shipped: 'info',
  confirmed: 'success',
  discontinued: 'error',
  cleared: 'success',
  bounced: 'error',
};

export default function StatusChip({ status, label, className = '' }) {
  const normalizedStatus = status?.toLowerCase() || 'pending';
  const variant = statusVariants[normalizedStatus] || 'neutral';
  
  const colors = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
    error: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
    neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-slate-500/20'
  };

  return (
    <span className={`
      inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ring-1 ring-inset
      ${colors[variant]}
      ${className}
    `}>
      {label || status}
    </span>
  );
}
