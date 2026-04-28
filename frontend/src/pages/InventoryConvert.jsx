import React, { useState, useEffect } from 'react';
import { 
    Replace, ArrowRightLeft, Scale, Package, 
    AlertCircle, Save, History, Box, 
    ChevronDown, CheckCircle2, AlertTriangle, Search
} from 'lucide-react';
import { getProducts } from '../api/productsApi';
import { convertStock } from '../api/inventoryApi';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { PageHeader, DashboardCard, AnimatedContainer } from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Autocomplete from '../components/ui/Autocomplete';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { motion } from 'framer-motion';

export default function InventoryConvert() {
    const queryClient = useQueryClient();

    const { data: products = [], isLoading: fetchingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await getProducts({ size: 1000 });
            const data = res.data || res;
            return Array.isArray(data) ? data : (data.content || []);
        },
        placeholderData: keepPreviousData,
    });

    const [productId, setProductId] = useState('');
    const [fromBulkQty, setFromBulkQty] = useState(0);
    const [toUnitQty, setToUnitQty] = useState(0);
    const [note, setNote] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        if (productId) {
            const product = products.find(p => p.id === productId);
            setSelectedProduct(product);
        } else {
            setSelectedProduct(null);
        }
    }, [productId, products]);

    const convertMutation = useMutation({
        mutationFn: convertStock,
        onSuccess: () => {
            toast.success('Molecular conversion complete');
            setFromBulkQty(0);
            setToUnitQty(0);
            setNote('');
            setProductId('');
            setSelectedProduct(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: () => {
            toast.error('Conversion protocol aborted');
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const normalizedProductId = String(productId || '').trim();
        const bulkQty = Number(fromBulkQty);
        const unitQty = Number(toUnitQty);

        if (!normalizedProductId) return toast.error('Please select a product');
        if (!Number.isFinite(bulkQty) || bulkQty <= 0) return toast.error('Subtract bulk quantity must be greater than zero');
        if (!Number.isFinite(unitQty) || unitQty <= 0) return toast.error('Yield unit quantity must be greater than zero');

        convertMutation.mutate({ productId: normalizedProductId, fromBulkQty: bulkQty, toUnitQty: unitQty, note: String(note || '').trim() });
    };

    return (
        <AnimatedContainer delay={0.1}>
            <PageHeader
                title="Molecular Conversion"
                subtitle="Transform bulk inventory mass into individual saleable units"
                icon={<Replace size={24} className="text-white" />}
            />

            <div className="max-w-4xl mx-auto mt-10 space-y-10">
                <DashboardCard
                    title="Conversion Directives"
                    subtitle="Specify origin mass and target unit yields"
                >
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Select Target Operand</label>
                            <Autocomplete
                                options={products.map(p => ({
                                    id: p.id,
                                    label: `${p.name}`,
                                    sublabel: `B: ${p.bulkQty} | U: ${p.unitQty} | Ratio: ${p.unitsPerBulk || 1}`
                                }))}
                                value={productId}
                                onChange={(val) => setProductId(val)}
                                placeholder="Search inventory nodes..."
                                icon={<Search size={18} />}
                                loading={fetchingProducts}
                                className="bg-slate-50 dark:bg-slate-900 border-none shadow-sm"
                            />
                        </div>

                        {selectedProduct && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-8 rounded-[2.5rem] bg-brand-primary/5 border border-brand-primary/10 flex items-start gap-5"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                                    <Package size={24} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1">
                                    <div>
                                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bulk MASS</h5>
                                        <p className="text-lg font-black text-slate-900 dark:text-slate-100 italic">{selectedProduct.bulkQty} <span className="text-[10px] text-slate-400 not-italic">UNITS</span></p>
                                    </div>
                                    <div>
                                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Atom Yield</h5>
                                        <p className="text-lg font-black text-slate-900 dark:text-slate-100 italic">{selectedProduct.unitQty} <span className="text-[10px] text-slate-400 not-italic">UNITS</span></p>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <h5 className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-1">Conversion Ratio</h5>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="brand" className="px-3 bg-brand-primary/10 text-brand-primary border-none">1 : {selectedProduct.unitsPerBulk || 1}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="relative group">
                                <Input
                                    type="number"
                                    label="Subtract Bulk Mass (-)"
                                    value={fromBulkQty}
                                    onChange={(e) => setFromBulkQty(parseFloat(e.target.value))}
                                    required
                                    disabled={convertMutation.isPending}
                                    icon={<Box size={16} className="text-red-400" />}
                                    className="bg-red-50/10 dark:bg-red-500/5 border-red-100 dark:border-red-900/30 focus:ring-red-500/10"
                                />
                                <div className="absolute right-4 top-10 flex items-center gap-2 pointer-events-none opacity-40">
                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">OUTFLOW</span>
                                </div>
                            </div>

                            <div className="relative group">
                                <Input
                                    type="number"
                                    label="Yield Unit Addition (+)"
                                    value={toUnitQty}
                                    onChange={(e) => setToUnitQty(parseInt(e.target.value))}
                                    required
                                    disabled={convertMutation.isPending}
                                    icon={<Package size={16} className="text-emerald-400" />}
                                    className="bg-emerald-50/10 border-emerald-100 focus:ring-emerald-500/10"
                                />
                                <div className="absolute right-4 top-10 flex items-center gap-2 pointer-events-none opacity-40">
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">INFLOW</span>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <Input
                                    label="Temporal Note / Rationale"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Annotate this conversion instance..."
                                    disabled={convertMutation.isPending}
                                    icon={<History size={16} />}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full h-16 rounded-[2rem] bg-slate-900 group"
                                disabled={convertMutation.isPending || !productId}
                                loading={convertMutation.isPending}
                            >
                                <ArrowRightLeft size={20} className="mr-3 group-hover:rotate-180 transition-transform duration-500" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Execute Molecular Shift</span>
                            </Button>
                        </div>
                    </form>
                </DashboardCard>

                <div className="p-8 rounded-[3rem] bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 flex items-start gap-4">
                    <AlertTriangle className="text-indigo-400 shrink-0 mt-1" size={24} />
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight italic">Irreversible Operation</h4>
                        <p className="text-[10px] font-medium text-indigo-400/80 uppercase tracking-widest leading-relaxed">
                            Dimensional stock conversion triggers permanent ledger mutations. Ensure mass calculations align with the physical inventory state before authorization.
                        </p>
                    </div>
                </div>
            </div>
        </AnimatedContainer>
    );
}
