import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Plus, Trash2, Edit, Truck, Eye, FileText, Search, X, 
    CheckCircle2, AlertCircle, Phone, Mail, MapPin, UserPlus
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getSuppliersSummary } from '../api/suppliersApi';
import { getSupplierListReportPdf, downloadBlob } from '../api/reportsApi';
import { getApiErrorMessage } from '../utils/apiError';
import { canManageSuppliers, normalizeRole } from '../utils/roleAccess';

import { PageHeader, DataTable, FormDialog, ConfirmDialog, StatusChip, DashboardCard, AnimatedContainer, GenericDetailsDialog, KpiCard } from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const initialFormData = {
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    email: '',
    supplyCategories: [],
    outstandingPayable: 0,
    status: 'ACTIVE'
};

const NAME_REGEX = /^[a-zA-Z\s]+$/;
const PHONE_REGEX = /^(?:0(?:70|71|72|74|75|76|77|78)\d{7}|\+94(?:70|71|72|74|75|76|77|78)\d{7})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADDRESS_REGEX = /^[a-zA-Z0-9\s,./\-#]+$/;

export default function Suppliers() {
    const queryClient = useQueryClient();
    const role = normalizeRole(localStorage.getItem('role'));
    const canManage = canManageSuppliers(role);
    const categoriesContainerRef = useRef(null);

    const getSupplierId = (supplier) => supplier?.id || supplier?._id;

    // Table & Filter State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ACTIVE');
    const [orderBy, setOrderBy] = useState('id');
    const [orderDirection, setOrderDirection] = useState('desc');

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    // Data Fetching
    const { data, isLoading } = useQuery({
        queryKey: ['suppliers', page, rowsPerPage, search, statusFilter, orderBy, orderDirection],
        queryFn: async () => {
            const params = {
                page,
                size: rowsPerPage,
                search: search || undefined,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                sort: `${orderBy},${orderDirection}`
            };
            const response = await getSuppliers(params);
            return response.data || response;
        },
        keepPreviousData: true
    });

    const { data: summaryData, isLoading: summaryLoading } = useQuery({
        queryKey: ['suppliers', 'summary'],
        queryFn: async () => {
            const res = await getSuppliersSummary();
            return res.data || res;
        }
    });

    const suppliers = data?.content || [];
    const totalCount = data?.totalElements || 0;

    const categoryOptions = useMemo(() => {
        const all = new Set();
        for (const supplier of suppliers || []) {
            for (const category of supplier?.supplyCategories || []) {
                const normalizedCategory = String(category || '').trim();
                if (normalizedCategory) all.add(normalizedCategory);
            }
        }

        for (const category of formData.supplyCategories || []) {
            const normalizedCategory = String(category || '').trim();
            if (normalizedCategory) all.add(normalizedCategory);
        }

        return Array.from(all).sort((a, b) => a.localeCompare(b));
    }, [suppliers, formData.supplyCategories]);

    const filteredCategoryOptions = useMemo(() => {
        const term = categorySearch.trim().toLowerCase();
        if (!term) return categoryOptions;
        return categoryOptions.filter((category) => category.toLowerCase().includes(term));
    }, [categoryOptions, categorySearch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoriesContainerRef.current && !categoriesContainerRef.current.contains(event.target)) {
                setCategoryDropdownOpen(false);
                setCategorySearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mutations — all validation done by the backend
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries(['suppliers']);
            setDialogOpen(false);
            setDeleteDialogOpen(false);
            setEditId(null);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Operation failed'));
        }
    };

    const createMutation = useMutation({ mutationFn: createSupplier, ...mutationOptions, onSuccess: () => { toast.success('Supplier added successfully'); mutationOptions.onSuccess(); } });
    const updateMutation = useMutation({ mutationFn: (data) => updateSupplier(editId || data.id, data), ...mutationOptions, onSuccess: () => { toast.success('Supplier updated'); mutationOptions.onSuccess(); } });
    const deleteMutation = useMutation({ mutationFn: deleteSupplier, ...mutationOptions, onSuccess: () => { toast.success('Supplier deleted'); mutationOptions.onSuccess(); } });

    // Handlers
    const handleOpenDialog = (supplier = null) => {
        if (!canManage) {
            toast.error('You do not have permission to manage suppliers');
            return;
        }

        if (supplier) {
            setEditId(getSupplierId(supplier));
            setFormData({
                name: supplier.name,
                contactPerson: supplier.contactPerson || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                email: supplier.email || '',
                supplyCategories: supplier.supplyCategories || [],
                outstandingPayable: supplier.outstandingPayable || 0,
                status: supplier.status || 'ACTIVE'
            });
        } else {
            setEditId(null);
            setFormData(initialFormData);
        }
        setFormErrors({});
        setCategorySearch('');
        setCategoryDropdownOpen(false);
        setDialogOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canManage) return toast.error('You do not have permission to manage suppliers');

        const name = String(formData.name || '').trim();
        const contactPerson = String(formData.contactPerson || '').trim();
        const phone = String(formData.phone || '').trim();
        const email = String(formData.email || '').trim();
        const address = String(formData.address || '').trim();
        const outstandingPayable = Number(formData.outstandingPayable);
        const typedCategory = String(categorySearch || '').trim();
        const baseCategories = (formData.supplyCategories || []).map((item) => String(item).trim()).filter(Boolean);
        const supplyCategories = typedCategory && !baseCategories.some((item) => item.toLowerCase() === typedCategory.toLowerCase())
            ? [...baseCategories, typedCategory]
            : baseCategories;

        const nextErrors = {};
        if (!name) nextErrors.name = 'Supplier name is required';
        else if (!NAME_REGEX.test(name)) nextErrors.name = 'Supplier name must contain only letters';

        if (!contactPerson) nextErrors.contactPerson = 'Contact person is required';
        else if (!NAME_REGEX.test(contactPerson)) nextErrors.contactPerson = 'Contact person must contain only letters';

        if (!phone) nextErrors.phone = 'Phone number is required';
            else if (!PHONE_REGEX.test(phone)) nextErrors.phone = 'Phone number must be 07Xxxxxxxx or +947Xxxxxxxx (X: 0,1,2,4,5,6,7,8)';

        if (!email) nextErrors.email = 'Email is required';
        else if (!EMAIL_REGEX.test(email)) nextErrors.email = 'Please enter a valid email address';

        if (!address) nextErrors.address = 'Address is required';
        else if (!ADDRESS_REGEX.test(address)) nextErrors.address = 'Address must contain only letters, numbers, and common characters';

        if (supplyCategories.length === 0) {
            nextErrors.supplyCategories = 'Please add at least one supply category';
        }

        if (!Number.isFinite(outstandingPayable) || outstandingPayable <= 0) {
            nextErrors.outstandingPayable = 'Outstanding payable must be greater than 0';
        }

        if (Object.keys(nextErrors).length > 0) {
            setFormErrors(nextErrors);
            toast.error(Object.values(nextErrors)[0]);
            return;
        }

        setFormErrors({});
        setCategorySearch('');

        const payload = {
            ...formData,
            name,
            contactPerson,
            phone,
            email,
            address,
            outstandingPayable,
            supplyCategories
        };
        if (editId) updateMutation.mutate(payload);
        else createMutation.mutate(payload);
    };

    const toggleCategory = (category) => {
        const normalizedCategory = String(category || '').trim();
        if (!normalizedCategory) return;

        setFormData((prev) => {
            const exists = (prev.supplyCategories || []).includes(normalizedCategory);
            return {
                ...prev,
                supplyCategories: exists
                    ? prev.supplyCategories.filter((item) => item !== normalizedCategory)
                    : [...(prev.supplyCategories || []), normalizedCategory]
            };
        });
    };

    const addCategoryFromSearch = () => {
        const newCategory = String(categorySearch || '').trim();
        if (!newCategory) return;
        toggleCategory(newCategory);
        setCategorySearch('');
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && orderDirection === 'asc';
        setOrderDirection(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleExportAll = async () => {
        try {
            const { data } = await getSupplierListReportPdf();
            if (!data) throw new Error('Invalid export response');

            const downloaded = downloadBlob(data, 'Supplier_List_Report.pdf');
            if (!downloaded) throw new Error('Unable to download exported file');

            toast.success('Report downloaded');
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Export failed'));
        }
    };

    const columns = useMemo(() => [
        { id: 'name', label: 'Supplier Name', minWidth: '220px', sortable: true, render: (val) => <span className="font-bold text-slate-900 dark:text-slate-100">{val}</span> },
        { 
            id: 'phone', label: 'Phone', minWidth: '140px', sortable: true, 
            render: (val) => (
                <div className="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 text-xs">
                    <Phone size={12} className="opacity-40" /> {val || '—'}
                </div>
            )
        },
        { 
            id: 'email', label: 'Email', minWidth: '160px', sortable: true, 
            render: (val) => (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{val || '—'}</span>
            )
        },
        { 
            id: 'address', label: 'Address', minWidth: '200px', sortable: true, 
            render: (val) => (
                <div className="flex items-start gap-2 max-w-[200px]">
                    <MapPin size={12} className="opacity-40 mt-1 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight line-clamp-1">{val || '—'}</span>
                </div>
            )
        },
        {
            id: 'outstandingPayable', label: 'Outstanding Payable', minWidth: '150px', sortable: true, align: 'right',
            render: (val) => <span className="font-black text-red-500">Rs.{Number(val || 0).toLocaleString()}</span>
        },
        {
            id: 'supplyCategories', label: 'Categories', minWidth: '180px', sortable: false,
            render: (val) => (
                <div className="flex flex-wrap gap-1">
                    {(val || []).slice(0, 3).map((category) => <Badge key={category} variant="secondary">{category}</Badge>)}
                    {Array.isArray(val) && val.length > 3 && <Badge variant="secondary">+{val.length - 3}</Badge>}
                </div>
            )
        },
        { id: 'status', label: 'Status', minWidth: '100px', align: 'center', sortable: true, render: (val) => <StatusChip status={val} /> }
    ], []);

    return (
        <AnimatedContainer>
            <PageHeader
                title="Suppliers" 
                subtitle="Manage supplier profiles and purchase history"
                icon={<Truck size={24} className="text-white" />}
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" onClick={handleExportAll}><FileText size={18} className="mr-2" /> Export List</Button>
                        <Button variant="primary" size="md" onClick={() => handleOpenDialog()} disabled={!canManage}><UserPlus size={18} className="mr-2" /> Add Supplier</Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <KpiCard title="Total Suppliers" value={summaryData?.total || 0} icon={Truck} color="primary" loading={summaryLoading} />
                <KpiCard title="Active" value={summaryData?.active || 0} icon={CheckCircle2} color="success" loading={summaryLoading} />
                <KpiCard title="Inactive" value={summaryData?.inactive || 0} icon={AlertCircle} color="warning" loading={summaryLoading} />
            </div>

            <DashboardCard title="Supplier Directory" className="mt-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div className="w-full md:w-96">
                        <Input
                            placeholder="Search by name, phone..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            className="bg-slate-50 dark:bg-slate-900 border-none shadow-sm"
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
                    serverSide columns={columns} data={suppliers} loading={isLoading}
                    totalCount={totalCount} page={page} rowsPerPage={rowsPerPage}
                    onPageChange={setPage} onRowsPerPageChange={setRowsPerPage}
                    orderBy={orderBy} orderDirection={orderDirection} onSortChange={handleSort}
                    actions={(row) => (
                        <div className="flex items-center gap-1 group">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedSupplier(row); setDetailsOpen(true); }} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 h-9 w-9 p-0 transition-colors">
                                <Eye size={16} />
                            </Button>
                            {canManage && (
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(row)} className="text-emerald-500 hover:bg-emerald-50 h-9 w-9 p-0">
                                    <Edit size={16} />
                                </Button>
                            )}
                            {canManage && (
                                <Button variant="ghost" size="sm" onClick={() => { setDeleteId(getSupplierId(row)); setDeleteDialogOpen(true); }} className="text-red-400 hover:bg-red-50 h-9 w-9 p-0">
                                    <Trash2 size={16} />
                                </Button>
                            )}
                        </div>
                    )}
                />
            </DashboardCard>

            <FormDialog 
                open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit} 
                title={editId ? 'Edit Supplier' : 'Add Supplier'} 
                subtitle={editId ? 'Update supplier information' : 'Register a new supplier'}
                loading={createMutation.isPending || updateMutation.isPending}
                maxWidth="max-w-3xl"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                    <div className="md:col-span-2">
                        <Input
                            label="Supplier Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            autoFocus
                            placeholder="e.g. ABC Distributors"
                            error={formErrors.name}
                            maxLength={120}
                        />
                    </div>
                    <Input
                        label="Contact Person"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="e.g. John Perera"
                        required
                        error={formErrors.contactPerson}
                    />
                    <Input
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+94 77 000 0000"
                        required
                        error={formErrors.phone}
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="supplier@example.com"
                        required
                        error={formErrors.email}
                    />
                    <div className="md:col-span-2 flex flex-col gap-1.5 w-full relative z-[120]" ref={categoriesContainerRef}>
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Supply Categories</label>
                        <div
                            className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus-within:ring-2 focus-within:ring-brand-primary/20 ${formErrors.supplyCategories ? 'border-red-500 ring-red-500/10' : 'border-slate-200 dark:border-slate-800'}`}
                            onClick={() => setCategoryDropdownOpen(true)}
                        >
                            <input
                                type="text"
                                value={categorySearch}
                                placeholder="Search categories or type to create new"
                                className="w-full bg-transparent outline-none"
                                onFocus={() => setCategoryDropdownOpen(true)}
                                onChange={(e) => {
                                    setCategoryDropdownOpen(true);
                                    setCategorySearch(e.target.value);
                                }}
                            />
                        </div>

                        {(formData.supplyCategories || []).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(formData.supplyCategories || []).map((category) => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => toggleCategory(category)}
                                        className="px-3 py-1 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
                                    >
                                        {category} x
                                    </button>
                                ))}
                            </div>
                        )}
                        {formErrors.supplyCategories && <p className="text-xs text-red-500 ml-1">{formErrors.supplyCategories}</p>}

                        {categoryDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-[130]">
                                <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                    {filteredCategoryOptions.length > 0 ? (
                                        filteredCategoryOptions.map((category) => {
                                            const selected = (formData.supplyCategories || []).includes(category);
                                            return (
                                                <button
                                                    key={category}
                                                    type="button"
                                                    className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selected ? 'text-brand-primary' : ''}`}
                                                    onClick={() => toggleCategory(category)}
                                                >
                                                    {selected ? '[x] ' : '[ ] '}{category}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">No category matches</div>
                                    )}
                                </div>

                                {categorySearch.trim() && !categoryOptions.some((item) => item.toLowerCase() === categorySearch.trim().toLowerCase()) && (
                                    <button
                                        type="button"
                                        className="w-full text-left px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-sm font-black text-brand-primary hover:bg-brand-primary/5"
                                        onClick={addCategoryFromSearch}
                                    >
                                        Create and select: {categorySearch.trim()}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <Input
                        type="number"
                        label="Outstanding Payable (Rs.)"
                        value={formData.outstandingPayable}
                        onChange={(e) => setFormData({ ...formData, outstandingPayable: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                        min="0.01"
                        step="0.01"
                        required
                        error={formErrors.outstandingPayable}
                    />
                    {editId && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Status</label>
                            <select 
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    )}
                    <div className="md:col-span-2">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1 mb-1.5 block">Address</label>
                        <textarea 
                            className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-brand-primary/20 min-h-[80px] ${formErrors.address ? 'border-red-500 ring-red-500/10' : 'border-slate-200 dark:border-slate-800'}`}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Supplier address..."
                            required
                        />
                        {formErrors.address && <p className="text-xs text-red-500 ml-1">{formErrors.address}</p>}
                    </div>
                </div>
            </FormDialog>

            <ConfirmDialog 
                open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={() => deleteMutation.mutate(deleteId)} 
                title="Delete Supplier" 
                message="Are you sure you want to delete this supplier? This action cannot be undone." 
                severity="error" loading={deleteMutation.isPending} 
            />

            <GenericDetailsDialog open={detailsOpen} onClose={() => setDetailsOpen(false)} data={selectedSupplier} title="Supplier Details" />
        </AnimatedContainer>
    );
}
