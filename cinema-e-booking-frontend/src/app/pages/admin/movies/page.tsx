'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../../../utils/api';

interface Showroom { id: string; name: string }

const AdminMoviesPage: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [genresCsv, setGenresCsv] = useState('');
  const [castCsv, setCastCsv] = useState('');
  const [director, setDirector] = useState('');
  const [producer, setProducer] = useState('');
  const [reviews, setReviews] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [rating, setRating] = useState('PG-13');
  const [duration, setDuration] = useState<number>(100);
  const [releaseDate, setReleaseDate] = useState('');
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [showtimes, setShowtimes] = useState<Array<{ showroom_id: string; start_time: string; end_time: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // fetch showrooms for showtime selection
    apiService.fetchApi<{ showrooms: Showroom[] }>('/api/showrooms')
      .then((data) => setShowrooms(data.showrooms || []))
      .catch(() => {});
    // fetch existing movies for management list
    apiService.getAdminMovies()
      .then((d) => setMovies(d.movies || []))
      .catch(() => {});
  }, []);

  const [movies, setMovies] = useState<any[]>([]);

  const addShowtimeRow = () => {
    setShowtimes([...showtimes, { showroom_id: '', start_time: '', end_time: '' }]);
  };

  const updateShowtime = (idx: number, key: string, value: string) => {
    const copy = [...showtimes];
    // @ts-ignore
    copy[idx][key] = value;
    setShowtimes(copy);
  };

  const removeShowtime = (idx: number) => {
    const copy = [...showtimes];
    copy.splice(idx, 1);
    setShowtimes(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !genresCsv || !castCsv || !director || !producer || !synopsis || !posterUrl || !trailerUrl || !rating) {
      setError('Please fill required fields: title, category, cast, director, producer, synopsis, poster image, trailer video, and rating.');
      return;
    }

    setLoading(true);
    try {
      const moviePayload: any = {
        title,
        synopsis,
        director,
        producer,
        // backend accepts cast as string[] per api types
        cast: castCsv ? castCsv.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        language: 'English',
        rating,
        duration_minutes: duration,
        release_date: releaseDate || undefined,
        poster_url: posterUrl || undefined,
        trailer_url: trailerUrl || undefined,
        reviews: reviews || undefined,
        genres: genresCsv ? genresCsv.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      };

      const res = await apiService.addMovie(moviePayload);
      const createdMovie = res.movie;

      // schedule showtimes (one-by-one)
      for (const s of showtimes) {
        if (!s.showroom_id || !s.start_time || !s.end_time) continue;
        try {
          await apiService.addShowtime({ movie_id: createdMovie.id, showroom_id: s.showroom_id, start_time: s.start_time, end_time: s.end_time });
        } catch (stErr) {
          console.warn('Showtime create failed', stErr);
        }
      }

      setSuccess('Movie created successfully');
      // prepend to list so admin sees it immediately
      setMovies(prev => [createdMovie, ...prev]);
      // reset form
      setTitle(''); setGenresCsv(''); setCastCsv(''); setDirector(''); setProducer(''); setSynopsis(''); setPosterUrl(''); setTrailerUrl(''); setRating('PG-13'); setDuration(100); setReleaseDate(''); setShowtimes([]);
    } catch (err: any) {
      console.error(err);
      // If backend returned validation details, format them for display
      if (err?.details) {
        // err.details may be an object from express-validator (errors.mapped())
        try {
          const details = err.details;
          if (typeof details === 'object') {
            const msgs = Object.values(details).map((d:any) => d.msg || JSON.stringify(d)).join('; ');
            setError(msgs || (err.message || 'Validation failed'));
          } else if (Array.isArray(details)) {
            setError(details.map((d:any)=>d.msg||d).join('; '));
          } else {
            setError(String(details));
          }
        } catch (e) {
          setError(err?.message || 'Failed to create movie');
        }
      } else {
        setError(err?.message || 'Failed to create movie');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex flex-col items-center py-10">
      <div className="mb-6 w-full max-w-5xl px-4">
        <button
          className="mb-6 px-6 py-2 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600 transition"
          onClick={() => router.push('/pages/admin')}
        >
          Back to Admin
        </button>
      </div>

      <div className="glass-card p-6 w-full max-w-5xl mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Manage Movies</h1>
          <div>
            <button className="glass-button mr-2" onClick={() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}>Add Movie</button>
          </div>
        </div>

        <div className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            {movies.length === 0 && (
              <div className="text-center py-6 text-gray-400 col-span-2">No movies found.</div>
            )}
            {movies.map((m) => (
              <div key={m.id} className="bg-black/40 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {m.poster_url ? (
                    <img src={m.poster_url} alt={m.title} className="w-16 h-24 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-24 bg-gray-800 rounded flex items-center justify-center text-sm text-gray-400">No Poster</div>
                  )}
                  <div>
                    <div className="font-semibold text-white">{m.title}</div>
                    <div className="text-sm text-gray-300">{m.genres ? (Array.isArray(m.genres) ? m.genres.join(', ') : (m.Genres || []).map((g:any)=>g.name).join(', ')) : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm" onClick={() => router.push(`/pages/admin/movies/${m.id}`)}>View / Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Add Movie</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="glass-input w-full" />
          </div>

          <div>
            <label className="block font-semibold">Genres (comma separated)</label>
            <input value={genresCsv} onChange={e => setGenresCsv(e.target.value)} className="glass-input w-full" />
          </div>

          <div>
            <label className="block font-semibold">Cast (comma separated)</label>
            <input value={castCsv} onChange={e => setCastCsv(e.target.value)} className="glass-input w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold">Director</label>
              <input value={director} onChange={e => setDirector(e.target.value)} className="glass-input w-full" />
            </div>
            <div>
              <label className="block font-semibold">Producer</label>
              <input value={producer} onChange={e => setProducer(e.target.value)} className="glass-input w-full" />
            </div>
          </div>

          <div>
            <label className="block font-semibold">Synopsis *</label>
            <textarea value={synopsis} onChange={e => setSynopsis(e.target.value)} className="glass-input w-full h-28" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold">MPAA Rating</label>
              <select value={rating} onChange={e => setRating(e.target.value)} className="glass-input w-full">
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
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="glass-input w-full" />
            </div>
            <div>
              <label className="block font-semibold">Release Date</label>
              <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className="glass-input w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold">Poster URL</label>
              <input value={posterUrl} onChange={e => setPosterUrl(e.target.value)} className="glass-input w-full" />
            </div>
            <div>
              <label className="block font-semibold">Trailer URL</label>
              <input value={trailerUrl} onChange={e => setTrailerUrl(e.target.value)} className="glass-input w-full" />
            </div>
          </div>

            <div>
              <label className="block font-semibold">Reviews *</label>
              <textarea value={reviews} onChange={e => setReviews(e.target.value)} className="glass-input w-full h-20" />
            </div>

          <div className="mt-4">
            <h3 className="font-bold mb-2">Showtimes (optional)</h3>
            <div className="space-y-3">
              {showtimes.map((s, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-sm">Showroom</label>
                    <select value={s.showroom_id} onChange={e => updateShowtime(idx, 'showroom_id', e.target.value)} className="glass-input w-full">
                      <option value="">Select showroom</option>
                      {showrooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">Start</label>
                    <input type="datetime-local" value={s.start_time} onChange={e => updateShowtime(idx, 'start_time', e.target.value)} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm">End</label>
                    <input type="datetime-local" value={s.end_time} onChange={e => updateShowtime(idx, 'end_time', e.target.value)} className="glass-input w-full" />
                  </div>
                  <div>
                    <button type="button" className="px-3 py-2 rounded bg-red-700 text-white text-sm hover:bg-red-600" onClick={() => removeShowtime(idx)}>Remove</button>
                  </div>
                </div>
              ))}

              <div>
                <button type="button" className="glass-button" onClick={addShowtimeRow}>Add showtime</button>
              </div>
            </div>
          </div>

          {error && <div className="text-red-400">{error}</div>}
          {success && <div className="text-green-400">{success}</div>}

          <div>
            <button type="submit" className="glass-button w-full py-3" disabled={loading}>{loading ? 'Saving...' : 'Create Movie'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminMoviesPage;
