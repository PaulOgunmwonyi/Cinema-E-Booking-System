'use client';
import { useState, useRef } from 'react';
import { Movie } from '../utils/api';
import BookingModal from './BookingModal';

interface SearchResultsProps {
  movies: Movie[];
  selectedDate?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ movies, selectedDate }) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const bookingButtonRef = useRef<HTMLButtonElement>(null);

  const formatDate = (dateString: string | null | undefined) => {
    // Handle null, undefined, or empty string
    if (!dateString || typeof dateString !== 'string') {
      return 'Date unavailable';
    }

    try {
      // Split the date string and create date with local timezone to avoid UTC offset issues
      const [year, month, day] = dateString.split('-').map(Number);
      
      // Validate that we have valid numbers
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return 'Invalid date';
      }

      const date = new Date(year, month - 1, day); // month is 0-indexed
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'dateString:', dateString);
      return 'Date unavailable';
    }
  };

  const handleBookTicketsClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsBookingModalOpen(true);
  };

  // Get unique dates from shows, filtering out invalid dates
  const getUniqueDates = (shows: any[]) => {
    if (!shows || !Array.isArray(shows)) return [];
    
    const uniqueDates = new Set();
    const validShows = shows.filter(show => show && show.show_date);
    
    validShows.forEach(show => {
      uniqueDates.add(show.show_date);
    });
    
    return Array.from(uniqueDates) as string[];
  };

  // Filter shows for selected date
  const getShowsForDate = (shows: any[], date: string) => {
    if (!shows || !Array.isArray(shows) || !date) return [];
    
    return shows.filter(show => show && show.show_date === date && show.show_time);
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
      {movies.map((movie) => {
        // Safely access movie properties
        const movieShows = movie.Shows || [];
        const movieGenres = movie.Genres || [];
        const genreName = Array.isArray(movieGenres) ? movieGenres[0]?.name : movieGenres?.name || 'Unknown';

        return (
          <div key={movie.id} className="glass-card overflow-hidden hover:scale-[1.02] transition-transform duration-300">
            <div className="flex flex-col sm:flex-row">
              {/* Movie Poster */}
              <div className="w-full sm:w-32 h-48 sm:h-48 bg-gradient-to-br from-uga-red/20 to-uga-black/40 relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <span className="bg-uga-red/80 text-uga-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm border border-uga-white/20">
                    ★ {movie.rating || 'NR'}
                  </span>
                </div>
              </div>
              
              {/* Movie Details */}
              <div className="flex-1 p-6">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-black mb-1 line-clamp-2">
                        {movie.title || 'Untitled Movie'}
                      </h3>
                      <span className="bg-uga-red/60 text-black px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-black/30 ml-2 flex-shrink-0">
                        {genreName}
                      </span>
                    </div>
                    
                    <p className="text-black/80 text-xs mb-3 line-clamp-2">
                      {movie.description || 'No description available'}
                    </p>
                    
                    {/* Show Dates or Show Times */}
                    <div className="mb-3">
                      {!selectedDate ? (
                        <div>
                          <h4 className="text-xs font-semibold text-black mb-1">Available Dates:</h4>
                          <div className="flex flex-wrap gap-1">
                            {getUniqueDates(movieShows).slice(0, 4).map((date, index) => (
                              <span 
                                key={index}
                                className="bg-uga-red/20 text-black px-2 py-1 rounded-full text-xs border border-uga-red/30"
                              >
                                {formatDate(date)}
                              </span>
                            ))}
                            {getUniqueDates(movieShows).length === 0 && (
                              <span className="text-xs text-black/60">No showtimes available</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-semibold text-black mb-1">
                            Show Times for {formatDate(selectedDate)}:
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {getShowsForDate(movieShows, selectedDate).slice(0, 4).map((show, index) => (
                              <span 
                                key={index}
                                className="bg-uga-red/20 text-black px-2 py-1 rounded-full text-xs border border-uga-red/30"
                              >
                                {show.show_time || 'Time TBA'}
                              </span>
                            ))}
                            {getShowsForDate(movieShows, selectedDate).length === 0 && (
                              <span className="text-xs text-black/60">No shows for this date</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Book Tickets Button */}
                  <div className="flex justify-end">
                    <button 
                      ref={bookingButtonRef}
                      onClick={() => handleBookTicketsClick(movie)}
                      className="glass-button px-4 py-1 text-black font-medium text-sm rounded-lg hover:scale-105 transition-transform duration-300 border border-black/30"
                      disabled={movieShows.length === 0}
                    >
                      {movieShows.length === 0 ? 'No Shows' : 'Book Tickets'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Booking Modal */}
      {selectedMovie && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          movie={selectedMovie}
          selectedDate={selectedDate}
          triggerElement={bookingButtonRef.current}
        />
      )}
    </div>
  );
};

export default SearchResults;
