import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthForm from '../Components/AuthForm.jsx';
import ProfileSettings from '../Components/ProfileSettings.jsx';

// Simple environment variable helper
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const Profile = () => {
    const navigate = useNavigate();
    // Auth State
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
    const [isLoaded, setIsLoaded] = useState(false);

    // User Data State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        // CP Handles (mapped for easier form handling)
        leetcode: '',
        codeforces: '',
        codechef: '',
        atcoder: ''
    });

    // NOTE: Missing state variables restored here
    const [channels, setChannels] = useState({ email: true });
    const [reminders, setReminders] = useState({ oneDay: false, twoDays: false });

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // Try to fetch current user on load
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            const res = await axios.get(`${API_URL}/users/me`, config).catch(() => null);

            if (res && res.data) {
                const data = res.data;
                const handles = data.platformHandles || [];
                // Helper to find handle
                const getHandle = (p) => handles.find(h => h.platform === p)?.handle || '';

                setFormData(prev => ({
                    ...prev,
                    name: data.name || '',
                    email: data.email || '',
                    password: '', // Don't show password
                    leetcode: getHandle('LeetCode'),
                    codeforces: getHandle('Codeforces'),
                    codechef: getHandle('CodeChef'),
                    atcoder: getHandle('AtCoder')
                }));
                if (data.channels) setChannels(prev => ({ ...prev, ...data.channels }));
                if (data.reminders) setReminders(prev => ({ ...prev, ...data.reminders }));

                setIsLoaded(true);
            }
        } catch (error) {
            console.error("Not logged in or profile fetch failed:", error);
            if (error.response) {
                console.error("Server response:", error.response.status, error.response.data);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        console.log("Submitting Auth:", authMode, formData);

        // Construct platformHandles array
        const platformHandles = [
            { platform: 'LeetCode', handle: formData.leetcode || '' },
            { platform: 'Codeforces', handle: formData.codeforces || '' },
            { platform: 'CodeChef', handle: formData.codechef || '' },
            { platform: 'AtCoder', handle: formData.atcoder || '' }
        ];

        try {
            let res;
            if (authMode === 'signup') {
                res = await axios.post(`${API_URL}/users/register`, {
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    platformHandles
                });
                toast.success('Account created! You are logged in.');
            } else {
                res = await axios.post(`${API_URL}/users/login`, {
                    email: formData.email,
                    password: formData.password
                });
                toast.success('Logged in successfully!');
            }

            // Save token
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
            }

            // After successful login/signup, fetch profile
            fetchCurrentUser();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Authentication failed');
            setMessage({ type: 'error', text: err.response?.data?.error || 'Authentication failed' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            // Construct platformHandles array
            const platformHandles = [
                { platform: 'LeetCode', handle: formData.leetcode || '' },
                { platform: 'Codeforces', handle: formData.codeforces || '' },
                { platform: 'CodeChef', handle: formData.codechef || '' },
                { platform: 'AtCoder', handle: formData.atcoder || '' }
            ];

            await axios.put(`${API_URL}/users/preferences`, {
                name: formData.name,
                channels,
                reminders,
                platformHandles
            }, config);
            toast.success('Preferences updated!');
            navigate('/dashboard');
        } catch (err) {
            toast.error('Failed to update.');
            setMessage({ type: 'error', text: 'Failed to update.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            localStorage.removeItem('token'); // Clear token
            await axios.post(`${API_URL}/users/logout`);
            setIsLoaded(false);
            setFormData({ name: '', email: '', password: '', leetcode: '', codeforces: '', codechef: '', atcoder: '' });
            setChannels({ email: true }); // Reset defaults
            setReminders({ oneDay: false, twoDays: false }); // Reset defaults
            setAuthMode('login');
            toast.success("Logged out successfully");
        } catch (err) {
            console.error("Logout failed", err);
            toast.error("Logout failed");
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-12 font-sans relative">
            {/* Close Button */}
            <button
                onClick={() => navigate('/calendar')}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="Close"
            >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="max-w-4xl mx-auto">
                <header className="mb-12 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4">
                        User Profile
                    </h1>
                    <p className="text-gray-400 text-lg">Manage your identity and notification preferences.</p>
                </header>

                {!isLoaded ? (
                    <AuthForm
                        authMode={authMode}
                        setAuthMode={setAuthMode}
                        formData={formData}
                        setFormData={setFormData}
                        handleAuthSubmit={handleAuthSubmit}
                        isLoading={isLoading}
                    />
                ) : (
                    <ProfileSettings
                        formData={formData}
                        setFormData={setFormData}
                        handleLogout={handleLogout}
                        channels={channels}
                        setChannels={setChannels}
                        reminders={reminders}
                        setReminders={setReminders}
                        handleUpdateProfile={handleUpdateProfile}
                        isLoading={isLoading}
                        message={message}
                    />
                )}
            </div>
        </div>
    );
};

export default Profile;
