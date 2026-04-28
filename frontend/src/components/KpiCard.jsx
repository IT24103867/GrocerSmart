import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';

export default function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'brand', // brand, blue, red, amber, indigo
  loading = false,
  delay = 0
}) {
  const isPositiveTrend = trend === 'up';

  const colorConfig = {
    brand: 'from-brand-primary to-brand-primary-dark shadow-brand-primary/20 bg-brand-primary/10 text-brand-primary',
    blue: 'from-blue-500 to-blue-700 shadow-blue-500/20 bg-blue-500/10 text-blue-500',
    red: 'from-red-500 to-red-700 shadow-red-500/20 bg-red-500/10 text-red-500',
    amber: 'from-amber-500 to-amber-700 shadow-amber-500/20 bg-amber-500/10 text-amber-500',
    indigo: 'from-indigo-500 to-indigo-700 shadow-indigo-500/20 bg-indigo-500/10 text-indigo-500',
  };

  const selectedColor = colorConfig[color] || colorConfig.brand;
  const gradientClasses = selectedColor.split(' ').slice(0, 2).join(' ');
  const shadowClass = selectedColor.split(' ')[2];
  const bgClass = selectedColor.split(' ')[3];
  const textClass = selectedColor.split(' ')[4];

  return (
    <Card 
      className="p-6 relative overflow-hidden group h-full" 
      hover={true}
      glass={true}
    >
      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            {loading ? <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800/50 animate-pulse rounded"></div> : title}
          </p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {loading ? <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800/50 animate-pulse rounded mt-1"></div> : value}
          </h3>
        </div>
        
        {Icon && (
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientClasses} flex items-center justify-center shadow-lg ${shadowClass} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
            {loading ? (
              <div className="w-6 h-6 bg-white/20 animate-pulse rounded-full"></div>
            ) : (
              <Icon size={28} className="text-white" />
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 relative z-10">
        {loading ? (
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800/50 animate-pulse rounded"></div>
        ) : trendValue ? (
          <>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ring-1 ring-inset ${isPositiveTrend ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20'}`}>
              {isPositiveTrend ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trendValue}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">vs last month</span>
          </>
        ) : (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic opacity-60">Real-time dynamic data</span>
        )}
      </div>

      {/* Decorative background element */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br ${gradientClasses} opacity-[0.03] group-hover:scale-150 transition-transform duration-700`}></div>
    </Card>
  );
}
