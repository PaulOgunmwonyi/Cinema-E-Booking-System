'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import SearchResults from '@/app/components/MovieResults';
import { Movie, apiService } from '../../utils/api';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  const date = searchParams.get('date') || '';

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        const allMovies = await apiService.getMovies();
        setMovies(allMovies);
      } catch (err) {
        setError('Failed to load movies. Please make sure the backend is running on http://localhost:5000');
        console.error('Error fetching movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Helper function to extract date from start_time timestamp
  const extractDate = (startTime: string) => {
    if (!startTime) return null;
    try {
      const date = new Date(startTime);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  // Helper function to extract time from start_time timestamp
  const extractTime = (startTime: string) => {
    if (!startTime) return null;
    try {
      const date = new Date(startTime);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error parsing time:', error);
      return null;
    }
  };

  // Filter movies based on search parameters with proper null/undefined checks
  const filteredMovies = movies.filter(movie => {
    // Check if movie title exists and matches query
    const matchesQuery = !query || (movie.title && movie.title.toLowerCase().includes(query.toLowerCase()));
    
    // Check if movie has genres and any genre matches the selected genre
    const matchesGenre = !genre || (
      movie.Genres && 
      Array.isArray(movie.Genres) && 
      movie.Genres.some(g => g && g.name && g.name.toLowerCase() === genre.toLowerCase())
    );
    
    // Check if movie has shows and any show matches the selected date
    const matchesDate = !date || (
      movie.Shows && 
      Array.isArray(movie.Shows) && 
      movie.Shows.some(s => {
        if (!s || !s.start_time) return false;
        const showDate = extractDate(s.start_time);
        return showDate === date;
      })
    );
    
    return matchesQuery && matchesGenre && matchesDate;
  });

  const getSearchSummary = () => {
    const filters = [];
    if (query) filters.push(`"${query}"`);
    if (genre) filters.push(`Genre: ${genre}`);
    if (date) {
      try {
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        filters.push(`Date: ${formattedDate}`);
      } catch (error) {
        filters.push(`Date: ${date}`);
      }
    }
    
    return filters.length > 0 ? filters.join(', ') : 'All movies';
  };

  const handleClearSearch = () => {
    router.push('/pages/searchResults');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uga-red mx-auto mb-4"></div>
          <span className="text-black font-medium">Loading movies...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error loading movies</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="glass-button px-6 py-2 text-black font-medium rounded-lg hover:scale-105 transition-transform duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (filteredMovies.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-4 drop-shadow-lg">Search Results</h1>
          <div className="glass-card p-4">
            <p className="text-black/90">
              <span className="font-semibold">Search filters:</span> {getSearchSummary()}
            </p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="glass-card p-12">
            <h3 className="text-2xl font-bold text-black mb-4">No movies found</h3>
            <p className="text-black/80 mb-6">
              {query || genre || date
                ? 'No movies match your search criteria. Try adjusting your filters.' 
                : 'No movies are currently available.'}
            </p>
            <button 
              onClick={handleClearSearch}
              className="glass-button px-6 py-2 text-black font-medium rounded-lg hover:scale-105 transition-transform duration-300"
            >
              Clear Search
            </button>
          </div>
        </div>
      </div>
    );
  }

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
