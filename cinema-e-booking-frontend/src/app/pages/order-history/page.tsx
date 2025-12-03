'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../../utils/api';

interface Booking {
  id: string;
  booking_number: number;
  movie_title: string;
  start_time: string;
  end_time: string;
  showroom_name: string;
  total_amount: number;
  tax_amount: number;
  booking_fee: number;
  discount_amount: number;
  status: string;
  created_at: string;
}

interface BookingDetails extends Booking {
  promotion_code?: string;
  tickets: Array<{
    seat_number: string;
    ticket_category: string;
    price: number;
  }>;
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.fetchApi<{ bookings: Booking[] }>(
        '/api/bookings/history',
        { method: 'GET' },
        true
      );
      // Convert string values to numbers
      const processedBookings = response.bookings.map(booking => ({
        ...booking,
        total_amount: parseFloat(booking.total_amount as any) || 0,
        tax_amount: parseFloat(booking.tax_amount as any) || 0,
        booking_fee: parseFloat(booking.booking_fee as any) || 0,
        discount_amount: parseFloat(booking.discount_amount as any) || 0,
      }));
      setBookings(processedBookings);
    } catch (err: any) {
      setError(err?.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      setDetailsLoading(true);
      const response = await apiService.fetchApi<{
        booking: BookingDetails;
        tickets: Array<{ seat_number: string; ticket_category: string; price: number }>;
      }>(
        `/api/bookings/details/${bookingId}`,
        { method: 'GET' },
        true
      );
      setSelectedBooking({ ...response.booking, tickets: response.tickets });
    } catch (err: any) {
      setError(err?.message || 'Failed to load booking details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return isUpcoming(booking.start_time);
    if (filter === 'past') return !isUpcoming(booking.start_time);
    return true;
  });

  const groupTicketsByCategory = (tickets: Array<{ seat_number: string; ticket_category: string; price: number }>) => {
    const grouped: Record<string, { quantity: number; price: number }> = {};
    tickets.forEach(ticket => {
      if (!grouped[ticket.ticket_category]) {
        grouped[ticket.ticket_category] = { quantity: 0, price: ticket.price };
      }
      grouped[ticket.ticket_category].quantity++;
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uga-red mx-auto mb-4"></div>
          <span className="text-black font-medium">Loading order history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Order History</h1>
          <p className="text-black/70">View and manage your movie bookings</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              filter === 'all'
                ? 'bg-black text-white'
                : 'glass-button text-black border border-black/30'
            }`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              filter === 'upcoming'
                ? 'bg-black text-white'
                : 'glass-button text-black border border-black/30'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              filter === 'past'
                ? 'bg-black text-white'
                : 'glass-button text-black border border-black/30'
            }`}
          >
            Past
          </button>
        </div>

        {error && (
          <div className="glass-card p-4 mb-6 border-l-4 border-red-500">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <svg
              className="w-16 h-16 text-black/30 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-bold text-black mb-2">No Bookings Found</h3>
            <p className="text-black/70 mb-6">
              {filter === 'all' ? "You haven't made any bookings yet." : `No ${filter} bookings found.`}
            </p>
            <button
              onClick={() => router.push('/')}
              className="glass-button px-6 py-3 rounded-lg text-black hover:scale-105 font-medium transition-all duration-300 border border-black/30"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="glass-card p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                onClick={() => fetchBookingDetails(booking.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-black">{booking.movie_title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isUpcoming(booking.start_time)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {isUpcoming(booking.start_time) ? 'Upcoming' : 'Past'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-black/70">
                      <p>
                        <span className="font-medium">Date:</span> {formatDate(booking.start_time)}
                      </p>
                      <p>
                        <span className="font-medium">Time:</span> {formatTime(booking.start_time)}
                      </p>
                      <p>
                        <span className="font-medium">Theater:</span> {booking.showroom_name}
                      </p>
                      <p>
                        <span className="font-medium">Booking ID:</span>{' '}
                        <span className="font-mono text-xs">#{booking.booking_number}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-black mb-1">
                      ${booking.total_amount.toFixed(2)}
                    </div>
                    <button className="glass-button px-4 py-2 rounded-lg text-sm text-black hover:scale-105 font-medium transition-all duration-300 border border-black/30">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {selectedBooking && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedBooking(null)}
          >
            <div
              className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {detailsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uga-red mx-auto mb-4"></div>
                  <span className="text-black font-medium">Loading details...</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-black">Booking Details</h2>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="text-black/50 hover:text-black transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Booking Info */}
                    <div>
                      <h3 className="font-bold text-black mb-3">Order Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-black/70">Booking ID:</span>
                          <span className="font-mono text-black">#{selectedBooking.booking_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Movie:</span>
                          <span className="font-semibold text-black">{selectedBooking.movie_title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Date:</span>
                          <span className="text-black">{formatDate(selectedBooking.start_time)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Time:</span>
                          <span className="text-black">{formatTime(selectedBooking.start_time)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Theater:</span>
                          <span className="text-black">{selectedBooking.showroom_name}</span>
                        </div>
                        {selectedBooking.promotion_code && (
                          <div className="flex justify-between">
                            <span className="text-black/70">Promo Code:</span>
                            <span className="text-green-600 font-semibold">
                              {selectedBooking.promotion_code}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tickets */}
                    <div>
                      <h3 className="font-bold text-black mb-3">Tickets</h3>
                      <div className="space-y-2 text-sm mb-3">
                        {Object.entries(groupTicketsByCategory(selectedBooking.tickets)).map(
                          ([category, { quantity, price }]) => (
                            <div key={category} className="flex justify-between">
                              <span className="text-black/80">
                                {category} x{quantity}
                              </span>
                              <span className="text-black">${(price * quantity).toFixed(2)}</span>
                            </div>
                          )
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedBooking.tickets.map((ticket) => (
                          <span
                            key={ticket.seat_number}
                            className="px-3 py-1 bg-black/10 rounded-lg text-sm font-medium text-black"
                          >
                            {ticket.seat_number}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div>
                      <h3 className="font-bold text-black mb-3">Payment Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-black/70">Subtotal:</span>
                          <span className="text-black">
                            ${(
                              Number(selectedBooking.total_amount) -
                              Number(selectedBooking.tax_amount) -
                              Number(selectedBooking.booking_fee) +
                              Number(selectedBooking.discount_amount)
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Tax (7%):</span>
                          <span className="text-black">${Number(selectedBooking.tax_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Booking Fee:</span>
                          <span className="text-black">${Number(selectedBooking.booking_fee).toFixed(2)}</span>
                        </div>
                        {selectedBooking.discount_amount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-${Number(selectedBooking.discount_amount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-black/20 pt-2 flex justify-between text-lg font-bold">
                          <span className="text-black">Total Paid:</span>
                          <span className="text-black">${Number(selectedBooking.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 glass-button px-4 py-3 rounded-lg text-black hover:scale-105 font-medium transition-all duration-300 border border-black/30"
                    >
                      Print Ticket
                    </button>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="flex-1 glass-button px-4 py-3 rounded-lg text-black hover:scale-105 font-medium transition-all duration-300 border border-black/30"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}