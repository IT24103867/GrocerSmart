import React, { useState } from 'react';
import { 
    FileText, BarChart3, Receipt, Package, Wallet, Download, 
    Calendar, Filter, ArrowRight, ShieldCheck, Search, ChevronRight
} from 'lucide-react';
import { PageHeader, DashboardCard, AnimatedContainer } from '../components';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
    getSalesReportPdf,
    getInventoryReportPdf,
    getChequeReportPdf,
    getUserReportPdf,
    getCreditCustomerReportPdf,
    getSupplierListReportPdf,
    getPurchaseOrderReportPdf,
    downloadBlob
} from '../api/reportsApi';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

export default function Reports() {
    const [salesDates, setSalesDates] = useState({ from: format(new Date(), 'yyyy-MM-01'), to: format(new Date(), 'yyyy-MM-dd') });
    const [invStatus, setInvStatus] = useState('ACTIVE');
    const [chequeStatus, setChequeStatus] = useState('PENDING');
    const [loading, setLoading] = useState(false);

    const downloadReport = async (requestFn, filename, successMessage, fallbackMessage) => {
        setLoading(true);
        try {
            const { data } = await requestFn();
            const downloaded = downloadBlob(data, filename);
            if (!downloaded) throw new Error('Unable to download report');
            toast.success(successMessage);
        } catch (error) {
            toast.error(fallbackMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadSales = async () => {
        return downloadReport(
            () => getSalesReportPdf(salesDates.from, salesDates.to),
            `POS_Analytics_${salesDates.from}_to_${salesDates.to}.pdf`,
            'POS report downloaded',
            'Failed to download POS report'
        );
    };

    const handleDownloadInventory = async () => {
        return downloadReport(
            () => getInventoryReportPdf(invStatus === 'ALL' ? null : invStatus),
            `Inventory_Ledger_${invStatus}.pdf`,
            'Inventory report downloaded',
            'Failed to download inventory report'
        );
    };

    const handleDownloadCheques = async () => {
        return downloadReport(
            () => getChequeReportPdf(chequeStatus === 'ALL' ? null : chequeStatus),
            `Liquidity_Report_${chequeStatus}.pdf`,
            'Cheque report downloaded',
            'Failed to download cheque report'
        );
    };

    const handleDownloadUsers = async () => {
        return downloadReport(
            () => getUserReportPdf(),
            'Users_Report.pdf',
            'User report downloaded',
            'Failed to download user report'
        );
    };

    const handleDownloadCreditCustomers = async () => {
        return downloadReport(
            () => getCreditCustomerReportPdf(),
            'Credit_Customers_Report.pdf',
            'Credit customer report downloaded',
            'Failed to download credit customer report'
        );
    };

    const handleDownloadSuppliers = async () => {
        return downloadReport(
            () => getSupplierListReportPdf(),
            'Supplier_List_Report.pdf',
            'Supplier report downloaded',
            'Failed to download supplier report'
        );
    };

    const handleDownloadPurchaseOrders = async () => {
        return downloadReport(
            () => getPurchaseOrderReportPdf(),
            'Purchase_Orders_Report.pdf',
            'Purchase order report downloaded',
            'Failed to download purchase order report'
        );
    };

    const reportCards = [
        {
            id: 'sales',
            title: "Financial Matrix",
            subtitle: "Historical POS checkout analysis and transactional audit logs",
            icon: BarChart3,
            color: 'emerald',
            action: handleDownloadSales,
            fields: (
                <div className="grid grid-cols-2 gap-4">
                    <Input type="date" label="Beginning Epoch" value={salesDates.from} onChange={(e) => setSalesDates({ ...salesDates, from: e.target.value })} className="bg-white dark:bg-slate-800" />
                    <Input type="date" label="Closing Epoch" value={salesDates.to} onChange={(e) => setSalesDates({ ...salesDates, to: e.target.value })} className="bg-white dark:bg-slate-800" />
                </div>
            )
        },
        {
            id: 'inventory',
            title: "Asset Inventory",
            subtitle: "Real-time stock valuation and reorder threshold monitoring",
            icon: Package,
            color: 'blue',
            action: handleDownloadInventory,
            fields: (
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lifecycle Filter</label>
                    <select 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                        value={invStatus}
                        onChange={(e) => setInvStatus(e.target.value)}
                    >
                        <option value="ACTIVE">OPERATIONAL ASSETS ONLY</option>
                        <option value="DISCONTINUED">ARCHIVED RECORD ONLY</option>
                        <option value="ALL">COMPLETE CATALOG MASTER</option>
                    </select>
                </div>
            )
        },
        {
            id: 'cheques',
            title: "Liquidity Audit",
            subtitle: "Instrument evolution tracking and bank realization analysis",
            icon: Wallet,
            color: 'amber',
            action: handleDownloadCheques,
            fields: (
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">instrument state</label>
                    <select 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                        value={chequeStatus}
                        onChange={(e) => setChequeStatus(e.target.value)}
                    >
                        <option value="PENDING">AWAITING CLEARANCE</option>
                        <option value="CLEARED">RECOGNIZED REVENUE</option>
                        <option value="BOUNCED">VOIDED / REJECTED</option>
                        <option value="ALL">GLOBAL LIQUIDITY ARCHIVE</option>
                    </select>
                </div>
            )
        },
        {
            id: 'users',
            title: 'Staff Registry',
            subtitle: 'Operator list and access baseline audit',
            icon: FileText,
            color: 'slate',
            action: handleDownloadUsers,
            fields: (
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                    Export the current staff directory as a PDF document.
                </div>
            )
        },
        {
            id: 'credit-customers',
            title: 'Credit Ledger',
            subtitle: 'Receivables snapshot and customer risk archive',
            icon: Wallet,
            color: 'indigo',
            action: handleDownloadCreditCustomers,
            fields: (
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                    Export all credit customer details, balances, and account state.
                </div>
            )
        },
        {
            id: 'suppliers',
            title: 'Supplier Ledger',
            subtitle: 'Vendor registry with contact and payable breakdown',
            icon: Package,
            color: 'amber',
            action: handleDownloadSuppliers,
            fields: (
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                    Export all suppliers with contact details, categories, and payable data.
                </div>
            )
        },
        {
            id: 'purchase-orders',
            title: 'Acquisition Orders',
            subtitle: 'Procurement trail and stock intake archive',
            icon: Receipt,
            color: 'rose',
            action: handleDownloadPurchaseOrders,
            fields: (
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                    Export the purchase order register as a PDF file.
                </div>
            )
        }
    ];

    return (
        <AnimatedContainer delay={0.1}>
            <PageHeader
                title="Operational Intelligence"
                subtitle="High-fidelity administrative reports and audit trails"
                icon={<ShieldCheck size={24} className="text-white" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                {reportCards.map((report) => (
                    <div key={report.id} className="group h-full">
                        <div className="h-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-brand-primary/5 hover:border-brand-primary/20 transition-all flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl bg-${report.color}-50 dark:bg-${report.color}-500/5 flex items-center justify-center text-${report.color}-500 transition-transform group-hover:scale-110`}>
                                    <report.icon size={28} />
                                </div>
                                <ArrowRight className="text-slate-200 dark:text-slate-800 group-hover:text-brand-primary transition-colors" />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight italic mb-2 leading-none">{report.title}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8">{report.subtitle}</p>
                                
                                <div className="space-y-6">
                                    {report.fields}
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-slate-50 dark:border-slate-800">
                                <Button
                                    variant="primary"
                                    className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 shadow-xl group-hover:scale-[1.02] transition-transform"
                                    onClick={report.action}
                                    disabled={loading}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <Download size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Generate Instrument PDF</span>
                                    </span>
                                </Button>
                                <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-center mt-4 italic">High-Fidelity PDF Realization</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Insights Placeholder */}
            <div className="mt-16 p-10 rounded-[3rem] bg-brand-primary/5 border border-brand-primary/10 border-dashed text-center">
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-6 text-brand-primary animate-pulse">
                    <BarChart3 size={24} />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Next-Gen Predictive Analysis</h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Machine learning driven forecasting and demand projection patterns coming soon...</p>
                <div className="mt-8 flex justify-center gap-4">
                    <div className="w-32 h-1 bg-brand-primary/20 rounded-full"></div>
                    <div className="w-16 h-1 bg-brand-primary/10 rounded-full"></div>
                    <div className="w-24 h-1 bg-brand-primary/5 rounded-full"></div>
                </div>
            </div>
        </AnimatedContainer>
    );
}
