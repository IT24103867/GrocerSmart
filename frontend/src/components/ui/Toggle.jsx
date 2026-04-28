import React from 'react';

export default function Toggle({ enabled, onChange, label, disabled = false }) {
  return (
    <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => !disabled && onChange(!enabled)}>
      <div 
        className={`
          relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2
          ${enabled ? 'bg-brand-primary' : 'bg-slate-200 dark:bg-slate-800'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </div>
      {label && <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-tight group-hover:text-brand-primary transition-colors">{label}</span>}
    </div>
  );
}
