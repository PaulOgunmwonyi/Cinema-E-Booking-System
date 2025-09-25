'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, Movie } from '../../utils/api';

export default function MovieDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getMovie(params.id)
      .then((data) => {
        setMovie(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-uga-white">
        Loading movie details...
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-8 text-uga-white">
        <h2 className="text-2xl font-bold mb-4">Movie not found</h2>
        <button
          className="glass-button px-4 py-2 rounded"
          onClick={() => router.push('/')}
        >
          Back to Movies
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-uga-white">
      <button
        className="glass-button px-4 py-2 rounded mb-6"
        onClick={() => router.push('/')}
      >
        Back to Movies
      </button>
      <div className="flex flex-col md:flex-row gap-8">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-64 h-auto rounded-lg shadow-lg"
        />
        <div>
          <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
          <div className="mb-2">
            {movie.mpaa_rating ? (
              <span className="bg-uga-red/80 text-uga-white px-3 py-1 rounded-full text-sm font-bold">
                {movie.mpaa_rating}
              </span>
            ) : (
              <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                Not Yet Rated
              </span>
            )}
          </div>
          <p className="mb-4">{movie.synopsis}</p>
          <div className="mb-4">
            <h3 className="font-semibold mb-1">Showtimes:</h3>
            <div className="flex flex-wrap gap-2">
              {movie.Shows && movie.Shows.length > 0 ? (
                movie.Shows.map((show, idx) => (
                  <span
                    key={idx}
                    className="bg-uga-white/10 text-uga-white px-2 py-1 rounded text-xs border border-uga-white/20"
                  >
                    {new Date(show.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ))
              ) : (
                <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs border border-uga-white/20">
                  Coming Soon
                </span>
              )}
            </div>
          </div>
          {movie.trailer_url && (
            <div>
              <h3 className="font-semibold mb-1">Trailer:</h3>
              <div className="aspect-video w-full max-w-xl">
                <iframe
                  width="100%"
                  height="100%"
                  src={movie.trailer_url}
                  title="Movie Trailer"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}