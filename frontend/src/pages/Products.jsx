import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Filter, FileUp, FileBarChart, Edit, Trash2, Eye, Printer, X, Check, Package, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

import { getProducts, createProduct, updateProduct, deleteProduct, importCsv, getProductDemandForecast } from '../api/productsApi';
import { getInventoryReportPdf, getProductDetailsPdf, downloadBlob } from '../api/reportsApi';
import { getApiErrorMessage } from '../utils/apiError';

import { PageHeader, DataTable, FormDialog, ConfirmDialog, StatusChip, DashboardCard, AnimatedContainer, GenericDetailsDialog } from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toggle from '../components/ui/Toggle';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

const initialFormData = {
    name: '',
    category: '',
    family: 'GENERAL',
    store_nbr: 1,
    onpromotion: 0,
    unitPrice: 0,
    bulkPrice: 0,
    purchasePrice: 0,
    stockLevels: { bulkQty: 0, retailQty: 0 },
    unitConfig: { bulkUnit: 'Case', retailUnit: 'Piece', conversionFactor: 1 },
    reorderPoint: 10,
    batchDetails: [{ batchId: '', expiryDate: '', costPrice: 0 }],
    status: 'ACTIVE',
};

const PRODUCT_TEXT_REGEX = /^[a-zA-Z0-9\s&()\-/.#,]+$/;

export default function Products() {
    const queryClient = useQueryClient();
    const categoryContainerRef = useRef(null);

    // Table & Filter State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [orderBy, setOrderBy] = useState('id');
    const [orderDirection, setOrderDirection] = useState('desc');

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [forecastOpen, setForecastOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [forecastProduct, setForecastProduct] = useState(null);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    // Data Fetching
    const { data, isLoading } = useQuery({
        queryKey: ['products', page, rowsPerPage, search, filterCategory, showArchived, orderBy, orderDirection],
        queryFn: async () => {
            const params = {
                page,
                size: rowsPerPage,
                search: search || undefined,
                category: filterCategory || undefined,
                status: showArchived ? 'DISCONTINUED' : 'ACTIVE',
                sort: `${orderBy},${orderDirection}`
            };
            const response = await getProducts(params);
            return response.data || response;
        },
        placeholderData: keepPreviousData
    });

    const products = data?.content || [];
    const totalCount = data?.totalElements || 0;

    const categoryOptions = useMemo(() => {
        const set = new Set(
            (products || [])
                .map((product) => String(product?.category || '').trim())
                .filter(Boolean)
        );

        if (formData.category?.trim()) {
            set.add(formData.category.trim());
        }

        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [products, formData.category]);

    const filteredCategoryOptions = useMemo(() => {
        const term = categorySearch.trim().toLowerCase();
        if (!term) return categoryOptions;
        return categoryOptions.filter((category) => category.toLowerCase().includes(term));
    }, [categoryOptions, categorySearch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryContainerRef.current && !categoryContainerRef.current.contains(event.target)) {
                setCategoryDropdownOpen(false);
                setCategorySearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mutations
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            setDialogOpen(false);
            setDeleteDialogOpen(false);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Operation failed'));
        }
    };

    const createMutation = useMutation({ mutationFn: createProduct, ...mutationOptions, onSuccess: () => { toast.success('Product created'); mutationOptions.onSuccess(); } });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateProduct(id, data),
        ...mutationOptions,
        onSuccess: () => {
            mutationOptions.onSuccess();
        }
    });
    const deleteMutation = useMutation({ mutationFn: deleteProduct, ...mutationOptions, onSuccess: () => { toast.success('Product archived'); mutationOptions.onSuccess(); } });
    
    const importMutation = useMutation({
        mutationFn: importCsv,
        onSuccess: (res) => {
            const data = res.data || res;
            toast.success(`Import success! Summary: ${data.imported} new items.`);
            queryClient.invalidateQueries(['products']);
        },
        onError: () => toast.error('Import failed')
    });

    const forecastMutation = useMutation({
        mutationFn: (productId) => getProductDemandForecast(productId),
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to fetch forecast'));
        }
    });

    const handleOpenDialog = (product = null) => {
        if (product) {
            setEditId(product.id);
            setFormData({
                name: product.name,
                category: product.category,
                family: product.category || 'GENERAL',
                store_nbr: 1,
                onpromotion: 0,
                unitPrice: product.unitPrice,
                bulkPrice: product.bulkPrice,
                purchasePrice: product.purchasePrice || 0,
                stockLevels: {
                    bulkQty: product?.stockLevels?.bulkQty ?? product.bulkQty ?? 0,
                    retailQty: product?.stockLevels?.retailQty ?? product.unitQty ?? 0,
                },
                unitConfig: {
                    bulkUnit: product?.unitConfig?.bulkUnit || 'Case',
                    retailUnit: product?.unitConfig?.retailUnit || 'Piece',
                    conversionFactor: product?.unitConfig?.conversionFactor ?? product.unitsPerBulk ?? 1,
                },
                reorderPoint: product.reorderPoint || product.reorderLevel || 10,
                batchDetails: (product.batchDetails && product.batchDetails.length > 0)
                    ? product.batchDetails.map((batch) => ({
                        batchId: batch.batchId || '',
                        expiryDate: batch.expiryDate ? format(new Date(batch.expiryDate), 'yyyy-MM-dd') : '',
                        costPrice: batch.costPrice ?? 0,
                    }))
                    : [{ batchId: '', expiryDate: '', costPrice: 0 }],
                status: product.status,
            });
        } else {
            setEditId(null);
            setFormData(initialFormData);
        }
        setCategorySearch('');
        setCategoryDropdownOpen(false);
        setDialogOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const name = String(formData.name || '').trim();
        const typedCategory = String(categorySearch || '').trim();
        const selectedCategory = String(formData.category || '').trim();
        const category = typedCategory || selectedCategory;
        const bulkUnit = String(formData.unitConfig?.bulkUnit || '').trim();
        const retailUnit = String(formData.unitConfig?.retailUnit || '').trim();

        if (!name) return toast.error('Product name is required');
        if (!PRODUCT_TEXT_REGEX.test(name)) return toast.error('Product name contains invalid characters');
        if (!category) return toast.error('Category is required');
        if (!PRODUCT_TEXT_REGEX.test(category)) return toast.error('Category contains invalid characters');
        if (!bulkUnit) return toast.error('Bulk unit is required');
        if (!PRODUCT_TEXT_REGEX.test(bulkUnit)) return toast.error('Bulk unit contains invalid characters');
        if (!retailUnit) return toast.error('Retail unit is required');
        if (!PRODUCT_TEXT_REGEX.test(retailUnit)) return toast.error('Retail unit contains invalid characters');

        const numericChecks = [
            { label: 'Unit Price', value: Number(formData.unitPrice), min: 0.01 },
            { label: 'Bulk Price', value: Number(formData.bulkPrice), min: 0.01 },
            { label: 'Purchase Price', value: Number(formData.purchasePrice), min: 0 },
            { label: 'Retail Stock', value: Number(formData.stockLevels?.retailQty), min: 0 },
            { label: 'Bulk Stock', value: Number(formData.stockLevels?.bulkQty), min: 0 },
            { label: 'Conversion Factor', value: Number(formData.unitConfig?.conversionFactor), min: 1 },
            { label: 'Reorder Point', value: Number(formData.reorderPoint), min: 1 },
        ];

        const invalidNumeric = numericChecks.find((field) => !Number.isFinite(field.value) || field.value < field.min);
        if (invalidNumeric) {
            return toast.error(`${invalidNumeric.label} cannot be less than ${invalidNumeric.min}`);
        }

        const invalidBatchIndex = (formData.batchDetails || []).findIndex((batch) => Number(batch?.costPrice || 0) < 0);
        if (invalidBatchIndex >= 0) {
            return toast.error(`Batch ${invalidBatchIndex + 1}: Cost Price cannot be negative`);
        }

        const invalidBatchLabelIndex = (formData.batchDetails || []).findIndex((batch) => {
            const batchId = String(batch?.batchId || '').trim();
            return batchId && !PRODUCT_TEXT_REGEX.test(batchId);
        });
        if (invalidBatchLabelIndex >= 0) {
            return toast.error(`Batch ${invalidBatchLabelIndex + 1}: Batch ID contains invalid characters`);
        }

        setCategorySearch('');

        const payload = {
            ...formData,
            name,
            category,
            unitConfig: {
                ...formData.unitConfig,
                bulkUnit,
                retailUnit
            },
            family: category || 'GENERAL',
            store_nbr: 1,
            onpromotion: 0,
        };

        if (editId) {
            updateMutation.mutate({ id: editId, data: payload }, {
                onSuccess: () => {
                    toast.success('Product updated');
                }
            });
        }
        else createMutation.mutate(payload);
    };

    const selectCategory = (category) => {
        const value = String(category || '').trim();
        setFormData((prev) => ({
            ...prev,
            category: value,
            family: value || 'GENERAL'
        }));
        setCategorySearch('');
        setCategoryDropdownOpen(false);
    };

    const handleToggleStatus = (product) => {
        const productId = product?.id || product?._id;
        if (!productId) {
            toast.error('Invalid product identifier');
            return;
        }

        const nextStatus = product.status === 'ACTIVE' ? 'DISCONTINUED' : 'ACTIVE';
        updateMutation.mutate({
            id: productId,
            data: {
                ...product,
                family: String(product.category || 'GENERAL').trim() || 'GENERAL',
                store_nbr: 1,
                onpromotion: 0,
                status: nextStatus
            }
        }, {
            onSuccess: () => {
                toast.success(nextStatus === 'ACTIVE' ? 'Activated' : 'Deactivated');
                queryClient.invalidateQueries(['products']);
            }
        });
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && orderDirection === 'asc';
        setOrderDirection(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleImportCsv = (e) => {
        const file = e.target.files[0];
        if (file) importMutation.mutate(file);
        e.target.value = '';
    };

    const handleExportPDF = async () => {
        try {
            const status = showArchived ? 'DISCONTINUED' : 'ACTIVE';
            const { data } = await getInventoryReportPdf(status);
            downloadBlob(data, `Inventory_${status}_${format(new Date(), 'yyyyMMdd')}.pdf`);
            toast.success("Downloaded");
        } catch (error) { toast.error("Export failed"); }
    };

    const formatCurrency = (val) => Number.isFinite(Number(val)) ? `Rs.${Number(val).toLocaleString()}` : '—';

    const openForecastDialog = async (product) => {
        try {
            setForecastProduct(product);
            setForecastOpen(true);
            await forecastMutation.mutateAsync(product.id);
        } catch (_) {
            // handled by mutation onError
        }
    };

    const handleBatchChange = (index, field, value) => {
        const next = [...formData.batchDetails];
        next[index] = { ...next[index], [field]: value };
        setFormData({ ...formData, batchDetails: next });
    };

    const addBatchRow = () => {
        setFormData({
            ...formData,
            batchDetails: [...formData.batchDetails, { batchId: '', expiryDate: '', costPrice: 0 }]
        });
    };

    const removeBatchRow = (index) => {
        const next = formData.batchDetails.filter((_, rowIndex) => rowIndex !== index);
        setFormData({
            ...formData,
            batchDetails: next.length ? next : [{ batchId: '', expiryDate: '', costPrice: 0 }]
        });
    };

    const columns = useMemo(() => [
        { id: 'name', label: 'Product Name', minWidth: '200px', sortable: true, render: (val) => <span className="font-bold text-slate-800 dark:text-slate-100">{val}</span> },
        { id: 'category', label: 'Category', minWidth: '120px', sortable: true, render: (val) => <Badge variant="secondary">{val}</Badge> },
        { id: 'purchasePrice', label: 'Purchase', align: 'right', sortable: true, render: (val) => <span className="font-bold text-slate-500 dark:text-slate-400">{formatCurrency(val)}</span> },
        { id: 'unitPrice', label: 'Sell Price', align: 'right', sortable: true, render: (val) => <span className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(val)}</span> },
        {
            id: 'totalInRetailUnits', label: 'Stock (Retail Units)', align: 'right', sortable: true,
            render: (val, row) => (
                <div className="flex flex-col items-end">
                    <span className={`font-black ${Number(val || 0) <= Number(row.reorderPoint || 10) ? 'text-red-500' : 'text-emerald-500'}`}>{val || 0}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.reorderPoint || 10} Reorder</span>
                </div>
            )
        },
        {
            id: 'activeToggle', label: 'Active', align: 'center',
            render: (_, row) => <Toggle enabled={row.status === 'ACTIVE'} onChange={() => handleToggleStatus(row)} />
        },
        {
            id: 'batchDetails', label: 'Nearest Expiry', sortable: false,
            render: (val) => {
                const nearest = Array.isArray(val) && val.length > 0
                    ? [...val]
                        .filter((batch) => batch?.expiryDate)
                        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0]
                    : null;
                return nearest?.expiryDate ? (
                <span className={`font-bold text-[10px] uppercase tracking-wider ${new Date(nearest.expiryDate) < new Date() ? 'text-red-500' : 'text-slate-500'}`}>
                    {format(new Date(nearest.expiryDate), 'MMM dd, yyyy')}
                </span>
                ) : <span className="text-slate-300">—</span>;
            },
        },
    ], []);

    return (
        <AnimatedContainer>
            <PageHeader
                title="Products" 
                subtitle="Master catalog and real-time inventory"
                icon={<Package size={24} className="text-white" />}
                actions={
                    <div className="flex items-center gap-3">
                        <input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={handleImportCsv} />
                        <label htmlFor="csv-upload" className="cursor-pointer">
                            <Button variant="outline" size="md" loading={importMutation.isPending} className="pointer-events-none">
                                <FileUp size={18} className="mr-2" /> Import CSV
                            </Button>
                        </label>
                        <Button variant="outline" size="md" onClick={handleExportPDF}>
                            <FileBarChart size={18} className="mr-2" /> Report
                        </Button>
                        <Button variant="primary" size="md" onClick={() => handleOpenDialog()}>
                            <Plus size={18} className="mr-2" /> Add Product
                        </Button>
                    </div>
                }
            />

            <DashboardCard title="Inventory Explorer" className="mt-8">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 items-end">
                    <div className="md:col-span-4">
                        <Input
                            label="Search Inventory"
                            placeholder="Name, Public ID..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            className="bg-slate-50 dark:bg-slate-900 border-none shadow-sm"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <Input
                            label="Category"
                            placeholder="All Categories"
                            value={filterCategory}
                            onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
                            className="bg-slate-50 dark:bg-slate-900 border-none shadow-sm"
                        />
                    </div>
                    <div className="md:col-span-3 pb-2">
                        <Toggle 
                            label={showArchived ? "Showing Archived" : "Active Only"} 
                            enabled={showArchived} 
                            onChange={(val) => { setShowArchived(val); setPage(0); }} 
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Button 
                            variant="secondary" 
                            className="w-full text-[10px]" 
                            disabled={!search && !filterCategory && !showArchived}
                            onClick={() => { setSearch(''); setFilterCategory(''); setShowArchived(false); setPage(0); }}
                        >
                            <X size={14} className="mr-1" /> Reset
                        </Button>
                    </div>
                </div>

                <DataTable
                    serverSide columns={columns} data={products} loading={isLoading}
                    totalCount={totalCount} page={page} rowsPerPage={rowsPerPage}
                    onPageChange={setPage} onRowsPerPageChange={setRowsPerPage}
                    orderBy={orderBy} orderDirection={orderDirection} onSortChange={handleSort}
                    actions={(row) => (
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(row); setDetailsOpen(true); }} className="text-blue-500 hover:bg-blue-50">
                                <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openForecastDialog(row)} className="text-indigo-500 hover:bg-indigo-50">
                                <TrendingUp size={16} />
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
                title={editId ? 'Modify Product' : 'Register Product'} 
                subtitle={editId ? `Editing ${formData.name}` : 'Enter product details to add to catalog'}
                loading={createMutation.isPending || updateMutation.isPending} 
                maxWidth="max-w-3xl"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                    <Input label="Product Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />

                    <div className="flex flex-col gap-1.5 w-full relative z-[120]" ref={categoryContainerRef}>
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Category <span className="text-red-500">*</span></label>
                        <div
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus-within:ring-2 focus-within:ring-brand-primary/20"
                            onClick={() => setCategoryDropdownOpen(true)}
                        >
                            <input
                                type="text"
                                value={categoryDropdownOpen ? categorySearch : formData.category}
                                placeholder="Search category or type new"
                                className="w-full bg-transparent outline-none"
                                onFocus={() => {
                                    setCategoryDropdownOpen(true);
                                    setCategorySearch('');
                                }}
                                onChange={(e) => {
                                    setCategoryDropdownOpen(true);
                                    setCategorySearch(e.target.value);
                                }}
                            />
                        </div>

                        {categoryDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-[130]">
                                <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                    {filteredCategoryOptions.length > 0 ? (
                                        filteredCategoryOptions.map((category) => (
                                            <button
                                                key={category}
                                                type="button"
                                                className="w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                onClick={() => selectCategory(category)}
                                            >
                                                {category}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">No category matches</div>
                                    )}
                                </div>

                                {categorySearch.trim() && !categoryOptions.some((item) => item.toLowerCase() === categorySearch.trim().toLowerCase()) && (
                                    <button
                                        type="button"
                                        className="w-full text-left px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-sm font-black text-brand-primary hover:bg-brand-primary/5"
                                        onClick={() => selectCategory(categorySearch)}
                                    >
                                        Create category: {categorySearch.trim()}
                                    </button>
                                )}
                            </div>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Forecast family will use this category automatically.</p>
                    </div>


                    
                    <div className="grid grid-cols-3 gap-4 md:col-span-2">
                        <Input type="number" label="Unit Price (Rs.)" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })} required min="0" step="0.01" />
                        <Input type="number" label="Bulk Price (Rs.)" value={formData.bulkPrice} onChange={(e) => setFormData({ ...formData, bulkPrice: Math.max(0, parseFloat(e.target.value) || 0) })} required min="0" step="0.01" />
                        <Input type="number" label="Purchase Price (Rs.)" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: Math.max(0, parseFloat(e.target.value) || 0) })} required min="0" step="0.01" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 md:col-span-2">
                        <Input type="number" label="Retail Stock" value={formData.stockLevels.retailQty} onChange={(e) => setFormData({ ...formData, stockLevels: { ...formData.stockLevels, retailQty: Math.max(0, parseInt(e.target.value) || 0) } })} required min="0" step="1" />
                        <Input type="number" label="Bulk Stock" value={formData.stockLevels.bulkQty} onChange={(e) => setFormData({ ...formData, stockLevels: { ...formData.stockLevels, bulkQty: Math.max(0, parseFloat(e.target.value) || 0) } })} required min="0" step="0.01" />
                        <Input type="number" label="Conversion Factor" value={formData.unitConfig.conversionFactor} onChange={(e) => setFormData({ ...formData, unitConfig: { ...formData.unitConfig, conversionFactor: Math.max(1, parseInt(e.target.value) || 1) } })} required min="1" step="1" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                        <Input label="Bulk Unit" value={formData.unitConfig.bulkUnit} onChange={(e) => setFormData({ ...formData, unitConfig: { ...formData.unitConfig, bulkUnit: e.target.value } })} required />
                        <Input label="Retail Unit" value={formData.unitConfig.retailUnit} onChange={(e) => setFormData({ ...formData, unitConfig: { ...formData.unitConfig, retailUnit: e.target.value } })} required />
                    </div>

                    <Input type="number" label="Reorder Point" value={formData.reorderPoint} onChange={(e) => setFormData({ ...formData, reorderPoint: Math.max(0, parseInt(e.target.value) || 0) })} required min="0" step="1" />
                    
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Status</label>
                        <select 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="DISCONTINUED">Discontinued</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Batch Details</h4>
                            <Button type="button" variant="outline" size="sm" onClick={addBatchRow}>Add Batch</Button>
                        </div>
                        <div className="space-y-2">
                            {formData.batchDetails.map((batch, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-10 gap-2 items-end border border-slate-200 dark:border-slate-800 rounded-xl p-2">
                                    <div className="md:col-span-4">
                                        <Input label="Batch ID" value={batch.batchId} onChange={(e) => handleBatchChange(index, 'batchId', e.target.value)} />
                                    </div>
                                    <div className="md:col-span-3">
                                        <Input type="date" label="Expiry Date" value={batch.expiryDate} onChange={(e) => handleBatchChange(index, 'expiryDate', e.target.value)} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Input type="number" label="Cost Price" value={batch.costPrice} onChange={(e) => handleBatchChange(index, 'costPrice', Math.max(0, parseFloat(e.target.value) || 0))} min="0" step="0.01" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeBatchRow(index)}><X size={14} /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </FormDialog>

            <ConfirmDialog
                open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={() => deleteMutation.mutate(deleteId)}
                title="Archive Product" 
                message="Are you sure you want to archive this product? It will be moved to the discontinued list and hidden from POS." 
                loading={deleteMutation.isPending} severity="error"
            />

            <GenericDetailsDialog open={detailsOpen} onClose={() => setDetailsOpen(false)} data={selectedProduct} title="Product Details" />

            <Modal
                open={forecastOpen}
                onClose={() => setForecastOpen(false)}
                title="Demand Forecast"
                subtitle={forecastProduct ? `${forecastProduct.name} • 14 day prediction` : ''}
                maxWidth="max-w-3xl"
            >
                {forecastMutation.isPending ? (
                    <div className="py-16 text-center">
                        <div className="w-10 h-10 mx-auto border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">Fetching AI forecast...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Stock</p>
                                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{Number(forecastMutation.data?.data?.currentStock || 0)}</p>
                            </div>
                            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">14 Day Demand</p>
                                <p className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">{Number(forecastMutation.data?.data?.totalForecast14Days || 0).toFixed(2)}</p>
                            </div>
                            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recommended Reorder</p>
                                <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{Number(forecastMutation.data?.data?.recommendedReorderQty || 0)}</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Daily Forecast</p>
                            <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                                {(forecastMutation.data?.data?.forecast14Days || []).map((val, idx) => (
                                    <div key={idx} className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Day {idx + 1}</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{Number(val).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => forecastProduct && openForecastDialog(forecastProduct)} loading={forecastMutation.isPending}>
                                Refresh Forecast
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </AnimatedContainer>
    );
}
