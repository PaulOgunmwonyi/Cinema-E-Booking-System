'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Movie {
  id: number;
  title: string;
  poster: string;
  rating?: number;
  trailerUrl: string;
  comingSoon?: boolean;
}

const nowPlaying: Movie[] = [
  {
    id: 1,
    title: "The Dark Knight",
    poster: "/api/placeholder/300/450",
    rating: 9.0,
    trailerUrl: "https://www.youtube.com/embed/EXeTwQWrcwY"
  },
  {
    id: 2,
    title: "Inception",
    poster: "/api/placeholder/300/450",
    rating: 8.8,
    trailerUrl: "https://www.youtube.com/embed/YoHD9XEInc0"
  },
  {
    id: 3,
    title: "The Shawshank Redemption",
    poster: "/api/placeholder/300/450",
    rating: 9.3,
    trailerUrl: "https://www.youtube.com/embed/6hB3S9bIaco"
  },
  {
    id: 4,
    title: "Pulp Fiction",
    poster: "/api/placeholder/300/450",
    rating: 8.9,
    trailerUrl: "https://www.youtube.com/embed/s7EdQ4FqbhY"
  },
  {
    id: 5,
    title: "Spider-Man: Across the Spider-Verse",
    poster: "/api/placeholder/300/450",
    rating: 8.7,
    trailerUrl: "https://www.youtube.com/embed/cqGjhVJWtEg"
  },
  {
    id: 6,
    title: "Inside Out 2",
    poster: "/api/placeholder/300/450",
    rating: 8.1,
    trailerUrl: "https://www.youtube.com/embed/LEjhY15eCx0"
  },
  {
    id: 7,
    title: "Oppenheimer",
    poster: "/api/placeholder/300/450",
    rating: 8.6,
    trailerUrl: "https://www.youtube.com/embed/uYPbbksJxIg"
  },
  {
    id: 8,
    title: "Barbie",
    poster: "/api/placeholder/300/450",
    rating: 7.5,
    trailerUrl: "https://www.youtube.com/embed/pBk4NYhWNMM"
  }
];

const comingSoon: Movie[] = [
  {
    id: 9,
    title: "Dune: Part Two",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w"
  },
  {
    id: 10,
    title: "Avatar 3",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/a8Gx8wiNbs8"
  },
  {
    id: 11,
    title: "Deadpool 3",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/7TavVZMewpY"
  },
  {
    id: 12,
    title: "Fantastic Four",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/AAgnQdiZFsQ"
  },
  {
    id: 13,
    title: "Mission: Impossible – Dead Reckoning Part Two",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/avz06PDqDbM"
  },
  {
    id: 14,
    title: "The Marvels",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/wS_qbDztgVY"
  },
  {
    id: 15,
    title: "Gladiator 2",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/owK1qxDselE"
  },
  {
    id: 16,
    title: "Kung Fu Panda 4",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/_inKs4eeHiI"
  }
];

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

function MovieGrid({ movies, showRating }: { movies: Movie[]; showRating: boolean }) {
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {movies.map(movie => (
          <div
            key={movie.id}
            className="glass-card overflow-hidden group transition-transform duration-200 hover:scale-105"
          >
            <Link href={`/movies/${movie.id}`} className="block cursor-pointer">
              <img
                src={movie.poster}
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
                  ★ {movie.rating}
                </span>
              ) : (
                <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-bold mt-2">
                  Not Yet Rated
                </span>
              )}
              <button
                className="glass-button px-4 py-2 text-uga-white font-medium rounded hover:scale-105 transition-transform duration-200"
                onClick={() => setTrailerUrl(movie.trailerUrl)}
              >
                Watch Trailer
              </button>
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
