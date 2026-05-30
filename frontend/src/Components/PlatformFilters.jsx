import {
    LeetCodeIcon,
    CodeforcesIcon,
    CodeChefIcon,
    AtCoderIcon,
    GFGIcon
} from './PlatformIcons.jsx';

const PlatformFilters = ({ activeFilters, onToggleFilter }) => {
    const platforms = [
        { name: 'Codeforces', color: 'blue', Icon: CodeforcesIcon },
        { name: 'LeetCode', color: 'yellow', Icon: LeetCodeIcon },
        { name: 'CodeChef', color: 'orange', Icon: CodeChefIcon },
        { name: 'AtCoder', color: 'purple', Icon: AtCoderIcon },
        { name: 'GFG', color: 'green', Icon: GFGIcon }
    ];

    return (
        <div className="flex flex-wrap gap-2 mb-8">
            <button
                onClick={() => onToggleFilter('All')}
                className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 border ${activeFilters.length === 5
                    ? 'bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                    : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/[0.05] hover:border-white/10'
                    }`}
            >
                All Platforms
            </button>

            {platforms.map(platform => {
                const isActive = activeFilters.includes(platform.name);
                const Icon = platform.Icon;
                return (
                    <button
                        key={platform.name}
                        onClick={() => onToggleFilter(platform.name)}
                        className={`px-5 py-2.5 rounded-full flex items-center gap-3 transition-all duration-300 border group/btn ${isActive
                            ? 'bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                            : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/[0.05] hover:border-white/10'
                            }`}
                    >
                        <Icon className={`w-3.5 h-3.5 transition-all duration-300 ${isActive ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale group-hover/btn:opacity-60'}`} />
                        <span className="font-black tracking-[0.1em] uppercase text-[9px]">{platform.name}</span>
                        {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default PlatformFilters;
