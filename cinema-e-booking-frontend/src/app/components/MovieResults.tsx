'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Show, Movie, Genre } from '../utils/api';
import BookingModal from './BookingModal';

interface SearchResultsProps {
  movies: Movie[];
  selectedDate?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ movies, selectedDate }) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const bookingButtonRef = useRef<HTMLButtonElement>(null);

  // Helper function to get rating display styles based on MPAA rating
  const getRatingStyles = (rating: string) => {
    const upperRating = rating?.toUpperCase() || 'NR';
    switch (upperRating) {
      case 'G':
        return 'bg-green-600/80 text-white border-green-400/30';
      case 'PG':
        return 'bg-blue-600/80 text-white border-blue-400/30';
      case 'PG-13':
        return 'bg-yellow-600/80 text-white border-yellow-400/30';
      case 'R':
        return 'bg-red-600/80 text-white border-red-400/30';
      case 'NC-17':
        return 'bg-purple-600/80 text-white border-purple-400/30';
      case 'NR':
      case 'NOT RATED':
        return 'bg-gray-600/80 text-white border-gray-400/30';
      default:
        return 'bg-uga-red/80 text-uga-white border-uga-white/20';
    }
  };

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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString || typeof dateString !== 'string') {
      return 'Date unavailable';
    }
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return 'Invalid date';
      }
      const date = new Date(year, month - 1, day);
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

  // Get unique dates from shows using start_time
  const getUniqueDates = (shows: Show[]) => {
    if (!shows || !Array.isArray(shows)) return [];
    const uniqueDates = new Set();
    const validShows = shows.filter(show => show && show.start_time);
    validShows.forEach(show => {
      const showDate = extractDate(show.start_time);
      if (showDate) {
        uniqueDates.add(showDate);
      }
    });
    return Array.from(uniqueDates) as string[];
  };

  // Filter shows for selected date using start_time
  const getShowsForDate = (shows: Show[], date: string) => {
    if (!shows || !Array.isArray(shows) || !date) return [];
    return shows.filter(show => {
      if (!show || !show.start_time) return false;
      const showDate = extractDate(show.start_time);
      return showDate === date;
    });
  };

  // Get show times for a specific date
  const getShowTimesForDate = (shows: Show[], date: string) => {
    const showsForDate = getShowsForDate(shows, date);
    return showsForDate.map(show => extractTime(show.start_time)).filter(time => time !== null);
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
        const movieShows = movie.Shows || [];
        const movieGenres = (movie.Genres ?? []) as { name?: string }[];
        const genreName = Array.isArray(movieGenres) ? movieGenres[0]?.name ?? 'Unknown' : (movieGenres as Genre)?.name ?? 'Unknown';

        return (
          <div key={movie.id} className="glass-card overflow-hidden hover:scale-[1.02] transition-transform duration-300">
            <div className="flex flex-col sm:flex-row">
              {/* Movie Poster & Link */}
              <Link href={`/movies/${movie.id}`} className="w-full sm:w-32 h-48 sm:h-48 bg-gradient-to-br from-uga-red/20 to-uga-black/40 relative flex-shrink-0 block group">
                {movie.poster_url ? (
                  <Image
                    src={movie.poster_url}
                    alt={movie.title}
                    fill
                    className="object-cover group-hover:opacity-90"
                    sizes="(max-width: 640px) 100vw, 32vw"
                    onError={() => {}}
                    style={{ objectFit: 'cover' }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm border ${getRatingStyles(movie.mpaa_rating)}`}>
                    {movie.mpaa_rating?.toUpperCase() || 'NR'}
                  </span>
                </div>
              </Link>
              
              {/* Movie Details */}
              <div className="flex-1 p-6">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      {/* Title as Link */}
                      <Link href={`/movies/${movie.id}`}>
                        <h3 className="text-lg font-bold text-black mb-1 line-clamp-2 hover:underline">
                          {movie.title || 'Untitled Movie'}
                        </h3>
                      </Link>
                      <span className="bg-uga-red/60 text-black px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-black/30 ml-2 flex-shrink-0">
                        {genreName}
                      </span>
                    </div>
                    
                    {/* Display Synopsis */}
                    <p className="text-black/80 text-xs mb-3 line-clamp-2">
                      {movie.synopsis || 'No synopsis available'}
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
                            {getUniqueDates(movieShows).length > 4 && (
                              <span className="text-xs text-black/60">
                                +{getUniqueDates(movieShows).length - 4} more
                              </span>
                            )}
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
                            {getShowTimesForDate(movieShows, selectedDate).slice(0, 4).map((time, index) => (
                              <span 
                                key={index}
                                className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-300"
                              >
                                {time}
                              </span>
                            ))}
                            {getShowTimesForDate(movieShows, selectedDate).length > 4 && (
                              <span className="text-xs text-black/60">
                                +{getShowTimesForDate(movieShows, selectedDate).length - 4} more
                              </span>
                            )}
                            {getShowTimesForDate(movieShows, selectedDate).length === 0 && (
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
