'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiService, Movie as ApiMovie } from './utils/api';

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
  comingSoon = false,
}: {
  movies: ApiMovie[];
  showRating: boolean;
  comingSoon?: boolean;
}) {
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [hoveredMovieId, setHoveredMovieId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="glass-card overflow-hidden group transition-transform duration-200 hover:scale-105"
          >
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full aspect-[2/3] object-cover rounded-t-lg transition-transform group-hover:scale-105"
            />
            <h3 className="text-lg font-bold text-uga-white mt-2 text-center">
              {movie.title}
            </h3>
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
              {comingSoon ? (
                <Link
                  href={`/movies/${movie.id}`}
                  className="mt-2 bg-gray-700 text-white font-bold px-4 py-2 rounded hover:scale-105 transition-transform duration-200 text-center"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredMovieId(movie.id)}
                  onMouseLeave={() => setHoveredMovieId(null)}
                >
                  {hoveredMovieId === movie.id ? 'More Info' : 'Coming Soon'}
                </Link>
              ) : (
                <Link
                  href={`/movies/${movie.id}`}
                  className="mt-2 bg-black text-white font-bold px-4 py-2 rounded hover:scale-105 transition-transform duration-200 text-center"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                >
                  Tickets &amp; More Info
                </Link>
              )}
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showProfileUpdated, setShowProfileUpdated] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check if user was redirected from successful registration
    if (searchParams.get('registered') === 'true') {
      setShowSuccess(true);
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }

    if (searchParams.get('profileUpdated') === 'true') {
      setShowProfileUpdated(true);
      setTimeout(() => setShowProfileUpdated(false), 5000);
    }

    if (searchParams.get('login') === 'success') {
      setShowLoginSuccess(true);
      // Clear the query param so refreshing won't re-show the banner
      try {
        router.replace('/');
      } catch (e) {
        // ignore routing errors
      }
      setTimeout(() => setShowLoginSuccess(false), 5000);
    }

    // Show logout banner only when logout was initiated in this session
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('showLogoutBanner') === '1') {
        setShowLogoutSuccess(true);
        setTimeout(() => setShowLogoutSuccess(false), 5000);
        sessionStorage.removeItem('showLogoutBanner');
      }
    } catch (err) {
      // ignore sessionStorage errors
    }

    apiService.getMovies().then((data) => {
      setMovies(data);
      setLoading(false);
    });
  }, [searchParams, router]);

  // Now Playing: has at least one showtime
  const nowPlaying = movies.filter(
    (movie) => Array.isArray(movie.Shows) && movie.Shows.length > 0
  );

  // Coming Soon: has no showtimes
  const comingSoon = movies.filter(
    (movie) => !Array.isArray(movie.Shows) || movie.Shows.length === 0
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

      {showSuccess && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
          <p className="text-green-400 text-center">
            🎉 Welcome! Your account has been successfully created and verified. You can now book tickets!
          </p>
        </div>
      )}

      {showLoginSuccess && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
          <p className="text-green-400 text-center">✅ Successfully signed in.</p>
        </div>
      )}

      {showLogoutSuccess && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
          <p className="text-red-400 text-center">You have been logged out.</p>
        </div>
      )}

      {showProfileUpdated && (
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
          <p className="text-blue-400 text-center">
            Your profile changes have been saved!
          </p>
        </div>
      )}

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-uga-white mb-4">Now Playing</h2>
        <MovieGrid movies={nowPlaying} showRating={true} />
      </section>

      <section>
        <h2 className="text-2xl font-bold text-uga-white mb-4">Coming Soon</h2>
        <MovieGrid movies={comingSoon} showRating={false} comingSoon={true} />
      </section>
    </div>
  );
}
