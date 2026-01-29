import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1e1e2d] border border-white/10 p-3 rounded-xl shadow-xl z-50">
                <p className="text-gray-400 text-xs mb-1">{label}</p>
                <p className="text-white font-bold text-sm">
                    Rating: <span className="text-blue-400">{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

const RatingGraph = ({ data, color }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-40 flex items-center justify-center text-gray-600 text-xs italic">
                No history available
            </div>
        );
    }

    // Determine Y-axis domain
    const ratings = data.map(d => d.rating);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    const domainMin = Math.max(0, minRating - 50); // Tighter bounds
    const domainMax = maxRating + 50;

    // Date formatter for X-axis (compact)
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); // "Jan 24"
    };

    return (
        <div className="h-40 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        domain={[domainMin, domainMax]}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={45}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20', strokeWidth: 2 }} />
                    <Line
                        type="monotone"
                        dataKey="rating"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RatingGraph;
