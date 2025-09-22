'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

const movies = [
  {
    id: 1,
    title: "The Dark Knight",
    poster: "/api/placeholder/300/450",
    rating: 9.0,
    trailerUrl: "https://www.youtube.com/embed/EXeTwQWrcwY",
    showtimes: ["2:00 PM", "5:00 PM", "8:00 PM"],
    description: "Batman faces his greatest challenge yet as the Joker wreaks havoc on Gotham City."
  },
  {
    id: 2,
    title: "Inception",
    poster: "/api/placeholder/300/450",
    rating: 8.8,
    trailerUrl: "https://www.youtube.com/embed/YoHD9XEInc0",
    showtimes: ["1:30 PM", "4:30 PM", "7:30 PM"],
    description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea."
  },
  {
    id: 3,
    title: "The Shawshank Redemption",
    poster: "/api/placeholder/300/450",
    rating: 9.3,
    trailerUrl: "https://www.youtube.com/embed/6hB3S9bIaco",
    showtimes: ["12:00 PM", "3:00 PM", "6:00 PM"],
    description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency."
  },
  {
    id: 4,
    title: "Pulp Fiction",
    poster: "/api/placeholder/300/450",
    rating: 8.9,
    trailerUrl: "https://www.youtube.com/embed/s7EdQ4FqbhY",
    showtimes: ["2:15 PM", "5:15 PM", "8:15 PM"],
    description: "The lives of two mob hitmen, a boxer, a gangster's wife, and a pair of diner bandits intertwine in four tales of violence and redemption."
  },
  {
    id: 5,
    title: "Spider-Man: Across the Spider-Verse",
    poster: "/api/placeholder/300/450",
    rating: 8.7,
    trailerUrl: "https://www.youtube.com/embed/cqGjhVJWtEg",
    showtimes: ["1:00 PM", "4:00 PM", "7:00 PM"],
    description: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence."
  },
  {
    id: 6,
    title: "Inside Out 2",
    poster: "/api/placeholder/300/450",
    rating: 8.1,
    trailerUrl: "https://www.youtube.com/embed/LEjhY15eCx0",
    showtimes: ["12:30 PM", "3:30 PM", "6:30 PM"],
    description: "Joy, Sadness, Anger, Fear and Disgust return as Riley enters her teenage years, facing new emotions and challenges."
  },
  {
    id: 7,
    title: "Oppenheimer",
    poster: "/api/placeholder/300/450",
    rating: 8.6,
    trailerUrl: "https://www.youtube.com/embed/uYPbbksJxIg",
    showtimes: ["2:45 PM", "5:45 PM", "8:45 PM"],
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb."
  },
  {
    id: 8,
    title: "Barbie",
    poster: "/api/placeholder/300/450",
    rating: 7.5,
    trailerUrl: "https://www.youtube.com/embed/pBk4NYhWNMM",
    showtimes: ["1:15 PM", "4:15 PM", "7:15 PM"],
    description: "Barbie suffers a crisis that leads her to question her world and her existence."
  }
];

const comingSoon = [
  {
    id: 9,
    title: "Dune: Part Two",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w",
    showtimes: ["Coming Soon"],
    description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family."
  },
  {
    id: 10,
    title: "Avatar 3",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/a8Gx8wiNbs8",
    showtimes: ["Coming Soon"],
    description: "The next chapter in James Cameron's Avatar saga, continuing the story of Pandora and its inhabitants."
  },
  {
    id: 11,
    title: "Deadpool 3",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/7TavVZMewpY",
    showtimes: ["Coming Soon"],
    description: "Wade Wilson returns as Deadpool in this highly anticipated third installment."
  },
  {
    id: 12,
    title: "Fantastic Four",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/AAgnQdiZFsQ",
    showtimes: ["Coming Soon"],
    description: "Marvel's first family of superheroes returns to the big screen in a new adventure."
  },
  {
    id: 13,
    title: "Mission: Impossible – Dead Reckoning Part Two",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/avz06PDqDbM",
    showtimes: ["Coming Soon"],
    description: "Ethan Hunt and his IMF team return for another high-stakes mission."
  },
  {
    id: 14,
    title: "The Marvels",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/wS_qbDztgVY",
    showtimes: ["Coming Soon"],
    description: "Carol Danvers, Kamala Khan, and Monica Rambeau team up in this cosmic Marvel adventure."
  },
  {
    id: 15,
    title: "Gladiator 2",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/owK1qxDselE",
    showtimes: ["Coming Soon"],
    description: "A sequel to the Oscar-winning epic, Gladiator."
  },
  {
    id: 16,
    title: "Kung Fu Panda 4",
    poster: "/api/placeholder/300/450",
    trailerUrl: "https://www.youtube.com/embed/_inKs4eeHiI",
    showtimes: ["Coming Soon"],
    description: "Po returns for more kung fu adventures in this fourth installment."
  }
];

export default function MovieDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const movieId = Number(params.id);

  // Search both arrays for the movie
  const movie = useMemo(
    () =>
      movies.find((m) => m.id === movieId) ||
      comingSoon.find((m) => m.id === movieId),
    [movieId]
  );

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
          src={movie.poster}
          alt={movie.title}
          className="w-64 h-auto rounded-lg shadow-lg"
        />
        <div>
          <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
          <div className="mb-2">
            {movie.rating !== undefined ? (
              <span className="bg-uga-red/80 text-uga-white px-3 py-1 rounded-full text-sm font-bold">
                ★ {movie.rating}
              </span>
            ) : (
              <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                Not Yet Rated
              </span>
            )}
          </div>
          <p className="mb-4">{movie.description}</p>
          <div className="mb-4">
            <h3 className="font-semibold mb-1">Showtimes:</h3>
            <div className="flex flex-wrap gap-2">
              {movie.showtimes?.map((show, idx) => (
                <span
                  key={idx}
                  className="bg-uga-white/10 text-uga-white px-2 py-1 rounded text-xs border border-uga-white/20"
                >
                  {show}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Trailer:</h3>
            <div className="aspect-video w-full max-w-xl">
              <iframe
                width="100%"
                height="100%"
                src={movie.trailerUrl}
                title="Movie Trailer"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}