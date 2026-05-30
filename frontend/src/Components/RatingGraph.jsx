import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-3xl z-[100] min-w-[160px]"
            >
                <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] mb-3 opacity-60">
                    {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.5)]" style={{ backgroundColor: '#22d3ee' }} />
                        <span className="text-white font-black text-2xl tracking-premium">
                            {payload[0].value}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 tracking-tight uppercase">Rating</span>
                </div>
            </motion.div>
        );
    }
    return null;
};

const RatingGraph = ({ data, color, hexColor }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-40 flex flex-col items-center justify-center text-gray-700 space-y-2">
                <div className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center text-[10px] italic">?</div>
                <span className="text-[10px] tracking-widest uppercase font-bold">No Records Found</span>
            </div>
        );
    }

    // Determine Y-axis domain
    const ratings = data.map(d => d.rating);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    const domainMin = Math.max(0, minRating - 30);
    const domainMax = maxRating + 30;

    const chartId = `colorRating-${hexColor.replace('#', '')}`;

    return (
        <div className="h-48 w-full mt-4 -ml-4 group">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                        <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={hexColor} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={hexColor} stopOpacity={0}/>
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="0" stroke="#ffffff05" vertical={false} />
                    <XAxis
                        dataKey="date"
                        hide
                    />
                    <YAxis
                        domain={[domainMin, domainMax]}
                        hide
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                    {/* Glow Layer */}
                    <Area
                        type="monotone"
                        dataKey="rating"
                        stroke={hexColor}
                        strokeWidth={4}
                        fill="transparent"
                        filter="url(#glow)"
                        opacity={0.3}
                        animationBegin={500}
                        animationDuration={2000}
                        dot={false}
                    />
                    <Area
                        type="monotone"
                        dataKey="rating"
                        stroke={hexColor || '#6366f1'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#${chartId})`}
                        animationBegin={500}
                        animationDuration={1500}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0, fill: '#22d3ee', shadow: '0 0 15px #22d3ee' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RatingGraph;
