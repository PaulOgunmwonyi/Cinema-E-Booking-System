'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, Movie, Show } from '../../utils/api';
import BookingModal from '../../components/BookingModal';

export default function MovieDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); 
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking modal state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const bookNowButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    apiService.getMovie(id)
      .then((data) => {
        setMovie(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // --- Date helpers (copied from BookingModal/MovieResults) ---

  // Extract UTC date string (YYYY-MM-DD)
  const extractDate = (startTime: string) => {
    if (!startTime) return null;
    try {
      const date = new Date(startTime);
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  // Format date for display (local time)
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
    } catch {
      return 'Date unavailable';
    }
  };

  // Get unique dates from shows
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

  // Get shows for selected date
  const getShowsForDate = (shows: Show[], date: string) => {
    if (!shows || !Array.isArray(shows) || !date) return [];
    return shows.filter(show => {
      if (!show || !show.start_time) return false;
      const showDate = extractDate(show.start_time);
      return showDate === date;
    });
  };

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

  const uniqueDates = movie.Shows ? getUniqueDates(movie.Shows) : [];
  const showsForSelectedDate =
    selectedDate && movie.Shows
      ? getShowsForDate(movie.Shows, selectedDate)
      : [];

  return (
    <div className="container mx-auto px-4 py-8 text-uga-white">
      <button
        className="glass-button px-4 py-2 rounded mb-6"
        onClick={() => router.push('/')}
      >
        Back to Movies
      </button>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster with full width, fixed aspect ratio */}
        <div className="w-full max-w-[400px] md:w-[400px] aspect-[2/3] flex-shrink-0">
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover rounded-lg shadow-lg aspect-[2/3] bg-gray-800"
            style={{ aspectRatio: '2/3', objectFit: 'cover' }}
          />
        </div>
        <div className="flex-1">
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
            <h3 className="font-semibold mb-1">Available Dates:</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {uniqueDates.length > 0 ? (
                uniqueDates.map(date => (
                  <button
                    key={date}
                    className={`px-3 py-1 rounded-full border text-sm font-semibold transition-colors duration-150 ${
                      selectedDate === date
                        ? 'bg-uga-red/80 text-white border-uga-red'
                        : 'bg-gray-700 text-white border-gray-500 hover:bg-uga-red/60 hover:text-white'
                    }`}
                    onClick={() => setSelectedDate(date)}
                  >
                    {formatDate(date)}
                  </button>
                ))
              ) : (
                <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs border border-uga-white/20">
                  No showtimes available
                </span>
              )}
            </div>
            {selectedDate && (
              <>
                <h3 className="font-semibold mb-1">Showtimes for {formatDate(selectedDate)}:</h3>
                <div className="flex flex-wrap gap-2">
                  {showsForSelectedDate.length > 0 ? (
                    showsForSelectedDate.map((show, idx) => (
                      <button
                        key={idx}
                        className="bg-uga-white/10 text-uga-white px-2 py-1 rounded text-xs border border-uga-white/20 hover:bg-uga-red/70 hover:text-white transition"
                        onClick={e => {
                          setIsBookingOpen(true);
                          setTriggerElement(e.currentTarget as HTMLElement);
                        }}
                      >
                        {new Date(show.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))
                  ) : (
                    <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs border border-uga-white/20">
                      No showtimes for this date
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          {movie.Shows && movie.Shows.length > 0 && (
            <button
              ref={bookNowButtonRef}
              className="bg-black hover:bg-gray-800 text-white font-bold px-6 py-2 rounded mt-2 shadow-lg transition-colors duration-200"
              onClick={e => {
                setSelectedDate(undefined); // Let user pick date in modal
                setIsBookingOpen(true);
                setTriggerElement(bookNowButtonRef.current);
              }}
            >
              Book Now
            </button>
          )}
          {movie.trailer_url && (
            <div className="mt-6">
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
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        movie={movie}
        triggerElement={triggerElement}
        selectedDate={selectedDate}
      />
    </div>
  );
}