import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, FileBarChart, Edit, Trash2, Eye, Printer, X, ShoppingBag, CreditCard, Landmark, ArrowRight, LayoutList } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

import { getSales, createSale, updateSale, deleteSale, confirmSale } from '../api/salesApi';
import { getProducts } from '../api/productsApi';
import { getCreditCustomers } from '../api/creditCustomersApi';
import { getSalesReportPdf, getInvoicePdf, downloadBlob } from '../api/reportsApi';
import { getApiErrorMessage } from '../utils/apiError';

import { PageHeader, DataTable, FormDialog, ConfirmDialog, DashboardCard, AnimatedContainer, SalesDetailsDialog } from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Autocomplete from '../components/ui/Autocomplete';
import Badge from '../components/ui/Badge';
import StatusChip from '../components/StatusChip';

const initialItemState = {
    productId: '',
    qtySold: 1,
    unitPrice: 0,
    lineTotal: 0
};

const initialFormData = {
    salesDate: format(new Date(), 'yyyy-MM-dd'),
    paymentType: 'CASH',
    creditCustomerId: null,
    note: '',
    items: [initialItemState]
};

const toInputDate = (value) => {
    if (!value) return format(new Date(), 'yyyy-MM-dd');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return format(new Date(), 'yyyy-MM-dd');
    return format(date, 'yyyy-MM-dd');
};

const toDisplayDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM dd, yyyy');
};

const getEntityId = (value) => {
    if (!value) return '';
    if (typeof value === 'object') return value.id || value._id || '';
    return value;
};

export default function Sales() {
    const queryClient = useQueryClient();

    // Table & Filter State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [orderBy, setOrderBy] = useState('id');
    const [orderDirection, setOrderDirection] = useState('desc');

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);

    // Data Fetching
    const { data, isLoading } = useQuery({
        queryKey: ['sales', page, rowsPerPage, search, minAmount, maxAmount, fromDate, toDate, orderBy, orderDirection],
        queryFn: async () => {
            const params = {
                page,
                size: rowsPerPage,
                search: search || undefined,
                minAmount: minAmount || undefined,
                maxAmount: maxAmount || undefined,
                from: fromDate || undefined,
                to: toDate || undefined,
                sort: `${orderBy},${orderDirection}`
            };
            const response = await getSales(params);
            return response.data || response;
        },
        placeholderData: keepPreviousData
    });

    const { data: productsData } = useQuery({
        queryKey: ['products', 'active'],
        queryFn: async () => {
            const res = await getProducts({ status: 'ACTIVE', size: 1000 });
            return res.data?.content || res.data || [];
        }
    });

    const { data: customersData } = useQuery({
        queryKey: ['creditCustomers', 'active'],
        queryFn: async () => {
            const res = await getCreditCustomers({ status: 'ACTIVE', size: 1000 });
            return res.data?.content || res.data || [];
        }
    });

    const sales = data?.content || [];
    const totalCount = data?.totalElements || 0;
    const products = productsData || [];
    const creditCustomers = customersData || [];

    // Mutations
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries(['sales']);
            setDialogOpen(false);
            setDeleteDialogOpen(false);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Operation failed'));
        }
    };

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const created = await createSale(data);
            const saleId = created?.data?.id || created?.data?._id || created?.id || created?._id;
            if (!saleId) throw new Error('Unable to finalize sale: missing sale identifier');
            await confirmSale(saleId);
            return created;
        },
        ...mutationOptions,
        onSuccess: () => {
            toast.success('POS checkout completed');
            queryClient.invalidateQueries(['creditCustomers']);
            queryClient.invalidateQueries(['products']);
            mutationOptions.onSuccess();
        }
    });
    const updateMutation = useMutation({ mutationFn: (data) => updateSale(editId, data), ...mutationOptions, onSuccess: () => { toast.success('Invoice updated'); mutationOptions.onSuccess(); } });
    const deleteMutation = useMutation({ mutationFn: deleteSale, ...mutationOptions, onSuccess: () => { toast.success('Record purged'); mutationOptions.onSuccess(); } });

    // Handlers
    const handleOpenDialog = (sale = null) => {
        if (sale) {
            setEditId(sale.id || sale._id);
            setFormData({
                salesDate: toInputDate(sale.salesDate || sale.createdAt),
                paymentType: sale.paymentType || sale.paymentMethod || 'CASH',
                creditCustomerId: sale.creditCustomerId || sale.customerId || sale.customer?._id || sale.customer || '',
                note: sale.note || '',
                items: (sale.items || []).map(item => ({
                    productId: item.productId || item.product?._id || item.product || '',
                    qtySold: item.qtySold ?? item.qty ?? item.quantity ?? 1,
                    unitPrice: item.unitPrice ?? item.price ?? 0,
                    lineTotal: item.lineTotal ?? item.subtotal ?? 0
                }))
            });
        } else {
            setEditId(null);
            setFormData(initialFormData);
        }
        setDialogOpen(true);
    };

    const handleAddItem = () => {
        setFormData({ ...formData, items: [...formData.items, { ...initialItemState }] });
    };

    const handleRemoveItem = (index) => {
        setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        const normalizedValue = field === 'productId' ? getEntityId(value) : value;
        const item = { ...newItems[index], [field]: normalizedValue };

        if (field === 'productId') {
            const prod = products.find(p => (p.id || p._id) === normalizedValue);
            if (prod) item.unitPrice = prod.unitPrice;
        }

        if (field === 'qtySold' || field === 'unitPrice' || field === 'productId') {
            item.lineTotal = Math.max(0, (Number(item.qtySold) || 0) * (Number(item.unitPrice) || 0));
        }

        newItems[index] = item;
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => formData.items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        const paymentType = String(formData.paymentType || '').trim().toUpperCase();
        const salesDate = String(formData.salesDate || '').trim();
        const note = String(formData.note || '').trim();

        if (!salesDate) return toast.error('Transaction date is required');
        if (new Date(salesDate) > new Date()) return toast.error('Transaction date cannot be in the future');
        if (!['CASH', 'CARD', 'CREDIT'].includes(paymentType)) return toast.error('Payment type is invalid');
        if (formData.paymentType === 'CREDIT' && !formData.creditCustomerId) return toast.error("Select a credit customer");
        if (note.length > 500) return toast.error('Note cannot exceed 500 characters');

        const normalizedItems = formData.items.map((item) => ({
            ...item,
            productId: getEntityId(item.productId)
        }));

        if (normalizedItems.length === 0) return toast.error("At least one item is required");

        const invalidItemIndex = normalizedItems.findIndex((item) => {
            const qtySold = Number(item.qtySold || 0);
            const unitPrice = Number(item.unitPrice || 0);
            const lineTotal = Number(item.lineTotal || 0);

            return !item.productId
                || !Number.isFinite(qtySold)
                || qtySold <= 0
                || !Number.isFinite(unitPrice)
                || unitPrice <= 0
                || !Number.isFinite(lineTotal)
                || lineTotal < 0;
        });

        if (invalidItemIndex >= 0) {
            return toast.error(`Item ${invalidItemIndex + 1}: select a product and enter valid quantity/price`);
        }

        const totalAmount = normalizedItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            return toast.error('Invoice total must be greater than zero');
        }

        if (paymentType === 'CREDIT') {
            const customer = creditCustomers.find((c) => (c.id || c._id) === formData.creditCustomerId);
            if (!customer) return toast.error('Select a valid credit customer');
            const outstanding = Number(customer.outstandingBalance ?? customer.currentBalance ?? 0);
            const creditLimit = Number(customer.creditLimit || 0);
            const availableCredit = Math.max(0, creditLimit - outstanding);
            if (totalAmount > availableCredit) {
                return toast.error('Credit limit exceeded for selected customer');
            }
        }

        const payload = {
            ...formData,
            paymentType,
            salesDate,
            note,
            items: normalizedItems.map((item) => {
                const qty = Number(item.qtySold || 0);
                const unitPrice = Number(item.unitPrice || 0);
                const lineTotal = Number(item.lineTotal || 0);

                return {
                    ...item,
                    qty,
                    quantity: qty,
                    price: unitPrice,
                    subtotal: lineTotal
                };
            })
        };

        if (editId) updateMutation.mutate(payload);
        else createMutation.mutate(payload);
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && orderDirection === 'asc';
        setOrderDirection(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handlePrintInvoice = async (sale) => {
        try {
            const res = await getInvoicePdf(sale.id);
            downloadBlob(res.data, `Invoice_${sale.publicId || sale.invoiceId}.pdf`);
            toast.success("Invoice downloaded");
        } catch (e) { toast.error("Download failed"); }
    };

    const handleExportReport = async () => {
        try {
            const res = await getSalesReportPdf(fromDate, toDate);
            downloadBlob(res.data, `Sales_Analysis_${format(new Date(), 'yyyyMMdd')}.pdf`);
            toast.success("Report Generated");
        } catch (e) { toast.error("Report failed"); }
    };

    const formatCurrency = (val) => `Rs.${Number(val || 0).toLocaleString()}`;

    const columns = useMemo(() => [
        { id: 'invoiceNo', label: 'Invoice ID', minWidth: '120px', sortable: true, render: (val, row) => <span className="font-black text-brand-primary uppercase tracking-tighter">{val || row.publicId || row.id}</span> },
        {
            id: 'salesDate',
            label: 'Invoice Date',
            minWidth: '150px',
            sortable: true,
            render: (val, row) => <span className="font-bold text-slate-800 dark:text-slate-100">{toDisplayDate(val || row.createdAt)}</span>
        },
        {
            id: 'paymentMethod', label: 'Payment', minWidth: '100px', sortable: true,
            render: (val, row) => {
                const payment = val || row.paymentType || 'CASH';
                return (
                <Badge variant={payment === 'CREDIT' ? 'amber' : 'success'}>
                    {payment === 'CREDIT' ? <CreditCard size={10} className="mr-1" /> : <LayoutList size={10} className="mr-1" />} {payment}
                </Badge>
                );
            }
        },
        { id: 'totalItemsSold', label: 'Line Items', align: 'center', sortable: true, render: (val, row) => <span className="font-bold text-slate-500 dark:text-slate-400">{val ?? row.items?.length ?? 0}</span> },
        { id: 'totalRevenue', label: 'Net Revenue', align: 'right', sortable: true, render: (val, row) => <span className="font-black text-slate-900 dark:text-slate-100 italic">{formatCurrency(val ?? row.totalAmount)}</span> }
    ], []);

    return (
        <AnimatedContainer>
            <PageHeader
                title="Order Management (POS)" 
                subtitle="Process live checkout transactions and monitor completed invoices"
                icon={<ShoppingBag size={24} className="text-white" />}
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" onClick={handleExportReport}><FileBarChart size={18} className="mr-2" /> Daily Audit</Button>
                        <Button variant="primary" size="md" onClick={() => handleOpenDialog()}><Plus size={18} className="mr-2" /> New POS Order</Button>
                    </div>
                }
            />

            <DashboardCard title="POS Transaction Archive" className="mt-8">
                {/* Advanced Multi-Filter */}
                <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-3xl mb-8 border border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 items-end">
                        <div className="lg:col-span-2">
                            <Input
                                label="Quick Find"
                                placeholder="Invoice ID, Customer, Note..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                className="bg-white dark:bg-slate-900"
                            />
                        </div>
                        <Input type="number" label="Min Value" value={minAmount} onChange={(e) => { setMinAmount(e.target.value); setPage(0); }} className="bg-white dark:bg-slate-900" />
                        <Input type="number" label="Max Value" value={maxAmount} onChange={(e) => { setMaxAmount(e.target.value); setPage(0); }} className="bg-white dark:bg-slate-900" />
                        <Input type="date" label="From" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} className="bg-white dark:bg-slate-900 text-xs" />
                        <Input type="date" label="To" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(0); }} className="bg-white dark:bg-slate-900 text-xs" />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-brand-primary transition-colors"
                            disabled={!search && !minAmount && !maxAmount && !fromDate && !toDate}
                            onClick={() => { setSearch(''); setMinAmount(''); setMaxAmount(''); setFromDate(''); setToDate(''); setPage(0); }}
                        >
                            <X size={14} className="mr-1" /> Reset Advanced Filters
                        </Button>
                    </div>
                </div>

                <DataTable
                    serverSide columns={columns} data={sales} loading={isLoading}
                    totalCount={totalCount} page={page} rowsPerPage={rowsPerPage}
                    onPageChange={setPage} onRowsPerPageChange={setRowsPerPage}
                    orderBy={orderBy} orderDirection={orderDirection} onSortChange={handleSort}
                    actions={(row) => (
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handlePrintInvoice(row)} title="Print Invoice" className="text-slate-400 hover:text-brand-primary">
                                <Printer size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedSale(row); setDetailsOpen(true); }} className="text-blue-500 hover:bg-blue-50">
                                <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(row)} className="text-emerald-500 hover:bg-emerald-50">
                                <Edit size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setDeleteId(row.id); setDeleteDialogOpen(true); }} className="text-red-500 hover:bg-red-50">
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    )}
                />
            </DashboardCard>

            <FormDialog
                open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit}
                title={editId ? `Audit POS Order (#${editId})` : 'POS Checkout'} 
                subtitle={editId ? `Updating invoice dated ${formData.salesDate}` : 'Create and finalize a live POS invoice'}
                loading={createMutation.isPending || updateMutation.isPending}
                maxWidth="max-w-6xl"
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-1">
                    <div className="lg:col-span-4 space-y-6">
                        <Input type="date" label="Invoice Date" value={formData.salesDate} onChange={(e) => setFormData({ ...formData, salesDate: e.target.value })} required />
                        
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Payment Method</label>
                            <select 
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                                value={formData.paymentType}
                                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                            >
                                <option value="CASH">Cash</option>
                                <option value="CARD">Debit/Credit Card</option>
                                <option value="CREDIT">Credit Customer</option>
                            </select>
                        </div>

                        {formData.paymentType === 'CREDIT' && (
                            <Autocomplete 
                                label="Credit Customer"
                                options={creditCustomers}
                                value={formData.creditCustomerId}
                                getOptionLabel={(c) => {
                                    const debt = Number(c.outstandingBalance ?? c.currentBalance ?? 0);
                                    const limit = Number(c.creditLimit || 0);
                                    const available = Math.max(0, limit - debt);
                                    return `${c.name} (Available: Rs.${available.toLocaleString()})`;
                                }}
                                onChange={(val) => setFormData({ ...formData, creditCustomerId: val })}
                                required
                            />
                        )}

                        <div className="p-1">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1 mb-1.5 block">Invoice Notes</label>
                            <textarea 
                                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-brand-primary/20 min-h-[100px] text-sm"
                                placeholder="Internal remarks, customer specific details..."
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-900 dark:bg-brand-primary/10 text-white dark:text-brand-primary shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <Badge variant="brand" className="bg-white/20 border-white/10 text-white">Final Calculation</Badge>
                                <Landmark size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Total Invoice Amount</span>
                                <h2 className="text-4xl font-black mt-1">{formatCurrency(calculateTotal())}</h2>
                            </div>
                            {formData.paymentType === 'CREDIT' && formData.creditCustomerId && (() => {
                                const customer = creditCustomers.find((c) => (c.id || c._id) === formData.creditCustomerId);
                                if (!customer) return null;
                                const debt = Number(customer.outstandingBalance ?? customer.currentBalance ?? 0);
                                const limit = Number(customer.creditLimit || 0);
                                const available = Math.max(0, limit - debt);
                                const exceeds = calculateTotal() > available;
                                return (
                                    <div className={`mt-4 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${exceeds ? 'bg-red-500/20 text-red-100' : 'bg-white/10 text-white'}`}>
                                        Credit Available: Rs.{available.toLocaleString()} {exceeds ? '| Limit Exceeded' : '| Within Limit'}
                                    </div>
                                );
                            })()}
                            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                                <span>Recorded by System Admin</span>
                                <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Invoice Items</h3>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-8 text-[10px]">
                                <Plus size={14} className="mr-1" /> Append Item
                            </Button>
                        </div>

                            <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-visible">
                                <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-5 py-4">Product</th>
                                        <th className="px-5 py-4 w-32 text-center">Quantity</th>
                                        <th className="px-5 py-4 w-40 text-right">Unit Price</th>
                                        <th className="px-5 py-4 w-40 text-right">Line Total</th>
                                        <th className="px-5 py-4 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                            <td className="px-5 py-4 min-w-[300px]">
                                                <Autocomplete
                                                    options={products}
                                                    value={item.productId}
                                                    getOptionLabel={(p) => `${p.name} (ID: ${p.publicId})`}
                                                    onChange={(val) => handleItemChange(index, 'productId', val)}
                                                    placeholder="Find catalog item..."
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-transparent text-center font-bold text-slate-900 dark:text-slate-100 border-b-2 border-slate-100 dark:border-slate-800 focus:border-brand-primary outline-none transition-all py-1"
                                                    value={item.qtySold} 
                                                    onChange={(e) => handleItemChange(index, 'qtySold', parseInt(e.target.value) || 0)}
                                                    min="1"
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-transparent text-right font-bold text-slate-900 dark:text-slate-100 border-b-2 border-slate-100 dark:border-slate-800 focus:border-brand-primary outline-none transition-all py-1"
                                                    value={item.unitPrice} 
                                                    onChange={(e) => handleItemChange(index, 'unitPrice', Math.max(0.01, parseFloat(e.target.value) || 0))}
                                                    step="0.01"
                                                    min="0.01"
                                                />
                                            </td>
                                            <td className="px-5 py-4 text-right font-black text-slate-900 dark:text-slate-100 italic">
                                                {formatCurrency(item.lineTotal)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.items.length === 0 && (
                                <div className="p-16 text-center">
                                    <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="uppercase text-[10px] font-black text-slate-400 tracking-[0.2em]">No Invoice Items</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </FormDialog>

            <SalesDetailsDialog open={detailsOpen} onClose={() => setDetailsOpen(false)} sale={selectedSale} />
            <ConfirmDialog 
                open={deleteDialogOpen} 
                onClose={() => setDeleteDialogOpen(false)} 
                onConfirm={() => deleteMutation.mutate(deleteId)} 
                title="Purge Transaction" 
                message="Are you sure you want to permanently delete this POS invoice? This action will impact historical audit logs." 
                severity="error" 
                loading={deleteMutation.isPending} 
            />
        </AnimatedContainer >
    );
}

