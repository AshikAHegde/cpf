import React from 'react';
import { FireIcon, CheckBadgeIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const NumberTicker = ({ value }) => {
    const [count, setCount] = React.useState(0);
    
    React.useEffect(() => {
        let start = 0;
        const end = parseInt(value);
        if (start === end) return;
        
        let totalDuration = 1500;
        let increment = end / (totalDuration / 16);
        
        let timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        
        return () => clearInterval(timer);
    }, [value]);

    return <span>{count.toLocaleString()}</span>;
};

const SummaryCards = ({ summary }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const cards = [
        {
            title: "Calculated Solve Count",
            value: <NumberTicker value={summary?.totalSolved || 0} />,
            subtitle: summary?.totalSolvedToday > 0 ? `+${summary.totalSolvedToday} today` : "Focus ongoing",
            icon: <CheckBadgeIcon className="w-5 h-5 text-indigo-400" />,
            accent: "indigo"
        },
        {
            title: "Current Focus Streak",
            value: <span className="flex items-baseline gap-2"><NumberTicker value={summary?.currentStreak || 0} /><span className="text-xl opacity-40 font-bold uppercase tracking-widest">Days</span></span>,
            subtitle: summary?.streakRange?.start
                ? `${formatDate(summary.streakRange.start)} — Present`
                : "No active streak",
            icon: <FireIcon className="w-5 h-5 text-rose-500" />,
            accent: "rose"
        },
        {
            title: "Peak Performance",
            value: <span className="flex items-baseline gap-2"><NumberTicker value={summary?.bestDay?.count || 0} /><span className="text-xl opacity-40 font-bold uppercase tracking-widest">Solved</span></span>,
            subtitle: summary?.bestDay?.date ? formatDate(summary.bestDay.date) : "Benchmark pending",
            icon: <ChartBarIcon className="w-5 h-5 text-cyan-500" />,
            accent: "cyan"
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
            {cards.map((card, idx) => (
                <motion.div
                    key={idx}
                    variants={item}
                    className="group relative glass rounded-[2.5rem] p-10 overflow-hidden cursor-default"
                >
                    {/* Atmospheric Glow */}
                    <div className={`absolute -top-12 -right-12 w-32 h-32 bg-${card.accent}-500/10 blur-[60px] rounded-full transition-all duration-700 group-hover:bg-${card.accent}-500/20 group-hover:scale-150`} />
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.3em] mb-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                    {card.title}
                                </p>
                                <h3 className="text-5xl font-black text-white tracking-premium leading-none">
                                    {card.value}
                                </h3>
                            </div>
                            <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 group-hover:border-white/20 transition-all duration-500 group-hover:bg-white/[0.08]">
                                {card.icon}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] border border-white/5 rounded-full backdrop-blur-md">
                                <div className={`w-1.5 h-1.5 rounded-full bg-${card.accent}-500 animate-pulse`} />
                                <span className="text-[11px] font-bold text-gray-400 tracking-tight">{card.subtitle}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default SummaryCards;
