'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Movie } from '@/app/data/mockData';
import { mockMovies } from '@/app/data/mockData';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  const date = searchParams.get('date') || '';

  // Filter movies based on search parameters
  const filteredMovies = mockMovies.filter(movie => {
    const matchesQuery = !query || movie.title.toLowerCase().includes(query.toLowerCase());
    const matchesGenre = !genre || movie.genre.toLowerCase() === genre.toLowerCase();
    const matchesDate = !date || movie.releaseDate.includes(date);
    
    return matchesQuery && matchesGenre && matchesDate;
  });

  const getSearchSummary = () => {
    const filters = [];
    if (query) filters.push(`"${query}"`);
    if (genre) filters.push(`Genre: ${genre}`);
    if (date) filters.push(`Date: ${date}`);
    
    return filters.length > 0 ? filters.join(', ') : 'All movies';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-uga-white mb-4 drop-shadow-lg">Search Results</h1>
        <div className="glass-card p-4">
          <p className="text-uga-white/90">
            <span className="font-semibold">Search filters:</span> {getSearchSummary()}
          </p>
          <p className="text-uga-white/80 mt-2">
            Found {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {filteredMovies.length === 0 ? (
        <div className="text-center py-12">
          <div className="glass-card p-12">
            <h3 className="text-2xl font-bold text-uga-white mb-4">No movies found</h3>
            <p className="text-uga-white/80 mb-6">
              Try adjusting your search criteria or browse all available movies.
            </p>
            <button 
              onClick={() => window.history.back()}
              className="glass-button px-6 py-3 text-uga-white font-medium rounded-full hover:scale-105 transition-transform duration-300"
            >
              Go Back
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredMovies.map((movie) => (
            <div key={movie.id} className="glass-card overflow-hidden hover:scale-105 transition-transform duration-300 group">
              <div className="aspect-[2/3] bg-gradient-to-br from-uga-red/20 to-uga-black/40 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <span className="bg-uga-red/80 text-uga-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm border border-uga-white/20">
                    ★ {movie.rating}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-uga-white mb-2 line-clamp-2 drop-shadow-sm">
                  {movie.title}
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-uga-red/60 text-uga-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-uga-white/20">
                    {movie.genre}
                  </span>
                  <span className="text-uga-white/70 text-sm">
                    {new Date(movie.releaseDate).getFullYear()}
                  </span>
                </div>
                <p className="text-uga-white/80 text-sm mb-4 line-clamp-3">
                  {movie.description}
                </p>
                <button className="w-full glass-button py-2 text-uga-white font-medium rounded-lg hover:scale-105 transition-transform duration-300">
                  Book Tickets
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-uga-white/20 rounded w-1/4 mb-4 backdrop-blur-sm"></div>
          <div className="h-4 bg-uga-white/20 rounded w-1/2 mb-8 backdrop-blur-sm"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <div className="aspect-[2/3] bg-uga-white/10"></div>
                <div className="p-6">
                  <div className="h-4 bg-uga-white/20 rounded mb-2"></div>
                  <div className="h-3 bg-uga-white/20 rounded w-2/3 mb-4"></div>
                  <div className="h-8 bg-uga-white/20 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
