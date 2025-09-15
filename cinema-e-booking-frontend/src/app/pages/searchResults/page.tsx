'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { mockMovies } from '@/app/data/mockData';
import SearchResults from '@/app/components/MovieResults';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  const date = searchParams.get('date') || '';

  // Filter movies based on search parameters
  const filteredMovies = mockMovies.filter(movie => {
    const matchesQuery = !query || movie.title.toLowerCase().includes(query.toLowerCase());
    const matchesGenre = !genre || movie.genre.toLowerCase() === genre.toLowerCase();
    const matchesDate = !date || movie.showDates.includes(date);
    
    return matchesQuery && matchesGenre && matchesDate;
  });

  const getSearchSummary = () => {
    const filters = [];
    if (query) filters.push(`"${query}"`);
    if (genre) filters.push(`Genre: ${genre}`);
    if (date) filters.push(`Date: ${date}`);
    
    return filters.length > 0 ? filters.join(', ') : 'All movies';
  };

  const handleClearSearch = () => {
    router.push('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black mb-4 drop-shadow-lg">Search Results</h1>
        <div className="glass-card p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-black/90">
                <span className="font-semibold">Search filters:</span> {getSearchSummary()}
              </p>
              <p className="text-black/80 mt-2">
                Found {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button 
              onClick={handleClearSearch}
              className="glass-button px-4 py-2 text-black font-medium rounded-lg hover:scale-105 transition-transform duration-300"
            >
              Clear Search
            </button>
          </div>
        </div>
      </div>

      <SearchResults movies={filteredMovies} selectedDate={date} />
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
