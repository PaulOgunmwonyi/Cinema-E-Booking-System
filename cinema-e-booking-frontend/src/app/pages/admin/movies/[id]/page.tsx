'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiService } from '../../../../utils/api';

const AdminEditMoviePage: React.FC = () => {
  const params = useParams();
  const id = (params as any)?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [movie, setMovie] = useState<any>(null);

  useEffect(() => {
    apiService.getMovie(id).then((m) => {
      setMovie(m);
      setLoading(false);
    }).catch((e) => {
      console.error(e);
      setError('Failed to load movie');
      setLoading(false);
    });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // send PUT to admin update endpoint
      await apiService.fetchApi(`/api/admin/movies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(movie),
        headers: { 'Content-Type': 'application/json' }
      }, true);
      setSuccess('Movie updated');
      setTimeout(() => router.push('/pages/admin/movies'), 900);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to update movie');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900"><div className="glass-card p-6 text-white">Loading...</div></div>;

  if (!movie) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900"><div className="glass-card p-6 text-white">Movie not found</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex flex-col items-center py-10">
      <div className="mb-6 w-full max-w-4xl px-4">
        <div className="flex items-center justify-between">
          <button className="mb-6 px-6 py-2 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600 transition" onClick={() => router.push('/pages/admin/movies')}>Back to Movies</button>
          <div>
            <button className="px-4 py-2 mr-2 bg-yellow-600 text-white rounded hover:bg-yellow-500" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy Link</button>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 w-full max-w-3xl mb-8">
        <h1 className="text-2xl font-bold mb-4">Edit Movie</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block font-semibold">Title *</label>
            <input value={movie.title || ''} onChange={e => setMovie({ ...movie, title: e.target.value })} className="glass-input w-full" />
          </div>

          <div>
            <label className="block font-semibold">Synopsis *</label>
            <textarea value={movie.synopsis || ''} onChange={e => setMovie({ ...movie, synopsis: e.target.value })} className="glass-input w-full h-28" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold">Director</label>
              <input value={movie.director || ''} onChange={e => setMovie({ ...movie, director: e.target.value })} className="glass-input w-full" />
            </div>
            <div>
              <label className="block font-semibold">Producer</label>
              <input value={movie.producer || ''} onChange={e => setMovie({ ...movie, producer: e.target.value })} className="glass-input w-full" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold">MPAA Rating</label>
              <select value={movie.rating || movie.mpaa_rating || 'PG-13'} onChange={e => setMovie({ ...movie, rating: e.target.value })} className="glass-input w-full">
                <option value="G">G</option>
                <option value="PG">PG</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R</option>
                <option value="NC-17">NC-17</option>
                <option value="Unrated">Unrated</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold">Duration (minutes)</label>
              <input type="number" value={movie.duration_minutes || movie.duration || 0} onChange={e => setMovie({ ...movie, duration_minutes: Number(e.target.value) })} className="glass-input w-full" />
            </div>
            <div>
              <label className="block font-semibold">Release Date</label>
              <input type="date" value={movie.release_date ? movie.release_date.split('T')[0] : ''} onChange={e => setMovie({ ...movie, release_date: e.target.value })} className="glass-input w-full" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="glass-button flex-1 py-3">Save Changes</button>
            <button type="button" className="px-4 py-3 bg-gray-700 text-white rounded" onClick={() => router.push('/pages/admin/movies')}>Cancel</button>
          </div>
          {error && <div className="text-red-400">{error}</div>}
          {success && <div className="text-green-400">{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default AdminEditMoviePage;
