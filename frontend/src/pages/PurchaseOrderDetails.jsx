import React, { useEffect, useState } from 'react';
import { 
    ArrowLeft, Download, Plus, ShoppingBag, Package, 
    Truck, Calendar, Hash, Inbox, History, Save, 
    ArrowRight, ChevronRight, Bookmark, Archive, 
    Search
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { addItem, receivePO } from '../api/purchaseOrdersApi';
import api from '../api/axios';
import { getProducts } from '../api/productsApi';
import { toast } from 'react-toastify';
import { 
    DashboardCard, AnimatedContainer, PageHeader, 
    StatusChip 
} from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Autocomplete from '../components/ui/Autocomplete';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

export default function PurchaseOrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [po, setPo] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemData, setItemData] = useState({ productId: '', qty: 1, unitCost: 0 });

    const fetchData = async () => {
        try {
            const res = await api.get(`/purchase-orders/${id}`);
            setPo(res.data);

            const pRes = await getProducts({ size: 1000 });
            const pData = pRes.data || pRes;
            setProducts(Array.isArray(pData) ? pData : (pData.content || []));
        } catch (e) {
            navigate('/purchase-orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    const handleAddItem = async () => {
        if (!itemData.productId) {
            toast.error("Please select a product");
            return;
        }
        try {
            await addItem(id, itemData);
            toast.success("Item added to purchase order");
            setItemData({ productId: '', qty: 1, unitCost: 0 });
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to add item');
        }
    };

    const handleReceive = async () => {
        try {
            await receivePO(id);
            toast.success("Purchase order received and stock updated");
            fetchData();
        } catch (e) { 
            toast.error(e.response?.data?.message || "Failed to receive purchase order"); 
        }
    };

    if (!po) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Directive Data...</p>
        </div>
    );

    const isCreated = po.status === 'CREATED';

    return (
        <AnimatedContainer delay={0.1}>
            <PageHeader
                title={`Acquisition Directive #${po.publicId || po.id}`}
                subtitle={`Initialized on ${new Date(po.poDate).toLocaleDateString()} at ${new Date(po.poDate).toLocaleTimeString()}`}
                icon={<Archive size={24} className="text-white" />}
                actions={
                    <div className="flex items-center gap-4">
                        <StatusChip status={po.status} />
                        {isCreated && (
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleReceive}
                                className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20"
                            >
                                <Download size={18} className="mr-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Finalize & Receive</span>
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
                {isCreated && (
                    <div className="lg:col-span-12">
                        <DashboardCard
                            title="Mutation: Add Directive Item"
                            subtitle="Select inventory nodes to include in this acquisition directive"
                            className="overflow-visible"
                            contentClassName="overflow-visible"
                        >
                            <div className="flex flex-col lg:flex-row items-end gap-6">
                                <div className="flex-1 w-full relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Target Product Node</label>
                                    <Autocomplete
                                        options={products.map(p => ({
                                            id: p.id,
                                            label: p.name,
                                            sublabel: `Stock: ${p.unitQty} | Cost: Rs.${p.purchasePrice || 0}`
                                        }))}
                                        value={itemData.productId}
                                        getOptionLabel={(option) => option?.label || ''}
                                        onChange={(val) => {
                                            const p = products.find(prod => prod.id === val);
                                            setItemData({
                                                ...itemData,
                                                productId: val,
                                                unitCost: p ? (p.purchasePrice || p.unitPrice || 0) : 0
                                            });
                                        }}
                                        placeholder="Search inventory database..."
                                        icon={<Search size={18} />}
                                        className="bg-slate-50 dark:bg-slate-900 border-none shadow-sm h-14"
                                    />
                                </div>
                                <div className="w-full lg:w-32">
                                    <Input
                                        type="number"
                                        label="Yield Qty"
                                        value={itemData.qty}
                                        onChange={(e) => setItemData({ ...itemData, qty: parseInt(e.target.value) || 1 })}
                                        className="h-14"
                                    />
                                </div>
                                <div className="w-full lg:w-48">
                                    <Input
                                        type="number"
                                        label="Node Cost (LKR)"
                                        value={itemData.unitCost}
                                        onChange={(e) => setItemData({ ...itemData, unitCost: parseFloat(e.target.value) || 0 })}
                                        className="h-14 font-black italic text-brand-primary"
                                    />
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={handleAddItem}
                                    className="h-14 px-10 bg-slate-900 dark:bg-slate-950 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/20 shrink-0"
                                >
                                    <Plus size={20} className="mr-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Append Item</span>
                                </Button>
                            </div>
                        </DashboardCard>
                    </div>
                )}

                <div className="lg:col-span-8">
                    <DashboardCard title="Directive Matrix" subtitle="Itemized breakdown of requested inventory mass">
                        <div className="overflow-x-auto -mx-10 px-10">
                            <table className="w-full border-separate border-spacing-y-4">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                        <th className="pb-4 text-left font-black pr-6">Catalog Identity</th>
                                        <th className="pb-4 text-center font-black">Yield Qty</th>
                                        <th className="pb-4 text-right font-black">Node Cost</th>
                                        <th className="pb-4 text-right font-black">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {po.items?.length > 0 ? po.items.map((item) => (
                                        <tr key={item.id} className="group transition-all">
                                            <td className="py-4 pr-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                                                        <ShoppingBag size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight italic">
                                                            {products.find(p => p.id === item.productId)?.name || `ID: ${item.productId}`}
                                                        </p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">INSTRUMENT ITEM: {item.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center">
                                                <Badge variant="ghost" className="px-4 bg-slate-50 dark:bg-slate-800 border-none font-black italic">
                                                    {item.qty} UNITS
                                                </Badge>
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className="text-sm font-bold text-slate-500 italic">Rs.{item.unitCost.toFixed(2)}</span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className="text-sm font-black text-slate-900 dark:text-slate-100 italic">Rs.{item.lineTotal.toFixed(2)}</span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center">
                                                <Inbox className="mx-auto text-slate-200 mb-4" size={48} />
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">No items in this purchase order yet</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} className="py-10 text-right">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pr-6">Directive Total</span>
                                        </td>
                                        <td className="py-10 text-right border-t-2 border-slate-50 dark:border-slate-800/10">
                                            <span className="text-3xl font-black text-brand-primary italic uppercase tracking-tighter">
                                                Rs.{po.totalAmount?.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </DashboardCard>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <Card title="Acquisition Log" className="bg-slate-50/50 dark:bg-slate-900/50 border-none shadow-none">
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                    <Truck size={20} />
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Supplier Root</h5>
                                    <p className="text-[11px] font-black text-brand-primary uppercase tracking-widest mt-1 italic">V-NODE: {po.supplierId}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Temporal Stamp</h5>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{new Date(po.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                                    <Hash size={20} />
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Global Pointer</h5>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">UID: {po.id}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-slate-900 dark:bg-slate-950 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-brand-primary/20"></div>
                        <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4 text-brand-primary">LIFECYCLE ADVISORY</h4>
                        <p className="text-xs font-medium text-slate-400 italic leading-relaxed mb-6">
                            Once this directive is <span className="text-white font-black">FINALIZED</span>, inventory stock nodes will be incremented relative to the item yield quantities. Ensure physical verification of mass before authorization.
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AUTHORIZATION LAYER: ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedContainer>
    );
}
