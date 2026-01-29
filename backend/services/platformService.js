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

        return {
            platform: 'LeetCode',
            handle,
            solved,
            rating,
            ranking: data.matchedUser.profile.ranking,
            history,
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

        return {
            platform: 'Codeforces',
            handle,
            rating: user.rating,
            rank: user.rank,
            maxRating: user.maxRating,
            history,
            success: true
        };
    } catch (err) {
        console.error(`Codeforces fetch error for ${handle}:`, err.message);
        return { platform: 'Codeforces', handle, error: "Failed to fetch", success: false };
    }
};

// --- AtCoder ---
const fetchAtCoder = async (handle) => {
    console.log(`Fetching AtCoder for: ${handle}`);
    try {
        // Parallel calls: Profile scrape and JSON history
        // Note: AtCoder history JSON is accessible publicly
        const [profileRes, historyRes] = await Promise.all([
            axios.get(`https://atcoder.jp/users/${handle}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
            axios.get(`https://atcoder.jp/users/${handle}/history/json`, { headers: { 'User-Agent': 'Mozilla/5.0' } }) // Valid JSON endpoint
        ]);

        const $ = cheerio.load(profileRes.data);
        let rating = 0;
        $('th').each((i, el) => {
            if ($(el).text().trim() === 'Rating') {
                const val = $(el).next('td').text().trim();
                const match = val.match(/^(\d+)/);
                if (match) rating = parseInt(match[1]);
            }
        });

        if (!rating && rating !== 0) throw new Error("Rating not found");

        const history = historyRes.data.map(x => ({
            rating: x.NewRating,
            date: new Date(x.EndTime).toISOString().split('T')[0]
        }));

        return {
            platform: 'AtCoder',
            handle,
            rating,
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
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(response.data);
        const rating = $('.rating-number').text().replace(/\D/g, '');
        const stars = $('.rating-star').text().trim();

        if (!rating) throw new Error("Rating not found");

        // CodeChef history is hard to scrape cleanly without huge regex or chart parsing. Skipping history.
        return {
            platform: 'CodeChef',
            handle,
            rating: parseInt(rating),
            stars,
            history: [], // No history for now
            success: true
        };
    } catch (err) {
        return { platform: 'CodeChef', handle, error: "Failed to fetch", success: false };
    }
};

module.exports = { fetchLeetCode, fetchCodeforces, fetchCodeChef, fetchAtCoder };
