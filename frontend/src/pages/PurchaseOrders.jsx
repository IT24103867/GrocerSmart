import React, { useEffect, useState } from 'react';
import { 
    Plus, Eye, Download, Search, X, 
    Truck, Printer
} from 'lucide-react';
import { getPOs, createPO } from '../api/purchaseOrdersApi';
import { getSuppliers } from '../api/suppliersApi';
import { getPurchaseOrderReportPdf, getPurchaseOrderPdf, downloadBlob } from '../api/reportsApi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PageHeader, DataTable, FormDialog, StatusChip, DashboardCard, AnimatedContainer } from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Autocomplete from '../components/ui/Autocomplete';
import Badge from '../components/ui/Badge';

export default function PurchaseOrders() {
    const [pos, setPos] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [supplierId, setSupplierId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [searchId, setSearchId] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchId) {
                if (isNaN(searchId)) params.publicId = searchId;
                else params.id = searchId;
            }
            const [poRes, supRes] = await Promise.all([
                getPOs(params),
                getSuppliers({ size: 1000 })
            ]);

            const poData = poRes.data?.content || (Array.isArray(poRes.data) ? poRes.data : []);
            const supData = supRes.data?.content || (Array.isArray(supRes.data) ? supRes.data : []);

            setPos(poData);
            setSuppliers(supData);
        } catch (e) {
            setPos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchId]);

    const handleOpenDialog = () => {
        setSupplierId('');
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSupplierId('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const normalizedSupplierId = String(supplierId || '').trim();
        if (!normalizedSupplierId) return toast.error('Please select a supplier');
        setSubmitting(true);
        try {
            await createPO({ supplierId: normalizedSupplierId });
            toast.success('Purchase order created');
            handleCloseDialog();
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to create purchase order');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExportAll = async () => {
        try {
            const { data } = await getPurchaseOrderReportPdf(null, null);
            downloadBlob(data, `Purchase_Orders_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Report downloaded');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const handleDownloadPoPdf = async (id) => {
        try {
            const { data } = await getPurchaseOrderPdf(id);
            downloadBlob(data, `PO_${id}.pdf`);
            toast.success('PO document downloaded');
        } catch (error) {
            toast.error('Download failed');
        }
    };

    const formatCurrency = (val) => {
        const num = Number(val);
        if (Number.isFinite(num)) return `Rs.${num.toLocaleString()}`;
        return '—';
    };

    const enrichedPos = pos.map(p => ({
        ...p,
        supplierName: suppliers.find(s => s.id === p.supplierId)?.name || p.supplierId
    }));

    const columns = [
        { 
            id: 'publicId', 
            label: 'PO ID', 
            minWidth: '120px',
            render: (val) => <span className="font-black text-brand-primary">#{val}</span>
        },
        { 
            id: 'supplierName', 
            label: 'Supplier', 
            minWidth: '220px',
            render: (val) => <span className="font-bold text-slate-900 dark:text-slate-200">{val}</span>
        },
        {
            id: 'poDate',
            label: 'Date',
            minWidth: '160px',
            render: (val) => <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(val).toLocaleDateString()}</span>
        },
        {
            id: 'totalAmount',
            label: 'Total Amount',
            minWidth: '150px',
            align: 'right',
            render: (val) => <span className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(val)}</span>
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: '120px',
            align: 'center',
            render: (val) => <StatusChip status={val} />
        },
    ];

    return (
        <AnimatedContainer delay={0.1}>
            <PageHeader
                title="Purchase Orders"
                subtitle="Manage supplier purchase orders and procurement"
                icon={<Truck size={24} className="text-white" />}
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" onClick={handleExportAll}>
                            <Download size={18} className="mr-2" />
                            Export Report
                        </Button>
                        <Button variant="primary" size="md" onClick={handleOpenDialog}>
                            <Plus size={18} className="mr-2" />
                            New Purchase Order
                        </Button>
                    </div>
                }
            />

            <DashboardCard title="Purchase Order List" className="mt-8">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                    <div className="relative flex-1 w-full">
                        <Input
                            placeholder="Search by PO ID..."
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border-none shadow-sm"
                        />
                        {searchId && (
                            <button 
                                onClick={() => setSearchId('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <Badge variant="secondary" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        {enrichedPos.length} Orders
                    </Badge>
                </div>

                <DataTable
                    columns={columns}
                    data={enrichedPos}
                    searchKey="supplierName"
                    loading={loading}
                    emptyTitle="No purchase orders found"
                    emptyDescription="Create a new purchase order to get started."
                    emptyAction={
                        <Button variant="primary" size="md" onClick={handleOpenDialog} className="px-10">
                            <Plus size={18} className="mr-2" />
                            New Purchase Order
                        </Button>
                    }
                    actions={(row) => (
                        <div className="flex items-center gap-2">
                            <Link to={`/purchase-orders/${row.id}/items`}>
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-blue-500 hover:bg-blue-50">
                                    <Eye size={16} />
                                </Button>
                            </Link>
                            <Button 
                                variant="ghost" size="sm"
                                onClick={() => handleDownloadPoPdf(row.id)}
                                className="h-9 w-9 p-0 text-slate-500 hover:bg-slate-100"
                            >
                                <Printer size={16} />
                            </Button>
                        </div>
                    )}
                />
            </DashboardCard>

            <FormDialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                onSubmit={handleSubmit}
                title="New Purchase Order"
                subtitle="Select a supplier to create a new purchase order"
                loading={submitting}
                submitText="Create Purchase Order"
                maxWidth="max-w-sm"
            >
                <div className="space-y-6 py-2">
                    <Autocomplete
                        label="Supplier"
                        options={suppliers.map(s => ({
                            id: s.id,
                            label: s.name,
                            sublabel: `ID: ${s.publicId}`
                        }))}
                        value={supplierId}
                        getOptionLabel={(option) => option?.label || ''}
                        onChange={(val) => setSupplierId(val)}
                        placeholder="Search suppliers..."
                    />
                </div>
            </FormDialog>
        </AnimatedContainer>
    );
}
