require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

const mongoose = require('mongoose');

app.use(cors({
    origin: ['http://localhost:5173', 'http://10.238.38.58:5173'], // Allow both localhost and network IP
    credentials: true
}));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cpf')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const { fetchContests } = require('./services/contestService');
const User = require('./models/User');

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

// --- Middlewares ---
const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
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

// Register
app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password, name, phoneNumber } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and Password are required" });

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: "User already exists" });

        user = new User({ email, password, name, phoneNumber });
        await user.save();

        // Generate Token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({ message: "User created", user: { email: user.email, name: user.name, preferences: { channels: user.channels, reminders: user.reminders } } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
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
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ message: "Logged in", user: { email: user.email, name: user.name, preferences: { channels: user.channels, reminders: user.reminders } } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout
app.post('/api/users/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.json({ message: "Logged out" });
});

// Get Current User (Protected)
app.get('/api/users/me', authMiddleware, async (req, res) => {
    res.json(req.user);
});


// Get User Preferences (Previous Route - now Protected or removed? Keeping for now but strictly it should be 'me')
// We can use 'me' instead of getting by email, for security.
// But satisfying previous frontend behavior, let's keep it but secure it if possible.
// Actually, let's Redirect /api/users/:email calls to /api/users/me if it matches logged in user, or just rely on 'me'.
// For simplicity with frontend changes, I will use /api/users/me for loading profile. (See plan)

// Update User Preferences (Protected)
app.put('/api/users/preferences', authMiddleware, async (req, res) => {
    try {
        const { name, phoneNumber, channels, reminders } = req.body;
        const user = req.user;

        user.name = name !== undefined ? name : user.name;
        user.phoneNumber = phoneNumber !== undefined ? phoneNumber : user.phoneNumber;
        if (channels) user.channels = channels;
        if (reminders) user.reminders = reminders;

        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Contest Routes ---

app.get('/api/contests', async (req, res) => {
    try {
        const contests = await fetchContests();
        res.json(contests);
    } catch (error) {
        console.error("Error fetching contests:", error);
        res.status(500).json({ error: "Failed to fetch contests" });
    }
});

const { startScheduler } = require('./services/scheduler');
startScheduler();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});