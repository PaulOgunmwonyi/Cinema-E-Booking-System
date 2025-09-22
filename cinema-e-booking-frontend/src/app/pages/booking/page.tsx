'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Movie, apiService } from '../../utils/api';

// Define ticket types and age categories
const AGE_CATEGORIES = [
  { id: 'adult', label: 'Adult (18+)', price: 0.00 },
  { id: 'senior', label: 'Senior (65+)', price: 0.00 },
  { id: 'child', label: 'Child (3-17)', price: 0.00 },
  { id: 'student', label: 'Student', price: 0.00 }
];

interface TicketSelection {
    id: string;
    category: string;
    quantity: number;
    price: number;
}

function BookingContent() {
  const searchParams = useSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketSelection[]>([]);

  // Get parameters from URL
  const movieId = searchParams.get('movieId');
  const movieTitle = searchParams.get('movieTitle');
  const showDate = searchParams.get('showDate');
  const showId = searchParams.get('showId');
  const showTime = searchParams.get('showTime');
  const showPrice = parseFloat(searchParams.get('price') || '0');

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (movieId) {
        try {
          const movieData = await apiService.getMovie(movieId);
          setMovie(movieData);
        } catch (error) {
          console.error('Error fetching movie:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const addTicket = () => {
    const adultCategory = AGE_CATEGORIES.find(cat => cat.id === 'adult');
    const newTicket: TicketSelection = {
      id: `ticket-${Date.now()}`,
      category: 'adult',
      quantity: 1,
      price: adultCategory?.price ?? 0.00
    };
    setTickets([...tickets, newTicket]);
  };

  const updateTicket = (ticketId: string, field: keyof TicketSelection, value: string | number) => {
    setTickets(tickets.map(ticket => {
      if (ticket.id === ticketId) {
        const updatedTicket = { ...ticket, [field]: value };
        
        // Update price when category changes
        if (field === 'category') {
          const categoryData = AGE_CATEGORIES.find(cat => cat.id === value);
          updatedTicket.price = categoryData?.price ?? 0.00;
        }
        
        return updatedTicket;
      }
      return ticket;
    }));
  };

  const removeTicket = (ticketId: string) => {
    setTickets(tickets.filter(ticket => ticket.id !== ticketId));
  };

  const calculateTotal = () => {
    return tickets.reduce((total, ticket) => total + (ticket.price * ticket.quantity), 0);
  };

  const getTotalTickets = () => {
    return tickets.reduce((total, ticket) => total + ticket.quantity, 0);
  };

  const handleProceedToPayment = () => {
    if (tickets.length === 0) {
      alert('Please add at least one ticket to proceed.');
      return;
    }

    // TODO: Implement payment flow
    const bookingDetails = {
      movie: movie?.title ?? '',
      date: showDate,
      time: showTime,
      tickets: tickets,
      total: calculateTotal(),
      totalTickets: getTotalTickets()
    };

    console.log('Booking details:', bookingDetails);
    alert(`Proceeding to payment for ${getTotalTickets()} ticket(s) - Total: $${calculateTotal().toFixed(2)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Movie Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start space-x-4">
            {movie?.poster_url && (
              <img
                src={movie.poster_url}
                alt={movieTitle || 'Movie'}
                className="w-24 h-36 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = '/api/placeholder/96/144';
                }}
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {movieTitle || movie?.title}
              </h1>
                <div className="flex flex-wrap gap-1 mb-2">
                    {movie?.Genres && (
                      <span
                        key={movie.Genres.id}
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {movie.Genres.name}
                      </span>
                    )}
                </div>
              <div className="text-gray-600 space-y-1">
                <p><strong>Date:</strong> {formatDate(showDate)}</p>
                <p><strong>Time:</strong> {formatTime(showTime)}</p>
                <p><strong>Price per ticket:</strong> ${showPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Selection */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-black">Select Tickets</h3>
                <button
                  onClick={addTicket}
                  className="glass-button px-4 py-2 rounded-lg text-black hover:bg-uga-red/20 font-medium transition-all duration-300"
                >
                  + Add Ticket
                </button>
              </div>

              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="text-center py-8 text-black/70">
                    <p className="mb-4">No tickets selected yet</p>
                    <button
                      onClick={addTicket}
                      className="glass-button px-6 py-3 rounded-lg text-black hover:bg-uga-red/20 font-medium"
                    >
                      Add Your First Ticket
                    </button>
                  </div>
                ) : (
                  tickets.map((ticket, index) => (
                    <div key={ticket.id} className="glass-morphism p-4 rounded-xl border border-white/30">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-black">Ticket {index + 1}</h4>
                        <button
                          onClick={() => removeTicket(ticket.id)}
                          className="text-uga-red hover:text-uga-red/70 font-bold text-lg transition-colors"
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Age Category */}
                        <div>
                          <label className="block text-sm font-medium text-black/90 mb-2">
                            Age Category
                          </label>
                          <select
                            value={ticket.category}
                            onChange={(e) => updateTicket(ticket.id, 'category', e.target.value)}
                            className="glass-input w-full px-3 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-uga-red/50"
                          >
                            {AGE_CATEGORIES.map(category => (
                              <option key={category.id} value={category.id} className="bg-uga-arch-black text-uga-white">
                                {category.label} - ${category.price.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-black/90 mb-2">
                            Quantity
                          </label>
                          <select
                            value={ticket.quantity}
                            onChange={(e) => updateTicket(ticket.id, 'quantity', parseInt(e.target.value))}
                            className="glass-input w-full px-3 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-uga-red/50"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                              <option key={num} value={num} className="bg-uga-arch-black text-uga-white">
                                {num}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Price Display */}
                      <div className="mt-3 text-right">
                        <span className="text-black/70 text-sm">Subtotal: </span>
                        <span className="font-bold text-black">
                          ${(ticket.price * ticket.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-4">
              <h3 className="text-xl font-bold text-black mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-black">
                  <span>Total Tickets:</span>
                  <span className="font-semibold">{getTotalTickets()}</span>
                </div>
                
                {tickets.map((ticket) => {
                  const category = AGE_CATEGORIES.find(cat => cat.id === ticket.category);
                  return (
                    <div key={ticket.id} className="flex justify-between text-sm text-black/80">
                      <span>{category?.label} x{ticket.quantity}</span>
                      <span>${(ticket.price * ticket.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
                
                <div className="border-t border-white/30 pt-3">
                  <div className="flex justify-between text-lg font-bold text-black">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={tickets.length === 0}
                className="w-full px-6 py-3 bg-uga-red/80 text-black rounded-lg hover:bg-uga-red font-semibold shadow-lg backdrop-blur-sm border border-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Proceed to Payment
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full mt-3 px-6 py-2 glass-button text-black rounded-lg hover:bg-white/30 font-medium transition-all duration-300"
              >
                Back to Show Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <p className="text-black text-lg">Loading booking details...</p>
        </div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
