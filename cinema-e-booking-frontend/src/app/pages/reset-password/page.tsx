'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiService } from '../../utils/api';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Missing reset token. Please use the link from your email.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) return;
  // Enforce password policy: at least 8 characters, includes uppercase, lowercase and number
  const passwordPolicy = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/;
  if (!passwordPolicy.test(password)) return setError('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
  if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const res = await apiService.resetPassword(token, password);
      setMessage(res.message || 'Password reset successful.');
      // redirect to login after a short delay
      setTimeout(() => router.push('/pages/login'), 1500);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-8 rounded-lg glass-card">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        {!token && <p className="text-red-400">Missing reset token. Use the link from your email.</p>}

        <form onSubmit={handleSubmit}>
          <label className="block mb-2">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-transparent border border-white/20 mb-4"
          />

          <label className="block mb-2">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3 py-2 rounded bg-transparent border border-white/20 mb-4"
          />

          <button type="submit" disabled={loading || !token} className="w-full glass-button px-4 py-2 font-bold rounded">
            {loading ? 'Saving…' : 'Set new password'}
          </button>
        </form>

        {message && <p className="mt-4 text-green-400">{message}</p>}
        {error && <p className="mt-4 text-red-400">{error}</p>}

      </div>
    </div>
  );
}
