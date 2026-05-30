const axios = require('axios');
const cheerio = require('cheerio');

// --- LeetCode ---
const fetchLeetCode = async (handle) => {
    console.log(`Fetching LeetCode for: ${handle}`);
    try {
        const query = `
            query getUserData($username: String!) {
                matchedUser(username: $username) {
                    profile {
                        ranking
                        reputation
                    }
                    submitStats {
                        acSubmissionNum {
                            difficulty
                            count
                        }
                    }
                }
                userContestRanking(username: $username) {
                    rating
                    globalRanking
                }
                userContestRankingHistory(username: $username) {
                    attended
                    rating
                    contest {
                        startTime
                    }
                }
            }
        `;
        const response = await axios.post('https://leetcode.com/graphql', {
            query,
            variables: { username: handle }
        });

        // Fetch calendar separately to avoid complexity in a single query if needed, 
        // or just add it to the main query. Let's add it to the main query.
        const calendarQuery = `
            query userProfileCalendar($username: String!) {
                matchedUser(username: $username) {
                    userCalendar {
                        submissionCalendar
                        streak
                        totalActiveDays
                    }
                }
            }
        `;
        const calendarResponse = await axios.post('https://leetcode.com/graphql', {
            query: calendarQuery,
            variables: { username: handle }
        });

        if (response.data.errors || !response.data.data.matchedUser) {
            return { platform: 'LeetCode', handle, error: "User not found", success: false };
        }

        const data = response.data.data;
        const solved = data.matchedUser.submitStats.acSubmissionNum.find(s => s.difficulty === 'All').count;
        const rating = data.userContestRanking ? Math.round(data.userContestRanking.rating) : null;

        // History: only attended contests
        const history = data.userContestRankingHistory
            ? data.userContestRankingHistory
                .filter(x => x.attended)
                .map(x => ({
                    rating: Math.round(x.rating),
                    date: new Date(x.contest.startTime * 1000).toISOString().split('T')[0]
                }))
            : [];

        const calendarData = calendarResponse.data.data?.matchedUser?.userCalendar || {};
        const submissionCalendar = calendarData.submissionCalendar ? JSON.parse(calendarData.submissionCalendar) : {};
        
        // Convert submissionCalendar (timestamp in seconds) to YYYY-MM-DD
        const calendar = {};
        Object.entries(submissionCalendar).forEach(([ts, count]) => {
            const date = new Date(parseInt(ts) * 1000).toISOString().split('T')[0];
            calendar[date] = (calendar[date] || 0) + count;
        });

        return {
            platform: 'LeetCode',
            handle,
            solved,
            rating,
            ranking: data.matchedUser.profile.ranking,
            history,
            calendar,
            streak: calendarData.streak,
            totalActiveDays: calendarData.totalActiveDays,
            success: true
        };
    } catch (err) {
        console.error(`LeetCode fetch error for ${handle}:`, err.message);
        return { platform: 'LeetCode', handle, error: "Failed to fetch", success: false };
    }
};

// --- Codeforces ---
const fetchCodeforces = async (handle) => {
    console.log(`Fetching Codeforces for: ${handle}`);
    try {
        // Parallel calls: Info and Rating History
        const [infoRes, ratingRes] = await Promise.all([
            axios.get(`https://codeforces.com/api/user.info?handles=${handle}`),
            axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`)
        ]);

        if (infoRes.data.status !== 'OK') return null;

        const user = infoRes.data.result[0];
        const history = ratingRes.data.status === 'OK'
            ? ratingRes.data.result.map(r => ({
                rating: r.newRating,
                date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString().split('T')[0]
            }))
            : [];

        // Fetch recent submissions for activity and TOTAL SOLVED
        let calendar = {};
        let solved = 0;
        try {
            const statusRes = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`);
            if (statusRes.data.status === 'OK') {
                const uniqueSolved = new Set();
                statusRes.data.result.forEach(sub => {
                    const date = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
                    if (sub.verdict === 'OK') {
                        calendar[date] = (calendar[date] || 0) + 1;
                        // Unique problem key: contestId + index (e.g., 1234A)
                        uniqueSolved.add(`${sub.problem.contestId}${sub.problem.index}`);
                    }
                });
                solved = uniqueSolved.size;
            }
        } catch (e) { console.error("CF Status fetch error", e.message); }

        return {
            platform: 'Codeforces',
            handle,
            rating: user.rating,
            rank: user.rank,
            maxRating: user.maxRating,
            solved,
            history,
            calendar,
            success: true
        };
    } catch (err) {
        console.error(`Codeforces fetch error for ${handle}:`, err.message);
        return { platform: 'Codeforces', handle, error: "Failed to fetch", success: false };
    }
};

// --- GFG (GeeksforGeeks) ---
const fetchGFG = async (handle) => {
    console.log(`Fetching GFG for: ${handle}`);
    try {
        const response = await axios.get(`https://www.geeksforgeeks.org/user/${handle}/`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(response.data);
        
        // GFG stats are often in spans with specific classes
        const solvedText = $('.scoreCard_head_left--score__39_Z0').first().text() || 
                           $('.tabs_main_content .solve-count').first().text() || "0";
        const solved = parseInt(solvedText.replace(/\D/g, '')) || 0;
        
        return {
            platform: 'GFG',
            handle,
            solved,
            calendar: {},
            history: [],
            success: true
        };
    } catch (err) {
        console.error(`GFG fetch error for ${handle}:`, err.message);
        return { platform: 'GFG', handle, error: "Failed to fetch", success: false };
    }
};

// --- AtCoder ---
const fetchAtCoder = async (handle) => {
    console.log(`Fetching AtCoder for: ${handle}`);
    try {
        const [profileRes, historyRes] = await Promise.all([
            axios.get(`https://atcoder.jp/users/${handle}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
            axios.get(`https://atcoder.jp/users/${handle}/history/json`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
        ]);

        const $ = cheerio.load(profileRes.data);
        let rating = 0;
        let solved = 0;
        
        $('th').each((i, el) => {
            const text = $(el).text().trim();
            if (text === 'Rating') {
                const val = $(el).next('td').text().trim();
                const match = val.match(/^(\d+)/);
                if (match) rating = parseInt(match[1]);
            }
        });

        // Scrape solved count if possible (AtCoder doesn't show it directly on main profile always, 
        // but often in "Accepted" under contest results or via a separate link. 
        // For now, let's look for any 'Accepted' text)
        const acceptedMatch = profileRes.data.match(/Accepted<\/th><td>(\d+)<\/td>/);
        if (acceptedMatch) solved = parseInt(acceptedMatch[1]);

        const history = historyRes.data.map(x => ({
            rating: x.NewRating,
            date: new Date(x.EndTime).toISOString().split('T')[0]
        }));

        return {
            platform: 'AtCoder',
            handle,
            rating,
            solved,
            history,
            success: true
        };
    } catch (err) {
        console.error(`AtCoder fetch error for ${handle}:`, err.message);
        return { platform: 'AtCoder', handle, error: "Failed to fetch", success: false };
    }
};

// --- CodeChef ---
const fetchCodeChef = async (handle) => {
    console.log(`Fetching CodeChef for: ${handle}`);
    try {
        const response = await axios.get(`https://www.codechef.com/users/${handle}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(response.data);
        const rating = $('.rating-number').first().text().replace(/\D/g, '');
        const stars = $('.rating-star').text().trim();

        // Extract History from Script Tag (CodeChef embeds it in a Highcharts config)
        let history = [];
        const scripts = $('script');
        scripts.each((i, s) => {
            const content = $(s).html();
            if (content && content.includes('all_rating')) {
                // Regex to find the rating history array
                const match = content.match(/all_rating\s*=\s*(\[.*?\]);/);
                if (match) {
                    try {
                        const rawHistory = JSON.parse(match[1]);
                        history = rawHistory.map(item => ({
                            rating: parseInt(item.rating),
                            date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(2, '0')}`
                        }));
                    } catch (e) {
                        console.error("CodeChef history parse error", e.message);
                    }
                }
            }
        });

        return {
            platform: 'CodeChef',
            handle,
            rating: parseInt(rating) || 0,
            stars: stars || '0',
            solved: 0, // CodeChef solved count is in another complex section
            history: history,
            success: !!rating
        };
    } catch (err) {
        console.error(`CodeChef fetch error for ${handle}:`, err.message);
        return { platform: 'CodeChef', handle, error: "Failed to fetch", success: false };
    }
};

module.exports = { fetchLeetCode, fetchCodeforces, fetchCodeChef, fetchAtCoder, fetchGFG };
