import React, { useMemo } from 'react';
import { 
    Printer, X, Receipt, Clock, CreditCard, ShoppingBag, 
    ArrowRight, Info, CheckCircle2, AlertTriangle, User 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

import { getInvoicePdf, downloadBlob } from '../api/reportsApi';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Card from './ui/Card';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
};

export default function SalesDetailsDialog({ open, onClose, sale }) {
    if (!sale) return null;

    const handleDownloadInvoice = async () => {
        try {
            const res = await getInvoicePdf(sale.id);
            downloadBlob(res.data, `Invoice_${sale.publicId || sale.invoiceId}.pdf`);
            toast.success("Invoice downloaded");
        } catch (e) {
            toast.error("Download failed");
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <span className="text-lg font-black uppercase tracking-tight italic">Transaction Insight</span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Audit Log for {sale.publicId}</p>
                    </div>
                </div>
            }
            maxWidth="max-w-4xl"
        >
            <div className="space-y-8 mt-2">
                {/* Header Summary Card */}
                <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-brand-primary/20"></div>
                    
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1.5 block">Instrument ID</span>
                            <h4 className="text-xl font-black italic tracking-tighter uppercase">{sale.publicId || sale.invoiceId}</h4>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1.5 block">Recorded Date</span>
                            <h4 className="text-lg font-bold italic">{sale.salesDate ? format(new Date(sale.salesDate), 'MMM dd, yyyy') : '—'}</h4>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1.5 block">Fidelity Status</span>
                            <div className="flex gap-2 mt-1">
                                <Badge variant="brand" className="bg-white/10 border-white/20 text-white text-[9px] px-3">{sale.paymentMethod || 'CASH'}</Badge>
                                <Badge variant={sale.paymentStatus === 'PAID' ? 'success' : 'amber'} className="text-[9px] px-3">{sale.paymentStatus || 'SETTLED'}</Badge>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1.5 block text-right">Settled Amount</span>
                            <h4 className="text-3xl font-black italic text-brand-primary">{formatCurrency(sale.totalRevenue)}</h4>
                        </div>
                    </div>

                    {sale.note && (
                        <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                            <div className="flex items-start gap-4">
                                <Info size={16} className="text-brand-primary shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">Audit Remarks</span>
                                    <p className="text-sm font-medium text-slate-300 italic">"{sale.note}"</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Items Analysis */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                            <Receipt size={14} className="text-brand-primary" /> Itemized Breakdown ({sale.items?.length || 0})
                        </h5>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4">Catalog Selection</th>
                                    <th className="px-6 py-4 text-center">Volume</th>
                                    <th className="px-6 py-4 text-right">Fixed Price</th>
                                    <th className="px-6 py-4 text-right">Net Yield</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {sale.items?.map((item, i) => (
                                    <tr key={item.id || i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 dark:text-slate-100 italic uppercase tracking-tighter leading-tight">
                                                    {item.productNameSnapshot || item.productName}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                    {item.categorySnapshot || 'GENERAL CATEGORY'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-black text-slate-600 dark:text-slate-400">
                                                {item.qtySold} <span className="text-[10px] opacity-60 ml-0.5">{item.unitOrBulk || 'UNIT'}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-bold text-slate-500 italic">{formatCurrency(item.unitPrice)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900 dark:text-slate-100 italic">{formatCurrency(item.lineTotal)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                                <tr>
                                    <td colSpan={3} className="px-6 py-5 text-right font-black text-slate-400 text-[10px] uppercase tracking-widest">Aggregate Total</td>
                                    <td className="px-6 py-5 text-right font-black text-brand-primary text-xl italic">{formatCurrency(sale.totalRevenue)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Financial Health */}
                {sale.paymentStatus !== 'PAID' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-3xl border border-emerald-100 dark:border-emerald-500/10 bg-emerald-50/30 dark:bg-emerald-500/5 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 leading-none">Recovered Funds</span>
                                <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400 italic leading-none">{formatCurrency(sale.paidAmount)}</h4>
                            </div>
                            <CheckCircle2 size={24} className="text-emerald-400 opacity-60" />
                        </div>
                        <div className="p-6 rounded-3xl border border-red-100 dark:border-red-500/10 bg-red-50/30 dark:bg-red-500/5 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 leading-none">Receivable Balance</span>
                                <h4 className="text-xl font-black text-red-600 dark:text-red-400 italic leading-none">{formatCurrency(sale.totalRevenue - (sale.paidAmount || 0))}</h4>
                            </div>
                            <AlertTriangle size={24} className="text-red-400 opacity-60" />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center -mx-6 -mb-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-b-[2.5rem]">
                <div className="flex gap-2">
                    <Button variant="ghost" size="md" onClick={handleDownloadInvoice} className="text-[10px] font-black uppercase">
                        <Printer size={16} className="mr-2" /> Print Instrument
                    </Button>
                </div>
                <Button variant="primary" size="md" onClick={onClose} className="px-12">Close Insight</Button>
            </div>
        </Modal>
    );
}
