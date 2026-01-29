import React from 'react';

const ProfileSettings = ({
    formData,
    setFormData,
    handleLogout,
    channels,
    setChannels,
    reminders,
    setReminders,
    handleUpdateProfile,
    isLoading,
    message
}) => {
    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Sidebar / Identity Summary */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-[#13131f] border border-white/10 rounded-3xl p-6 shadow-xl text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-500/10 to-transparent" />
                    <div className="relative">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-blue-500/20">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : formData.email.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{formData.name || 'User'}</h2>
                        <p className="text-sm text-gray-400 mb-6">{formData.email}</p>

                        <button
                            onClick={handleLogout}
                            className="text-sm text-red-400 hover:text-red-300 font-medium bg-red-500/10 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Settings Area */}
            <div className="lg:col-span-2 space-y-8">
                {/* Personal Info Edit */}
                <section className="bg-[#13131f] border border-white/10 rounded-3xl p-8 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full" />
                        Personal Details
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Display Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* CP Platforms */}
                <section className="bg-[#13131f] border border-white/10 rounded-3xl p-8 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-green-500 rounded-full" />
                        CP Platforms
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">LeetCode</label>
                            <input
                                type="text"
                                value={formData.leetcode || ''}
                                onChange={e => setFormData({ ...formData, leetcode: e.target.value })}
                                placeholder="username"
                                className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Codeforces</label>
                            <input
                                type="text"
                                value={formData.codeforces || ''}
                                onChange={e => setFormData({ ...formData, codeforces: e.target.value })}
                                placeholder="handle"
                                className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CodeChef</label>
                            <input
                                type="text"
                                value={formData.codechef || ''}
                                onChange={e => setFormData({ ...formData, codechef: e.target.value })}
                                placeholder="username"
                                className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">AtCoder</label>
                            <input
                                type="text"
                                value={formData.atcoder || ''}
                                onChange={e => setFormData({ ...formData, atcoder: e.target.value })}
                                placeholder="username"
                                className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-gray-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* Notification Preferences */}
                <section className="bg-[#13131f] border border-white/10 rounded-3xl p-8 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-500 rounded-full" />
                        Notification Settings
                    </h3>

                    <div className="space-y-6">
                        {/* Channels */}
                        <div>
                            <label className="text-sm font-semibold text-gray-400 mb-3 block">Delivery Channels</label>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => setChannels(p => ({ ...p, email: !p.email }))}
                                    className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all ${channels.email ? 'bg-blue-600/20 border-blue-500/50 text-blue-300' : 'bg-[#0a0a0f] border-gray-800 text-gray-400'}`}
                                >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${channels.email ? 'bg-blue-500 border-transparent' : 'border-gray-600'}`}>
                                        {channels.email && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    Email Notifications
                                </button>
                            </div>
                        </div>

                        {/* Reminders */}
                        <div>
                            <label className="text-sm font-semibold text-gray-400 mb-3 block">Reminder Timing</label>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div
                                    onClick={() => setReminders(p => ({ ...p, oneDay: !p.oneDay }))}
                                    className={`cursor-pointer p-4 rounded-xl border transition-all ${reminders.oneDay ? 'bg-white/10 border-blue-500/50' : 'bg-[#0a0a0f] border-gray-800 hover:border-gray-700'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-bold ${reminders.oneDay ? 'text-blue-400' : 'text-gray-300'}`}>24 Hours Before</span>
                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${reminders.oneDay ? 'bg-blue-500' : 'bg-gray-700'}`}>
                                            <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${reminders.oneDay ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">Get a reminder 1 day before the contest starts.</p>
                                </div>

                                <div
                                    onClick={() => setReminders(p => ({ ...p, twoDays: !p.twoDays }))}
                                    className={`cursor-pointer p-4 rounded-xl border transition-all ${reminders.twoDays ? 'bg-white/10 border-purple-500/50' : 'bg-[#0a0a0f] border-gray-800 hover:border-gray-700'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-bold ${reminders.twoDays ? 'text-purple-400' : 'text-gray-300'}`}>48 Hours Before</span>
                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${reminders.twoDays ? 'bg-purple-500' : 'bg-gray-700'}`}>
                                            <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${reminders.twoDays ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">Get a reminder 2 days before the contest starts.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4">
                    {message && (
                        <span className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {message.text}
                        </span>
                    )}
                    <button
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                        className="ml-auto bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
