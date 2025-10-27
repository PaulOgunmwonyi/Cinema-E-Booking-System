'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../../utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await apiService.forgotPassword(email.trim());
      setMessage(res.message || 'If this email exists, a reset link will be sent.');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-8 rounded-lg glass-card">
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
        <p className="mb-4 text-sm text-white/70">Enter the email address associated with your account. We'll send a link to reset your password.</p>

        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-transparent border border-white/20 mb-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button px-4 py-2 font-bold rounded"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        {message && <p className="mt-4 text-green-400">{message}</p>}
        {error && <p className="mt-4 text-red-400">{error}</p>}

        <div className="mt-6 text-sm text-white/70">
          <a className="hover:underline cursor-pointer" onClick={() => router.push('/pages/login')}>Back to login</a>
        </div>
      </div>
    </div>
  );
}
