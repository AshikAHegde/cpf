require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

const mongoose = require('mongoose');

app.use(cors({
    origin: true, // Allow any origin
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


const authMiddleware = async (req, res, next) => {
    // Check for token in Cookies OR Authorization header (Bearer <token>)
    let token = req.cookies.token;

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

        // Generate Token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return token in response as well for localStorage fallback
        res.status(201).json({
            message: "User created",
            token,
            user: {
                email: user.email,
                name: user.name,
                platformHandles: user.platformHandles,
                preferences: { channels: user.channels, reminders: user.reminders }
            }
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

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            message: "Logged in",
            token,
            user: {
                email: user.email,
                name: user.name,
                platformHandles: user.platformHandles,
                preferences: { channels: user.channels, reminders: user.reminders }
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/users/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true
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


const { fetchLeetCode, fetchCodeforces, fetchCodeChef, fetchAtCoder } = require('./services/platformService');

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
                default:
                    return null;
            }
        });

        const results = await Promise.all(promises);

        results.forEach(result => {
            if (result && result.platform) {
                stats[result.platform.toLowerCase()] = result;
            }
        });

        res.json(stats);
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