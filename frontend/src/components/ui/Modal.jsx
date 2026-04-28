import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-xl',
  loading = false,
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`
              relative w-full ${maxWidth} bg-white dark:bg-slate-900 
              rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 
              overflow-hidden flex flex-col max-h-[90vh]
            `}
          >
            {/* Header */}
            <div className="px-6 py-5 flex items-start justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase leading-none">
                  {title}
                </h3>
                {subtitle && (
                  <p className="mt-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="p-2 -mt-1 -mr-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 transition-all custom-scrollbar">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
