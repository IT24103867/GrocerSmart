import React from 'react';

export default function SectionCard({ title, subtitle, actions, children, className = '', ...props }) {
    return (
        <div 
            className={`
                flex flex-col h-full bg-white dark:bg-slate-900 
                border border-slate-200 dark:border-slate-800 
                rounded-2xl shadow-sm overflow-hidden ${className}
            `}
            {...props}
        >
            {(title || actions) && (
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                        {title && <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{title}</h3>}
                        {subtitle && <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className="flex-1 p-6">
                {children}
            </div>
        </div>
    );
}
