import React from 'react';

export default function Card({ title, subtitle, actions, children, className = '', hover = false, ...props }) {
    return (
        <div 
            className={`
                bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                rounded-2xl overflow-hidden transition-all duration-300
                ${hover ? 'hover:shadow-lg hover:border-brand-primary/30 group' : 'shadow-sm'}
                ${className}
            `}
            {...props}
        >
            {(title || actions) && (
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                        {title && <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">{title}</h3>}
                        {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
