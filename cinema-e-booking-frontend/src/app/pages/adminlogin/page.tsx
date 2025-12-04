"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '../../utils/api';
import { useUser } from '../../contexts/UserContext';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.adminLogin({ email, password });

      // Persist tokens to localStorage so app-wide auth works
      if (typeof window !== 'undefined') {
        const tokens = { accessToken: res.accessToken, refreshToken: res.refreshToken };
        localStorage.setItem('cinema_tokens', JSON.stringify(tokens));
      }

      // Fetch profile now that tokens are available and update UserContext
      try {
        const profile = await apiService.getProfile();
        const u = profile.user;
        const userData = {
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          is_admin: true,
        };
        login(userData, { accessToken: res.accessToken, refreshToken: res.refreshToken });
      } catch (profileErr) {
        console.warn('Admin logged in but failed to fetch profile:', profileErr);
        // still proceed to admin area; tokens are saved
      }

      router.push('/pages/admin');
    } catch (err: any) {
      setError(err?.message || 'Admin login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="absolute top-20 left-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="glass-card p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-white/70">Sign in to manage Cinema E-Booking as an administrator</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-white font-medium mb-2">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${error && !email ? 'border-red-500' : ''}`}
                  placeholder="admin@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="password" className="block text-white font-medium mb-2">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${error && !password ? 'border-red-500' : ''}`}
                  placeholder="Admin password"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 glass-button py-3 rounded-lg font-bold text-white hover:text-gray-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in as Admin'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 px-4 py-3 rounded-lg border border-white/30 text-white hover:bg-white/10"
              >
                Back to Home
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;