import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import SummaryCards from '../Components/SummaryCards.jsx';
import PlatformFilters from '../Components/PlatformFilters.jsx';
import ContributionHeatmap from '../Components/ContributionHeatmap.jsx';
import RatingGraph from '../Components/RatingGraph.jsx';
import PageTransition from './PageTransition.jsx';
import BackgroundSystem from './BackgroundSystem.jsx';
import {
    LeetCodeIcon,
    CodeforcesIcon,
    CodeChefIcon,
    AtCoderIcon,
    GFGIcon
} from './PlatformIcons.jsx';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState(['LeetCode', 'Codeforces', 'CodeChef', 'AtCoder', 'GFG']);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Parallel fetch for user and stats
            const [userRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/users/me`, config),
                axios.get(`${API_URL}/users/stats`, config)
            ]);

            setUser(userRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFilter = (platform) => {
        if (platform === 'All') {
            const allPlatforms = ['LeetCode', 'Codeforces', 'CodeChef', 'AtCoder', 'GFG'];
            if (activeFilters.length === allPlatforms.length) {
                setActiveFilters([]);
            } else {
                setActiveFilters(allPlatforms);
            }
            return;
        }
        setActiveFilters(prev =>
            prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
        );
    };

    const { filteredSummary, filteredContributionData } = useMemo(() => {
        if (!stats) return { filteredSummary: null, filteredContributionData: {} };

        const filteredContributionMap = {};
        Object.entries(stats.contributionData || {}).forEach(([date, data]) => {
            let dailyTotal = 0;
            const dailyPlatforms = {};

            Object.entries(data.platforms).forEach(([platform, count]) => {
                if (activeFilters.includes(platform)) {
                    dailyTotal += count;
                    dailyPlatforms[platform] = count;
                }
            });

            if (dailyTotal > 0) {
                filteredContributionMap[date] = { total: dailyTotal, platforms: dailyPlatforms };
            }
        });

        let totalSolved = 0;
        activeFilters.forEach(platform => {
            const platformStats = stats.platforms[platform.toLowerCase()];
            if (platformStats && (platformStats.solved || platformStats.totalSolved)) {
                totalSolved += (platformStats.solved || platformStats.totalSolved);
            }
        });

        const sortedDates = Object.keys(filteredContributionMap).sort();
        let currentStreak = 0;
        let streakRange = { start: null, end: null };
        let bestDay = { date: null, count: 0 };
        let totalSolvedToday = 0;

        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (sortedDates.length > 0) {
            sortedDates.forEach(date => {
                if (filteredContributionMap[date].total > bestDay.count) {
                    bestDay = { date, count: filteredContributionMap[date].total };
                }
                if (date === todayStr) {
                    totalSolvedToday = filteredContributionMap[date].total;
                }
            });

            let checkDate = filteredContributionMap[todayStr] ? todayStr : (filteredContributionMap[yesterdayStr] ? yesterdayStr : null);
            if (checkDate) {
                streakRange.end = checkDate;
                let d = new Date(checkDate);
                while (true) {
                    const dStr = d.toISOString().split('T')[0];
                    if (filteredContributionMap[dStr]) {
                        currentStreak++;
                        streakRange.start = dStr;
                        d.setDate(d.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }
        }

        return {
            filteredSummary: {
                totalSolved,
                totalSolvedToday,
                currentStreak,
                streakRange,
                bestDay
            },
            filteredContributionData: filteredContributionMap
        };
    }, [stats, activeFilters]);

    const RatingHistoryGraph = ({ data, hexColor }) => {
        if (!data || data.length === 0) return null;
        return (
            <div className="h-24 w-full">
                <RatingGraph data={data} hexColor={hexColor} />
            </div>
        );
    };

    const StatsCard = ({ platform, data, color, hexColor }) => {
        const Icons = {
            LeetCode: LeetCodeIcon,
            Codeforces: CodeforcesIcon,
            CodeChef: CodeChefIcon,
            AtCoder: AtCoderIcon,
            GFG: GFGIcon
        };

        const Icon = Icons[platform];
        const isConnected = data && data.success;

        const highlights = {
            LeetCode: { label: "Ranking", val: data?.ranking || 'N/A' },
            Codeforces: { label: "Rank", val: data?.rank || 'Newbie' },
            CodeChef: { label: "Stars", val: data?.stars || '0' },
            AtCoder: { label: "Color", val: data?.color || 'Grey' },
            GFG: { label: "Score", val: data?.score || '0' }
        };

        const info = highlights[platform];

        if (!isConnected) {
            return (
                <Link to="/profile" className="group">
                    <motion.div
                        whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' }}
                        className="glass border-dashed rounded-[2rem] p-5 h-full transition-all duration-500 flex flex-col justify-between"
                    >
                        <div className="flex items-center gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center overflow-hidden">
                                <Icon className="w-6 h-6 grayscale" />
                            </div>
                            <div>
                                <h4 className="text-white font-black tracking-tight">{platform}</h4>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Not Connected</p>
                            </div>
                        </div>
                        <div className="mt-8">
                            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest group-hover:underline">Connect Account →</span>
                        </div>
                    </motion.div>
                </Link>
            );
        }

        return (
            <motion.div
                whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.04)' }}
                className="glass rounded-[2rem] p-5 transition-all duration-500 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] blur-[40px] rounded-full -z-10" />

                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center overflow-hidden">
                            <Icon className="w-6 h-6 grayscale opacity-80 group-hover:grayscale-0" />
                        </div>
                        <div>
                            <h4 className="text-white font-black tracking-tight">{platform}</h4>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Connected</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-1">Solved Questions</p>
                            <h3 className="text-3xl font-black text-white leading-none tracking-tighter">
                                {data?.solved || data?.totalSolved || 0}
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-1">{info.label}</p>
                            <p className="text-white font-bold text-sm tracking-tight">{info.val}</p>
                        </div>
                    </div>

                    {data?.history && data.history.length > 0 && (
                        <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Rating Flux</p>
                                <span className={`text-[10px] font-bold ${color === 'yellow' ? 'text-yellow-500' : 'text-blue-400'}`}>
                                    {data.history[data.history.length - 1].rating}
                                </span>
                            </div>
                            <RatingHistoryGraph data={data.history} hexColor={hexColor} />
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    const SkeletonLoader = () => (
        <div className="p-4 md:p-10 lg:px-14 min-h-screen bg-[#0b0f17] relative overflow-hidden">
            <div className="mb-16 space-y-4">
                <div className="w-32 h-6 skeleton opacity-20" />
                <div className="w-2/3 h-20 skeleton opacity-10" />
                <div className="w-1/2 h-6 skeleton opacity-5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                {[1, 2, 3].map(i => <div key={i} className="h-32 skeleton opacity-10 rounded-3xl" />)}
            </div>
            <div className="w-full h-64 skeleton opacity-5 rounded-3xl mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <div key={i} className="h-48 skeleton opacity-10 rounded-3xl" />)}
            </div>
        </div>
    );

    if (isLoading) return <SkeletonLoader />;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                duration: 1, 
                ease: [0.16, 1, 0.3, 1] 
            } 
        }
    };

    return (
        <PageTransition>
            <BackgroundSystem>
                <div className="p-4 md:p-10 lg:px-14 min-h-screen selection:bg-blue-500/30">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="relative z-10"
                    >
                    <motion.header
                        variants={itemVariants}
                        className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-500 font-black uppercase tracking-widest">v2.1.0 Alpha</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>
                            <h1 className="text-4xl md:text-7xl font-black text-white tracking-premium leading-none mb-4">
                                Focus, <span className="text-white/30">{user?.name || 'Coder'}</span>
                            </h1>
                            <p className="text-gray-500 text-lg md:text-xl max-w-xl font-medium tracking-tight opacity-80">
                                Your algorithmic performance, centralized and optimized for deep focus.
                            </p>
                        </div>
                    </motion.header>

                    <motion.div variants={itemVariants}>
                        <SummaryCards summary={filteredSummary || stats?.summary} />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h2 className="text-gray-700 text-[10px] font-black uppercase tracking-[0.4em] mb-8 mt-20 flex items-center gap-4">
                            <span className="w-8 h-[1px] bg-white/5" />
                            Platform Ecosystem
                            <span className="flex-grow h-[1px] bg-white/5" />
                        </h2>
                        <PlatformFilters activeFilters={activeFilters} onToggleFilter={toggleFilter} />
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="grid grid-cols-12 gap-8"
                    >
                        {/* Heatmap Spotlight */}
                        <div className="col-span-12">
                            <ContributionHeatmap data={filteredContributionData} />
                        </div>

                        {/* Sub-grid for Insights */}
                        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {activeFilters.includes('LeetCode') && <StatsCard platform="LeetCode" data={stats?.platforms?.leetcode} color="yellow" hexColor="#fbbf24" />}
                            {activeFilters.includes('Codeforces') && <StatsCard platform="Codeforces" data={stats?.platforms?.codeforces} color="blue" hexColor="#60a5fa" />}
                            {activeFilters.includes('CodeChef') && <StatsCard platform="CodeChef" data={stats?.platforms?.codechef} color="orange" hexColor="#fb923c" />}
                            {activeFilters.includes('AtCoder') && <StatsCard platform="AtCoder" data={stats?.platforms?.atcoder} color="gray" hexColor="#9ca3af" />}
                            {activeFilters.includes('GFG') && <StatsCard platform="GFG" data={stats?.platforms?.gfg} color="green" hexColor="#10b981" />}

                            {/* Invitation to connect more */}
                            <motion.div
                                whileHover={{ scale: 0.98, borderColor: 'rgba(255,255,255,0.1)' }}
                                className="bg-white/[0.01] border-2 border-dashed border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group transition-all duration-500"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-6 group-hover:bg-white/5 transition-colors">
                                    <span className="text-white text-2xl font-black">+</span>
                                </div>
                                <h4 className="text-white font-bold mb-2">Expanding?</h4>
                                <p className="text-gray-600 text-xs px-4">Connect more competitive platforms to unify your metrics.</p>
                            </motion.div>
                        </div>
                    </motion.div>
                    </motion.div>
                </div>
            </BackgroundSystem>
        </PageTransition>
    );
};

export default Dashboard;
