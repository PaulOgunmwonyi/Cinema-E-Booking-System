'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Movie } from '../utils/api';

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

  // Group shows by date
  const showsByDate = useMemo(() => {
    const grouped: { [date: string]: typeof movie.Shows } = {};
    
    movie.Shows.forEach(show => {
      const date = show.show_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(show);
    });
    
    // Sort shows by time for each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.show_time.localeCompare(b.show_time));
    });
    
    return grouped;
  }, [movie, movie.Shows]);

  const availableDates = Object.keys(showsByDate).sort();
  const availableShows = selectedDate ? showsByDate[selectedDate] : [];

  const handleBookTickets = () => {
    if (!selectedDate || !selectedShow) {
      alert('Please select both a date and show time');
      return;
    }

    const selectedShowData = movie.Shows.find(show => show.id === selectedShow);
    
    // Navigate to booking page with movie and show details
    const queryParams = new URLSearchParams({
      movieId: movie.id,
      movieTitle: movie.title,
      showDate: currSelectedDate,
      showId: selectedShow,
      showTime: selectedShowData?.show_time || '',
      price: selectedShowData?.price.toString() || '0'
    });

    router.push(`/pages/booking?${queryParams.toString()}`);
    onClose();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
          <p className="text-black/70 text-sm">{movie.Genres.name} • ★ {movie.rating}</p>
        </div>

        <div className="space-y-4">
          {/* Date Dropdown */}
          <div>
            <label className="block text-sm font-medium text-black/90 mb-2">
              Select Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableDates.map((date) => (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedShow(''); // Reset show selection when date changes
                  }}
                  className={`p-3 text-sm rounded border ${
                    selectedDate === date
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {formatDate(date)}
                </button>
              ))}
            </div>
          </div>

          {/* Show Time Selection */}
          {selectedDate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-black/90 mb-2">
                Select Show Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableShows.map((show) => (
                  <button
                    key={show.id}
                    onClick={() => setSelectedShow(show.id)}
                    className={`p-3 text-sm rounded border ${
                      selectedShow === show.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div>{formatTime(show.show_time)}</div>
                    <div className="text-xs opacity-75">${show.price}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Book Tickets Button */}
          <div className="mt-6">
            <button
              onClick={handleBookTickets}
              disabled={!selectedDate || !selectedShow}
              className={`w-full py-3 px-4 rounded font-medium ${
                selectedDate && selectedShow
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Book Tickets
            </button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default BookingModal;
