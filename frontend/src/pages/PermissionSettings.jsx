import React, { useEffect, useState } from 'react';
import { 
    Shield, Save, RotateCcw, ShieldCheck, ShieldAlert, 
    Lock, ChevronRight, CheckCircle2, Info
} from 'lucide-react';
import { getCashierPermissions, bulkUpdateCashierPermissions } from '../api/permissionsApi';
import { toast } from 'react-toastify';
import { PageHeader, DashboardCard, AnimatedContainer } from '../components';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import Badge from '../components/ui/Badge';

const MODULE_LABELS = {
    DASHBOARD: 'Global Intelligence Hub',
    PRODUCTS: 'Catalog Selection',
    INVENTORY_CONVERT: 'Molecular Conversion',
    CREDIT_CUSTOMERS: 'Strategic Receivables',
    CHEQUES: 'Liquidity Evolution',
    SALES: 'POS Operations',
    SUPPLIERS: 'Fulfillment Network',
    PURCHASE_ORDERS: 'Sourcing Directives',
    TRASH: 'System Archive / Recycle',
    REPORTS: 'Operational Analytics'
};

export default function PermissionSettings() {
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const { data } = await getCashierPermissions();
            setPermissions(data.permissions || {});
        } catch (error) {
            toast.error('Failed to load access matrix');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const handleToggle = (moduleKey) => {
        setPermissions(prev => ({
            ...prev,
            [moduleKey]: !prev[moduleKey]
        }));
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await bulkUpdateCashierPermissions(permissions);
            toast.success('Access matrix synchronized');
        } catch (error) {
            toast.error('Matrix update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        fetchPermissions();
        toast.info('Matrix reset to last known state');
    };

    return (
        <AnimatedContainer delay={0.1}>
            <PageHeader
                title="Access Governance"
                subtitle="High-fidelity permission mapping for operational nodes"
                icon={<Shield size={24} className="text-white" />}
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="md"
                            onClick={handleReset}
                            disabled={loading || submitting}
                        >
                            <RotateCcw size={18} className="mr-2" /> 
                            Revert
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            onClick={handleSave}
                            disabled={loading || submitting}
                            loading={submitting}
                        >
                            <Save size={18} className="mr-2" /> 
                            Authorize
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
                <div className="lg:col-span-8">
                    <DashboardCard
                        title="Node Access Matrix"
                        subtitle="Define segment-specific visibility for the CASHIER role"
                    >
                        <div className="space-y-4">
                            {Object.entries(MODULE_LABELS).map(([key, label], index) => (
                                <div 
                                    key={key} 
                                    className={`
                                        flex items-center justify-between p-6 rounded-[2rem] transition-all
                                        ${permissions[key] 
                                            ? 'bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50' 
                                            : 'bg-white dark:bg-slate-900/50 border border-transparent opacity-80'}
                                    `}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${permissions[key] ? 'bg-brand-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            {permissions[key] ? <ShieldCheck size={24} /> : <Lock size={20} />}
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-black uppercase tracking-tight italic transition-colors ${permissions[key] ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                                                {label}
                                            </h4>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Module Descriptor: {key}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <Badge variant={permissions[key] ? 'success' : 'amber'} className="px-3 text-[9px]">
                                            {permissions[key] ? 'AUTHORIZED' : 'RESTRICTED'}
                                        </Badge>
                                        <Toggle 
                                            checked={!!permissions[key]} 
                                            onChange={() => handleToggle(key)}
                                            disabled={loading || submitting}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DashboardCard>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="p-10 rounded-[3rem] bg-slate-900 dark:bg-slate-950 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-brand-primary/20"></div>
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                                <ShieldAlert size={26} />
                            </div>
                            <h4 className="text-xl font-black italic uppercase tracking-tighter">Security Protocol</h4>
                        </div>
                        
                        <p className="text-sm font-medium text-slate-300 italic mb-8 leading-relaxed">
                            Restricting access to sensitive modules like <span className="text-white font-black">Financial Reports</span>, <span className="text-white font-black">Recycle Bin</span>, and <span className="text-white font-black">Supplier Network</span> maintains high data integrity and prevents unauthorized leakage.
                        </p>

                        <div className="flex items-center gap-2 group/tip">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary group-hover/tip:scale-150 transition-transform"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Handshake Required</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 block italic">* Mutations take effect upon the next node re-authentication or page refresh.</p>
                    </div>

                    <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-none shadow-none">
                        <div className="flex items-center gap-3 mb-6">
                            <Info size={16} className="text-brand-primary" />
                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Access Topology</h5>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Role</span>
                                <Badge variant="brand" className="text-[9px] bg-slate-50 dark:bg-slate-800 border-none">CASHIER</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enforcement</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase italic">Server-Side Layer</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AnimatedContainer>
    );
}
