import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Eye, Search, X, Receipt, ShoppingCart, CreditCard, Clock, CheckCircle2, AlertTriangle, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

import { getOrders, createOrder, updateOrder, deleteOrder } from '../api/ordersApi';
import { getProducts } from '../api/productsApi';
import { getCreditCustomers } from '../api/creditCustomersApi';
import { getApiErrorMessage } from '../utils/apiError';

import { PageHeader, DataTable, FormDialog, ConfirmDialog, StatusChip, DashboardCard, AnimatedContainer } from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Autocomplete from '../components/ui/Autocomplete';
import Badge from '../components/ui/Badge';

const initialItemState = {
    productId: '',
    qty: 1,
    unitPrice: 0,
    discount: 0,
    lineTotal: 0
};

const initialFormData = {
    invoiceNo: '',
    paymentType: 'CASH',
    creditCustomerId: '',
    items: [{ ...initialItemState }]
};

export default function Orders() {
    const queryClient = useQueryClient();

    // Table & Filter State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPaymentType, setFilterPaymentType] = useState('');
    const [orderBy, setOrderBy] = useState('id');
    const [orderDirection, setOrderDirection] = useState('desc');

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);

    // Data Fetching
    const { data, isLoading } = useQuery({
        queryKey: ['orders', page, rowsPerPage, search, filterStatus, filterPaymentType, orderBy, orderDirection],
        queryFn: async () => {
            const params = {
                page,
                size: rowsPerPage,
                search: search || undefined,
                status: filterStatus || undefined,
                paymentType: filterPaymentType || undefined,
                sort: `${orderBy},${orderDirection}`
            };
            const response = await getOrders(params);
            return response.data || response;
        },
        placeholderData: keepPreviousData
    });

    const { data: customerData } = useQuery({
        queryKey: ['creditCustomers', 'active'],
        queryFn: async () => {
            const res = await getCreditCustomers({ status: 'ACTIVE', size: 1000 });
            return res.data?.content || res.data || [];
        }
    });

    const { data: productsData } = useQuery({
        queryKey: ['products', 'active'],
        queryFn: async () => {
            const res = await getProducts({ status: 'ACTIVE', size: 1000 });
            return res.data?.content || res.data || [];
        }
    });

    const orders = data?.content || [];
    const totalCount = data?.totalElements || 0;
    const creditCustomers = customerData || [];
    const products = productsData || [];

    // Mutations
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
            setDialogOpen(false);
            setDeleteDialogOpen(false);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Operation failed'));
        }
    };

    const createMutation = useMutation({ mutationFn: createOrder, ...mutationOptions, onSuccess: () => { toast.success('Order draft created'); mutationOptions.onSuccess(); } });
    const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateOrder(id, data), ...mutationOptions, onSuccess: () => { toast.success('Order updated'); mutationOptions.onSuccess(); } });
    const deleteMutation = useMutation({ mutationFn: deleteOrder, ...mutationOptions, onSuccess: () => { toast.success('Order voided'); mutationOptions.onSuccess(); } });

    const handleOpenDialog = (order = null) => {
        if (order) {
            setEditId(order.id);
            setFormData({
                invoiceNo: order.invoiceNo || '',
                paymentType: order.paymentType || 'CASH',
                creditCustomerId: order.creditCustomerId || order.customer || '',
                items: Array.isArray(order.items) && order.items.length > 0
                    ? order.items.map((item) => ({
                        productId: item.productId || item.product?._id || item.product || '',
                        qty: item.qty || item.quantity || 1,
                        unitPrice: item.unitPrice || item.price || 0,
                        discount: item.discount || 0,
                        lineTotal: item.lineTotal || item.subtotal || 0
                    }))
                    : [{ ...initialItemState }]
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
        const item = { ...newItems[index], [field]: value };

        if (field === 'productId') {
            const prod = products.find(p => p.id === value);
            if (prod) item.unitPrice = prod.unitPrice;
        }

        if (field === 'qty' || field === 'unitPrice' || field === 'productId' || field === 'discount') {
            const subtotal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
            item.lineTotal = Math.max(0, subtotal - (Number(item.discount) || 0));
        }

        newItems[index] = item;
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => formData.items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);

    const isCreditLimitExceeded = () => {
        if (formData.paymentType !== 'CREDIT' || !formData.creditCustomerId) return false;
        const customer = creditCustomers.find(c => c.id === formData.creditCustomerId);
        if (!customer) return false;
        const available = (customer.creditLimit || 0) - (customer.outstandingBalance || 0);
        return calculateTotal() > available;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const invoiceNo = String(formData.invoiceNo || '').trim();
        const paymentType = String(formData.paymentType || '').trim().toUpperCase();

        if (!invoiceNo) return toast.error('Invoice number is required');
        if (!['CASH', 'CARD', 'CREDIT'].includes(paymentType)) return toast.error('Payment type is invalid');

        if (formData.paymentType === 'CREDIT' && !formData.creditCustomerId) return toast.error("Credit Customer is required");
        if (isCreditLimitExceeded()) return toast.error("Credit limit exceeded");
        if (formData.items.length === 0) return toast.error("At least one item is required");

        const invalidItemIndex = formData.items.findIndex((item) => !item.productId || Number(item.qty || 0) <= 0);
        if (invalidItemIndex >= 0) {
            return toast.error(`Item ${invalidItemIndex + 1}: select a product and enter valid quantity`);
        }

        const invalidPricingIndex = formData.items.findIndex((item) => {
            const qty = Number(item.qty || 0);
            const unitPrice = Number(item.unitPrice || 0);
            const discount = Number(item.discount || 0);
            const lineTotal = Number(item.lineTotal || 0);
            const subtotal = qty * unitPrice;

            return !Number.isFinite(unitPrice)
                || unitPrice <= 0
                || !Number.isFinite(discount)
                || discount < 0
                || discount > subtotal
                || !Number.isFinite(lineTotal)
                || lineTotal < 0;
        });

        if (invalidPricingIndex >= 0) {
            return toast.error(`Item ${invalidPricingIndex + 1}: unit price/discount values are invalid`);
        }

        const payload = {
            ...formData,
            invoiceNo,
            paymentType
        };

        if (editId) updateMutation.mutate({ id: editId, data: payload });
        else createMutation.mutate(payload);
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && orderDirection === 'asc';
        setOrderDirection(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const formatCurrency = (val) => `Rs.${Number(val || 0).toLocaleString()}`;

    const columns = useMemo(() => [
        { id: 'invoiceNo', label: 'Invoice #', minWidth: '120px', sortable: true, render: (val) => <span className="font-bold text-slate-700 dark:text-slate-200">{val}</span> },
        { id: 'orderDate', label: 'Date/Time', minWidth: '150px', sortable: true, render: (val) => <span className="text-xs font-bold text-slate-500 dark:text-slate-400 italic uppercase">{format(new Date(val), 'MMM dd, HH:mm')}</span> },
        {
            id: 'paymentType', label: 'Payment', minWidth: '100px', sortable: true,
            render: (val) => (
                <Badge variant={val === 'CREDIT' ? 'amber' : 'success'}>
                    {val === 'CREDIT' ? <CreditCard size={10} className="mr-1" /> : <Clock size={10} className="mr-1" />} {val}
                </Badge>
            )
        },
        { id: 'totalAmount', label: 'Total', align: 'right', sortable: true, render: (val) => <span className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(val)}</span> },
        { id: 'status', label: 'Status', align: 'center', sortable: true, render: (val) => <StatusChip status={val} /> }
    ], []);

    return (
        <AnimatedContainer>
            <PageHeader
                title="Order Processing" 
                subtitle="Manage sales orders, drafts and fulfillment"
                icon={<Receipt size={24} className="text-white" />}
                actions={<Button variant="primary" size="md" onClick={() => handleOpenDialog()}><Plus size={18} className="mr-2" /> Start New Order</Button>}
            />

            <DashboardCard title="Order Repository" className="mt-8">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 items-end">
                    <div className="md:col-span-4">
                        <Input
                            label="Find Order"
                            placeholder="Invoice No, ID..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            className="bg-slate-50 dark:bg-slate-900 border-none shadow-sm"
                        />
                    </div>
                    <div className="md:col-span-3">
                         <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Fulfillment</label>
                            <select 
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
                            >
                                <option value="">All Statuses</option>
                                <option value="DRAFT">DRAFT</option>
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </div>
                    </div>
                    <div className="md:col-span-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Payment Channel</label>
                            <select 
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                                value={filterPaymentType}
                                onChange={(e) => { setFilterPaymentType(e.target.value); setPage(0); }}
                            >
                                <option value="">All Payments</option>
                                <option value="CASH">CASH</option>
                                <option value="CARD">CARD</option>
                                <option value="CREDIT">CREDIT</option>
                            </select>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <Button 
                            variant="secondary" 
                            className="w-full text-[10px]" 
                            disabled={!search && !filterStatus && !filterPaymentType}
                            onClick={() => { setSearch(''); setFilterStatus(''); setFilterPaymentType(''); setPage(0); }}
                        >
                            <X size={14} className="mr-1" /> Reset
                        </Button>
                    </div>
                </div>

                <DataTable
                    serverSide columns={columns} data={orders} loading={isLoading}
                    totalCount={totalCount} page={page} rowsPerPage={rowsPerPage}
                    onPageChange={setPage} onRowsPerPageChange={setRowsPerPage}
                    orderBy={orderBy} orderDirection={orderDirection} onSortChange={handleSort}
                    actions={(row) => (
                        <div className="flex items-center gap-2">
                            <Link to={`/orders/${row.id}/items`}>
                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase">
                                    <Eye size={12} className="mr-1.5" /> Items
                                </Button>
                            </Link>
                            {row.status === 'DRAFT' && (
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(row)} className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                                    <Edit size={16} />
                                </Button>
                            )}
                            {row.status === 'DRAFT' && (
                                <Button variant="ghost" size="sm" onClick={() => { setDeleteId(row.id); setDeleteDialogOpen(true); }} className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                    <Trash2 size={16} />
                                </Button>
                            )}
                        </div>
                    )}
                />
            </DashboardCard>

            <FormDialog
                open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit}
                title={editId ? 'Edit Sales Order' : 'Generate Sales Order'} 
                subtitle={editId ? `Update draft invoice #${editId}` : 'Create a new draft invoice'}
                loading={createMutation.isPending || updateMutation.isPending}
                maxWidth="max-w-6xl"
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-1">
                    {/* Invoice Meta */}
                    <div className="lg:col-span-4 space-y-6">
                        <Input label="Invoice Number" value={formData.invoiceNo} onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })} required autoFocus placeholder="e.g. INV-1001" />
                        
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Payment Type</label>
                            <select 
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                                value={formData.paymentType}
                                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                            >
                                <option value="CASH">CASH</option>
                                <option value="CARD">CARD</option>
                                <option value="CREDIT">CREDIT</option>
                            </select>
                        </div>

                        {formData.paymentType === 'CREDIT' && (
                            <Autocomplete 
                                label="Credit Customer"
                                options={creditCustomers}
                                value={formData.creditCustomerId}
                                getOptionLabel={(c) => `${c.name} (Available: Rs.${((c.creditLimit || 0) - (c.outstandingBalance || 0)).toLocaleString()})`}
                                onChange={(val) => setFormData({ ...formData, creditCustomerId: val })}
                                required
                            />
                        )}

                        <div className="p-6 rounded-2xl bg-brand-primary/5 border border-brand-primary/10">
                            <h4 className="text-xs font-black text-brand-primary uppercase tracking-widest mb-4">Financial Summary</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(calculateTotal())}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                                    <span>Items Count</span>
                                    <span>{formData.items.length}</span>
                                </div>
                                <div className="pt-3 border-t border-brand-primary/20 flex justify-between items-end">
                                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Grand Total</span>
                                    <span className={`text-2xl font-black ${isCreditLimitExceeded() ? 'text-red-500' : 'text-brand-primary'}`}>{formatCurrency(calculateTotal())}</span>
                                </div>
                                {isCreditLimitExceeded() && (
                                    <div className="mt-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase flex items-start gap-2">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        <span>Customer credit limit exceeded! Payment must be strictly manual.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="lg:col-span-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Order Items</h3>
                            <Button variant="outline" size="sm" onClick={handleAddItem} className="h-8 text-[10px]">
                                <Plus size={14} className="mr-1" /> Add Product
                            </Button>
                        </div>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-visible shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-5 py-4">Product Specification</th>
                                        <th className="px-5 py-4 w-32 text-center">Qty</th>
                                        <th className="px-5 py-4 w-40 text-right">Price @ Unit</th>
                                        <th className="px-5 py-4 w-32 text-right">Discount</th>
                                        <th className="px-5 py-4 w-40 text-right">Line Total</th>
                                        <th className="px-5 py-4 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                            <td className="px-5 py-4 min-w-[300px]">
                                                <Autocomplete
                                                    options={products}
                                                    value={item.productId}
                                                    getOptionLabel={(p) => `${p.name} (Stock: ${p.unitQty})`}
                                                    onChange={(val) => handleItemChange(index, 'productId', val)}
                                                    placeholder="Search catalog..."
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-transparent text-center font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 focus:border-brand-primary outline-none transition-colors"
                                                    value={item.qty} 
                                                    onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                                                    min="1"
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-transparent text-right font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 focus:border-brand-primary outline-none transition-colors"
                                                    value={item.unitPrice} 
                                                    onChange={(e) => handleItemChange(index, 'unitPrice', Math.max(0.01, parseFloat(e.target.value) || 0))}
                                                    step="0.01"
                                                    min="0.01"
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent text-right font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 focus:border-brand-primary outline-none transition-colors"
                                                    value={item.discount || 0}
                                                    onChange={(e) => handleItemChange(index, 'discount', Math.max(0, parseFloat(e.target.value) || 0))}
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="px-5 py-4 text-right font-black text-slate-900 dark:text-slate-100">
                                                {formatCurrency(item.lineTotal)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <button 
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.items.length === 0 && (
                                <div className="p-10 text-center uppercase text-[10px] font-black text-slate-400 tracking-widest">
                                    No items in order draft
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </FormDialog>

            <ConfirmDialog
                open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={() => deleteMutation.mutate(deleteId)}
                title="Void Order Draft" 
                message="Are you sure you want to void this order draft? This action will remove the record entirely." 
                loading={deleteMutation.isPending} severity="error"
            />
        </AnimatedContainer>
    );
}
