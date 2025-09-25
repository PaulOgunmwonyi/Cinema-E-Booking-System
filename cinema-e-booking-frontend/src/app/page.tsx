'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiService, Movie as ApiMovie } from './utils/api';

function getShowtimes(shows: ApiMovie['Shows']) {
  // Extract and format up to 3 showtimes for display
  if (!shows || shows.length === 0) return [];
  return shows
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3)
    .map(show =>
      new Date(show.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
}

function TrailerModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black rounded-lg overflow-hidden shadow-lg relative w-full max-w-2xl">
        <button
          className="absolute top-2 right-2 text-white text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={url}
            title="Movie Trailer"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

function MovieGrid({
  movies,
  showRating,
}: {
  movies: ApiMovie[];
  showRating: boolean;
}) {
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="glass-card overflow-hidden group transition-transform duration-200 hover:scale-105"
          >
            <Link href={`/movies/${movie.id}`} className="block cursor-pointer">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover rounded-t-lg transition-transform group-hover:scale-105"
              />
              <h3 className="text-lg font-bold text-uga-white mt-2 hover:underline text-center">
                {movie.title}
              </h3>
            </Link>
            <div className="flex flex-col items-center gap-2 pb-4">
              {showRating ? (
                <span className="bg-uga-red/80 text-uga-white px-3 py-1 rounded-full text-sm font-bold mt-2">
                  {movie.mpaa_rating || 'Not Yet Rated'}
                </span>
              ) : (
                <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-bold mt-2">
                  Not Yet Rated
                </span>
              )}
              {movie.trailer_url && (
                <button
                  className="glass-button px-4 py-2 text-uga-white font-medium rounded hover:scale-105 transition-transform duration-200"
                  onClick={() => setTrailerUrl(movie.trailer_url!)}
                >
                  Watch Trailer
                </button>
              )}
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {getShowtimes(movie.Shows).length > 0 ? (
                  getShowtimes(movie.Shows).map((show, idx) => (
                    <span
                      key={idx}
                      className="bg-uga-white/10 text-uga-white px-2 py-1 rounded text-xs border border-uga-white/20"
                    >
                      {show}
                    </span>
                  ))
                ) : (
                  <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs border border-uga-white/20">
                    Coming Soon
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {trailerUrl && (
        <TrailerModal url={trailerUrl} onClose={() => setTrailerUrl(null)} />
      )}
    </>
  );
}

export default function Home() {
  const [movies, setMovies] = useState<ApiMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getMovies().then((data) => {
      setMovies(data);
      setLoading(false);
    });
  }, []);

  const now = new Date();

  // Now Playing: release_date in the past or today
  const nowPlaying = movies.filter(
    (movie) => new Date(movie.release_date) <= now
  );

  // Coming Soon: release_date in the future
  const comingSoon = movies.filter(
    (movie) => new Date(movie.release_date) > now
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-uga-white">
        Loading movies...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-uga-white mb-8 text-center drop-shadow-lg">
        Welcome to Cinema E-Booking
      </h1>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-uga-white mb-4">Now Playing</h2>
        <MovieGrid movies={nowPlaying} showRating={true} />
      </section>

      <section>
        <h2 className="text-2xl font-bold text-uga-white mb-4">Coming Soon</h2>
        <MovieGrid movies={comingSoon} showRating={false} />
      </section>
    </div>
  );
}
