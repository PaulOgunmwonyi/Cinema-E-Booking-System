'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Movie, Show } from '../utils/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie;
  triggerElement: HTMLElement | null;
  selectedDate?: string;
}

const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, 
  onClose, 
  movie, 
  triggerElement,
  selectedDate
}) => {
  const [currSelectedDate, setSelectedDate] = useState<string>(selectedDate || '');
  const [selectedShow, setSelectedShow] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Helper function to extract date from start_time timestamp (copied from MovieResults)
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

  // Helper function to extract time from start_time timestamp (copied from MovieResults)
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

  // Format date for display (copied from MovieResults)
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

  // Get unique dates from shows using start_time (copied from MovieResults)
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

  // Filter shows for selected date using start_time (copied from MovieResults)
  const getShowsForDate = (shows: Show[], date: string) => {
    if (!shows || !Array.isArray(shows) || !date) return [];
    
    return shows.filter(show => {
      if (!show || !show.start_time) return false;
      const showDate = extractDate(show.start_time);
      return showDate === date;
    });
  };

  // Group shows by date using the same logic as MovieResults
  const showsByDate = useMemo(() => {
    const grouped: { [date: string]: Show[] } = {};
    
    if (!movie.Shows || !Array.isArray(movie.Shows)) return grouped;
    
    movie.Shows.forEach(show => {
      if (show && show.start_time) {
        const date = extractDate(show.start_time);
        if (date) {
          if (!grouped[date]) {
            grouped[date] = [];
          }
          grouped[date].push(show);
        }
      }
    });
    
    // Sort shows by time for each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const timeA = extractTime(a.start_time) || '';
        const timeB = extractTime(b.start_time) || '';
        return timeA.localeCompare(timeB);
      });
    });
    
    return grouped;
  }, [movie.Shows]);

  const availableDates = Object.keys(showsByDate).sort();
  const availableShows = currSelectedDate ? showsByDate[currSelectedDate] || [] : [];

  const handleBookTickets = () => {
    if (!currSelectedDate || !selectedShow) {
      alert('Please select both a date and show time');
      return;
    }

    const selectedShowData = movie.Shows?.find(show => show.id === selectedShow);
    
    // Navigate to booking page with movie and show details
    const queryParams = new URLSearchParams({
      movieId: movie.id,
      movieTitle: movie.title,
      showDate: currSelectedDate,
      showId: selectedShow,
      showTime: selectedShowData?.start_time ? extractTime(selectedShowData.start_time) || '' : '',
    });

    router.push(`/pages/booking?${queryParams.toString()}`);
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (modalRef.current && !modalRef.current.contains(target) && 
          triggerElement && !triggerElement.contains(target)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerElement]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="fixed z-50 glass-card animate-in slide-in-from-top-2 duration-300 shadow-2xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{ 
          minWidth: '350px',
          maxWidth: '400px'
        }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-black drop-shadow-lg">Book Tickets</h2>
            <button
              onClick={onClose}
              className="text-black/70 hover:text-black transition-colors duration-200 text-xl font-bold hover:rotate-90 transform"
            >
              ×
            </button>
          </div>

          {/* Movie Title */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black">{movie.title}</h3>
            <p className="text-black/70 text-sm">
              {movie.Genres && Array.isArray(movie.Genres) && movie.Genres.length > 0 
                ? movie.Genres[0].name 
                : 'Unknown Genre'} 
              • {movie.mpaa_rating?.toUpperCase() || 'NR'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Date Selection Dropdown */}
            <div>
              <label className="block text-sm font-medium text-black/90 mb-2">
                Select Date
              </label>
              {availableDates.length === 0 ? (
                <div className="glass-input w-full px-4 py-2 rounded-lg text-black/50">
                  No showtimes available
                </div>
              ) : (
                <select
                  value={currSelectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedShow(''); // Reset show selection when date changes
                  }}
                  className="glass-input w-full px-4 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-uga-white/50"
                >
                  <option value="" className="bg-uga-arch-black text-uga-white">Select a date</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date} className="bg-uga-arch-black text-uga-white">
                      {formatDate(date)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Show Time Selection Dropdown */}
            <div>
              <label className="block text-sm font-medium text-black/90 mb-2">
                Select Show Time
              </label>
              {!currSelectedDate ? (
                <div className="glass-input w-full px-4 py-2 rounded-lg text-black/50">
                  Please select a date first
                </div>
              ) : availableShows.length === 0 ? (
                <div className="glass-input w-full px-4 py-2 rounded-lg text-black/50">
                  No shows available for this date
                </div>
              ) : (
                <select
                  value={selectedShow}
                  onChange={(e) => setSelectedShow(e.target.value)}
                  className="glass-input w-full px-4 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-uga-white/50"
                >
                  <option value="" className="bg-uga-arch-black text-uga-white">Select a show time</option>
                  {availableShows.map((show) => (
                    <option key={show.id} value={show.id} className="bg-uga-arch-black text-uga-white">
                      {extractTime(show.start_time) || 'Time TBA'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Book Tickets Button - Updated to match your design */}
          <div className="mt-6">
            <button
              onClick={handleBookTickets}
              disabled={!currSelectedDate || !selectedShow || availableShows.length === 0}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                currSelectedDate && selectedShow && availableShows.length > 0
                  ? 'glass-button text-black hover:scale-105 border border-black/30 hover:text-black'
                  : 'bg-black/10 text-black/40 cursor-not-allowed border border-black/10'
              }`}
            >
              {availableShows.length === 0 ? 'No Shows Available' : 'Book Tickets'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingModal;
