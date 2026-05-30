require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

const mongoose = require('mongoose');

const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server and local tools with no origin header
        if (!origin) return callback(null, true);

        // If no allowlist is provided, keep development friction low
        if (allowedOrigins.length === 0) return callback(null, true);

        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});


mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cpf')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const { fetchContests } = require('./services/contestService');
const User = require('./models/User');

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const AUTH_COOKIE_NAME = 'token';

if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not set. Using fallback secret for local development only.');
}

const getCookieOptions = () => ({
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
});

const signAuthToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const buildAuthResponse = (user) => ({
    id: user._id,
    email: user.email,
    name: user.name,
    platformHandles: user.platformHandles,
    preferences: { channels: user.channels, reminders: user.reminders }
});

const authMiddleware = async (req, res, next) => {
    // Check for token in Cookies OR Authorization header (Bearer <token>)
    let token = req.cookies[AUTH_COOKIE_NAME];

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(decoded.userId).select('-password');
        if (!req.user) return res.status(401).json({ error: "Unauthorized: User not found" });
        next();
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};


// --- User Routes ---


app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password, name, platformHandles } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and Password are required" });

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: "User already exists" });

        user = new User({ email, password, name, platformHandles });
        await user.save();

        const token = signAuthToken(user._id);

        res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

        res.status(201).json({
            message: "User created",
            user: buildAuthResponse(user)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and Password are required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = signAuthToken(user._id);

        res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

        res.json({
            message: "Logged in",
            user: buildAuthResponse(user)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/users/logout', (req, res) => {
    res.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: IS_PROD ? 'none' : 'lax'
    });
    res.json({ message: "Logged out" });
});


app.get('/api/users/me', authMiddleware, async (req, res) => {
    res.json(req.user);
});



app.put('/api/users/preferences', authMiddleware, async (req, res) => {
    try {
        const { name, channels, reminders, platformHandles } = req.body;
        const user = req.user;

        user.name = name !== undefined ? name : user.name;
        if (channels) user.channels = channels;
        if (reminders) user.reminders = reminders;
        if (platformHandles) user.platformHandles = platformHandles;

        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



app.get('/api/contests', async (req, res) => {
    try {
        const contests = await fetchContests();
        res.json(contests);
    } catch (error) {
        console.error("Error fetching contests:", error);
        res.status(500).json({ error: "Failed to fetch contests" });
    }
});


const { fetchLeetCode, fetchCodeforces, fetchCodeChef, fetchAtCoder, fetchGFG } = require('./services/platformService');

app.get('/api/users/stats', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const stats = {};
        const handles = user.platformHandles || [];

        // Parallelize fetching
        const promises = handles.map(async (item) => {
            if (!item.handle) return null;

            switch (item.platform) {
                case 'LeetCode':
                    return await fetchLeetCode(item.handle);
                case 'Codeforces':
                    return await fetchCodeforces(item.handle);
                case 'CodeChef':
                    return await fetchCodeChef(item.handle);
                case 'AtCoder':
                    return await fetchAtCoder(item.handle);
                case 'GFG':
                    return await fetchGFG(item.handle);
                default:
                    return null;
            }
        });

        const results = await Promise.all(promises);
        const contributionMap = {};
        let totalSolved = 0;

        results.forEach(result => {
            if (result && result.platform) {
                stats[result.platform.toLowerCase()] = result;
                
                // Add to total solved if available
                if (result.solved) totalSolved += result.solved;

                // Merge calendars
                if (result.calendar) {
                    Object.entries(result.calendar).forEach(([date, count]) => {
                        if (!contributionMap[date]) {
                            contributionMap[date] = { total: 0, platforms: {} };
                        }
                        contributionMap[date].total += count;
                        contributionMap[date].platforms[result.platform] = (contributionMap[date].platforms[result.platform] || 0) + count;
                    });
                }
            }
        });

        // Calculate Streak, Best Day, and Solved Today from contributionMap
        const sortedDates = Object.keys(contributionMap).sort();
        let currentStreak = 0;
        let streakRange = { start: null, end: null };
        let bestDay = { date: null, count: 0 };
        let totalSolvedToday = 0;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (sortedDates.length > 0) {
            // Best Day & Today Solved
            sortedDates.forEach(date => {
                if (contributionMap[date].total > bestDay.count) {
                    bestDay = { date, count: contributionMap[date].total };
                }
                if (date === todayStr) {
                    totalSolvedToday = contributionMap[date].total;
                }
            });

            // Current Streak
            let checkDate = contributionMap[todayStr] ? todayStr : (contributionMap[yesterdayStr] ? yesterdayStr : null);
            if (checkDate) {
                streakRange.end = checkDate;
                let d = new Date(checkDate);
                while (true) {
                    const dStr = d.toISOString().split('T')[0];
                    if (contributionMap[dStr]) {
                        currentStreak++;
                        streakRange.start = dStr;
                        d.setDate(d.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }
        }

        res.json({
            platforms: stats,
            summary: {
                totalSolved,
                totalSolvedToday,
                currentStreak,
                streakRange,
                bestDay
            },
            contributionData: contributionMap
        });
    } catch (err) {
        console.error("Stats fetch error:", err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

const { startScheduler } = require('./services/scheduler');
startScheduler();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
