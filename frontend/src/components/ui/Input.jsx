import React from 'react';

export default function Input({ 
  label, 
  error, 
  className = '', 
  id,
  ...props 
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-4 py-2.5 rounded-xl border transition-all duration-200
          bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm
          border-slate-200 dark:border-slate-800
          text-slate-900 dark:text-slate-100
          placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary
          ${error ? 'border-red-500 ring-red-500/10' : ''}
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
  );
}
