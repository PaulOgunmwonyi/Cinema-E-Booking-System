'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // <-- Add this import
import { apiService } from '../../../utils/api';

interface Movie {
  id: number | string;
  title: string;
  duration_minutes: number; // <-- use this instead of runtime
}

interface Showroom {
  id: number | string;
  name: string;
}

interface Show {
  id: number | string;
  movie_id: number | string;
  showroom_id: number | string;
  start_time: string;
  end_time: string;
  is_active?: boolean;
  Movie?: Movie;
  Showroom?: Showroom;
}

const AdminShowtimesPage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedShowroom, setSelectedShowroom] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter(); // <-- Add this line

  // Fetch movies, showrooms, and shows
  useEffect(() => {
    apiService.fetchApi('/api/admin/movies').then((data) => setMovies(data.movies || []));
    apiService.fetchApi('/api/showrooms').then((data) => setShowrooms(data.showrooms || []));
    fetchShows();
  }, []);

  const fetchShows = () => {
    apiService.fetchApi('/api/admin/showtimes').then((data) => setShows(data.shows || []));
  };

  const handleAddShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedMovie || !selectedShowroom || !startTime || !endTime) {
      setError('Please fill out all fields.');
      return;
    }

    try {
      await apiService.fetchApi('/api/admin/showtimes', {
        method: 'POST',
        body: JSON.stringify({
          movie_id: selectedMovie,
          showroom_id: selectedShowroom,
          start_time: startTime,
          end_time: endTime,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      setSuccess('Showtime added successfully!');
      setSelectedMovie('');
      setSelectedShowroom('');
      setStartTime('');
      setEndTime('');
      fetchShows();
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('conflict')) {
        setError('Scheduling conflict: this showroom already has a show at that time.');
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Failed to add showtime.');
      }
    }
  };

  const handleDeleteShowtime = async (showId: number | string) => {
    setError('');
    setSuccess('');
    try {
      await apiService.fetchApi(`/api/admin/showtimes/${showId}`, {
        method: 'DELETE',
      });
      setSuccess('Showtime deleted successfully!');
      fetchShows();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete showtime.');
    }
  };

  // Only update if both a movie and start time are selected
  useEffect(() => {
    const movie = movies.find(m => String(m.id) === String(selectedMovie));
    if (movie && startTime) {
      const start = new Date(startTime);
      if (!isNaN(start.getTime())) {
        const end = new Date(start.getTime() + movie.duration_minutes * 60000);
        // Format as yyyy-MM-ddTHH:mm for datetime-local input
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formatted = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
        setEndTime(formatted);
      }
    }
  }, [selectedMovie, startTime, movies]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex flex-col items-center py-10">
      <button
        className="mb-6 px-6 py-2 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600 transition"
        onClick={() => router.push('/pages/admin')}
      >
        Go Back
      </button>
      <div className="glass-card p-8 w-full max-w-2xl mb-8">
        <h1 className="text-2xl font-bold text-white mb-4">Schedule a Movie Showtime</h1>
        <form onSubmit={handleAddShowtime} className="space-y-4">
          <div>
            <label className="block text-white mb-1">Movie</label>
            <select
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-lg text-white bg-black"
              required
            >
              <option value="">Select a movie</option>
              {movies.map((movie) => (
                <option key={movie.id} value={movie.id}>{movie.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white mb-1">Showroom</label>
            <select
              value={selectedShowroom}
              onChange={(e) => setSelectedShowroom(e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-lg text-white bg-black"
              required
            >
              <option value="">Select a showroom</option>
              {showrooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-lg text-white bg-black"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-1">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-lg text-white bg-black"
              required
              readOnly // <-- Add this
            />
          </div>
          {error && <div className="text-red-400">{error}</div>}
          {success && <div className="text-green-400">{success}</div>}
          <button
            type="submit"
            className="glass-button w-full py-3 rounded-lg font-bold text-white hover:text-gray-200 shadow-lg"
          >
            Add Showtime
          </button>
        </form>
      </div>

      <div className="glass-card p-8 w-full max-w-3xl">
        <h2 className="text-xl font-bold text-white mb-4">Current Showtimes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-white">
            <thead>
              <tr>
                <th className="px-4 py-2">Movie</th>
                <th className="px-4 py-2">Showroom</th>
                <th className="px-4 py-2">Start Time</th>
                <th className="px-4 py-2">End Time</th>
                <th className="px-4 py-2">Actions</th> {/* New column for actions */}
              </tr>
            </thead>
            <tbody>
              {shows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-400">No showtimes scheduled.</td>
                </tr>
              )}
              {shows.map((show) => (
                <tr key={show.id}>
                  <td className="px-4 py-2">{show.Movie?.title || 'N/A'}</td>
                  <td className="px-4 py-2">{show.Showroom?.name || 'N/A'}</td>
                  <td className="px-4 py-2">{new Date(show.start_time).toLocaleString()}</td>
                  <td className="px-4 py-2">{new Date(show.end_time).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <button
                      className="px-3 py-1 bg-red-600 rounded text-white hover:bg-red-700 transition"
                      onClick={() => handleDeleteShowtime(show.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminShowtimesPage;