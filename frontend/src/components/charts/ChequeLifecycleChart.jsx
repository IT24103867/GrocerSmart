import React from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import DashboardCard from '../DashboardCard';
import EmptyState from '../EmptyState';

export default function ChequeLifecycleChart({ data, loading }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl backdrop-blur-md min-w-[140px]">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.name}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {data.value} {data.value === 1 ? 'Cheque' : 'Cheques'}
                    </p>
                    <p className="text-xs font-black text-brand-primary mt-1">
                        {((data.value / total) * 100).toFixed(1)}% of total
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <DashboardCard
            title="Cheque Lifecycle"
            subtitle="Status distribution overview"
        >
            <div className="h-[340px] w-full mt-4 relative">
                {data.length > 0 ? (
                    <>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
                            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none">
                                {total}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">
                                Total
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            className="hover:opacity-80 transition-opacity cursor-pointer"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => (
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                            {value}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </>
                ) : (
                    <EmptyState
                        title="No Cheques Found"
                        description="Cheque status distribution will appear here."
                    />
                )}
            </div>
        </DashboardCard>
    );
}
