'use client';
import { Movie } from '@/app/data/mockData';

interface SearchResultsProps {
  movies: Movie[];
  selectedDate?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ movies, selectedDate }) => {
  const formatDate = (dateString: string) => {
    // Split the date string and create date with local timezone to avoid UTC offset issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="glass-card p-12">
          <h3 className="text-2xl font-bold text-black mb-4">No movies found</h3>
          <p className="text-black/80 mb-6">
            Try adjusting your search criteria or browse all available movies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {movies.map((movie) => (
        <div key={movie.id} className="glass-card overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <div className="flex flex-col sm:flex-row">
            {/* Movie Poster */}
            <div className="w-full sm:w-32 h-48 sm:h-48 bg-gradient-to-br from-uga-red/20 to-uga-black/40 relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <span className="bg-uga-red/80 text-uga-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm border border-uga-white/20">
                  ★ {movie.rating}
                </span>
              </div>
            </div>
            
            {/* Movie Details */}
            <div className="flex-1 p-6">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-black mb-1 line-clamp-2">
                      {movie.title}
                    </h3>
                    <span className="bg-uga-red/60 text-uga-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-uga-white/20 ml-2 flex-shrink-0">
                      {movie.genre}
                    </span>
                  </div>
                  
                  <p className="text-black/80 text-xs mb-3 line-clamp-2">
                    {movie.description}
                  </p>
                  
                  {/* Show Dates or Show Times */}
                  <div className="mb-3">
                    {!selectedDate ? (
                      <div>
                        <h4 className="text-xs font-semibold text-black mb-1">Available Dates:</h4>
                        <div className="flex flex-wrap gap-1">
                          {movie.showDates.slice(0, 3).map((date, index) => (
                            <span 
                              key={index}
                              className="bg-black/10 text-black px-2 py-1 rounded-full text-xs border border-black/20"
                            >
                              {formatDate(date)}
                            </span>
                          ))}
                          {movie.showDates.length > 3 && (
                            <span className="text-black/60 text-xs px-1 py-1">
                              +{movie.showDates.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-xs font-semibold text-black mb-1">
                          Show Times for {formatDate(selectedDate)}:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {movie.showTimes.slice(0, 4).map((time, index) => (
                            <span 
                              key={index}
                              className="bg-uga-red/20 text-black px-2 py-1 rounded-full text-xs border border-uga-red/30"
                            >
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Book Tickets Button */}
                <div className="flex justify-end">
                  <button className="glass-button px-4 py-1 text-black font-medium text-sm rounded-lg hover:scale-105 transition-transform duration-300">
                    Book Tickets
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
