import React, { useState } from 'react';
import { 
    Trash2, AlertTriangle, ShieldAlert, History, Key, 
    Settings as SettingsIcon, ArrowRight, ShieldCheck, 
    Database, RefreshCw, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { resetSystem } from '../api/admin';
import { AnimatedContainer, DashboardCard, ConfirmDialog, PageHeader } from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { getApiErrorMessage } from '../utils/apiError';

export default function Settings() {
    const navigate = useNavigate();
    const [confirmText, setConfirmText] = useState('');
    const [openConfirm, setOpenConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (confirmText !== 'RESET') {
            toast.error("Please type 'RESET' exactly to confirm.");
            return;
        }

        setLoading(true);
        try {
            await resetSystem(confirmText);
            toast.success("System reset successfully. All data wiped except Admin.");
            setOpenConfirm(false);
            
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/login';
            }, 2000);
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'System reset failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatedContainer>
            <PageHeader 
                title="System Governance" 
                subtitle="Advanced administrative controls and data lifecycle management"
                icon={<SettingsIcon size={24} className="text-white" />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
                {/* Critical Controls */}
                <div className="lg:col-span-2 space-y-8">
                    <DashboardCard 
                        title="Factory Reset Protocol" 
                        subtitle="DANGER ZONE: Permanent erasure of all operational data"
                        className="border-red-100 dark:border-red-900/30"
                    >
                        <div className="space-y-6">
                            <div className="p-6 rounded-[2.5rem] bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 flex items-start gap-4">
                                <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
                                <div>
                                    <h4 className="text-base font-black text-red-600 dark:text-red-400 uppercase tracking-tight italic">Destructive Operation Warning</h4>
                                    <p className="text-xs font-bold text-red-500/70 uppercase tracking-widest mt-1 leading-relaxed">
                                        Performing a system reset will permanently delete all <span className="text-red-600 font-black">Orders, POS Transactions, Products, Customers, Cheques, and Suppliers</span>. 
                                        The primary admin account will be preserved. This action cannot be reversed.
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900/50 border border-red-100 dark:border-red-900/30 shadow-xl shadow-red-500/5">
                                <div className="flex flex-col md:flex-row items-end gap-6">
                                    <div className="flex-1 w-full">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Confirmation Cipher</label>
                                        <Input 
                                            placeholder="Type 'RESET' to authorize" 
                                            value={confirmText} 
                                            onChange={(e) => setConfirmText(e.target.value)}
                                            className="bg-slate-50 dark:bg-slate-950 border-red-100 focus:ring-red-500/20"
                                        />
                                    </div>
                                    <Button 
                                        variant="primary" 
                                        className={`px-10 py-4 h-[52px] ${confirmText === 'RESET' ? 'bg-red-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'} transition-all`}
                                        disabled={confirmText !== 'RESET'}
                                        onClick={() => setOpenConfirm(true)}
                                    >
                                        <Trash2 size={18} className="mr-2" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Execute Wipe</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DashboardCard>

                    <DashboardCard 
                        title="Staff Access Architecture" 
                        subtitle="Granular permission mapping for the Cashier network"
                    >
                        <div className="space-y-6">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 italic">
                                Define segment-specific visibility (Inventory, Financials, Audit Logs) for secondary terminals and floor staff.
                            </p>
                            
                            <div className="p-8 rounded-[2.5rem] bg-brand-primary/5 border border-brand-primary/10 border-dashed flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <ShieldAlert size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-brand-primary uppercase tracking-tight italic">CASHIER ROLE PRIVILEGES</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Global configuration for floor terminals</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="primary" 
                                    size="md" 
                                    onClick={() => navigate('/settings/permissions')}
                                    className="px-8"
                                >
                                    <ShieldCheck size={18} className="mr-2" />
                                    Configure Node Access
                                </Button>
                            </div>
                        </div>
                    </DashboardCard>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <Card title="Maintenance Logs" className="bg-slate-50/50 dark:bg-slate-900/50 border-none shadow-none">
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Admin Preservation</h5>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">System root credentials and UID are shielded from reset operations.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <RefreshCw size={20} />
                                </div>
                                <div>
                                    <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Cache Invalidation</h5>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">Wipe procedure triggers instant JWT invalidation across all nodes.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                    <Trash2 size={20} />
                                </div>
                                <div>
                                    <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Archive Purge</h5>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">Deleted records and recycle bin blobs are physically wiped.</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="p-8 rounded-[2.5rem] bg-slate-900 dark:bg-slate-950 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <AlertCircle className="text-brand-primary mb-4" size={24} />
                        <h4 className="text-lg font-black italic uppercase tracking-tighter">System Health</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 group-hover:text-white transition-colors">v1.2.4-STABLE</p>
                        <div className="mt-6 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400">Node Sync</span>
                            <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-none px-3">ENCRYPTED</Badge>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
                onConfirm={handleReset}
                title="Confirm System Reset"
                message="This will permanently delete all data except the admin account. This action cannot be undone."
                confirmText="Reset System"
                loading={loading}
                severity="error"
            />
        </AnimatedContainer>
    );
}
