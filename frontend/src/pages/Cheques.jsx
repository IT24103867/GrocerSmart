import React, { useState, useMemo } from 'react';
import { 
    Plus, Edit, Landmark, Eye, FileText, 
    CheckCircle2, AlertTriangle, Clock, Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

import { getCheques, createCheque, updateCheque, updateChequeStatus, deleteCheque, getChequesSummary } from '../api/chequesApi';
import { getCreditCustomers } from '../api/creditCustomersApi';
import { getChequeReportPdf, downloadBlob } from '../api/reportsApi';
import { getApiErrorMessage } from '../utils/apiError';

import { PageHeader, DataTable, FormDialog, ConfirmDialog, DashboardCard, AnimatedContainer, GenericDetailsDialog, KpiCard } from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Autocomplete from '../components/ui/Autocomplete';

const initialFormData = {
    chequeNumber: '',
    customerId: '',
    bankName: '',
    branch: '',
    chequeType: 'Incoming',
    amount: 0,
    issueDate: '',
    dueDate: '',
    status: 'PENDING',
    note: '',
};

const CHEQUE_TEXT_REGEX = /^[a-zA-Z0-9\s&()\-/.#,]+$/;
const CHEQUE_NUMBER_REGEX = /^\d{6}$/;

export default function Cheques() {
    const queryClient = useQueryClient();

    // Table & Filter State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [orderBy, setOrderBy] = useState('id');
    const [orderDirection, setOrderDirection] = useState('desc');

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedCheque, setSelectedCheque] = useState(null);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [statusData, setStatusData] = useState({ id: null, status: '', depositDate: '', clearedDate: '', bouncedDate: '', bounceReason: '' });

    // Data Fetching
    const { data: chequeData, isLoading } = useQuery({
        queryKey: ['cheques', page, rowsPerPage, search, statusFilter, orderBy, orderDirection],
        queryFn: async () => {
            const params = {
                page,
                size: rowsPerPage,
                search: search || undefined,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                sort: `${orderBy},${orderDirection}`
            };
            const res = await getCheques(params);
            return res.data || res;
        },
        keepPreviousData: true
    });

    const { data: customerData } = useQuery({
        queryKey: ['creditCustomers', 'active'],
        queryFn: async () => {
            const res = await getCreditCustomers({ status: 'ACTIVE', size: 1000 });
            const data = res.data || res;
            return Array.isArray(data) ? data : (data.content || []);
        }
    });

    const { data: summaryData, isLoading: summaryLoading } = useQuery({
        queryKey: ['cheques', 'summary'],
        queryFn: async () => {
            const res = await getChequesSummary();
            return res.data || res;
        }
    });

    const cheques = chequeData?.content || [];
    const totalCount = chequeData?.totalElements || 0;
    const customers = customerData || [];

    // Mutations — all validation done by the backend
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries(['cheques']);
            setDialogOpen(false);
            setDeleteDialogOpen(false);
            setEditId(null);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Operation failed'));
        }
    };

    const createMutation = useMutation({ mutationFn: createCheque, ...mutationOptions, onSuccess: () => { toast.success('Cheque recorded'); mutationOptions.onSuccess(); } });
    const updateMutation = useMutation({ mutationFn: (data) => updateCheque(editId || data.id, data), ...mutationOptions, onSuccess: () => { toast.success('Cheque updated'); mutationOptions.onSuccess(); } });
    const statusMutation = useMutation({
        mutationFn: ({ id, ...data }) => updateChequeStatus(id, data),
        onSuccess: () => {
            toast.success('Status updated');
            setStatusDialogOpen(false);
            queryClient.invalidateQueries(['cheques']);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Status update failed'));
        }
    });
    const deleteMutation = useMutation({ mutationFn: deleteCheque, ...mutationOptions, onSuccess: () => { toast.success('Cheque deleted'); mutationOptions.onSuccess(); } });

    // Handlers
    const handleOpenDialog = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({
                ...item,
                customerId: item.customerId || '',
                issueDate: item.issueDate ? String(item.issueDate).slice(0, 10) : '',
                dueDate: item.dueDate ? String(item.dueDate).slice(0, 10) : ''
            });
        } else {
            setEditId(null);
            setFormData({ ...initialFormData, issueDate: format(new Date(), 'yyyy-MM-dd') });
        }
        setDialogOpen(true);
    };

    // Basic frontend validation for required text fields.
    const handleSubmit = (e) => {
        e.preventDefault();

        const chequeNumber = String(formData.chequeNumber || '').trim();
        const bankName = String(formData.bankName || '').trim();
        const branch = String(formData.branch || '').trim();
        const chequeType = String(formData.chequeType || 'Incoming').trim();
        const amount = Number(formData.amount);
        const issueDate = String(formData.issueDate || '').trim();
        const dueDate = String(formData.dueDate || '').trim();

        if (!chequeNumber) {
            toast.error('Cheque number is required');
            return;
        }

        if (!CHEQUE_NUMBER_REGEX.test(chequeNumber)) {
            toast.error('Cheque number must be exactly 6 digits');
            return;
        }

        if (!bankName) {
            toast.error('Bank name is required');
            return;
        }

        if (!CHEQUE_TEXT_REGEX.test(bankName)) {
            toast.error('Bank name contains invalid characters');
            return;
        }

        if (!branch) {
            toast.error('Branch is required');
            return;
        }

        if (!CHEQUE_TEXT_REGEX.test(branch)) {
            toast.error('Branch contains invalid characters');
            return;
        }

        if (!['Incoming', 'Outgoing'].includes(chequeType)) {
            toast.error('Cheque type is invalid');
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            toast.error('Amount must be greater than zero');
            return;
        }

        if (!issueDate) {
            toast.error('Issue date is required');
            return;
        }

        if (!dueDate) {
            toast.error('Due date is required');
            return;
        }

        if (new Date(dueDate) < new Date(issueDate)) {
            toast.error('Due date cannot be before issue date');
            return;
        }

        if (chequeType === 'Incoming' && !String(formData.customerId || '').trim()) {
            toast.error('Customer is required for incoming cheques');
            return;
        }

        const payload = {
            ...formData,
            chequeNumber,
            bankName,
            branch,
            chequeType,
            amount,
            issueDate,
            dueDate
        };

        if (editId) updateMutation.mutate(payload);
        else createMutation.mutate(payload);
    };

    // Status update — backend validates required date fields per status
    const handleStatusSubmit = (e) => {
        e.preventDefault();
        statusMutation.mutate(statusData);
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && orderDirection === 'asc';
        setOrderDirection(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleExportPDF = async () => {
        try {
            const { data } = await getChequeReportPdf(statusFilter === 'ALL' ? null : statusFilter);
            downloadBlob(data, `Cheque_Report_${statusFilter}.pdf`);
            toast.success('Report downloaded');
        } catch (e) { toast.error('Export failed'); }
    };

    const formatCurrency = (val) => `Rs.${Number(val || 0).toLocaleString()}`;

    const columns = useMemo(() => [
        { id: 'chequeNumber', label: 'Cheque No.', minWidth: '130px', sortable: true, render: (val) => <span className="font-bold text-slate-800 dark:text-slate-200">{val}</span> },
        {
            id: 'customerId', label: 'Customer', minWidth: '180px', sortable: true,
            render: (val) => {
                const cust = customers.find(c => c.id === val);
                return <span className="font-bold text-slate-500 dark:text-slate-400">{cust?.name || (val ? `#${val}` : '—')}</span>;
            }
        },
        { id: 'bankName', label: 'Bank', minWidth: '150px', sortable: true, render: (val) => <span className="font-bold text-slate-500 dark:text-slate-400">{val}</span> },
        {
            id: 'chequeType', label: 'Type', minWidth: '100px', sortable: true, align: 'center',
            render: (val) => <Badge variant={val === 'Incoming' ? 'success' : 'amber'}>{val || 'Incoming'}</Badge>
        },
        { id: 'amount', label: 'Amount', minWidth: '140px', align: 'right', sortable: true, render: (val) => <span className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(val)}</span> },
        { id: 'dueDate', label: 'Due Date', minWidth: '130px', sortable: true, render: (val) => <span className="font-bold text-slate-500 dark:text-slate-400 text-xs">{val}</span> },
        {
            id: 'status', label: 'Status', minWidth: '150px', align: 'center', sortable: true,
            render: (val, row) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setStatusData({
                            id: row.id,
                            status: val,
                            depositDate: row.depositDate || new Date().toISOString().split('T')[0],
                            clearedDate: row.clearedDate || '',
                            bouncedDate: row.bouncedDate || '',
                            bounceReason: row.bounceReason || ''
                        });
                        setStatusDialogOpen(true);
                    }}
                    className="hover:scale-105 transition-transform"
                >
                    <Badge variant={val === 'CLEARED' ? 'success' : val === 'BOUNCED' ? 'error' : val === 'DEPOSITED' ? 'brand' : 'amber'}>
                        {val}
                    </Badge>
                </button>
            )
        }
    ], [customers]);

    return (
        <AnimatedContainer>
            <PageHeader
                title="Cheque Management" 
                subtitle="Track and manage post-dated cheques"
                icon={<Landmark size={24} className="text-white" />}
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" onClick={handleExportPDF}><FileText size={18} className="mr-2" /> Export Report</Button>
                        <Button variant="primary" size="md" onClick={() => handleOpenDialog()}><Plus size={18} className="mr-2" /> Add Cheque</Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <KpiCard title="Total Value" value={formatCurrency(summaryData?.totalAmount || 0)} icon={Landmark} color="primary" loading={summaryLoading} />
                <KpiCard title="Pending" value={summaryData?.pending || 0} icon={Clock} color="warning" loading={summaryLoading} />
                <KpiCard title="Cleared" value={summaryData?.cleared || 0} icon={CheckCircle2} color="success" loading={summaryLoading} />
                <KpiCard title="Bounced" value={summaryData?.bounced || 0} icon={AlertTriangle} color="error" loading={summaryLoading} />
            </div>

            <DashboardCard title="Cheque Registry" className="mt-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div className="w-full md:w-96">
                        <Input
                            placeholder="Search by cheque number or bank..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            className="bg-slate-50 dark:bg-slate-900 border-none shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto max-w-full">
                        {['PENDING', 'DEPOSITED', 'CLEARED', 'BOUNCED', 'ALL'].map((status) => (
                            <button
                                key={status}
                                onClick={() => { setStatusFilter(status); setPage(0); }}
                                className={`
                                    px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap
                                    ${statusFilter === status 
                                        ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-sm ring-1 ring-brand-primary/20' 
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
                                `}
                            >
                                {status === 'ALL' ? 'All' : status}
                            </button>
                        ))}
                    </div>
                </div>

                <DataTable
                    serverSide columns={columns} data={cheques} loading={isLoading}
                    totalCount={totalCount} page={page} rowsPerPage={rowsPerPage}
                    onPageChange={setPage} onRowsPerPageChange={setRowsPerPage}
                    orderBy={orderBy} orderDirection={orderDirection} onSortChange={handleSort}
                    actions={(row) => (
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedCheque(row); setDetailsOpen(true); }} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 h-9 w-9 p-0 transition-colors">
                                <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(row)} className="text-emerald-500 hover:bg-emerald-50 h-9 w-9 p-0">
                                <Edit size={16} />
                            </Button>
                            <Button 
                                variant="ghost" size="sm" 
                                disabled={row.status !== 'PENDING'} 
                                onClick={() => { setDeleteId(row.id); setDeleteDialogOpen(true); }} 
                                className={`h-9 w-9 p-0 ${row.status === 'PENDING' ? 'text-red-400 hover:bg-red-50' : 'text-slate-200 cursor-not-allowed'}`}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    )}
                />
            </DashboardCard>

            {/* Add/Edit Cheque Dialog */}
            <FormDialog 
                open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit} 
                title={editId ? 'Edit Cheque' : 'Add Cheque'} 
                subtitle={editId ? 'Update cheque details' : 'Register a new cheque'}
                loading={createMutation.isPending || updateMutation.isPending}
                maxWidth="max-w-2xl"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                    <Input label="Cheque Number" value={formData.chequeNumber} onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })} required autoFocus placeholder="e.g. 456721" maxLength={6} />
                    <Input label="Bank Name" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} required placeholder="e.g. Commercial Bank" />
                    <Input label="Branch" value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} required placeholder="e.g. Colombo Main" />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Cheque Type</label>
                        <select
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                            value={formData.chequeType}
                            onChange={(e) => setFormData({ ...formData, chequeType: e.target.value })}
                        >
                            <option value="Incoming">Incoming</option>
                            <option value="Outgoing">Outgoing</option>
                        </select>
                    </div>
                    
                    <div className="md:col-span-2">
                        <Autocomplete 
                            label="Linked Customer (required for Incoming)"
                            options={customers}
                            value={formData.customerId}
                            getOptionLabel={(cu) => `${cu.name} (${cu.publicId})`}
                            onChange={(val) => setFormData({ ...formData, customerId: val })}
                            placeholder="Search customer..."
                        />
                    </div>

                    <Input type="number" label="Amount (Rs.)" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required min="0" step="0.01" />
                    <div className="hidden md:block"></div>
                    
                    <Input type="date" label="Issue Date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} required />
                    <Input type="date" label="Due Date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
                    
                    <div className="md:col-span-2">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1 mb-1.5 block">Notes (optional)</label>
                        <textarea 
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-brand-primary/20 min-h-[80px] text-sm"
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            placeholder="Optional notes..."
                        />
                    </div>
                </div>
            </FormDialog>

            {/* Update Status Dialog */}
            <FormDialog
                open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}
                onSubmit={handleStatusSubmit}
                title="Update Cheque Status" 
                subtitle="Change the current status of this cheque"
                loading={statusMutation.isPending} 
                maxWidth="max-w-md"
            >
                <div className="space-y-6 p-1">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Status</label>
                        <select 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                            value={statusData.status}
                            onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                        >
                            <option value="PENDING">Pending</option>
                            <option value="DEPOSITED">Deposited</option>
                            <option value="CLEARED">Cleared</option>
                            <option value="BOUNCED">Bounced</option>
                        </select>
                    </div>

                    {statusData.status === 'DEPOSITED' && (
                        <Input type="date" label="Deposit Date" value={statusData.depositDate} onChange={(e) => setStatusData({ ...statusData, depositDate: e.target.value })} required />
                    )}

                    {statusData.status === 'CLEARED' && (
                        <Input type="date" label="Cleared Date" value={statusData.clearedDate} onChange={(e) => setStatusData({ ...statusData, clearedDate: e.target.value })} required />
                    )}

                    {statusData.status === 'BOUNCED' && (
                        <>
                            <Input type="date" label="Bounced Date" value={statusData.bouncedDate} onChange={(e) => setStatusData({ ...statusData, bouncedDate: e.target.value })} required />
                            <div className="p-1">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1 mb-1.5 block">Bounce Reason</label>
                                <textarea 
                                    className="w-full px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 font-medium text-red-700 dark:text-red-400 outline-none focus:ring-2 focus:ring-red-500/20 min-h-[80px] text-sm"
                                    value={statusData.bounceReason} 
                                    onChange={(e) => setStatusData({ ...statusData, bounceReason: e.target.value })} 
                                    required 
                                    placeholder="e.g. Insufficient funds..."
                                />
                            </div>
                        </>
                    )}

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cheque Value</span>
                            <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{formatCurrency(cheques.find(c => c.id === statusData.id)?.amount)}</h4>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${statusData.status === 'CLEARED' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                </div>
            </FormDialog>

            <ConfirmDialog 
                open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={() => deleteMutation.mutate(deleteId)} 
                title="Delete Cheque" 
                message="Are you sure you want to delete this cheque record? This action cannot be undone." 
                severity="error" loading={deleteMutation.isPending} 
            />

            <GenericDetailsDialog open={detailsOpen} onClose={() => setDetailsOpen(false)} data={selectedCheque} title="Cheque Details" />
        </AnimatedContainer>
    );
}
