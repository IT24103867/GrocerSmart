import React, { useEffect, useState } from 'react';
import { 
    X, Info, Wallet, TrendingUp, History, User, Receipt, 
    CreditCard, FileText, Download, Edit, Trash2, Eye, EyeOff, FileDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

import { getCustomerPayments, getCustomerInvoices, getCreditCustomerSummary } from '../api/creditCustomersApi';
import { getCustomerLedgerPdf, getInvoicePdf, getCustomerProfilePdf, downloadBlob } from '../api/reportsApi';

import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Card from './ui/Card';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
};

export default function CreditCustomerDetailsDialog({ open, onClose, customer, aiRiskData, aiRiskLoading, onFetchAiRisk, onEdit, onPay, onDelete, onStatusToggle }) {
    const [tabValue, setTabValue] = useState('overview');
    const [payments, setPayments] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && customer?.id) {
            fetchData();
        }
    }, [open, customer]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [paymentsRes, invoicesRes, summaryRes] = await Promise.all([
                getCustomerPayments(customer.id),
                getCustomerInvoices(customer.id),
                getCreditCustomerSummary(customer.id)
            ]);
            setPayments(paymentsRes.data || paymentsRes || []);
            setInvoices(invoicesRes.data || invoicesRes || []);
            setSummary(summaryRes.data || summaryRes || null);
        } catch (error) {
            console.error("Failed to load customer data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadLedger = async () => {
        try {
            const res = await getCustomerLedgerPdf(customer.id);
            downloadBlob(res.data, `Ledger_${customer.name}.pdf`);
            toast.success("Ledger downloaded");
        } catch (e) {
            toast.error("Download failed");
        }
    };

    const handleDownloadInvoice = async (inv) => {
        try {
            const res = await getInvoicePdf(inv.id);
            downloadBlob(res.data, `Invoice_${inv.invoiceId}.pdf`);
            toast.success("Invoice downloaded");
        } catch (e) {
            toast.error("Download failed");
        }
    };

    const handleDownloadProfile = async () => {
        try {
            const res = await getCustomerProfilePdf(customer.id);
            downloadBlob(res.data, `Profile_${customer.name}.pdf`);
            toast.success("Profile downloaded");
        } catch (e) {
            toast.error("Download failed");
        }
    };

    if (!customer) return null;

    const displaySummary = summary || customer;
    const ledgerEntries = (customer.ledger || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <Modal 
            open={open}            onClose={onClose} 
            title={
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none">{customer.name}</h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">ID: {customer.publicId} • {customer.phone || 'NO PHONE'}</p>
                    </div>
                </div>
            }
            maxWidth="max-w-5xl"
        >
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 mb-6 bg-slate-50/50 dark:bg-slate-900/50 p-1 rounded-2xl">
                {[
                    { id: 'overview', label: 'Overview', icon: Info },
                    { id: 'invoices', label: 'Invoices', icon: Receipt },
                    { id: 'payments', label: 'Ledger', icon: CreditCard }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setTabValue(tab.id)}
                        className={`
                            flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                            ${tabValue === tab.id 
                                ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}
                        `}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {tabValue === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Risk Snapshot</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <Badge variant={(aiRiskData?.riskStatus || customer.riskStatus) === 'Safe' ? 'success' : 'error'}>
                                            {aiRiskData?.riskStatus || customer.riskStatus || 'Unknown'}
                                        </Badge>
                                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                                            Score: {Number(aiRiskData?.aiRiskScore ?? customer.aiRiskScore ?? 0)}%
                                        </span>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                            Confidence: {Number(aiRiskData?.confidence || 0)}%
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onFetchAiRisk && onFetchAiRisk(customer)}
                                    loading={Boolean(aiRiskLoading)}
                                >
                                    Refresh From AI
                                </Button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-3xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 text-center">
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-2 block">Outstanding Debt</span>
                                <h4 className="text-3xl font-black text-red-600 dark:text-red-400 italic leading-none">{formatCurrency(displaySummary.outstandingBalance)}</h4>
                                <p className="text-[10px] font-bold text-red-400/60 uppercase tracking-widest mt-2 italic">Active receivables</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 text-center">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 block">Available Credit</span>
                                <h4 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 italic leading-none">{formatCurrency(displaySummary.availableCredit)}</h4>
                                <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest mt-2 italic">Limit: {formatCurrency(displaySummary.creditLimit)}</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 text-center">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 block">Total Repaid</span>
                                <h4 className="text-3xl font-black text-blue-600 dark:text-blue-400 italic leading-none">{formatCurrency(displaySummary.totalPaid)}</h4>
                                <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mt-2 italic">Lifetime volume</p>
                            </div>
                        </div>

                        {/* Account Stats */}
                        <div>
                            <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <TrendingUp size={14} className="text-brand-primary" /> Account Ledger Statistics
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { label: 'Total Purchases', value: formatCurrency(displaySummary.totalPurchases), icon: Receipt },
                                    { label: 'Last Transaction', value: displaySummary.lastPaymentDate || 'NEVER', icon: History },
                                    { label: 'Credit Cycle', value: `${displaySummary.paymentTermsDays} DAYS`, icon: CreditCard },
                                    { label: 'Address', value: displaySummary.address || 'NOT PROVIDED', icon: Info }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-transform hover:scale-[1.01]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <item.icon size={14} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 italic">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {tabValue === 'invoices' && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4">Invoice ID</th>
                                    <th className="px-6 py-4">Dated</th>
                                    <th className="px-6 py-4 text-right">Revenue</th>
                                    <th className="px-6 py-4 text-right">Settled</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 w-12 text-center">PDF</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={6} className="py-20 text-center"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                                ) : invoices.length > 0 ? invoices.map((inv) => (
                                    <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-black text-brand-primary text-sm uppercase tracking-tighter italic">{inv.invoiceId}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{inv.salesDate ? format(new Date(inv.salesDate), 'MMM dd, yyyy') : '—'}</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100 text-sm italic">{formatCurrency(inv.totalRevenue)}</td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-500 text-sm italic">{formatCurrency(inv.paidAmount)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={inv.paymentStatus === 'PAID' ? 'success' : inv.paymentStatus === 'PARTIAL' ? 'amber' : 'error'}>
                                                {inv.paymentStatus}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleDownloadInvoice(inv)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-brand-primary transition-all opacity-0 group-hover:opacity-100">
                                                <Download size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} className="py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No matching invoices found in history</td></tr>
                                )}
                            </tbody>
                        </table>
                    </motion.div>
                )}

                {tabValue === 'payments' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4">Transaction Hub</th>
                                    <th className="px-6 py-4 text-right">Repayment Amount</th>
                                    <th className="px-6 py-4 text-center">Gateway</th>
                                    <th className="px-6 py-4">Audit Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={4} className="py-20 text-center"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                                ) : ledgerEntries.length > 0 ? ledgerEntries.map((entry, index) => (
                                    <tr key={`${entry.date}-${entry.amount}-${index}`} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase italic">
                                            {entry.date ? format(new Date(entry.date), 'MMM dd, yyyy HH:mm') : '—'}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-black text-base italic ${entry.type === 'Credit' ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(entry.amount)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={entry.type === 'Credit' ? 'success' : 'error'} className="px-3 text-[9px]">{entry.type}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-400 italic">{entry.description || entry.orderId || 'NO REMARKS'}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No ledger records found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 -mx-6 -mb-6 p-6 rounded-b-[2.5rem]">
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleDownloadProfile} className="text-[10px] font-black">
                        <FileText size={14} className="mr-1.5" /> Profile Audit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownloadLedger} className="text-[10px] font-black">
                        <FileDown size={14} className="mr-1.5" /> Full Ledger PDF
                    </Button>
                </div>
                <Button variant="primary" size="md" onClick={onClose} className="px-10">Close Record</Button>
            </div>
        </Modal>
    );
}
