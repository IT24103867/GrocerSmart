import React, { useState } from 'react';
import { 
    Trash2, RotateCcw, ShieldAlert, History, Users, 
    ShoppingBag, Truck, CreditCard, Receipt, Wallet, 
    Landmark, Trash, Info, CheckCircle2, AlertTriangle, 
    X, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { 
    useDeletedUsers, useRestoreUser, useDeleteUserPermanent,
    useDeletedProducts, useRestoreProduct, useDeleteProductPermanent,
    useDeletedSuppliers, useRestoreSupplier, useDeleteSupplierPermanent,
    useDeletedCustomers, useRestoreCustomer, useDeleteCustomerPermanent,
    useDeletedOrders, useRestoreOrder, useDeleteOrderPermanent,
    useDeletedSales, useRestoreSale, useDeleteSalePermanent,
    useDeletedCheques, useRestoreCheque, useDeleteChequePermanent
} from '../hooks/useTrash';
import { motion } from 'framer-motion';

import { 
    AnimatedContainer, DashboardCard, DataTable, 
    ConfirmDialog, PageHeader 
} from '../components';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const TABS = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'customers', label: 'Credit Clients', icon: CreditCard },
    { id: 'orders', label: 'Direct Orders', icon: Receipt },
    { id: 'sales', label: 'POS Logs', icon: Wallet },
    { id: 'cheques', label: 'Instruments', icon: Landmark }
];

export default function TrashPage() {
    const [tabIndex, setTabIndex] = useState(0);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState(null); 
    const [selectedItem, setSelectedItem] = useState(null);

    // Queries
    const usersQ = useDeletedUsers();
    const productsQ = useDeletedProducts();
    const suppliersQ = useDeletedSuppliers();
    const customersQ = useDeletedCustomers();
    const ordersQ = useDeletedOrders();
    const salesQ = useDeletedSales();
    const chequesQ = useDeletedCheques();

    // Mutations
    const restoreUser = useRestoreUser();
    const deleteUser = useDeleteUserPermanent();
    const restoreProduct = useRestoreProduct();
    const deleteProduct = useDeleteProductPermanent();
    const restoreSupplier = useRestoreSupplier();
    const deleteSupplier = useDeleteSupplierPermanent();
    const restoreCustomer = useRestoreCustomer();
    const deleteCustomer = useDeleteCustomerPermanent();
    const restoreOrder = useRestoreOrder();
    const deleteOrder = useDeleteOrderPermanent();
    const restoreSale = useRestoreSale();
    const deleteSale = useDeleteSalePermanent();
    const restoreCheque = useRestoreCheque();
    const deleteCheque = useDeleteChequePermanent();

    const handleAction = (type, item) => {
        setSelectedItem(item);
        setConfirmType(type);
        setConfirmOpen(true);
    };

    const getRegistryId = (row) => {
        if (!row) return '—';
        return row.publicId || row.invoiceNo || row.chequeNumber || row.SKU || row.username || row.name || row.id || '—';
    };

    const getPrimaryLabel = (row) => {
        if (!row) return '—';
        return row.name || row.fullName || row.title || row.chequeNumber || row.invoiceNo || row.publicId || row.id || '—';
    };

    const getSecondaryLabel = (row) => {
        if (!row) return '—';
        const parts = [
            row.category,
            row.phone,
            row.email,
            row.contactPerson,
            row.bankName,
            row.branch,
            row.paymentType,
            row.status
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(' | ') : '—';
    };

    const getColumns = () => {
        const baseColumns = [
            {
                id: 'registryId',
                label: 'Registry ID',
                minWidth: '180px',
                render: (_, row) => <span className="font-black text-brand-primary uppercase tracking-tighter italic text-sm">{getRegistryId(row)}</span>
            },
            {
                id: 'primaryLabel',
                label: 'Registry Identity',
                minWidth: '220px',
                render: (_, row) => <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter italic text-sm">{getPrimaryLabel(row)}</span>
            },
            {
                id: 'description',
                label: 'Legacy Metadata',
                minWidth: '250px',
                render: (_, row) => <span className="text-xs font-bold text-slate-400 uppercase tracking-tight italic line-clamp-1">{getSecondaryLabel(row)}</span>
            },
            {
                id: 'deletedAt',
                label: 'Decommissioned',
                minWidth: '180px',
                render: (val) => <span className="text-xs font-black text-red-400 uppercase tracking-widest">{val ? format(new Date(val), 'MMM dd, HH:mm') : '—'}</span>
            },
            {
                id: 'status',
                label: 'State',
                minWidth: '100px',
                align: 'center',
                render: () => <Badge variant="error" className="px-3 text-[9px]">DELETED</Badge>
            }
        ];

        if (tabIndex === 4) {
            return [
                {
                    id: 'registryId',
                    label: 'Registry ID',
                    minWidth: '180px',
                    render: (_, row) => <span className="font-black text-brand-primary uppercase tracking-tighter italic text-sm">{row.publicId || row.invoiceNo || row.id || '—'}</span>
                },
                {
                    id: 'summary',
                    label: 'Direct Order',
                    minWidth: '240px',
                    render: (_, row) => <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter italic text-sm">{row.publicId || row.invoiceNo || row.id || '—'}</span>
                },
                {
                    id: 'description',
                    label: 'Legacy Metadata',
                    minWidth: '250px',
                    render: (_, row) => <span className="text-xs font-bold text-slate-400 uppercase tracking-tight italic line-clamp-1">{[row.paymentType, row.status, row.supplierId].filter(Boolean).join(' | ') || '—'}</span>
                },
                {
                    id: 'deletedAt',
                    label: 'Decommissioned',
                    minWidth: '180px',
                    render: (val) => <span className="text-xs font-black text-red-400 uppercase tracking-widest">{val ? format(new Date(val), 'MMM dd, HH:mm') : '—'}</span>
                },
                {
                    id: 'status',
                    label: 'State',
                    minWidth: '100px',
                    align: 'center',
                    render: () => <Badge variant="error" className="px-3 text-[9px]">DELETED</Badge>
                }
            ];
        }

        if (tabIndex === 5) {
            return [
                {
                    id: 'registryId',
                    label: 'Registry ID',
                    minWidth: '180px',
                    render: (_, row) => <span className="font-black text-brand-primary uppercase tracking-tighter italic text-sm">{row.invoiceNo || row.publicId || row.id || '—'}</span>
                },
                {
                    id: 'summary',
                    label: 'POS Invoice',
                    minWidth: '220px',
                    render: (_, row) => <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter italic text-sm">{row.invoiceNo || row.publicId || row.id || '—'}</span>
                },
                {
                    id: 'description',
                    label: 'Legacy Metadata',
                    minWidth: '250px',
                    render: (_, row) => <span className="text-xs font-bold text-slate-400 uppercase tracking-tight italic line-clamp-1">{[row.paymentType, row.status, row.note].filter(Boolean).join(' | ') || '—'}</span>
                },
                {
                    id: 'deletedAt',
                    label: 'Decommissioned',
                    minWidth: '180px',
                    render: (val) => <span className="text-xs font-black text-red-400 uppercase tracking-widest">{val ? format(new Date(val), 'MMM dd, HH:mm') : '—'}</span>
                },
                {
                    id: 'status',
                    label: 'State',
                    minWidth: '100px',
                    align: 'center',
                    render: () => <Badge variant="error" className="px-3 text-[9px]">DELETED</Badge>
                }
            ];
        }

        if (tabIndex === 6) {
            return [
                {
                    id: 'registryId',
                    label: 'Registry ID',
                    minWidth: '180px',
                    render: (_, row) => <span className="font-black text-brand-primary uppercase tracking-tighter italic text-sm">{row.chequeNumber || row.publicId || row.id || '—'}</span>
                },
                {
                    id: 'summary',
                    label: 'Instrument',
                    minWidth: '220px',
                    render: (_, row) => <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter italic text-sm">{row.chequeNumber || row.publicId || row.id || '—'}</span>
                },
                {
                    id: 'bankName',
                    label: 'Bank',
                    minWidth: '180px',
                    render: (_, row) => <span className="text-xs font-bold text-slate-400 uppercase tracking-tight italic line-clamp-1">{row.bankName || '—'}</span>
                },
                {
                    id: 'branch',
                    label: 'Branch',
                    minWidth: '180px',
                    render: (_, row) => <span className="text-xs font-bold text-slate-400 uppercase tracking-tight italic line-clamp-1">{row.branch || '—'}</span>
                },
                {
                    id: 'description',
                    label: 'Legacy Metadata',
                    minWidth: '200px',
                    render: (_, row) => <span className="text-xs font-bold text-slate-400 uppercase tracking-tight italic line-clamp-1">{row.status || '—'}</span>
                },
                {
                    id: 'deletedAt',
                    label: 'Decommissioned',
                    minWidth: '180px',
                    render: (val) => <span className="text-xs font-black text-red-400 uppercase tracking-widest">{val ? format(new Date(val), 'MMM dd, HH:mm') : '—'}</span>
                },
                {
                    id: 'status',
                    label: 'State',
                    minWidth: '100px',
                    align: 'center',
                    render: () => <Badge variant="error" className="px-3 text-[9px]">DELETED</Badge>
                }
            ];
        }

        return baseColumns;
    };

    const handleConfirm = async () => {
        if (!selectedItem || !confirmType) return;
        const selectedItemId = selectedItem.id || selectedItem._id;
        if (!selectedItemId) return;

        let mutation;
        let query;

        switch (tabIndex) {
            case 0: mutation = confirmType === 'restore' ? restoreUser : deleteUser; query = usersQ; break;
            case 1: mutation = confirmType === 'restore' ? restoreProduct : deleteProduct; query = productsQ; break;
            case 2: mutation = confirmType === 'restore' ? restoreSupplier : deleteSupplier; query = suppliersQ; break;
            case 3: mutation = confirmType === 'restore' ? restoreCustomer : deleteCustomer; query = customersQ; break;
            case 4: mutation = confirmType === 'restore' ? restoreOrder : deleteOrder; query = ordersQ; break;
            case 5: mutation = confirmType === 'restore' ? restoreSale : deleteSale; query = salesQ; break;
            case 6: mutation = confirmType === 'restore' ? restoreCheque : deleteCheque; query = chequesQ; break;
            default: break;
        }

        if (mutation) {
            try {
                await mutation.mutateAsync(selectedItemId);
                if (query?.refetch) await query.refetch();
                setConfirmOpen(false);
                setSelectedItem(null);
            } catch (error) {}
        }
    };

    const getCurrentData = () => {
        switch (tabIndex) {
            case 0: return usersQ.data || [];
            case 1: return productsQ.data || [];
            case 2: return suppliersQ.data || [];
            case 3: return customersQ.data || [];
            case 4: return ordersQ.data || [];
            case 5: return salesQ.data || [];
            case 6: return chequesQ.data || [];
            default: return [];
        }
    };

    const getCurrentLoading = () => {
        switch (tabIndex) {
            case 0: return usersQ.isLoading;
            case 1: return productsQ.isLoading;
            case 2: return suppliersQ.isLoading;
            case 3: return customersQ.isLoading;
            case 4: return ordersQ.isLoading;
            case 5: return salesQ.isLoading;
            case 6: return chequesQ.isLoading;
            default: return false;
        }
    };

    const entityName = TABS[tabIndex].label;

    return (
        <AnimatedContainer>
            <PageHeader 
                title="System Archive" 
                subtitle="Lifecycle management for decommissioned operational entities"
                icon={<Trash2 size={24} className="text-white" />}
            />

            <div className="mt-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[700px]">
                <div className="flex items-center bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-50 dark:border-slate-800 overflow-x-auto no-scrollbar scroll-smooth">
                    {TABS.map((tab, i) => (
                        <button
                            key={tab.id}
                            onClick={() => setTabIndex(i)}
                            className={`
                                flex items-center gap-3 py-6 px-10 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] transition-all relative
                                ${tabIndex === i 
                                    ? 'bg-white dark:bg-slate-900 text-brand-primary shadow-sm border-b border-brand-primary' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
                            `}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                            {tabIndex === i && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary" />}
                        </button>
                    ))}
                </div>

                <div className="p-10 flex-1">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/5 flex items-center justify-center text-red-500">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h4 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight italic">{entityName} ARCHIVE</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Records awaiting permanent purging or molecular restoration</p>
                            </div>
                        </div>
                    </div>

                    <DataTable
                        columns={getColumns()}
                        data={getCurrentData()}
                        loading={getCurrentLoading()}
                        emptyTitle={`Archive Cleared for ${entityName}`}
                        emptyDescription={`No decommissioned ${entityName.toLowerCase()} specimens found in the registry.`}
                        actions={(row) => (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleAction('restore', row)}
                                    className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                    title="Restore Registry Entry"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button 
                                    onClick={() => handleAction('delete', row)}
                                    className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                    title="Permanent Purge Protocol"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    />
                </div>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
                title={confirmType === 'restore' ? `Restore Entity?` : `Authorize Permanent Purge?`}
                message={
                    confirmType === 'restore'
                        ? `Are you certain you wish to restore "${selectedItem?.name}"? The specimen will be reintegrated into the operational matrix.`
                        : `AUTHORIZATION WARNING: This protocol will permanently wipe "${selectedItem?.name}" from memory. This action is irreversible.`
                }
                confirmText={confirmType === 'restore' ? "Restore Identity" : "Execute Global Wipe"}
                severity={confirmType === 'restore' ? "info" : "error"}
            />
        </AnimatedContainer>
    );
}
