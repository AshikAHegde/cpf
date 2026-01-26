import React from 'react';

const AuthForm = ({ authMode, setAuthMode, formData, setFormData, handleAuthSubmit, isLoading }) => {
    return (
        <div className="max-w-md mx-auto bg-[#13131f] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
            {/* Auth Tabs */}
            <div className="flex p-1 bg-white/5 rounded-xl mb-8">
                <button
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${authMode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Login
                </button>
                <button
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${authMode === 'signup' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Sign Up
                </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-5">
                {authMode === 'signup' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                        <input
                            required={authMode === 'signup'}
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input
                        required
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                    <input
                        required
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* Phone is usually asked in signup or profile, used for SMS */}
                {authMode === 'signup' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                        <input
                            required={authMode === 'signup'}
                            type="tel"
                            placeholder="+1 234 567 8900"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 mt-4"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        authMode === 'login' ? 'Access Profile' : 'Create Account'
                    )}
                </button>
            </form>
        </div>
    );
};

export default AuthForm;
