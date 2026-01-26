const axios = require('axios');

const COLORS = {
    leetcode: '#dc2626',
    codeforces: '#3b82f6',
    codechef: '#10b981',
    atcoder: '#6b7280',
    default: '#8b5cf6'
};

const normalizeDate = (date) => new Date(date).toISOString();

const getCodeforcesType = (name, type) => {
    const divMatch = name.match(/Div\.?\s*([0-9\+]+)/i);
    if (name.includes('Educational') && divMatch) {
        return `Edu Div ${divMatch[1]}`;
    }
    if (name.includes('Educational')) return 'Educational';
    if (divMatch) return `Div ${divMatch[1]}`;
    return type === 'CF' ? 'Division' : 'Other';
};

let cachedContests = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const fetchContests = async () => {
    // Check Cache
    if (cachedContests && (Date.now() - lastFetchTime < CACHE_DURATION)) {
        console.log('Serving contests from cache');
        return cachedContests;
    }

    try {
        const [cfRes, atRes, lcRes, ccRes] = await Promise.allSettled([
            axios.get(process.env.CODEFORCES_API_URL, { timeout: 10000 }),
            axios.get(process.env.ATCODER_API_URL, { timeout: 10000 }),
            axios.get(process.env.LEETCODE_API_URL, { timeout: 10000 }),
            axios.get(process.env.CODECHEF_API_URL, { timeout: 10000 })
        ]);

        let contests = [];
        const now = new Date(); // Current time

        // Calculate the date range for filtering contests
        // Default range: Previous month start to end of 2 months later (approx 90 days window)
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

        const isInRange = (dateStr) => {
            const date = new Date(dateStr);
            return date >= start && date <= end;
        };

        // Codeforces
        if (cfRes.status === 'fulfilled' && cfRes.value.data.status === 'OK') {
            const cfContests = cfRes.value.data.result
                .filter(c => isInRange(c.startTimeSeconds * 1000))
                .map(c => ({
                    title: c.name,
                    start: normalizeDate(c.startTimeSeconds * 1000),
                    end: normalizeDate((c.startTimeSeconds + c.durationSeconds) * 1000),
                    platform: 'Codeforces',
                    type: getCodeforcesType(c.name, c.type),
                    url: `https://codeforces.com/contests`,
                    color: COLORS.codeforces
                }));
            contests = [...contests, ...cfContests];
        }

        // AtCoder
        if (atRes.status === 'fulfilled') {
            const atContests = atRes.value.data
                .filter(c => c.start_epoch_second > 0)
                .map(c => ({ ...c, startMs: c.start_epoch_second * 1000 }))
                .filter(c => isInRange(c.startMs))
                .map(c => ({
                    title: c.title,
                    start: new Date(c.startMs).toISOString(),
                    end: new Date(c.startMs + c.duration_second * 1000).toISOString(),
                    platform: 'AtCoder',
                    type: c.id.startsWith('abc') ? 'beginner' : c.id.startsWith('arc') ? 'regular' : c.id.startsWith('agc') ? 'grand' : 'other',
                    url: `https://atcoder.jp/contests/${c.id}`,
                    color: COLORS.atcoder
                }));
            contests.push(...atContests);
        }

        // LeetCode
        if (lcRes.status === 'fulfilled' && lcRes.value.data && lcRes.value.data.allContests) {
            const lcContests = lcRes.value.data.allContests
                .filter(c => isInRange(c.startTime * 1000))
                .map(c => ({
                    title: c.title,
                    start: normalizeDate(c.startTime * 1000),
                    end: normalizeDate((c.startTime + c.duration) * 1000),
                    platform: 'LeetCode',
                    type: c.title.toLowerCase().includes('biweekly') ? 'biweekly' : 'weekly',
                    url: `https://leetcode.com/contest/${c.titleSlug}`,
                    color: COLORS.leetcode
                }));
            contests = [...contests, ...lcContests];
        }

        // CodeChef
        if (ccRes.status === 'fulfilled' && ccRes.value.data) {
            const ccContests = [
                ...(ccRes.value.data.present_contests || []),
                ...(ccRes.value.data.future_contests || [])
            ]
                .filter(c => isInRange(c.contest_start_date_iso))
                .map(c => ({
                    title: c.contest_name,
                    start: normalizeDate(c.contest_start_date_iso),
                    end: normalizeDate(c.contest_end_date_iso),
                    platform: 'CodeChef',
                    type: c.contest_code.includes('START') ? 'starters' : 'long',
                    url: `https://www.codechef.com/${c.contest_code}`,
                    color: COLORS.codechef
                }));
            contests = [...contests, ...ccContests];
        }

        contests.sort((a, b) => new Date(a.start) - new Date(b.start));

        // Update Cache
        cachedContests = contests;
        lastFetchTime = Date.now();
        console.log('Fetched fresh contests and updated cache');

        return contests;

    } catch (error) {
        console.error("Error fetching contests:", error);
        return [];
    }
};

module.exports = { fetchContests };
