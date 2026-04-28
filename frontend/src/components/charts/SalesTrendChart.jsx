import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Area, ComposedChart, Legend
} from 'recharts';
import DashboardCard from '../DashboardCard';
import EmptyState from '../EmptyState';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function SalesTrendChart({ data, loading, timeRange, onTimeRangeChange }) {
    // Sort data by date ascending just in case
    const sortedData = useMemo(() => {
        if (!data) return [];
        return [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [data]);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl backdrop-blur-md">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                    <div className="space-y-1.5">
                        {payload.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    {entry.name}:
                                </span>
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-auto">
                                    {entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <DashboardCard
            title="POS Trend"
            subtitle="Daily orders and revenue analytics"
            action={
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                        onClick={() => onTimeRangeChange('7d')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            timeRange === '7d'
                                ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        7D
                    </button>
                    <button
                        onClick={() => onTimeRangeChange('30d')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            timeRange === '30d'
                                ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        30D
                    </button>
                </div>
            }
        >
            <div className="h-[340px] w-full mt-4">
                {sortedData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={sortedData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#50C878" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#50C878" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                dy={10}
                            />
                            <YAxis
                                yAxisId="left"
                                orientation="left"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `Rs.${val}`}
                                tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#50C878', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <Legend 
                                verticalAlign="top" 
                                height={36} 
                                iconType="circle"
                                formatter={(value) => (
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{value}</span>
                                )}
                            />

                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue"
                                stroke="#50C878"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                strokeWidth={3}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="orders"
                                name="Orders"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyState
                        title="No Data Available"
                        description="POS trends will appear here once orders are placed."
                    />
                )}
            </div>
        </DashboardCard>
    );
}
