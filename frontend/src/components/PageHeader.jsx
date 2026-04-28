import React from 'react';
import { Package, User } from 'lucide-react';

export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shadow-sm border border-brand-primary/20">
            {React.isValidElement(Icon) ? Icon : <Icon size={24} />}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight uppercase">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
