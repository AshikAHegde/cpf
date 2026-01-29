import React, { useEffect, useState } from "react";
import PageTransition from "./PageTransition";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import RatingGraph from "./RatingGraph";


const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

                const userRes = await axios.get(`${API_URL}/users/me`, config).catch(() => null);
                if (userRes) setUser(userRes.data);

                const statsRes = await axios.get(`${API_URL}/users/stats`, config);
                setStats(statsRes.data);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getPlatformConfig = (platform, data) => {
        const isConnected = data && data.success;
        let diff = "N/A";
        let label = "Rating";
        let rankLabel = "Rank";

        if (isConnected) {
            if (platform === 'LeetCode') {
                if (data.rating) {
                    label = "Contest Rating";
                    diff = data.rating;
                } else if (data.solved !== undefined) {
                    label = "Problems Solved";
                    diff = data.solved;
                }
                rankLabel = "Global Rank";
            } else if (platform === 'Codeforces') {
                diff = data.rating;
                label = "Current Rating";
                rankLabel = "Rank";
            } else if (platform === 'CodeChef') {
                diff = data.rating;
                label = "Current Rating";
                rankLabel = "Stars";
            } else if (platform === 'AtCoder') {
                diff = data.rating;
                label = "Current Rating";
            }
        }
        return { diff, label, rankLabel };
    };

    const StatsCard = ({ platform, data, color }) => {
        const isConnected = data && data.success;
        const hasError = data && !data.success && data.error;
        const { diff, label, rankLabel } = getPlatformConfig(platform, data);

        return (
            <div className={`bg-[#13131f] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-${color}-500/50 transition-all duration-300 flex-1 flex flex-col`}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />

                <h3 className="text-xl font-bold text-gray-200 mb-1">{platform}</h3>

                {isConnected ? (
                    <div className="mt-4 space-y-3">
                        <div className="text-sm text-gray-400">Handle: <span className="text-white font-mono">{data.handle}</span></div>

                        <div className="flex items-end gap-2">
                            <span className={`text-4xl font-extrabold text-${color}-400`}>{diff}</span>
                            <span className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{label}</span>
                        </div>

                        {data.rank && <div className="text-xs text-gray-500 capitalize">{rankLabel}: {data.rank}</div>}
                        {data.stars && <div className="text-xs text-yellow-500 capitalize">{data.stars}</div>}
                        {data.ranking && <div className="text-xs text-gray-500">Global Rank: {data.ranking}</div>}
                    </div>
                ) : (
                    <div className="mt-4">
                        {hasError ? (
                            <p className="text-red-400 text-sm">Failed to fetch data for <span className="font-mono">{data.handle}</span></p>
                        ) : (
                            <p className="text-gray-500 text-sm italic">Not connected</p>
                        )}
                        <Link to="/profile" className="inline-block mt-4 text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg transition-colors">
                            {hasError ? 'Check Handle' : 'Connect'}
                        </Link>
                    </div>
                )}
            </div>
        );
    };

    const GraphCard = ({ data, color, hexColor }) => {
        const isConnected = data && data.success;
        if (!isConnected) return <div className="h-48 bg-[#13131f] border border-white/5 rounded-2xl p-6 flex items-center justify-center text-gray-700 italic text-sm">No Graph Data</div>;

        return (
            <div className={`bg-[#13131f] border border-white/5 rounded-2xl p-4 h-48 relative overflow-hidden group hover:border-${color}-500/50 transition-all duration-300`}>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Rating History</h4>
                <div className="h-32 w-full">
                    <RatingGraph data={data.history} color={hexColor} />
                </div>
            </div>
        );
    };

    const PlatformGroup = ({ platform, data, color, hexColor }) => (
        <div className="flex flex-col gap-4 h-full">
            <StatsCard platform={platform} data={data} color={color} />
            <GraphCard data={data} color={color} hexColor={hexColor} />
        </div>
    );

    return (
        <PageTransition>
            <div className="p-6 md:p-12 min-h-screen">
                <header className="mb-12">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{user?.name || 'Coder'}</span>
                    </h1>
                    <p className="text-gray-400">Here's your competitive programming overview.</p>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex flex-col gap-4">
                                <div className="h-40 bg-[#13131f] rounded-2xl border border-white/5"></div>
                                <div className="h-48 bg-[#13131f] rounded-2xl border border-white/5"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <PlatformGroup
                            platform="LeetCode"
                            data={stats?.leetcode}
                            color="yellow"
                            hexColor="#fbbf24"
                        />
                        <PlatformGroup
                            platform="Codeforces"
                            data={stats?.codeforces}
                            color="blue"
                            hexColor="#60a5fa"
                        />
                        <PlatformGroup
                            platform="CodeChef"
                            data={stats?.codechef}
                            color="orange"
                            hexColor="#fb923c"
                        />
                        <PlatformGroup
                            platform="AtCoder"
                            data={stats?.atcoder}
                            color="gray"
                            hexColor="#9ca3af"
                        />
                    </div>
                )}

                {!isLoading && !stats && (
                    <div className="mt-12 text-center p-12 bg-[#13131f] rounded-3xl border border-dashed border-gray-700">
                        <p className="text-gray-400 mb-4">No data found. Connect your accounts to see stats.</p>
                        <Link to="/profile" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all">
                            Setup Profile
                        </Link>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default Dashboard;
