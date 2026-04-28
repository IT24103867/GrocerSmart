import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Autocomplete({
  options = [],
  value,
  onChange,
  getOptionLabel = (option) => option?.name || '',
  placeholder = 'Select an option...',
  label,
  required = false,
  error = '',
  loading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const getOptionValue = (option) => option?.id ?? option?._id ?? option;

  const filteredOptions = options.filter((option) =>
    getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((opt) => {
    const optValue = getOptionValue(opt);
    if (optValue === value || opt === value) return true;

    if (value && typeof value === 'object') {
      return optValue === getOptionValue(value);
    }

    return false;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`flex flex-col gap-1.5 w-full relative ${isOpen ? 'z-[90]' : 'z-10'}`} ref={containerRef}>
      {label && (
        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all cursor-pointer
          ${isOpen ? 'ring-2 ring-brand-primary/20 border-brand-primary' : 'border-slate-200 dark:border-slate-800'}
          ${error ? 'border-red-500 ring-red-500/10' : ''}
          bg-white dark:bg-slate-900 shadow-sm
        `}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <span className="font-bold text-slate-900 dark:text-slate-100 italic">
              {getOptionLabel(selectedOption)}
            </span>
          ) : (
            <span className="text-slate-400 font-medium italic">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          size={18} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-[100] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  autoFocus
                  type="text"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder="Type to filter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="px-4 py-8 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                  Loading options...
                </div>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const optionValue = getOptionValue(option);
                  const isSelected = optionValue === value;
                  return (
                    <div
                      key={optionValue}
                      className={`
                        px-4 py-3 flex items-center justify-between cursor-pointer transition-colors
                        ${isSelected ? 'bg-brand-primary/5 text-brand-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(optionValue);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      <span className="text-sm font-bold leading-tight">{getOptionLabel(option)}</span>
                      {isSelected && <Check size={16} />}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                  No matches found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-[10px] font-black text-red-500 uppercase tracking-tighter mt-1 ml-1">{error}</p>}
    </div>
  );
}
