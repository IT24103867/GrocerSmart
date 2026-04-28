import React, { useState, useMemo } from 'react';
import { 
    Plus, Edit, Trash2, CreditCard, Eye, EyeOff, FileText, 
    Search, X, Landmark, TrendingUp, Wallet, UserPlus
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { getCustomers, createCustomer, updateCustomer, deleteCustomer, addPayment, getCreditCustomersSummary, calculateCustomerRisk } from '../api/creditCustomersApi';
import { getCustomerLedgerPdf, getCustomerProfilePdf, getCreditCustomerReportPdf, downloadBlob } from '../api/reportsApi';
import { getApiErrorMessage } from '../utils/apiError';

import { PageHeader, DataTable, FormDialog, ConfirmDialog, StatusChip, DashboardCard, AnimatedContainer, CreditCustomerDetailsDialog, KpiCard } from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const initialFormData = {
    name: '',
    phone: '',
    address: '',
    creditLimit: '',
    paymentTermsDays: 30,
    authorizedThreshold: 0,
    customerType: 'CREDIT'
};

const NAME_REGEX = /^[a-zA-Z\s]+$/;
const PHONE_REGEX = /^[+]?[\d\s-]{9,15}$/;
const ADDRESS_REGEX = /^[a-zA-Z0-9\s,./\-#]+$/;

export default function CreditCustomers() {
    const queryClient = useQueryClient();

    const getCustomerId = (customer) => customer?.id || customer?._id;

    // Table & Filter State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ACTIVE');
    const [orderBy, setOrderBy] = useState('id');
    const [orderDirection, setOrderDirection] = useState('desc');

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedAiRisk, setSelectedAiRisk] = useState(null);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [paymentData, setPaymentData] = useState({ customerId: null, amount: 0, note: '', currentBalance: 0 });

    // Data Fetching
    const { data, isLoading } = useQuery({
        queryKey: ['creditCustomers', page, rowsPerPage, search, statusFilter, orderBy, orderDirection],
        queryFn: async () => {
            const params = {
                page,
                size: rowsPerPage,
                search: search || undefined,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                sort: `${orderBy},${orderDirection}`
            };
            const response = await getCustomers(params);
            return response.data || response;
        },
        keepPreviousData: true
    });

    const { data: summaryData, isLoading: summaryLoading } = useQuery({
        queryKey: ['creditCustomers', 'summary'],
        queryFn: async () => {
            const res = await getCreditCustomersSummary();
            return res.data || res;
        }
    });

    const customers = data?.content || [];
    const totalCount = data?.totalElements || 0;

    // Mutations — all validation done by the backend
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries(['creditCustomers']);
            setDialogOpen(false);
            setPaymentDialogOpen(false);
            setDeleteDialogOpen(false);
            setEditId(null);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Operation failed'));
        }
    };

    const createMutation = useMutation({ mutationFn: createCustomer, ...mutationOptions, onSuccess: () => { toast.success('Customer added successfully'); mutationOptions.onSuccess(); } });
    const updateMutation = useMutation({ mutationFn: (data) => updateCustomer(editId || data.id, data), ...mutationOptions, onSuccess: () => { toast.success('Customer updated'); mutationOptions.onSuccess(); } });
    const deleteMutation = useMutation({ mutationFn: deleteCustomer, ...mutationOptions, onSuccess: () => { toast.success('Customer deleted'); mutationOptions.onSuccess(); } });
    const paymentMutation = useMutation({
        mutationFn: (data) => addPayment(data.customerId, { amount: data.amount, note: data.note }),
        ...mutationOptions,
        onSuccess: () => { toast.success('Payment recorded'); mutationOptions.onSuccess(); }
    });

    const aiRiskMutation = useMutation({
        mutationFn: ({ id }) => calculateCustomerRisk(id),
        onSuccess: (res, variables) => {
            const payload = res?.data || res || {};
            setSelectedAiRisk(payload);

            if (!variables?.silent) {
                const modelRisk = payload.aiModelRisk || payload.riskStatus || 'Unknown';
                const score = Number(payload.aiRiskScore || 0);
                toast.success(`AI risk fetched: ${modelRisk} (${score}%)`);
            }

            queryClient.invalidateQueries(['creditCustomers']);

            setSelectedCustomer((prev) => {
                if (!prev) return prev;
                if (getCustomerId(prev) !== variables.id) return prev;
                return {
                    ...prev,
                    aiRiskScore: payload.aiRiskScore,
                    riskStatus: payload.riskStatus
                };
            });
        },
        onError: (error, variables) => {
            if (!variables?.silent) {
                toast.error(getApiErrorMessage(error, 'Failed to fetch AI risk'));
            }
        }
    });

    const handleOpenDetails = (customer) => {
        setSelectedCustomer(customer);
        setSelectedAiRisk(null);
        setDetailsOpen(true);
        aiRiskMutation.mutate({ id: getCustomerId(customer), silent: true });
    };

    // Handlers
    const handleOpenDialog = (customer = null) => {
        if (customer) {
            setEditId(getCustomerId(customer));
            setFormData({
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                creditLimit: customer.creditLimit,
                paymentTermsDays: customer.paymentTermsDays || 30,
                authorizedThreshold: customer.authorizedThreshold || 0,
                customerType: customer.customerType || 'CREDIT'
            });
        } else {
            setEditId(null);
            setFormData(initialFormData);
        }
        setDialogOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const name = String(formData.name || '').trim();
        const phone = String(formData.phone || '').trim();
        const address = String(formData.address || '').trim();
        const creditLimit = Number(formData.creditLimit);
        const paymentTermsDays = Number(formData.paymentTermsDays);

        if (!name) return toast.error('Customer name is required');
        if (!NAME_REGEX.test(name)) return toast.error('Customer name must contain only letters');
        if (!phone) return toast.error('Phone number is required');
        if (!PHONE_REGEX.test(phone)) return toast.error('Please enter a valid phone number');
        if (!address) return toast.error('Address is required');
        if (!ADDRESS_REGEX.test(address)) return toast.error('Address must contain only letters, numbers, and common characters');

        if (!Number.isFinite(creditLimit) || creditLimit <= 0) {
            return toast.error('Credit limit must be greater than 0');
        }

        if (!Number.isInteger(paymentTermsDays) || paymentTermsDays < 1 || paymentTermsDays > 365) {
            return toast.error('Payment terms must be between 1 and 365 days');
        }

        const payload = {
            ...formData,
            name,
            phone,
            address,
            creditLimit,
            paymentTermsDays
        };

        if (editId) updateMutation.mutate(payload);
        else createMutation.mutate(payload);
    };

    // Payment validation remains minimal (UX feedback before sending)
    const handlePaymentSubmit = (e) => {
        e.preventDefault();

        if (!paymentData.customerId) {
            toast.error('Customer is required for payment');
            return;
        }

        if (Number(paymentData.amount || 0) <= 0) {
            toast.error('Payment amount must be greater than zero');
            return;
        }

        paymentMutation.mutate(paymentData);
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && orderDirection === 'asc';
        setOrderDirection(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleExportAll = async () => {
        try {
            const res = await getCreditCustomerReportPdf();
            downloadBlob(res.data, `Credit_Customers_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Report downloaded');
        } catch (e) { toast.error('Export failed'); }
    };

    const formatCurrency = (val) => `Rs.${Number(val || 0).toLocaleString()}`;

    const columns = useMemo(() => [
        { id: 'name', label: 'Customer Name', minWidth: '200px', sortable: true, render: (val) => <span className="font-bold text-slate-800 dark:text-slate-200">{val}</span> },
        { id: 'phone', label: 'Phone', minWidth: '120px', sortable: true, render: (val) => <span className="font-bold text-slate-500 dark:text-slate-400">{val || '—'}</span> },
        {
            id: 'creditLimit', label: 'Credit Limit', minWidth: '130px', align: 'right', sortable: true,
            render: (val) => <span className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(val)}</span>
        },
        {
            id: 'outstandingBalance', label: 'Outstanding', minWidth: '130px', align: 'right', sortable: true,
            render: (val) => (
                <span className={`font-black text-base ${Number(val) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {formatCurrency(val)}
                </span>
            )
        },
        {
            id: 'availableCredit', label: 'Available', minWidth: '130px', align: 'right', sortable: false,
            render: (_, row) => {
                const available = Math.max(0, Number(row.creditLimit || 0) - Number(row.outstandingBalance || 0));
                return <span className="font-bold text-slate-400 dark:text-slate-500">{formatCurrency(available)}</span>;
            }
        },
        { id: 'status', label: 'Status', minWidth: '100px', align: 'center', sortable: true, render: (val) => <StatusChip status={val} /> }
    ], []);

    return (
        <AnimatedContainer>
            <PageHeader
                title="Credit Customers" 
                subtitle="Manage credit accounts and outstanding balances"
                icon={<Landmark size={24} className="text-white" />}
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" onClick={handleExportAll}><FileText size={18} className="mr-2" /> Export Report</Button>
                        <Button variant="primary" size="md" onClick={() => handleOpenDialog()}><UserPlus size={18} className="mr-2" /> Add Customer</Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <KpiCard title="Total Outstanding" value={formatCurrency(summaryData?.totalOutstanding)} icon={TrendingUp} color="error" loading={summaryLoading} />
                <KpiCard title="Total Credit Limit" value={formatCurrency(summaryData?.totalLimit)} icon={Landmark} color="primary" loading={summaryLoading} />
                <KpiCard title="Available Credit" value={formatCurrency(summaryData?.totalAvailable)} icon={Wallet} color="success" loading={summaryLoading} />
            </div>

            <DashboardCard title="Credit Ledger" className="mt-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div className="w-full md:w-96">
                        <Input
                            placeholder="Search by name, phone, ID..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            className="bg-slate-50 dark:bg-slate-800/20"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        {['ACTIVE', 'INACTIVE', 'ALL'].map((status) => (
                            <button
                                key={status}
                                onClick={() => { setStatusFilter(status); setPage(0); }}
                                className={`
                                    px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all
                                    ${statusFilter === status 
                                        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
                                `}
                            >
                                {status === 'ALL' ? 'All' : status}
                            </button>
                        ))}
                    </div>
                </div>

                <DataTable
                    serverSide columns={columns} data={customers} loading={isLoading}
                    totalCount={totalCount} page={page} rowsPerPage={rowsPerPage}
                    onPageChange={setPage} onRowsPerPageChange={setRowsPerPage}
                    orderBy={orderBy} orderDirection={orderDirection} onSortChange={handleSort}
                    actions={(row) => (
                        <div className="flex items-center gap-1 group">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDetails(row)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 h-9 w-9 p-0">
                                <Eye size={16} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => aiRiskMutation.mutate({ id: getCustomerId(row) })}
                                className="text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 h-9 w-9 p-0"
                                title="Fetch AI risk"
                            >
                                <TrendingUp size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(row)} className="text-emerald-500 hover:bg-emerald-50 h-9 w-9 p-0">
                                <Edit size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setPaymentData({ customerId: getCustomerId(row), amount: 0, note: '', currentBalance: Number(row.outstandingBalance || 0) }); setPaymentDialogOpen(true); }} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 h-9 w-9 p-0">
                                <CreditCard size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate({ ...row, status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })} className={row.status === 'ACTIVE' ? 'text-amber-500 h-9 w-9 p-0' : 'text-slate-400 h-9 w-9 p-0'}>
                                {row.status === 'ACTIVE' ? <EyeOff size={16} /> : <Eye size={16} />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setDeleteId(getCustomerId(row)); setDeleteDialogOpen(true); }} className="text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 h-9 w-9 p-0">
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    )}
                />
            </DashboardCard>

            {/* Add/Edit Customer Dialog */}
            <FormDialog 
                open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit} 
                title={editId ? 'Edit Customer' : 'Add Customer'} 
                subtitle={editId ? 'Update customer information' : 'Create a new credit account'}
                loading={createMutation.isPending || updateMutation.isPending}
                maxWidth="max-w-3xl"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                    <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required autoFocus placeholder="Customer name" />
                    <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+94 77 000 0000" required />
                    <div className="md:col-span-2">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1 mb-1.5 block">Address</label>
                        <textarea 
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-brand-primary/20 min-h-[80px]"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Customer address"
                        />
                    </div>
                    <Input type="number" label="Credit Limit (Rs.)" value={formData.creditLimit} onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })} required min="0" />
                    <Input type="number" label="Payment Terms (Days)" value={formData.paymentTermsDays} onChange={(e) => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) || 0 })} required />
                    
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Customer Type</label>
                        <select 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                            value={formData.customerType}
                            onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                        >
                            <option value="CREDIT">Credit Account</option>
                            <option value="CASH">Cash Account</option>
                        </select>
                    </div>
                </div>
            </FormDialog>

            {/* Record Payment Dialog */}
            <FormDialog
                open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} onSubmit={handlePaymentSubmit}
                title="Record Payment" 
                subtitle="Settle outstanding balance" 
                loading={paymentMutation.isPending}
                submitDisabled={paymentData.amount <= 0}
                submitText="Record Payment" 
                maxWidth="max-w-md"
            >
                <div className="space-y-6 p-1">
                    <Input 
                        type="number" label="Payment Amount (Rs.)" 
                        value={paymentData.amount || ''} 
                        onChange={(e) => setPaymentData({ ...paymentData, amount: Math.max(0, parseFloat(e.target.value) || 0) })} 
                        required autoFocus 
                        min="0"
                        step="0.01"
                        helperText={`Outstanding balance: ${formatCurrency(paymentData.currentBalance)}`} 
                    />
                    
                    <div className="p-6 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white border border-white/5 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
                            <span>Payment Summary</span>
                            <Landmark size={14} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold opacity-60">Current Balance</span>
                                <span className="font-bold">{formatCurrency(paymentData.currentBalance)}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-400">
                                <span className="text-xs font-bold">Payment</span>
                                <span className="font-bold">- {formatCurrency(paymentData.amount)}</span>
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                <span className="text-sm font-black uppercase tracking-tighter">Remaining</span>
                                <span className="text-2xl font-black text-emerald-400">{formatCurrency(Math.max(0, paymentData.currentBalance - paymentData.amount))}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-1">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1 mb-1.5 block">Note (optional)</label>
                        <textarea 
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-brand-primary/20 min-h-[80px] text-sm"
                            placeholder="Add reference, cheque number, etc..."
                            value={paymentData.note}
                            onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                        />
                    </div>
                </div>
            </FormDialog>

            <ConfirmDialog 
                open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={() => deleteMutation.mutate(deleteId)} 
                title="Delete Customer" 
                message="Are you sure you want to delete this customer? This action cannot be undone." 
                severity="error" loading={deleteMutation.isPending} 
            />

            <CreditCustomerDetailsDialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                customer={selectedCustomer}
                aiRiskData={selectedAiRisk}
                aiRiskLoading={aiRiskMutation.isPending}
                onFetchAiRisk={(row) => aiRiskMutation.mutate({ id: getCustomerId(row) })}
                onEdit={(row) => { setDetailsOpen(false); handleOpenDialog(row); }}
                onPay={(row) => {
                    setDetailsOpen(false);
                    setPaymentData({ customerId: getCustomerId(row), amount: 0, note: '', currentBalance: Number(row.outstandingBalance || 0) });
                    setPaymentDialogOpen(true);
                }}
                onDelete={(id) => { setDetailsOpen(false); setDeleteId(id); setDeleteDialogOpen(true); }}
                onStatusToggle={(row) => updateMutation.mutate({ ...row, status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
            />
        </AnimatedContainer>
    );
}
