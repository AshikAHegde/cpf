require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const normalizeDate = (date) => new Date(date).toISOString();

const COLORS = {
    leetcode: '#dc2626',
    codeforces: '#3b82f6',
    codechef: '#10b981',
    atcoder: '#6b7280',
    default: '#8b5cf6'
};

const getCodeforcesType = (name, type) => {
    const divMatch = name.match(/Div\.?\s*([0-9\+]+)/i);
    if (name.includes('Educational') && divMatch) {
        return `Edu Div ${divMatch[1]}`;
    }
    if (name.includes('Educational')) return 'Educational';
    if (divMatch) return `Div ${divMatch[1]}`;
    return type === 'CF' ? 'Division' : 'Other';
};

app.get('/api/contests', async (req, res) => {
    try {
        const [cfRes, atRes, lcRes, ccRes] = await Promise.allSettled([
            axios.get(process.env.CODEFORCES_API_URL, { timeout: 10000 }),
            axios.get(process.env.ATCODER_API_URL, { timeout: 10000 }),
            axios.get(process.env.LEETCODE_API_URL, { timeout: 10000 }),
            axios.get(process.env.CODECHEF_API_URL, { timeout: 10000 })
        ]);

        let contests = [];
        const now = new Date();

        // Calculate date range: Start of previous month to End of next month
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

        const isInRange = (dateStr) => {
            const date = new Date(dateStr);
            return date >= start && date <= end;
        };

        if (cfRes.status === 'fulfilled' && cfRes.value.data.status === 'OK') {
            const cfContests = cfRes.value.data.result
                .filter(c => {
                    const startTime = c.startTimeSeconds * 1000;
                    // Check if contest is in range (loose check for future or recent past)
                    // Codeforces returns all history, so we strictly filter by our range
                    return isInRange(startTime);
                })
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
        } else {
            console.error('Codeforces fetch failed:', cfRes.reason);
        }

        if (atRes.status === 'fulfilled') {
            const atContests = atRes.value.data
                .filter(c => c.start_epoch_second > 0)
                .map(c => {
                    const startMs = c.start_epoch_second * 1000;
                    return { ...c, startMs };
                })
                .filter(c => isInRange(c.startMs)) // Filter by date range
                .map(c => {
                    const endMs = c.startMs + c.duration_second * 1000;
                    return {
                        title: c.title,
                        start: new Date(c.startMs).toISOString(),
                        end: new Date(endMs).toISOString(),
                        platform: 'AtCoder',
                        type: c.id.startsWith('abc')
                            ? 'beginner'
                            : c.id.startsWith('arc')
                                ? 'regular'
                                : c.id.startsWith('agc')
                                    ? 'grand'
                                    : 'other',
                        url: `https://atcoder.jp/contests/${c.id}`,
                        color: COLORS.atcoder
                    };
                });

            contests.push(...atContests);
        } else {
            console.error('AtCoder fetch failed:', atRes.reason);
        }

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
        } else {
            console.error('LeetCode fetch failed or invalid data');
        }

        if (ccRes.status === 'fulfilled' && ccRes.value.data) {
            const ccContests = [
                ...(ccRes.value.data.present_contests || []),
                ...(ccRes.value.data.future_contests || []),
                // CodeChef API might separate past contests, if 'past_contests' is available and needed for "previous month", it should be added.
                // Assuming present/future covers enough for now or the API structure allows it.
                // If previous month data is missing, it might be in 'past_contests' which strictly isn't usually sent in light APIs.
                // For now, filtering what we have.
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

        res.json(contests);

    } catch (error) {
        console.error("Error fetching contests:", error);
        res.status(500).json({ error: "Failed to fetch contests" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});