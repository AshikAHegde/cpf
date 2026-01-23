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


        if (cfRes.status === 'fulfilled' && cfRes.value.data.status === 'OK') {
            const cfContests = cfRes.value.data.result
                .filter(c => c.phase === 'BEFORE')
                .map(c => ({
                    title: c.name,
                    start: normalizeDate(c.startTimeSeconds * 1000),
                    end: normalizeDate((c.startTimeSeconds + c.durationSeconds) * 1000),
                    platform: 'Codeforces',
                    type: c.type === 'CF' ? 'division' : 'educational',
                    url: `https://codeforces.com/contest`,
                    color: COLORS.codeforces
                }));
            contests = [...contests, ...cfContests];
        } else {
            console.error('Codeforces fetch failed:', cfRes.reason);
        }


        if (atRes.status === 'fulfilled') {
            const atContests = atRes.value.data
                .slice(-5)
                .map((c, index) => {
                    const fakeStartDate = new Date();
                    fakeStartDate.setDate(fakeStartDate.getDate() + index + 1);
                    fakeStartDate.setHours(20, 0, 0, 0);

                    const fakeEndDate = new Date(fakeStartDate);
                    fakeEndDate.setHours(22, 0, 0, 0);

                    return {
                        title: c.title,
                        start: fakeStartDate.toISOString(),
                        end: fakeEndDate.toISOString(),
                        platform: 'AtCoder',
                        type: c.id.startsWith('abc') ? 'beginner' : c.id.startsWith('arc') ? 'regular' : c.id.startsWith('agc') ? 'grand' : 'other',
                        url: `https://atcoder.jp/contests/${c.id}`,
                        color: COLORS.atcoder
                    };
                });
            contests = [...contests, ...atContests];
        } else {
            console.error('AtCoder fetch failed:', atRes.reason);
        }


        if (lcRes.status === 'fulfilled' && lcRes.value.data && lcRes.value.data.allContests) {
            const lcContests = lcRes.value.data.allContests
                .filter(c => new Date(c.startTime * 1000) > now)
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
                ...(ccRes.value.data.future_contests || [])
            ].map(c => ({
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