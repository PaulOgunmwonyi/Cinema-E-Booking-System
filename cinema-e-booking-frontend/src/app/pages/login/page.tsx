"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { apiService } from '../../utils/api';
import { useUser } from '../../contexts/UserContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { login } = useUser();
  const searchParams = useSearchParams();
  const [showRegisteredBanner, setShowRegisteredBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowRegisteredBanner(true);
      // Remove the query param so the banner only appears once — clearing it
      // prevents the message from reappearing on refresh.
      try {
        router.replace('/pages/login');
      } catch (e) {
        // ignore routing errors
      }

      setTimeout(() => setShowRegisteredBanner(false), 5000);
    }
  }, [searchParams, router]);

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
      const res = await apiService.loginUser({ email, password });
      const tokens = { accessToken: res.accessToken, refreshToken: res.refreshToken };
      const user = { id: '', email, firstName: '', lastName: '', role: res.role };
      login(user, tokens);
      
      // Check for redirect parameter
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        // Redirect back to the original path
        router.push(redirectTo);
      } else {
        // Default redirect to home with success flag
        router.push('/?login=success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 relative overflow-hidden">
      {/* Background Effects (same as signup) */}
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="absolute top-20 left-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="glass-card p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-white/70">Sign in to continue booking tickets with Cinema E-Booking</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {showRegisteredBanner && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4">
                <p className="text-green-400 text-center">Registration complete — please log in.</p>
              </div>
            )}
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
                  placeholder="you@example.com"
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
                  placeholder="Your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div />
              <a href="/pages/forgot-password" className="text-white/70 hover:underline">Forgot password?</a>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 glass-button py-3 rounded-lg font-bold text-white hover:text-gray-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const redirectTo = searchParams.get('redirect');
                  const signupPath = redirectTo ? `/pages/signup?redirect=${encodeURIComponent(redirectTo)}` : '/pages/signup';
                  router.push(signupPath);
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-white/30 text-white hover:bg-white/10"
              >
                Create account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
