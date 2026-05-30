import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LeetCodeIcon,
    CodeforcesIcon,
    CodeChefIcon,
    AtCoderIcon,
    GFGIcon
} from './PlatformIcons.jsx';

const ContributionHeatmap = ({ data }) => {
    const [hoveredDay, setHoveredDay] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    // Obsidian Azure Color System (Indigo to Cyan Gradient)
    const intensityLevels = {
        0: 'rgba(255, 255, 255, 0.02)', 
        1: 'rgba(99, 102, 241, 0.2)',   // Indigo Faded
        2: 'rgba(99, 102, 241, 0.45)',  // Indigo Mid
        3: 'rgba(34, 211, 238, 0.6)',   // Cyan High
        4: 'rgba(34, 211, 238, 0.9)'    // Cyan Peak
    };

    const getIntensity = (count) => {
        if (!count || count === 0) return 0;
        if (count < 3) return 1;
        if (count < 6) return 2;
        if (count < 10) return 3;
        return 4;
    };

    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const totalWeeks = 53;
    const totalDays = totalWeeks * 7;

    // Go back exactly enough days to start on a Sunday approximately 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (52 * 7) - currentDay);
    startDate.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < totalDays; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Stop exactly at today
        if (date > today) break;

        const dateStr = date.toISOString().split('T')[0];

        days.push({
            date: dateStr,
            count: data[dateStr]?.total || 0,
            platforms: data[dateStr]?.platforms || {},
            month: date.toLocaleString('default', { month: 'short' }),
            dayOfMonth: date.getDate(),
            isFirstOfMonth: date.getDate() === 1
        });
    }

    // 1. Group days by month accurately
    const months = [];
    let currentMonthKey = null;

    days.forEach(day => {
        const d = new Date(day.date);
        const m = d.getMonth();
        const y = d.getFullYear();
        const key = `${m}-${y}`;

        if (key !== currentMonthKey) {
            months.push({
                name: day.month,
                key,
                days: []
            });
            currentMonthKey = key;
        }
        months[months.length - 1].days.push(day);
    });

    // 2. Structure each month into a grid (ensuring 7 rows)
    const formattedMonths = months.map(m => {
        const weeks = [];
        const firstDayOfWeek = new Date(m.days[0].date).getDay(); // 0 is Sunday

        // First week: handle leading empty slots
        const firstWeek = new Array(7).fill(null);
        let dayPtr = 0;
        for (let i = firstDayOfWeek; i < 7 && dayPtr < m.days.length; i++) {
            firstWeek[i] = m.days[dayPtr++];
        }
        weeks.push(firstWeek);

        // Fill middle/last weeks
        while (dayPtr < m.days.length) {
            const nextWeek = new Array(7).fill(null);
            for (let i = 0; i < 7 && dayPtr < m.days.length; i++) {
                nextWeek[i] = m.days[dayPtr++];
            }
            weeks.push(nextWeek);
        }
        return { ...m, weeks };
    });

    const platformIcons = {
        LeetCode: LeetCodeIcon,
        Codeforces: CodeforcesIcon,
        CodeChef: CodeChefIcon,
        AtCoder: AtCoderIcon,
        GFG: GFGIcon
    };

    return (
        <div 
            className="relative glass p-10 mb-16 overflow-hidden cursor-default group/heatmap rounded-[3rem]" 
            ref={containerRef}
            onMouseMove={handleMouseMove}
        >
            {/* Background Depth */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full -z-10 animate-slow-pulse" />

            <header className="flex items-center justify-between mb-12">
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-white tracking-premium uppercase flex items-center gap-3">
                        Strategic <span className="opacity-30">Insights</span>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
                    </h3>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.3em] opacity-40">System Performance Metrics (Indigo-Cyan Spectrum)</p>
                </div>

                {/* Minimalist Legend */}
                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-5 py-2.5 rounded-full backdrop-blur-md">
                    <span className="text-[9px] text-gray-600 uppercase font-black tracking-[0.2em]">Low</span>
                    <div className="flex gap-[4px]">
                        {[0, 1, 2, 3, 4].map(lvl => (
                            <div key={lvl} style={{ backgroundColor: intensityLevels[lvl] }} className="w-3 h-3 rounded-[3px] border border-white/[0.05]" />
                        ))}
                    </div>
                    <span className="text-[9px] text-gray-600 uppercase font-black tracking-[0.2em]">High</span>
                </div>
            </header>

            <div className="flex gap-6">
                {/* Weekday Labels */}
                <div className="flex flex-col justify-between py-1 text-[9px] font-black text-gray-700 uppercase tracking-widest h-[105px] opacity-40">
                    <span>Sun</span>
                    <span>Wed</span>
                    <span>Fri</span>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar pb-8">
                    <div className="flex gap-8 items-start">
                        {formattedMonths.map((m, mIdx) => (
                            <div key={m.key} className="flex flex-col gap-6 min-w-fit">
                                {/* Grid for this month */}
                                <div className="flex gap-[3px]">
                                    {m.weeks.map((week, wIdx) => (
                                        <div key={wIdx} className="flex flex-col gap-[3px]">
                                            {week.map((day, dIdx) => {
                                                if (!day) {
                                                    return <div key={`empty-${dIdx}`} className="w-[12px] h-[12px] opacity-0" />;
                                                }
                                                const intensity = getIntensity(day.count);
                                                return (
                                                    <motion.div
                                                        key={day.date}
                                                        onMouseEnter={() => setHoveredDay(day)}
                                                        onMouseLeave={() => setHoveredDay(null)}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ 
                                                            delay: (mIdx * 0.05) + (wIdx * 0.005) + (dIdx * 0.01), 
                                                            duration: 0.5,
                                                            ease: [0.16, 1, 0.3, 1]
                                                        }}
                                                        style={{ backgroundColor: intensityLevels[intensity] }}
                                                        className="w-[12px] h-[12px] rounded-[3px] transition-all duration-500 relative border border-white/[0.04]"
                                                        whileHover={{
                                                            scale: 1.5,
                                                            zIndex: 50,
                                                            backgroundColor: intensity > 2 ? 'rgba(34, 211, 238, 1)' : 'rgba(99, 102, 241, 1)',
                                                            boxShadow: intensity > 2 ? '0 0 20px rgba(34, 211, 238, 0.4)' : '0 0 15px rgba(99, 102, 241, 0.3)'
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                                {/* Month Label */}
                                <div className="text-center group-hover/heatmap:opacity-100 opacity-40 transition-opacity">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                                        {m.name}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Elegant Tooltip - Glass 2.0 */}
            <AnimatePresence>
                {hoveredDay && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0,
                            scale: 1,
                            x: mousePos.x,
                            y: mousePos.y - 140 
                        }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400, mass: 0.5 }}
                        className="pointer-events-none absolute z-[100] bg-white/[0.03] border border-white/10 p-6 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-3xl min-w-[240px]"
                        style={{
                            left: -120, 
                            top: 0
                        }}
                    >
                        <header className="flex justify-between items-center mb-5 pb-4 border-b border-white/5">
                            <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] leading-none">
                                {new Date(hoveredDay.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                            <div className={`w-2.5 h-2.5 rounded-full ${getIntensity(hoveredDay.count) > 0 ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
                        </header>

                        <div className="space-y-5">
                            <div>
                                <h4 className="text-white text-4xl font-black tracking-premium leading-none mb-2">
                                    {hoveredDay.count}
                                </h4>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest opacity-60">Strategic Solves</p>
                            </div>

                            {Object.entries(hoveredDay.platforms).length > 0 && (
                                <div className="space-y-3 pt-2">
                                    {Object.entries(hoveredDay.platforms).map(([platform, count]) => {
                                        const Icon = platformIcons[platform] || LeetCodeIcon;
                                        return (
                                            <div key={platform} className="flex items-center justify-between group/item">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 group-hover/item:border-white/10 transition-colors">
                                                        <Icon className="w-4 h-4 opacity-70 group-hover/item:opacity-100 transition-opacity" />
                                                    </div>
                                                    <span className="text-[12px] text-gray-400 font-bold group-hover/item:text-white transition-colors">{platform}</span>
                                                </div>
                                                <span className="text-[11px] font-black text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContributionHeatmap;
