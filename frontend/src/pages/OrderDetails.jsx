import React, { useEffect, useState } from 'react';
import { 
    ArrowLeft, Check, Printer, Plus, ShoppingBag, 
    CreditCard, Calendar, Hash, User, ShieldAlert, 
    AlertCircle, Inbox, History, Save, ChevronRight, 
    ArrowRight, Bookmark, Archive, Search, FileText
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrder, addOrderItem, confirmOrder } from '../api/ordersApi';
import { getProducts } from '../api/productsApi';
import { getCustomerBalance } from '../api/creditCustomersApi';
import { getInvoicePdf, downloadBlob } from '../api/reportsApi';
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

export default function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [products, setProducts] = useState([]);
    const [customerBalance, setCustomerBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [itemData, setItemData] = useState({ productId: '', qty: 1, unitPrice: 0 });

    const fetchData = async () => {
        try {
            const oRes = await getOrder(id);
            const currentOrder = oRes.data;
            setOrder(currentOrder);

            if (currentOrder.paymentType === 'CREDIT' && currentOrder.creditCustomerId) {
                const bRes = await getCustomerBalance(currentOrder.creditCustomerId);
                setCustomerBalance(bRes.data);
            }

            const pRes = await getProducts({ size: 1000 });
            const pData = pRes.data || pRes;
            setProducts(Array.isArray(pData) ? pData : (pData.content || []));
        } catch (e) {
            navigate('/orders');
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

        if (Number(itemData.qty || 0) <= 0) {
            toast.error("Quantity must be greater than zero");
            return;
        }

        if (Number(itemData.unitPrice || 0) < 0) {
            toast.error("Unit price cannot be negative");
            return;
        }

        try {
            await addOrderItem(id, itemData);
            toast.success("Item added to order");
            setItemData({ ...itemData, qty: 1, unitPrice: 0, productId: '' });
            fetchData();
        } catch (e) { toast.error("Failed to add item"); }
    };

    const handleConfirm = async () => {
        try {
            await confirmOrder(id);
            toast.success("Order confirmed successfully");
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to confirm order");
        }
    };

    const handleDownloadInvoice = async () => {
        try {
            const res = await getInvoicePdf(id);
            downloadBlob(res.data, `Invoice_${order.invoiceNo}.pdf`);
            toast.success("Invoice downloaded");
        } catch (e) {
            toast.error("Failed to download invoice");
        }
    };

    const isLimitExceeded = () => {
        if (!order || order.paymentType !== 'CREDIT' || !customerBalance) return false;
        const total = order.totalAmount || 0;
        return total > customerBalance.availableCredit;
    };

    if (!order) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Transaction Layer...</p>
        </div>
    );

    const isDraft = order.status === 'DRAFT';

    return (
        <AnimatedContainer delay={0.1}>
            <PageHeader
                title={`Order Instrument #${order.invoiceNo}`}
                subtitle={`Serialized on ${new Date(order.orderDate).toLocaleDateString()}`}
                icon={<FileText size={24} className="text-white" />}
                actions={
                    <div className="flex items-center gap-4">
                        <StatusChip status={order.status} />
                        {order.status !== 'DRAFT' && (
                            <Button
                                variant="outline"
                                size="md"
                                onClick={handleDownloadInvoice}
                            >
                                <Printer size={18} className="mr-2" />
                                Export Invoice
                            </Button>
                        )}
                        {isDraft && (
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleConfirm}
                                disabled={isLimitExceeded()}
                                className={`
                                    shadow-xl transition-all
                                    ${isLimitExceeded() 
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none' 
                                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'}
                                `}
                            >
                                <Check size={18} className="mr-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {isLimitExceeded() ? "CREDIT EXCEEDED" : "FINALIZE TRANSACTION"}
                                </span>
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
                {order.paymentType === 'CREDIT' && customerBalance && (
                    <div className="lg:col-span-12">
                        <div className={`
                            p-8 rounded-[3rem] border flex flex-col md:flex-row items-center justify-between gap-8
                            ${isLimitExceeded() 
                                ? 'bg-red-50/50 dark:bg-red-500/5 border-red-100 dark:border-red-900/30' 
                                : 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-900/30'}
                        `}>
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isLimitExceeded() ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    <ShieldAlert size={28} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-tight italic text-slate-900 dark:text-slate-100">CLIENT CREDIT TELEMETRY</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Assigned Node: {order.creditCustomerName}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                                <div>
                                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payload</h5>
                                    <p className="text-xl font-black text-slate-900 dark:text-slate-100 italic">Rs.{order.totalAmount?.toFixed(2)}</p>
                                </div>
                                <div className="border-l border-slate-200 dark:border-slate-800 pl-10">
                                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Headroom</h5>
                                    <p className={`text-xl font-black italic ${isLimitExceeded() ? 'text-red-500' : 'text-emerald-500'}`}>
                                        Rs.{customerBalance.availableCredit?.toFixed(2)}
                                    </p>
                                </div>
                                <div className="hidden md:block border-l border-slate-200 dark:border-slate-800 pl-10">
                                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Protocol Status</h5>
                                    <Badge variant={isLimitExceeded() ? 'error' : 'success'} className="mt-1 px-4 border-none">
                                        {isLimitExceeded() ? 'CRITICAL: BLOCK' : 'STABLE: AUTHORIZE'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isDraft && (
                    <div className="lg:col-span-12">
                        <DashboardCard title="Append Transaction Segment" subtitle="Modify order mass by adding discrete product nodes">
                            <div className="flex flex-col lg:flex-row items-end gap-6">
                                <div className="flex-1 w-full relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Catalog Node Selection</label>
                                    <Autocomplete
                                        options={products.map(p => ({
                                            id: p.id,
                                            label: p.name,
                                            sublabel: `Stock: ${p.unitQty} | Price: Rs.${p.unitPrice}`
                                        }))}
                                        value={itemData.productId}
                                        onChange={(val) => {
                                            const p = products.find(prod => prod.id === val);
                                            setItemData({
                                                ...itemData,
                                                productId: val,
                                                unitPrice: p ? (p.unitPrice || 0) : 0
                                            });
                                        }}
                                        placeholder="Search product nodes..."
                                        icon={<Search size={18} />}
                                        className="bg-slate-50 dark:bg-slate-900 border-none shadow-sm h-14"
                                    />
                                </div>
                                <div className="w-full lg:w-32">
                                    <Input
                                        type="number"
                                        label="Yield Qty"
                                        value={itemData.qty}
                                        onChange={(e) => setItemData({ ...itemData, qty: Math.max(1, parseInt(e.target.value) || 1) })}
                                        min="1"
                                        className="h-14"
                                    />
                                </div>
                                <div className="w-full lg:w-48">
                                    <Input
                                        type="number"
                                        label="Sale Price"
                                        value={itemData.unitPrice}
                                        onChange={(e) => setItemData({ ...itemData, unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                                        min="0"
                                        step="0.01"
                                        className="h-14 font-black italic text-brand-primary"
                                    />
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={handleAddItem}
                                    className="h-14 px-10 bg-slate-900 dark:bg-slate-950 shadow-xl shadow-slate-900/10 shrink-0"
                                >
                                    <Plus size={20} className="mr-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Authorize Item</span>
                                </Button>
                            </div>
                        </DashboardCard>
                    </div>
                )}

                <div className="lg:col-span-8">
                    <DashboardCard title="Billing Matrix" subtitle="Serialized breakdown of current transaction items">
                        <div className="overflow-x-auto -mx-10 px-10">
                            <table className="w-full border-separate border-spacing-y-4">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                        <th className="pb-4 text-left font-black pr-6">Catalog Node</th>
                                        <th className="pb-4 text-center font-black">Segment Qty</th>
                                        <th className="pb-4 text-right font-black">Unit Valuation</th>
                                        <th className="pb-4 text-right font-black">Segment Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items?.length > 0 ? order.items.map((item) => (
                                        <tr key={item.id} className="group">
                                            <td className="py-4 pr-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                                                        <ShoppingBag size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight italic">
                                                            {products.find(p => p.id === item.productId)?.name || `ID: ${item.productId}`}
                                                        </p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">NODE_UID: {item.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center">
                                                <Badge variant="ghost" className="px-4 bg-slate-50 dark:bg-slate-800 border-none font-black italic">
                                                    {item.qty} UNITS
                                                </Badge>
                                            </td>
                                            <td className="py-4 text-right text-sm font-bold text-slate-500 italic">
                                                Rs.{item.unitPrice?.toFixed(2)}
                                            </td>
                                            <td className="py-4 text-right text-sm font-black text-slate-900 dark:text-slate-100 italic">
                                                Rs.{item.lineTotal?.toFixed(2)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center">
                                                <Inbox className="mx-auto text-slate-200 mb-4" size={48} />
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">No items in this order yet</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} className="py-10 text-right">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pr-6 italic">Aggregate Valuation</span>
                                        </td>
                                        <td className="py-10 text-right border-t-2 border-slate-50 dark:border-slate-800/20">
                                            <span className="text-4xl font-black text-brand-primary italic uppercase tracking-tighter">
                                                Rs.{order.totalAmount?.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </DashboardCard>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <Card title="Metastructure Data" className="bg-slate-50/50 dark:bg-slate-900/50 border-none shadow-none">
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                    <Bookmark size={20} />
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Payment Topology</h5>
                                    <p className="text-[11px] font-black text-brand-primary uppercase tracking-widest mt-1 italic">{order.paymentType}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <Calendar size={20} />
                                </div>
                                {order.status !== 'DRAFT' && (
                                    <div>
                                        <h5 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Execution Date</h5>
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{new Date(order.updatedAt || order.orderDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                                    <Hash size={20} />
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Internal Anchor</h5>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">OID: {order.id}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className={`p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group ${order.paymentType === 'CASH' ? 'bg-slate-900 dark:bg-slate-950 text-white' : 'bg-brand-primary text-white'}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/10 transition-all"></div>
                        <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4">NODE ADVISORY</h4>
                        <p className="text-xs font-medium text-white/70 italic leading-relaxed mb-6">
                            {isDraft 
                               ? "This transaction is currently in a mutable DRAFT state. Finalize to execute ledger mutations across the network."
                               : "This transaction has been localized and the ledger is locked. No further mutations are authorized for this instrument."}
                        </p>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${isDraft ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                                {isDraft ? 'DRAFT_LOCK: INACTIVE' : 'DRAFT_LOCK: ACTIVE'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedContainer>
    );
}
