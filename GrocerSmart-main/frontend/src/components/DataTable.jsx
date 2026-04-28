import React, { useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import debounce from 'lodash/debounce';
import Card from './ui/Card';
import Input from './ui/Input';
import EmptyState from './EmptyState';

export default function DataTable({
  columns,
  data = [],
  searchKey,
  actions,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display at the moment.',
  onRowClick,
  serverSide = false,
  page = 0,
  rowsPerPage = 10,
  totalCount = 0,
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  orderBy,
  orderDirection = 'asc',
  onSortChange,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useCallback(
    debounce((val) => {
      if (onSearchChange) onSearchChange(val);
    }, 500),
    [onSearchChange]
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (serverSide) debouncedSearch(val);
  };

  const totalPages = Math.ceil((serverSide ? totalCount : data.length) / rowsPerPage);

  const renderSortIcon = (columnId) => {
    if (orderBy !== columnId) return <ArrowUpDown size={14} className="ml-1 opacity-20" />;
    return orderDirection === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-brand-primary" /> 
      : <ArrowDown size={14} className="ml-1 text-brand-primary" />;
  };

  return (
    <Card className="flex flex-col h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Search Header */}
      {searchKey && (
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
            />
          </div>
        </div>
      )}

      {/* Table Body */}
      <div className="flex-1 overflow-auto relative custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 ${col.sortable !== false ? 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-100' : ''}`}
                  onClick={() => col.sortable !== false && onSortChange && onSortChange(col.id)}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center">
                    {col.label}
                    {col.sortable !== false && renderSortIcon(col.id)}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              // Loading Shimmer
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.id} className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                    </td>
                  ))}
                  {actions && <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 ml-auto"></div></td>}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="py-20">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr 
                  key={row.id || i} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`group transition-colors hover:bg-slate-50/50 dark:hover:bg-brand-primary/5 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.id} className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                      {col.render ? col.render(row[col.id], row) : row[col.id]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Showing <span className="font-bold text-slate-900 dark:text-slate-100">{page * rowsPerPage + 1}</span> to <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min((page + 1) * rowsPerPage, totalCount)}</span> of <span className="font-bold text-slate-900 dark:text-slate-100">{totalCount}</span> results
        </div>
        
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Rows:</span>
                <select 
                    value={rowsPerPage} 
                    onChange={(e) => onRowsPerPageChange(parseInt(e.target.value))}
                    className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                    {[5, 10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
            </div>
          
            <div className="flex items-center gap-1">
                <button 
                onClick={() => onPageChange(0)} 
                disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                >
                <ChevronsLeft size={18} />
                </button>
                <button 
                onClick={() => onPageChange(page - 1)} 
                disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                >
                <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-brand-primary">
                {page + 1} <span className="text-slate-400 mx-1">/</span> {totalPages}
                </div>

                <button 
                onClick={() => onPageChange(page + 1)} 
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                >
                <ChevronRight size={18} />
                </button>
                <button 
                onClick={() => onPageChange(totalPages - 1)} 
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                >
                <ChevronsRight size={18} />
                </button>
            </div>
        </div>
      </div>
    </Card>
  );
}
