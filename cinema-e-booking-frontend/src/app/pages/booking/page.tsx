'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Movie, apiService } from '../../utils/api';

// Define ticket types and age categories
const AGE_CATEGORIES = [
  { id: 'adult', label: 'Adult (18+)', price: 12.00 },
  { id: 'senior', label: 'Senior (65+)', price: 9.00 },
  { id: 'child', label: 'Child (3-17)', price: 8.00 },
  { id: 'student', label: 'Student', price: 10.00 }
];

interface TicketSelection {
    id: string;
    category: string;
    quantity: number;
    price: number;
    assignedSeats: string[];
}

interface SelectedSeatInfo {
  id: string;
  displayName: string;
}

interface Seat {
  id: string;
  row_label: string;
  seat_number: number;
  is_available: boolean;
  isSelected: boolean;
}

function BookingContent() {
  const searchParams = useSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketSelection[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeatInfo[]>([]);
  const [showroomName, setShowroomName] = useState<string>('');

  // Get parameters from URL
  const movieId = searchParams.get('movieId');
  const movieTitle = searchParams.get('movieTitle');
  const showDate = searchParams.get('showDate');
  const showId = searchParams.get('showId');
  const showTime = searchParams.get('showTime');

  // Helper function to create seat display name
  const getSeatDisplayName = (seat: Seat) => `${seat.row_label}${seat.seat_number}`;

  // Fetch seats from database when showId is available
  useEffect(() => {
    const fetchSeats = async () => {
      if (!showId) {
        console.log('No showId provided, seats will not be loaded');
        return;
      }

      try {
        console.log('Fetching seats for show:', showId);
        const response = await apiService.getAvailableSeats(showId);
        const apiSeats = response.seats;
        
        // Transform API seats to include selection state
        const transformedSeats: Seat[] = apiSeats.map(seat => ({
          ...seat,
          isSelected: false
        }));
        
        console.log('Loaded seats from database:', transformedSeats.length, 'seats');
        console.log('Seat distribution by row:', 
          Object.entries(
            transformedSeats.reduce((acc: Record<string, number>, seat) => {
              acc[seat.row_label] = (acc[seat.row_label] || 0) + 1;
              return acc;
            }, {})
          )
        );
        setSeats(transformedSeats);
        
        // Try to get showroom name - we can extract it from the movie's shows
        if (movie?.Shows && Array.isArray(movie.Shows)) {
          const currentShow = movie.Shows.find(show => show.id === showId);
          if (currentShow?.Showroom?.name) {
            setShowroomName(currentShow.Showroom.name);
          } else {
            // Fallback to a generic name if showroom data isn't available
            setShowroomName('Theater');
          }
        } else {
          // Fallback if no show data is available
          setShowroomName('Theater');
        }
      } catch (error) {
        console.error('Error fetching seats:', error);
        // Fallback to empty seats array if API fails
        setSeats([]);
      }
    };

    fetchSeats();
  }, [showId, movie]);



  // Helper function to get rating display styles based on MPAA rating (copied from MovieResults)
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
    
    try {
      // Handle YYYY-MM-DD format from API
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const getTotalTickets = () => {
    return tickets.reduce((total, ticket) => total + ticket.quantity, 0);
  };

  // Handle seat selection
  const handleSeatClick = (seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || !seat.is_available) return;

    const totalTicketsNeeded = getTotalTickets();
    const seatDisplayName = getSeatDisplayName(seat);
    
    const isCurrentlySelected = selectedSeats.some(s => s.id === seatId);
    
    if (isCurrentlySelected) {
      // Deselect seat
      setSelectedSeats(selectedSeats.filter(s => s.id !== seatId));
      setSeats(seats.map(s => 
        s.id === seatId ? { ...s, isSelected: false } : s
      ));
    } else {
      // Select seat (only if we haven't exceeded ticket count)
      if (selectedSeats.length < totalTicketsNeeded) {
        const newSeatInfo: SelectedSeatInfo = {
          id: seatId,
          displayName: seatDisplayName
        };
        setSelectedSeats([...selectedSeats, newSeatInfo]);
        setSeats(seats.map(s => 
          s.id === seatId ? { ...s, isSelected: true } : s
        ));
      } else {
        alert(`You can only select ${totalTicketsNeeded} seats for your tickets.`);
      }
    }
  };

  const addTicket = () => {
    const adultCategory = AGE_CATEGORIES.find(cat => cat.id === 'adult');
    const newTicket: TicketSelection = {
      id: `ticket-${Date.now()}`,
      category: 'adult',
      quantity: 1,
      price: adultCategory?.price ?? 12.00,
      assignedSeats: []
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
          updatedTicket.price = categoryData?.price ?? 12.00;
        }
        
        return updatedTicket;
      }
      return ticket;
    }));

    // Clear selected seats when ticket quantities change
    if (field === 'quantity') {
      setSelectedSeats([]);
      setSeats(seats.map(seat => ({ ...seat, isSelected: false })));
    }
  };

  const removeTicket = (ticketId: string) => {
    setTickets(tickets.filter(ticket => ticket.id !== ticketId));
    // Clear selected seats when removing tickets
    setSelectedSeats([]);
    setSeats(seats.map(seat => ({ ...seat, isSelected: false })));
  };

  const calculateTotal = () => {
    return tickets.reduce((total, ticket) => total + (ticket.price * ticket.quantity), 0);
  };

  const getSeatClassName = (seat: Seat) => {
    if (!seat.is_available) {
      return 'bg-red-500 cursor-not-allowed';
    } else if (seat.isSelected) {
      return 'bg-green-500 hover:bg-green-600 cursor-pointer';
    } else {
      return 'bg-gray-300 hover:bg-gray-400 cursor-pointer';
    }
  };

  const handleProceedToPayment = () => {
    if (tickets.length === 0) {
      alert('Please add at least one ticket to proceed.');
      return;
    }

    const totalTicketsNeeded = getTotalTickets();
    if (selectedSeats.length !== totalTicketsNeeded) {
      alert(`Please select ${totalTicketsNeeded} seats for your tickets.`);
      return;
    }

    const bookingDetails = {
      movie: movie?.title ?? movieTitle ?? '',
      date: showDate,
      time: showTime,
      tickets: tickets,
      selectedSeats: selectedSeats,
      selectedSeatIds: selectedSeats.map(seat => seat.id), // For future database operations
      selectedSeatNames: selectedSeats.map(seat => seat.displayName), // For display
      total: calculateTotal(),
      totalTickets: getTotalTickets()
    };

    console.log('Booking details:', bookingDetails);
    alert(`Proceeding to payment for ${getTotalTickets()} ticket(s) - Seats: ${selectedSeats.map(seat => seat.displayName).join(', ')} - Total: $${calculateTotal().toFixed(2)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uga-red mx-auto mb-4"></div>
          <span className="text-black font-medium">Loading booking details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Movie Information */}
        <div className="glass-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
            {movie?.poster_url && (
              <div className="relative w-24 h-36 sm:w-32 sm:h-48 bg-gradient-to-br from-uga-red/20 to-uga-black/40 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={movie.poster_url}
                  alt={movieTitle || movie.title || 'Movie'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Rating badge overlay */}
                <div className="absolute bottom-1 right-1">
                  <span className={`px-2 py-1 rounded text-xs font-bold backdrop-blur-sm border ${getRatingStyles(movie.mpaa_rating)}`}>
                    {movie.mpaa_rating?.toUpperCase() || 'NR'}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-black mb-2 drop-shadow-lg">
                {movieTitle || movie?.title}
              </h1>
              
              {/* Display genres properly */}
              <div className="flex flex-wrap gap-1 mb-3">
                {movie?.Genres && Array.isArray(movie.Genres) ? (
                  movie.Genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="bg-uga-red/60 text-black px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-black/30"
                    >
                      {genre.name}
                    </span>
                  ))
                ) : null}
              </div>

              {/* Display synopsis */}
              {movie?.synopsis && (
                <p className="text-black/80 text-sm mb-4 line-clamp-3">
                  {movie.synopsis}
                </p>
              )}
              
              <div className="text-black/90 space-y-2">
                <p className="flex items-center">
                  <span className="font-semibold mr-2">📅 Date:</span> 
                  <span className="bg-uga-red/20 px-2 py-1 rounded border border-uga-red/30 text-xs">
                    {formatDate(showDate)}
                  </span>
                </p>
                <p className="flex items-center">
                  <span className="font-semibold mr-2">🕐 Time:</span> 
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300 text-xs">
                    {showTime || 'Time TBA'}
                  </span>
                </p>
                {movie?.duration_minutes && (
                  <p className="flex items-center">
                    <span className="font-semibold mr-2">⏱️ Duration:</span>
                    <span className="text-black/70">
                      {Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes  % 60}m
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Ticket Selection */}
          <div className="xl:col-span-1">
            <div className="glass-card p-6 mb-6 xl:mb-0">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-black drop-shadow-lg">Select Tickets</h3>
                <button
                  onClick={addTicket}
                  className="glass-button px-4 py-2 rounded-lg text-black hover:scale-105 font-medium transition-all duration-300 border border-black/30"
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
                      className="glass-button px-6 py-3 rounded-lg text-black hover:scale-105 font-medium border border-black/30 transition-all duration-300"
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
                          className="text-uga-red hover:text-uga-red/70 font-bold text-lg transition-colors hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Age Category */}
                        <div>
                          <label className="block text-sm font-medium text-black/90 mb-2">
                            Age Category
                          </label>
                          <select
                            value={ticket.category}
                            onChange={(e) => updateTicket(ticket.id, 'category', e.target.value)}
                            className="glass-input w-full px-3 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-uga-white/50"
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
                            className="glass-input w-full px-3 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-uga-white/50"
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

          {/* Seat Selection */}
          <div className="xl:col-span-1">
            <div className="glass-card p-6 mb-6 xl:mb-0">
              <h3 className="text-xl font-bold text-black mb-4 drop-shadow-lg text-center">Select Seats</h3>
              
              {!showId ? (
                <div className="text-center py-8 text-black/70">
                  <p>No show selected. Please select a date and time first.</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-black/70">
                  <p>Please add tickets first to select seats</p>
                </div>
              ) : (
                <div>
                  {/* Showroom name and Screen indicator */}
                  <div className="mb-6 text-center">
                    {showroomName && (
                      <p className="text-black font-semibold text-lg mb-3 drop-shadow-sm">
                        {showroomName}
                      </p>
                    )}
                    <div className="bg-gradient-to-r from-uga-red/60 to-uga-red/40 h-2 rounded-full mb-2"></div>
                    <p className="text-black/70 text-sm">SCREEN</p>
                  </div>

                  {/* Seat grid */}
                  <div className="mb-6">
                    {seats.length === 0 ? (
                      <div className="text-center py-8 text-black/70">
                        <p>Loading seat map...</p>
                      </div>
                    ) : (
                      <div>
                        {/* Group seats by row */}
                        {Object.entries(
                          seats.reduce((acc: Record<string, Seat[]>, seat) => {
                            if (!acc[seat.row_label]) {
                              acc[seat.row_label] = [];
                            }
                            acc[seat.row_label].push(seat);
                            return acc;
                          }, {})
                        )
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([rowLabel, rowSeats]) => (
                          <div key={rowLabel} className="flex items-center justify-center mb-2">
                            {/* Row label */}
                            <div className="w-6 flex items-center justify-center text-black font-semibold text-sm mr-2">
                              {rowLabel}
                            </div>
                            {/* Seats in this row */}
                            <div className="flex gap-1">
                              {rowSeats
                                .sort((a, b) => a.seat_number - b.seat_number)
                                .map((seat) => (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSeatClick(seat.id)}
                                  className={`w-6 h-6 rounded-sm text-xs font-bold transition-all duration-200 ${getSeatClassName(seat)}`}
                                  disabled={!seat.is_available}
                                  title={!seat.is_available ? 'Occupied' : seat.isSelected ? 'Selected' : 'Available'}
                                >
                                  {seat.seat_number}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center space-x-4 text-xs text-black/70">
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                      <span>Selected</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                      <span>Occupied</span>
                    </div>
                  </div>

                  {/* Selected seats display */}
                  {selectedSeats.length > 0 && (
                    <div className="mt-4 p-3 bg-green-100 rounded-lg">
                      <p className="text-sm font-semibold text-green-800">Selected Seats:</p>
                      <p className="text-sm text-green-700">
                        {selectedSeats.map(seat => seat.displayName).join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Seat selection status */}
                  <div className="mt-4 text-center">
                    <p className="text-sm text-black/70">
                      {selectedSeats.length} of {getTotalTickets()} seats selected
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="xl:col-span-1">
            <div className="glass-card p-6 sticky top-4">
              <h3 className="text-xl font-bold text-black mb-4 drop-shadow-lg">Order Summary</h3>
              
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
                
                {selectedSeats.length > 0 && (
                  <div className="border-t border-white/30 pt-3">
                    <p className="text-sm text-black/80 mb-2">Selected Seats:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedSeats.map(seat => (
                        <span key={seat.id} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {seat.displayName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border-t border-white/30 pt-3">
                  <div className="flex justify-between text-lg font-bold text-black">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={tickets.length === 0 || selectedSeats.length !== getTotalTickets()}
                className="w-full px-6 py-3 glass-button text-black rounded-lg hover:scale-105 font-semibold transition-all duration-300 border border-black/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {tickets.length === 0 
                  ? 'Add Tickets First'
                  : selectedSeats.length !== getTotalTickets()
                  ? `Select ${getTotalTickets() - selectedSeats.length} More Seats`
                  : 'Proceed to Payment'
                }
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full mt-3 px-6 py-2 glass-button text-black rounded-lg hover:scale-105 font-medium transition-all duration-300 border border-black/30"
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
