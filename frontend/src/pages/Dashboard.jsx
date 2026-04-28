import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, CreditCard, Landmark, Package, 
    AlertTriangle, Store, ShoppingCart, 
    LineChart, UserPlus, Receipt
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';

import { getProducts } from '../api/productsApi';
import { getCustomers } from '../api/creditCustomersApi';
import { getCheques } from '../api/chequesApi';
import { getOrders } from '../api/ordersApi';
import { getSales, getDailySalesStats, getTopProductsStats } from '../api/salesApi';

import KpiCard from '../components/KpiCard';
import DashboardCard from '../components/DashboardCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StatusChip from '../components/StatusChip';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import ChequeLifecycleChart from '../components/charts/ChequeLifecycleChart';

const formatCurrency = (amount) => {
    const num = Number(amount || 0);
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(num);
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const role = useMemo(() => localStorage.getItem('role') || 'CASHIER', []);
    const isAdmin = useMemo(() => role === 'ADMIN', [role]);

    const [stats, setStats] = useState({
        totalRevenue: 0,
        todaysSales: 0,
        salesCount: 0,
        ordersCount: 0,
        activeProducts: 0,
        lowStock: 0,
        expiringCount: 0,
        creditBalance: 0,
        availableCredit: 0,
        pendingCheques: 0,
    });

    const [salesTrend, setSalesTrend] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [chequeStatus, setChequeStatus] = useState([]);
    const [recentSales, setRecentSales] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [dueCheques, setDueCheques] = useState([]);
    const [topDebtors, setTopDebtors] = useState([]);
    const [timeRange, setTimeRange] = useState('7d');

    const currentDate = useMemo(() => format(new Date(), 'EEEE, MMMM do, yyyy'), []);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const toList = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.content)) return payload.content;
        return [];
    };

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                const promises = [
                    getProducts({ status: 'ACTIVE', size: 1000 }).catch(() => ({ data: [] })),
                    getCustomers({ size: 1000 }).catch(() => ({ data: [] })),
                    getCheques({ size: 1000 }).catch(() => ({ data: [] })),
                    getOrders({ size: 1000 }).catch(() => ({ data: [] })),
                ];
                if (isAdmin) promises.push(getSales({ size: 1000 }).catch(() => ({ data: [] })));
                else promises.push(Promise.resolve({ data: [] }));

                const [prodRes, custRes, chequeRes, ordersRes, salesRes] = await Promise.all(promises);
                if (!isMounted) return;

                const products = toList(prodRes?.data);
                const customers = toList(custRes?.data);
                const cheques = toList(chequeRes?.data);
                const orders = toList(ordersRes?.data);
                const sales = toList(salesRes?.data);

                const activeProducts = products.length;
                const lowStockCandidates = products
                    .map((p) => {
                        const retail = Number(p?.stockLevels?.retailQty ?? p?.unitQty ?? 0);
                        const bulk = Number(p?.stockLevels?.bulkQty ?? p?.bulkQty ?? 0);
                        const factor = Number(p?.unitConfig?.conversionFactor ?? p?.unitsPerBulk ?? 1);
                        const totalRetailUnits = retail + (bulk * factor);
                        const reorder = Number(p?.reorderPoint ?? p?.reorderLevel ?? 10);
                        return {
                            ...p,
                            totalRetailUnits,
                            reorder,
                            deficit: reorder - totalRetailUnits
                        };
                    })
                    .filter((p) => p.totalRetailUnits <= p.reorder)
                    .sort((a, b) => a.totalRetailUnits - b.totalRetailUnits);

                const lowStock = lowStockCandidates.length;
                
                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
                const expiringCount = products.filter((p) => {
                    const expiry = p?.expiryDate || p?.batchDetails?.[0]?.expiryDate;
                    if (!expiry) return false;
                    const parsed = new Date(expiry);
                    return !Number.isNaN(parsed.getTime()) && parsed <= sevenDaysFromNow;
                }).length;

                const creditBalance = customers.reduce((sum, c) => sum + Number(c.outstandingBalance ?? c.currentBalance ?? c.totalDebt ?? 0), 0);
                const availableCredit = customers.reduce((sum, c) => {
                    const limit = Number(c.creditLimit || 0);
                    const debt = Number(c.outstandingBalance ?? c.currentBalance ?? c.totalDebt ?? 0);
                    return sum + Math.max(0, limit - debt);
                }, 0);
                const pendingCheques = cheques.filter(c => c.status === 'PENDING' || c.status === 'DEPOSITED').length;
                const ordersCount = orders.length;

                const totalRev = sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
                const todaysInvoices = sales.filter((s) => format(new Date(s.createdAt), 'yyyy-MM-dd') === todayStr);
                const todaysSales = todaysInvoices.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);

                const debtors = [...customers]
                    .map((c) => ({
                        ...c,
                        debt: Number(c.outstandingBalance ?? c.currentBalance ?? c.totalDebt ?? 0)
                    }))
                    .filter((c) => c.debt > 0)
                    .sort((a, b) => b.debt - a.debt)
                    .slice(0, 5);

                const recent = [...sales]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 6);

                const upcomingCheques = [...cheques]
                    .filter((c) => {
                        if (!(c.status === 'PENDING' || c.status === 'DEPOSITED')) return false;
                        const due = new Date(c.dueDate);
                        return !Number.isNaN(due.getTime());
                    })
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .slice(0, 6);

                setStats({
                    activeProducts,
                    lowStock,
                    expiringCount,
                    creditBalance,
                    availableCredit,
                    pendingCheques,
                    ordersCount,
                    totalRevenue: totalRev,
                    todaysSales,
                    salesCount: sales.length
                });

                setLowStockProducts(lowStockCandidates.slice(0, 6));
                setTopDebtors(debtors);
                setRecentSales(recent);
                setDueCheques(upcomingCheques);

                const statusCounts = cheques.reduce((acc, curr) => {
                    const s = curr.status || 'UNKNOWN';
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {});
                setChequeStatus(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

                if (isAdmin) {
                    const days = timeRange === '7d' ? 7 : 30;
                    const fromDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
                    const [dailyRes, topRes] = await Promise.all([
                        getDailySalesStats(fromDate, format(new Date(), 'yyyy-MM-dd')).catch(() => ({ data: [] })),
                        getTopProductsStats(fromDate, format(new Date(), 'yyyy-MM-dd'), 5).catch(() => ({ data: [] }))
                    ]);
                    if (dailyRes?.data) setSalesTrend(dailyRes.data.map(d => ({ date: format(new Date(d.date), 'MMM dd'), revenue: d.totalRevenue })));
                    if (topRes?.data) setTopProducts(topRes.data);
                }
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [isAdmin, timeRange]);

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-premium flex flex-col md:flex-row justify-between items-center gap-6"
            >
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                        <Store size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">Dashboard</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{currentDate}</p>
                            <Badge variant="success">Store Active</Badge>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" size="md" onClick={() => navigate('/pos')}>
                        <Plus size={18} className="mr-2" /> New POS Order
                    </Button>
                    <Button variant="secondary" size="md" onClick={() => navigate('/credit-customers')}>
                        <UserPlus size={18} className="mr-2" /> Add Customer
                    </Button>
                </div>
            </motion.div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {isAdmin ? (
                    <>
                        <KpiCard title="Today's Revenue" value={formatCurrency(stats.todaysSales)} icon={LineChart} color="brand" loading={loading} trend="up" trendValue="+12%" />
                        <KpiCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={Landmark} color="blue" loading={loading} />
                    </>
                ) : (
                    <>
                        <KpiCard title="Total Orders" value={stats.ordersCount} icon={Receipt} color="brand" loading={loading} />
                        <KpiCard title="Active Products" value={stats.activeProducts} icon={Package} color="blue" loading={loading} />
                    </>
                )}
                <KpiCard title="Expiring Items" value={stats.expiringCount} icon={AlertTriangle} color="amber" loading={loading} trend={stats.expiringCount > 0 ? 'down' : 'up'} trendValue={stats.expiringCount > 0 ? `${stats.expiringCount} Alerts` : 'None'} />
                <KpiCard title="Low Stock Items" value={stats.lowStock} icon={ShoppingCart} color="red" loading={loading} trend={stats.lowStock > 5 ? 'down' : 'up'} trendValue={stats.lowStock > 0 ? `${stats.lowStock} Critical` : 'Safe'} />
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {isAdmin && (
                    <div className="lg:col-span-8">
                        <DashboardCard 
                            title="POS Performance" 
                            subtitle="Checkout revenue trend over time"
                            action={
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setTimeRange('7d')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${timeRange === '7d' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                    >7 Days</button>
                                    <button 
                                        onClick={() => setTimeRange('30d')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${timeRange === '30d' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                    >30 Days</button>
                                </div>
                            }
                        >
                            <div className="h-[350px] w-full mt-4">
                                <SalesTrendChart
                                    data={salesTrend}
                                    loading={loading}
                                    timeRange={timeRange}
                                    onTimeRangeChange={setTimeRange}
                                />
                            </div>
                        </DashboardCard>
                    </div>
                )}

                <div className={isAdmin ? "lg:col-span-4" : "lg:col-span-12"}>
                    <DashboardCard title="Top Selling" subtitle="Products by popularity">
                        <div className="space-y-4 mt-4">
                            {topProducts.map((p, i) => (
                                <div key={p.productId || i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">{i + 1}</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-primary transition-colors">{p.productName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{p.totalQtySold} Units Sold</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-slate-700 dark:text-slate-300">{formatCurrency(p.totalRevenue)}</p>
                                </div>
                            ))}
                            {topProducts.length === 0 && !loading && (
                                <div className="text-center py-10 opacity-50 uppercase text-[10px] font-black tracking-widest text-slate-400">No data available</div>
                            )}
                        </div>
                    </DashboardCard>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <DashboardCard title="Financial Health" subtitle="System exposure monitoring">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div className="p-5 rounded-2xl bg-red-500/[0.03] border border-red-500/10 flex flex-col justify-between">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-1">
                                <AlertTriangle size={12} /> Outstanding Debt
                            </span>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(stats.creditBalance)}</h4>
                        </div>
                        <div className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 flex flex-col justify-between">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-1">
                                <Landmark size={12} /> Pending Cheques
                            </span>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.pendingCheques}</h4>
                        </div>
                        <div className="p-5 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 flex flex-col justify-between sm:col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                    <LineChart size={12} /> System Throughput
                                </span>
                                <Badge variant="success">Excellent</Badge>
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.salesCount} <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Total Invoices</span></h4>
                        </div>
                    </div>
                 </DashboardCard>
                 
                 <DashboardCard title="Cheque Lifecycle" subtitle="Banking status distribution">
                    <div className="h-[300px] w-full mt-4">
                        <ChequeLifecycleChart data={chequeStatus} loading={loading} />
                    </div>
                 </DashboardCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardCard title="Recent POS Invoices" subtitle="Latest finalized checkout records">
                    <div className="space-y-3 mt-4">
                        {recentSales.map((sale, idx) => (
                            <div key={sale.id || sale._id || idx} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">{sale.invoiceNo || sale.publicId || sale.id}</p>
                                    <StatusChip status={sale.status || 'CONFIRMED'} />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <span>{sale.customer?.name || 'Walk-in'}</span>
                                    <span>{format(new Date(sale.createdAt), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="mt-2 text-base font-black text-brand-primary">{formatCurrency(sale.totalAmount)}</div>
                            </div>
                        ))}
                        {recentSales.length === 0 && !loading && (
                            <div className="text-center py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">No invoices yet</div>
                        )}
                    </div>
                </DashboardCard>

                <DashboardCard title="Low Stock Watchlist" subtitle="Products at or below reorder level">
                    <div className="space-y-3 mt-4">
                        {lowStockProducts.map((product, idx) => (
                            <div key={product.id || product._id || idx} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">{product.name}</p>
                                    <Badge variant="danger">Low Stock</Badge>
                                </div>
                                <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {product.publicId || '-'} | Reorder at {product.reorder}
                                </div>
                                <div className="mt-2 text-sm font-black text-red-500">Available: {product.totalRetailUnits}</div>
                            </div>
                        ))}
                        {lowStockProducts.length === 0 && !loading && (
                            <div className="text-center py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Stock levels are healthy</div>
                        )}
                    </div>
                </DashboardCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardCard title="Top Credit Exposure" subtitle="Customers with highest outstanding balances">
                    <div className="space-y-3 mt-4">
                        {topDebtors.map((customer, idx) => (
                            <div key={customer.id || customer._id || idx} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">{customer.name}</p>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{customer.publicId || '-'} | Limit {formatCurrency(customer.creditLimit)}</p>
                                </div>
                                <p className="text-sm font-black text-red-500">{formatCurrency(customer.debt)}</p>
                            </div>
                        ))}
                        {topDebtors.length === 0 && !loading && (
                            <div className="text-center py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">No outstanding balances</div>
                        )}
                    </div>
                </DashboardCard>

                <DashboardCard title="Upcoming Cheque Dues" subtitle="Pending instruments sorted by nearest due date">
                    <div className="space-y-3 mt-4">
                        {dueCheques.map((cheque, idx) => (
                            <div key={cheque.id || cheque._id || idx} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">Cheque #{cheque.chequeNumber}</p>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{cheque.bankName} | Due {format(new Date(cheque.dueDate), 'MMM dd, yyyy')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-amber-500">{formatCurrency(cheque.amount)}</p>
                                    <StatusChip status={cheque.status} />
                                </div>
                            </div>
                        ))}
                        {dueCheques.length === 0 && !loading && (
                            <div className="text-center py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">No pending cheque dues</div>
                        )}
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
}
