import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FireIcon,
    TrophyIcon,
    BoltIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    CodeBracketIcon,
    CalendarIcon
} from '@heroicons/react/24/solid';
import { AtCoderIcon, CodeChefIcon, CodeforcesIcon, LeetCodeIcon } from "../Components/PlatformIcons";

const platformIcons = {
    Codeforces: CodeforcesIcon,
    LeetCode: LeetCodeIcon,
    AtCoder: AtCoderIcon,
    CodeChef: CodeChefIcon,
};

const Dashboard = () => {
    const [user, setUser] = useState({ name: 'Coder' });
    const [upcomingContests, setUpcomingContests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock Data for "Sexy" Visuals
    const stats = [
        { title: 'Total Solved', value: '1,284', icon: CodeBracketIcon, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { title: 'Current Streak', value: '14 Days', icon: FireIcon, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
        { title: 'Global Rank', value: '#4,291', icon: TrophyIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
        { title: 'Total XP', value: '45.2k', icon: BoltIcon, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    ];

    const recentActivity = [
        { id: 1, problem: 'Two Sum', platform: 'LeetCode', status: 'Accepted', time: '2 hours ago', color: 'text-green-400' },
        { id: 2, problem: 'Watermelon', platform: 'Codeforces', status: 'Accepted', time: '5 hours ago', color: 'text-green-400' },
        { id: 3, problem: 'Knapsack DP', platform: 'AtCoder', status: 'Wrong Answer', time: '1 day ago', color: 'text-red-400' },
        { id: 4, problem: 'Chef and Strings', platform: 'CodeChef', status: 'Accepted', time: '2 days ago', color: 'text-green-400' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

                // Fetch User
                const userRes = await axios.get(`${apiBase}/api/users/me`).catch(() => null);
                if (userRes && userRes.data) {
                    setUser(userRes.data);
                }

                // Fetch Contests
                const contestsRes = await axios.get(`${apiBase}/api/contests`);
                const upcoming = contestsRes.data
                    .filter(c => new Date(c.start) > new Date())
                    .sort((a, b) => new Date(a.start) - new Date(b.start))
                    .slice(0, 5);
                setUpcomingContests(upcoming);

            } catch (error) {
                console.error("Error loading dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Generate Mock Heatmap Data
    const heatmapData = Array.from({ length: 52 * 7 }, (_, i) => ({
        level: Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : 0
    }));

    const getHeatmapColor = (level) => {
        switch (level) {
            case 1: return 'bg-green-900/40';
            case 2: return 'bg-green-700/60';
            case 3: return 'bg-green-500/80';
            case 4: return 'bg-green-400';
            default: return 'bg-white/5';
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tight mb-2">
                            Dashboard
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Welcome back, <span className="text-white font-semibold">{user.name || 'Champion'}</span>. Ready to solve?
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-medium text-gray-300">System Online</span>
                    </div>
                </header>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className={`relative overflow-hidden p-6 rounded-2xl bg-[#13131f]/60 backdrop-blur-xl border ${stat.border} group transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl`}>
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12`}>
                                <stat.icon className={`w-24 h-24 ${stat.color}`} />
                            </div>
                            <div className="relative z-10 flex flex-col justify-between h-full">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} mb-4`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{stat.title}</p>
                                    <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Left Column: Activity & Charts */}
                    <div className="xl:col-span-2 space-y-8">

                        {/* Heatmap Section */}
                        <div className="bg-[#13131f]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-lg">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <ChartBarIcon className="w-5 h-5 text-blue-400" />
                                    Submission Activity
                                </h3>
                                <div className="text-xs text-gray-500">Last 12 Months</div>
                            </div>
                            <div className="w-full overflow-x-auto pb-2">
                                <div className="flex gap-1 min-w-[700px]">
                                    {/* Mocking a heatmap grid (52 weeks x 7 days) */}
                                    {Array.from({ length: 53 }).map((_, weekIndex) => (
                                        <div key={weekIndex} className="flex flex-col gap-1">
                                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                                                const level = heatmapData[weekIndex * 7 + dayIndex]?.level || 0;
                                                return (
                                                    <div
                                                        key={dayIndex}
                                                        className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)} transition-colors duration-300 hover:ring-1 hover:ring-white/50`}
                                                        title={`${level * 3} submissions`}
                                                    />
                                                )
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-400">
                                <span>Less</span>
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-sm bg-white/5"></div>
                                    <div className="w-3 h-3 rounded-sm bg-green-900/40"></div>
                                    <div className="w-3 h-3 rounded-sm bg-green-700/60"></div>
                                    <div className="w-3 h-3 rounded-sm bg-green-500/80"></div>
                                    <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                                </div>
                                <span>More</span>
                            </div>
                        </div>

                        {/* Recent Activity List */}
                        <div className="bg-[#13131f]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-lg">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-purple-400" />
                                Recent Activity
                            </h3>
                            <div className="space-y-4">
                                {recentActivity.map((item) => {
                                    const Icon = platformIcons[item.platform];
                                    return (
                                        <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-[#0a0a0f] rounded-lg border border-white/10 group-hover:border-white/20 transition-colors">
                                                    {Icon && <Icon className="w-5 h-5 text-gray-300" />}
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-medium">{item.problem}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                        <span>{item.platform}</span>
                                                        <span>•</span>
                                                        <span>{item.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-bold ${item.color} bg-white/5 px-2 py-1 rounded-md`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Upcoming & Profile */}
                    <div className="space-y-8">

                        {/* Upcoming Contests Widget */}
                        <div className="bg-[#13131f]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-lg relative overflow-hidden">
                            {/* Decorative blurred blob */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-pink-400" />
                                    Upcoming
                                </h3>
                                <a href="/calendar" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">View All</a>
                            </div>

                            <div className="space-y-3 relative z-10">
                                {loading ? (
                                    <div className="text-center py-8 text-gray-500 animate-pulse">Loading contests...</div>
                                ) : upcomingContests.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">No upcoming contests</div>
                                ) : (
                                    upcomingContests.map((contest, idx) => {
                                        const date = new Date(contest.start);
                                        const Icon = platformIcons[contest.platform];
                                        return (
                                            <div key={idx} className="group flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer">
                                                <div className="flex flex-col items-center justify-center min-w-[3.5rem] bg-[#0a0a0f] rounded-lg p-2 border border-white/10">
                                                    <span className="text-xs font-bold text-red-400 uppercase">{date.toLocaleString('default', { month: 'short' })}</span>
                                                    <span className="text-xl font-bold text-white leading-none mt-0.5">{date.getDate()}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors" title={contest.title}>
                                                        {contest.title}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
                                                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{contest.platform}</span>
                                                        <span className="text-[10px] text-gray-600">•</span>
                                                        <span className="text-[10px] text-gray-400">{date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <button className="w-full mt-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                                Set Reminders
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
