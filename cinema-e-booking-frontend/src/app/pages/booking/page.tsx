'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Movie, apiService } from '../../utils/api';
import { useUser } from '../../contexts/UserContext';

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

interface PaymentCard {
  id: string;
  card_type: string;
  expiration_date: string;
}

interface NewCardData {
  cardType: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
}

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn, user } = useUser();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketSelection[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeatInfo[]>([]);
  const [showroomName, setShowroomName] = useState<string>('');
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [showNewCardForm, setShowNewCardForm] = useState<boolean>(false);
  const [newCardData, setNewCardData] = useState<NewCardData>({
    cardType: 'VISA',
    cardNumber: '',
    expirationDate: '',
    cvv: ''
  });
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoValidation, setPromoValidation] = useState<{ valid: boolean; discountAmount: number | null; discountPercent?: number | null; message?: string } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState<boolean>(false);

  // Clear promo validation when user edits the code
  useEffect(() => {
    setPromoValidation(null);
  }, [promoCode]);
  const [savingCard, setSavingCard] = useState<boolean>(false);
  const hasRestoredState = useRef(false);
  const hasLoadedSeats = useRef(false);

  // Get parameters from URL
  const movieId = searchParams.get('movieId');
  const movieTitle = searchParams.get('movieTitle');
  const showDate = searchParams.get('showDate');
  const showId = searchParams.get('showId');
  const showTime = searchParams.get('showTime');

  // Helper function to create seat display name
  const getSeatDisplayName = (seat: Seat) => `${seat.row_label}${seat.seat_number}`;

  // Fetch payment cards for logged in users
  const fetchPaymentCards = useCallback(async (autoSelectNewest = false) => {
    if (!isLoggedIn) {
      setPaymentCards([]);
      return;
    }
    
    try {
      const profile = await apiService.getProfile();
      setPaymentCards(profile.cards || []);
      
      // Auto-select first card if available and no card is selected
      if (profile.cards && profile.cards.length > 0) {
        if (!selectedCardId) {
          setSelectedCardId(profile.cards[0].id);
        } else if (autoSelectNewest) {
          // When adding a new card, select the most recently added one (last in array)
          const newestCard = profile.cards[profile.cards.length - 1];
          setSelectedCardId(newestCard.id);
        }
      }
    } catch (error) {
      console.error('Error fetching payment cards:', error);
      setPaymentCards([]);
    }
  }, [isLoggedIn, selectedCardId]);

  // Fetch payment cards when user logs in
  useEffect(() => {
    fetchPaymentCards();
  }, [isLoggedIn, fetchPaymentCards]);

  // Handle adding a new payment card
  const handleAddNewCard = async () => {
    // Check card limit
    if (paymentCards.length >= 4) {
      alert('You can only store up to 4 payment cards.');
      return;
    }

    if (!newCardData.cardNumber || !newCardData.expirationDate || !newCardData.cvv) {
      alert('Please fill out all card fields.');
      return;
    }

    // Basic validation
    if (newCardData.cardNumber.replace(/\s/g, '').length < 13) {
      alert('Please enter a valid card number.');
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(newCardData.expirationDate)) {
      alert('Please enter expiry date in MM/YY format.');
      return;
    }

    if (newCardData.cvv.length < 3 || newCardData.cvv.length > 4) {
      alert('Please enter a valid CVV.');
      return;
    }

    setSavingCard(true);
    try {
      // Call API to save the card
      await apiService.addPaymentCard({
        cardType: newCardData.cardType,
        cardNumber: newCardData.cardNumber,
        expirationDate: newCardData.expirationDate,
      });

      // Refresh the payment cards list and auto-select the new card
      await fetchPaymentCards(true);

      // Reset the form and close it
      setNewCardData({cardType: 'VISA', cardNumber: '', expirationDate: '', cvv: ''});
      setShowNewCardForm(false);

      alert('Payment card added successfully!');
    } catch (error) {
      console.error('Error adding payment card:', error);
      let errorMessage = 'Failed to add payment card.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setSavingCard(false);
    }
  };

  // Fetch seats and restore booking state when showId is available
  useEffect(() => {
    const fetchSeatsAndRestoreState = async () => {
      if (!showId) {
        return;
      }

      if (hasLoadedSeats.current) {
        return;
      }

      // First, restore booking state if user is logged in and we haven't restored yet
      let restoredSelectedSeats: SelectedSeatInfo[] = [];
      if (isLoggedIn && !hasRestoredState.current) {
        try {
          const savedState = localStorage.getItem('cinema_booking_state');
          if (savedState) {
            const bookingState = JSON.parse(savedState);
            
            // Only restore if it's for the same show and not too old (30 minutes)
            const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
            if (bookingState.showId === showId && bookingState.timestamp > thirtyMinutesAgo) {
              
              setTickets(bookingState.tickets);
              
              restoredSelectedSeats = bookingState.selectedSeats;
              setSelectedSeats(restoredSelectedSeats);
              
              localStorage.removeItem('cinema_booking_state');
              hasRestoredState.current = true;
            } else {
              localStorage.removeItem('cinema_booking_state');
            }
          }
        } catch{
          localStorage.removeItem('cinema_booking_state');
        }
      }

      // Fetch seats from API
      try {
        const response = await apiService.getAvailableSeats(showId);
        const apiSeats = response.seats;
        // Transform API seats to include selection state (from restored state)
        const transformedSeats: Seat[] = apiSeats.map(seat => {
          const shouldBeSelected = restoredSelectedSeats.some(selectedSeat => selectedSeat.id === seat.id);
          return {
            ...seat,
            isSelected: shouldBeSelected
          };
        });
        
        setSeats(transformedSeats);
        hasLoadedSeats.current = true;
        
        // Set showroom name from API response
        if (response.showroom?.name) {
          setShowroomName(response.showroom.name);
        } else {
          setShowroomName('Theater');
        }
      } catch (error) {
        console.error('Error fetching seats:', error);
        setSeats([]);
        setShowroomName('Theater');
      }
    };

    fetchSeatsAndRestoreState();
  }, [showId, isLoggedIn]);

  // Reset flags when showId changes
  useEffect(() => {
    hasLoadedSeats.current = false;
    hasRestoredState.current = false;
  }, [showId]);

  // Update seat visual state when selectedSeats changes (for user interactions)
  useEffect(() => {
    if (selectedSeats.length > 0 && seats.length > 0 && hasLoadedSeats.current) {
      setSeats(prevSeats => {
        const updatedSeats = prevSeats.map(seat => {
          const isSelected = selectedSeats.some(selectedSeat => selectedSeat.id === seat.id);
          return {
            ...seat,
            isSelected
          };
        });
        return updatedSeats;
      });
    }
  }, [selectedSeats, seats.length]);

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

  // Cleanup effect - clear old booking state on unmount
  useEffect(() => {
    return () => {
      // Optional: Clean up very old booking states on unmount
      try {
        const savedState = localStorage.getItem('cinema_booking_state');
        if (savedState) {
          const bookingState = JSON.parse(savedState);
          // Clear if older than 1 hour
          const oneHourAgo = Date.now() - (60 * 60 * 1000);
          if (bookingState.timestamp < oneHourAgo) {
            localStorage.removeItem('cinema_booking_state');
          }
        }
      } catch {
        localStorage.removeItem('cinema_booking_state');
      }
    };
  }, []);



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

  // Calculate subtotal (tickets only)
  const calculateSubtotal = () => {
    return tickets.reduce((total, ticket) => total + (ticket.price * ticket.quantity), 0);
  };

  // Calculate tax (7%)
  const calculateTax = () => {
    return calculateSubtotal() * 0.07;
  };

  // Calculate booking fee (5% of subtotal)
  const calculateBookingFee = () => {
    return calculateSubtotal() * 0.05;
  };

  // Calculate final total (subtotal + tax + booking fee)
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateBookingFee();
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

  const handleProceedToPayment = async () => {

    if (tickets.length === 0) {
      alert('Please add at least one ticket to proceed.');
      return;
    }

    const totalTicketsNeeded = getTotalTickets();
    if (selectedSeats.length !== totalTicketsNeeded) {
      alert(`Please select ${totalTicketsNeeded} seats for your tickets.`);
      return;
    }

    // Check if user is logged in
    if (!isLoggedIn) {
      // Store booking state before redirecting to login
      const bookingState = {
        tickets,
        selectedSeats,
        showId,
        timestamp: Date.now()
      };
      localStorage.setItem('cinema_booking_state', JSON.stringify(bookingState));
      
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/pages/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check if we have user ID, if not, fetch user profile
    let userId = user?.id;
    
    if (!userId) {
      try {
        const profile = await apiService.getProfile();
        userId = profile.user.id;
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        alert('Unable to retrieve user information. Please log in again.');
        return;
      }
    }

    if (!showId) {
      alert('Show information not available. Please try again.');
      return;
    }

    // Validate payment method
    if (isLoggedIn && paymentCards.length > 0 && !selectedCardId) {
      alert('Please select a payment method.');
      return;
    }

    if ((!isLoggedIn || paymentCards.length === 0 || showNewCardForm) && 
        (!newCardData.cardNumber || !newCardData.expirationDate || !newCardData.cvv)) {
      alert('Please enter complete payment card information.');
      return;
    }

    // Basic card validation
    if (newCardData.cardNumber && newCardData.cardNumber.replace(/\s/g, '').length < 13) {
      alert('Please enter a valid card number.');
      return;
    }

    if (newCardData.expirationDate && !/^\d{2}\/\d{2}$/.test(newCardData.expirationDate)) {
      alert('Please enter expiry date in MM/YY format.');
      return;
    }

    if (newCardData.cvv && (newCardData.cvv.length < 3 || newCardData.cvv.length > 4)) {
      alert('Please enter a valid CVV.');
      return;
    }

    try {
      // Prepare payment information
      let paymentInfo = {};
      if (isLoggedIn && selectedCardId && paymentCards.length > 0) {
        // Using saved card
        paymentInfo = { 
          payment_card_id: selectedCardId 
        };
      } else if (newCardData.cardNumber && newCardData.expirationDate && newCardData.cvv) {
        // Using new card details
        paymentInfo = {
          card_type: newCardData.cardType,
          card_number: newCardData.cardNumber.replace(/\s/g, ''),
          expiration_date: newCardData.expirationDate,
          cvv: newCardData.cvv
        };
      }
      
      // Create tickets array with seat assignments for backend
      const ticketDataForAPI = [];
      let seatIndex = 0;
      
      for (const ticket of tickets) {
        for (let i = 0; i < ticket.quantity; i++) {
          if (seatIndex < selectedSeats.length) {
            ticketDataForAPI.push({
              seat_id: selectedSeats[seatIndex].id,
              ticket_category: ticket.category,
              price: ticket.price
            });
            seatIndex++;
          }
        }
      }
      
      // Reserve the seats in the database
      const reservationData = {
        user_id: userId,
        show_id: showId,
        tickets: ticketDataForAPI,
        payment: paymentInfo
      };
      if (promoCode && promoCode.trim() !== '') {
        (reservationData as any).promotion_code = promoCode.trim();
      }

      console.log('Sending reservation request:', reservationData);
      
      const result = await apiService.reserveSeats(reservationData);
      
      console.log('Reservation successful:', result);
      
      // Clear booking state
      localStorage.removeItem('cinema_booking_state');

      // Use server-provided totals (discounts/total) when available
      const subtotalServer = (result.subtotal ?? calculateSubtotal()).toFixed(2);
      const taxServer = (result.tax_amount ?? calculateTax()).toFixed(2);
      const bookingFeeServer = (result.booking_fee ?? calculateBookingFee()).toFixed(2);
      const discountServer = (result.discount_amount ?? 0).toFixed(2);
      const totalServer = (result.total_amount ?? calculateTotal()).toFixed(2);

      // Prepare order confirmation data
      const orderParams = new URLSearchParams({
        bookingId: result.booking_id,
        movieTitle: movieTitle || movie?.title || 'Unknown Movie',
        showDate: showDate || '',
        showTime: showTime || '',
        seats: selectedSeats.map(seat => seat.displayName).join(','),
        subtotal: subtotalServer,
        tax: taxServer,
        bookingFee: bookingFeeServer,
        discount: discountServer,
        total: totalServer,
        tickets: encodeURIComponent(JSON.stringify(tickets.map(ticket => ({
          category: AGE_CATEGORIES.find(cat => cat.id === ticket.category)?.label || ticket.category,
          quantity: ticket.quantity,
          price: ticket.price
        }))))
      });
      
      // Navigate to order confirmation page
      router.push(`/pages/order-confirmation?${orderParams.toString()}`);
      
    } catch (error) {
      console.error('Seat reservation failed:', error);
      
      let errorMessage = 'Failed to reserve seats. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    }
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

          {/* Payment Method */}
          <div className="xl:col-span-1">
            <div className="glass-card p-6 mb-6">
              <h3 className="text-xl font-bold text-black mb-4 drop-shadow-lg">Payment Method</h3>
              
              {isLoggedIn ? (
                <>
                  {paymentCards.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {paymentCards.map((card) => (
                        <div key={card.id} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id={card.id}
                            name="payment_method"
                            checked={selectedCardId === card.id}
                            onChange={() => setSelectedCardId(card.id)}
                            className="w-4 h-4"
                          />
                          <label htmlFor={card.id} className="flex-1 cursor-pointer">
                            <div className="p-3 border border-black/20 rounded-lg bg-white/20">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-black">
                                  {card.card_type} ****{' '}
                                  {/* Show last 4 digits if available in future */}
                                </span>
                                <span className="text-sm text-black/70">
                                  Expires: {card.expiration_date}
                                </span>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                      
                      <button
                        onClick={() => setShowNewCardForm(true)}
                        className="w-full mt-3 p-3 border-2 border-dashed border-black/30 rounded-lg text-black hover:bg-white/10 transition-colors"
                      >
                        + Add New Card
                      </button>
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <p className="text-black/70 mb-3">No saved payment methods</p>
                      <button
                        onClick={() => setShowNewCardForm(true)}
                        className="px-6 py-2 glass-button text-black rounded-lg border border-black/30"
                      >
                        Add Payment Method
                      </button>
                    </div>
                  )}
                  
                  {showNewCardForm && (
                    <div className="mt-4 p-4 border border-black/20 rounded-lg bg-white/10">
                      <h4 className="font-semibold text-black mb-3">Add New Card</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-black mb-1">Card Type</label>
                          <select
                            value={newCardData.cardType}
                            onChange={(e) => setNewCardData({...newCardData, cardType: e.target.value})}
                            className="w-full p-2 border border-black/20 rounded bg-white/80 text-black"
                          >
                            <option value="VISA">Visa</option>
                            <option value="MASTERCARD">Mastercard</option>
                            <option value="AMEX">American Express</option>
                            <option value="DISCOVER">Discover</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-black mb-1">Card Number</label>
                          <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={newCardData.cardNumber}
                            onChange={(e) => {
                              // Format card number with spaces
                              const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                              if (value.replace(/\s/g, '').length <= 16) {
                                setNewCardData({...newCardData, cardNumber: value});
                              }
                            }}
                            className="w-full p-2 border border-black/20 rounded bg-white/80 text-black"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-black mb-1">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={newCardData.expirationDate}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length >= 2) {
                                  value = value.substring(0, 2) + '/' + value.substring(2, 4);
                                }
                                setNewCardData({...newCardData, expirationDate: value});
                              }}
                              className="w-full p-2 border border-black/20 rounded bg-white/80 text-black"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-black mb-1">CVV</label>
                            <input
                              type="text"
                              placeholder="123"
                              value={newCardData.cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').substring(0, 4);
                                setNewCardData({...newCardData, cvv: value});
                              }}
                              className="w-full p-2 border border-black/20 rounded bg-white/80 text-black"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-3 mt-4">
                          <button
                            onClick={handleAddNewCard}
                            disabled={savingCard}
                            className="flex-1 px-4 py-2 glass-button text-black rounded border border-black/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingCard ? 'Saving...' : 'Save Card'}
                          </button>
                          <button
                            onClick={() => {
                              setShowNewCardForm(false);
                              setNewCardData({cardType: 'VISA', cardNumber: '', expirationDate: '', cvv: ''});
                            }}
                            className="px-4 py-2 border border-black/30 rounded text-black hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="text-black/70 mb-3">Please log in to view saved payment methods</p>
                  <div className="p-4 border border-black/20 rounded-lg bg-white/10">
                    <p className="text-sm text-black mb-3">Or enter payment details:</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-black mb-1">Card Type</label>
                        <select
                          value={newCardData.cardType}
                          onChange={(e) => setNewCardData({...newCardData, cardType: e.target.value})}
                          className="w-full p-2 border border-black/20 rounded bg-white/80 text-black"
                        >
                          <option value="VISA">Visa</option>
                          <option value="MASTERCARD">Mastercard</option>
                          <option value="AMEX">American Express</option>
                          <option value="DISCOVER">Discover</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-black mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={newCardData.cardNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                            if (value.replace(/\s/g, '').length <= 16) {
                              setNewCardData({...newCardData, cardNumber: value});
                            }
                          }}
                          className="w-full p-2 border border-black/20 rounded bg-white/80 text-black"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-black mb-1">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={newCardData.expirationDate}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.substring(0, 2) + '/' + value.substring(2, 4);
                              }
                              setNewCardData({...newCardData, expirationDate: value});
                            }}
                            className="w-full p-2 border border-black/20 rounded bg-white/80 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-black mb-1">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            value={newCardData.cvv}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').substring(0, 4);
                              setNewCardData({...newCardData, cvv: value});
                            }}
                            className="w-full p-2 border border-black/20 rounded bg-white/80 text-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
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
                
                <div className="border-t border-white/30 pt-3 space-y-2">
                {/* Promo code input */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-black/90 mb-2">Promotion Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 glass-input px-3 py-2 rounded-lg text-black"
                    />
                    <button
                      onClick={async () => {
                        if (!promoCode || promoCode.trim() === '') {
                          setPromoValidation({ valid: false, discountAmount: null, message: 'Enter a promo code to apply' });
                          return;
                        }
                        setApplyingPromo(true);
                        try {
                          const resp = await apiService.validatePromo(promoCode.trim(), calculateSubtotal());
                          const discount = resp.discount_amount ?? null;
                          setPromoValidation({ valid: true, discountAmount: discount, discountPercent: resp.promotion?.discount_percent ?? null, message: 'Promo applied' });
                        } catch (err) {
                          console.error('Promo validation failed:', err);
                          let msg = 'Failed to validate promo';
                          if (err instanceof Error) msg = err.message;
                          setPromoValidation({ valid: false, discountAmount: null, message: msg });
                        } finally {
                          setApplyingPromo(false);
                        }
                      }}
                      className="px-3 py-2 bg-uga-red/60 text-black rounded-lg"
                      disabled={applyingPromo}
                    >{applyingPromo ? 'Checking...' : 'Apply'}</button>
                  </div>
                </div>
                {promoValidation && (
                  <div className="mt-2 text-sm">
                    {promoValidation.valid ? (
                      promoValidation.discountAmount !== null ? (
                        <div className="text-green-800">Estimated discount: ${promoValidation.discountAmount.toFixed(2)}</div>
                      ) : (
                        <div className="text-green-800">{promoValidation.message || 'Promo applied'}</div>
                      )
                    ) : (
                      <div className="text-red-700">{promoValidation.message || 'Invalid promo'}</div>
                    )}
                  </div>
                )}
                  <div className="flex justify-between text-sm text-black/80">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-black/80">
                    <span>Tax (7%):</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-black/80">
                    <span>Booking Fee (5%):</span>
                    <span>${calculateBookingFee().toFixed(2)}</span>
                  </div>
                  <div className="border-t border-black/20 pt-2">
                    <div className="flex justify-between text-lg font-bold text-black">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
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
                  : isLoggedIn 
                  ? 'Proceed to Payment'
                  : 'Book Tickets'
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
