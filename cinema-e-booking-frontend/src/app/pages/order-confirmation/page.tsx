'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface OrderDetails {
  bookingId: string;
  movieTitle: string;
  showDate: string;
  showTime: string;
  seats: string[];
  subtotal: number;
  discount?: number;
  tax: number;
  bookingFee: number;
  total: number;
  tickets: Array<{
    category: string;
    quantity: number;
    price: number;
  }>;
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get order details from URL parameters
    const bookingId = searchParams.get('bookingId');
    const movieTitle = searchParams.get('movieTitle');
    const showDate = searchParams.get('showDate');
    const showTime = searchParams.get('showTime');
    const seats = searchParams.get('seats')?.split(',') || [];
    const subtotal = parseFloat(searchParams.get('subtotal') || '0');
    const discount = parseFloat(searchParams.get('discount') || '0');
    const tax = parseFloat(searchParams.get('tax') || '0');
    const bookingFee = parseFloat(searchParams.get('bookingFee') || '0');
    const total = parseFloat(searchParams.get('total') || '0');
    const ticketsParam = searchParams.get('tickets');

    if (bookingId && movieTitle) {
      const tickets = ticketsParam ? JSON.parse(decodeURIComponent(ticketsParam)) : [];
      
      setOrderDetails({
        bookingId,
        movieTitle,
        showDate: showDate || '',
        showTime: showTime || '',
        seats,
        subtotal,
        discount,
        tax,
        bookingFee,
        total,
        tickets
      });
    }
    
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uga-red mx-auto mb-4"></div>
          <span className="text-black font-medium">Loading order confirmation...</span>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Order Not Found</h1>
          <p className="text-black/70 mb-6">We could not find your order details.</p>
          <button
            onClick={() => router.push('/')}
            className="glass-button px-6 py-3 rounded-lg text-black hover:scale-105 font-medium transition-all duration-300 border border-black/30"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Booking Confirmed!</h1>
          <p className="text-black/70">Your tickets have been successfully reserved.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-black mb-4">Order Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-black/70">Booking ID:</span>
                <span className="font-mono text-sm text-black">{orderDetails.bookingId}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-black/70">Movie:</span>
                <span className="font-semibold text-black">{orderDetails.movieTitle}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-black/70">Date:</span>
                <span className="text-black">{formatDate(orderDetails.showDate)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-black/70">Time:</span>
                <span className="text-black">{orderDetails.showTime}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-black/70">Seats:</span>
                <span className="text-black">{orderDetails.seats.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Ticket Information */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-black mb-4">Ticket Information</h2>
            
            <div className="space-y-3 mb-4">
              {orderDetails.tickets.map((ticket, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-black/80">{ticket.category} x{ticket.quantity}</span>
                  <span className="text-black">${(ticket.price * ticket.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-black/20 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-black/70">Subtotal:</span>
                <span className="text-black">${orderDetails.subtotal.toFixed(2)}</span>
              </div>
              {orderDetails.discount && orderDetails.discount > 0 && (
                <div className="flex justify-between text-sm text-green-800">
                  <span className="">Discount:</span>
                  <span className="">-${orderDetails.discount.toFixed(2)}</span>
                </div>
              )}
              {orderDetails.discount && orderDetails.discount > 0 ? (
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-black/80">Subtotal after discount:</span>
                  <span className="text-black">${(orderDetails.subtotal - orderDetails.discount).toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm">
                <span className="text-black/70">Tax (7%):</span>
                <span className="text-black">${orderDetails.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/70">Booking Fee (5%):</span>
                <span className="text-black">${orderDetails.bookingFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-black/20 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-black">Total Paid:</span>
                  <span className="text-black">${orderDetails.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="glass-card p-6 mt-8">
          <h2 className="text-xl font-bold text-black mb-4">Important Information</h2>
          <div className="space-y-2 text-black/80">
            <p>• Please arrive at the theater at least 15 minutes before showtime.</p>
            <p>• Present your booking ID at the counter to collect your tickets.</p>
            <p>• Your seats are reserved and guaranteed.</p>
            <p>• For any changes or cancellations, please contact our customer service.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <button
            onClick={() => router.push('/')}
            className="glass-button px-8 py-3 rounded-lg text-black hover:scale-105 font-semibold transition-all duration-300 border border-black/30"
          >
            Return to Home
          </button>
          <button
            onClick={() => window.print()}
            className="glass-button px-8 py-3 rounded-lg text-black hover:scale-105 font-semibold transition-all duration-300 border border-black/30"
          >
            Print Confirmation
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <p className="text-black text-lg">Loading confirmation...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}