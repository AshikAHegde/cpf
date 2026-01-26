import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
        password: '', // Added password field
        phone: ''
    });

    // NOTE: Missing state variables restored here
    const [channels, setChannels] = useState({ email: true, sms: false });
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
            const res = await axios.get(`${API_URL}/users/me`).catch(() => null);

            if (res && res.data) {
                const data = res.data;
                setFormData(prev => ({
                    ...prev,
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phoneNumber || '',
                    password: '' // Don't show password
                }));
                if (data.channels) setChannels(prev => ({ ...prev, ...data.channels }));
                if (data.reminders) setReminders(prev => ({ ...prev, ...data.reminders }));

                setIsLoaded(true);
            }
        } catch (error) {
            console.error("Not logged in");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        console.log("Submitting Auth:", authMode, formData);

        try {
            if (authMode === 'signup') {
                await axios.post(`${API_URL}/users/register`, {
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    phoneNumber: formData.phone
                });
                setMessage({ type: 'success', text: 'Account created! You are logged in.' });
            } else {
                await axios.post(`${API_URL}/users/login`, {
                    email: formData.email,
                    password: formData.password
                });
            }
            // After successful login/signup, fetch profile
            fetchCurrentUser();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Authentication failed' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            await axios.put(`${API_URL}/users/preferences`, {
                name: formData.name,
                phoneNumber: formData.phone,
                channels,
                reminders
            });
            setMessage({ type: 'success', text: 'Preferences updated!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${API_URL}/users/logout`);
            setIsLoaded(false);
            setFormData({ name: '', email: '', password: '', phone: '' });
            setChannels({ email: true, sms: false }); // Reset defaults
            setReminders({ oneDay: false, twoDays: false }); // Reset defaults
            setAuthMode('login');
        } catch (err) {
            console.error("Logout failed", err);
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
