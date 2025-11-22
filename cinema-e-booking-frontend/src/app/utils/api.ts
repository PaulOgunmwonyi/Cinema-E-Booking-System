const API_BASE_URL = 'http://localhost:5001';

export interface Genre {
  id: string;
  name: string;
}

export interface Show {
  id: string;
  movie_id: string;
  showroom_id: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  is_active: boolean;
  created_at?: string;
  Movie?: Movie;
  Showroom?: Showroom;
}

export interface Movie {
  id: string;
  title: string;
  synopsis?: string;
  duration_minutes?: number;
  mpaa_rating: string;
  release_date?: string;
  director?: string;
  producer?: string;
  poster_url?: string;
  trailer_url?: string;
  created_at?: string;
  updated_at?: string;
  Genres?: Genre[];
  Shows?: Show[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface PaymentCard {
  id: string;
  cardType: string;
  cardNumber?: string;
  expirationDate?: string; 
}

export interface Showroom {
  id: string;
  name: string;
  capacity: number;
}

export interface Promotion {
  id: string;
  code: string;
  title?: string;
  description?: string;
  start_date: string;
  end_date: string;
  discount_percent: number;
  created_at?: string;
  updated_at?: string;
}

export interface Seat {
  id: string;
  row_label: string;
  seat_number: number;
  is_available: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  show_id: string;
  total_amount: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  created_at?: string;
}

export interface Ticket {
  id: string;
  booking_id: string;
  show_id: string;
  seat_number: string;
  ticket_category: string;
  price: number;
}

export interface AdminMenuItem {
  label: string;
  path: string;
}

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  promotions: boolean;
  address?: Address;
  paymentCards: PaymentCard[];
}

export interface BackendProfileResponse {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    promo_opt_in: boolean;
  };
  address?: {
    id: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  cards: Array<{
    id: string;
    card_type: string;
    expiration_date: string;
  }>;
}

function getAccessToken() {
  const tokens = localStorage.getItem('cinema_tokens');
  if (!tokens) return null;
  try {
    return JSON.parse(tokens).accessToken;
  } catch {
    return null;
  }
}

class ApiService {
  private async fetchApi<T>(endpoint: string, options?: RequestInit, auth: boolean = false): Promise<T> {
    const accessToken = auth ? getAccessToken() : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options?.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all movies with their genres and shows
  async getMovies(): Promise<Movie[]> {
    return this.fetchApi<Movie[]>('/movies');
  }

  // Get a specific movie by ID
  async getMovie(id: string): Promise<Movie> {
    return this.fetchApi<Movie>(`/movies/${id}`);
  }

  // Get all genres
  async getGenres(): Promise<Genre[]> {
    return this.fetchApi<Genre[]>('/genres');
  }

  // Get all shows
  async getShows(): Promise<Show[]> {
    return this.fetchApi<Show[]>('/shows');
  }

  // Authentication methods
  async registerUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    promoOptIn?: boolean;
    address?: Address;
    cards?: Array<{
      cardType: string;
      cardNumber: string;
      expirationDate: string;
      isDefault?: boolean;
    }>;
  }): Promise<{ message: string }> {
    return this.fetchApi<{ message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyEmail(email: string, code: string): Promise<{ message: string }> {
    return this.fetchApi<{ message: string }>('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async loginUser(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<{
    message: string;
    accessToken: string;
    refreshToken: string;
    role: string;
  }> {
    return this.fetchApi<{
      message: string;
      accessToken: string;
      refreshToken: string;
      role: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.fetchApi<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.fetchApi<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }
  // Get current user's profile
  async getProfile(): Promise<BackendProfileResponse> {
    return this.fetchApi<BackendProfileResponse>('/api/profile/me', { method: 'GET' }, true);
  }

  // Update current user's profile
  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    password?: string;
    address?: Address;
    promoOptIn?: boolean;
  }): Promise<{ message: string }> {
    return this.fetchApi('/api/profile/edit', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  // Add a payment card
  async addPaymentCard(card: {
    cardType: string;
    cardNumber: string;
    expirationDate: string;
  }): Promise<{ message: string }> {
    return this.fetchApi('/api/profile/edit', {
      method: 'PUT',
      body: JSON.stringify({ card }),
    }, true);
  }

  // Remove a payment card
  async removePaymentCard(cardId: string): Promise<{ message: string }> {
    return this.fetchApi('/api/profile/edit', {
      method: 'PUT',
      body: JSON.stringify({ removeCardId: cardId }),
    }, true);
  }

  // Admin methods
  async getAdminHome(): Promise<{ menu: AdminMenuItem[] }> {
    return this.fetchApi<{ menu: AdminMenuItem[] }>('/api/admin', { method: 'GET' }, true);
  }

  // Admin - Movie management
  async addMovie(movieData: {
    title: string;
    synopsis: string;
    director: string;
    cast?: string[];
    language: string;
    rating: string;
    duration_minutes: number;
    release_date: string;
    poster_url: string;
    trailer_url?: string;
    genres?: string[];
  }): Promise<{ message: string; movie: Movie }> {
    return this.fetchApi<{ message: string; movie: Movie }>('/api/admin/movies', {
      method: 'POST',
      body: JSON.stringify(movieData),
    }, true);
  }

  async getAdminMovies(): Promise<{ movies: Movie[] }> {
    return this.fetchApi<{ movies: Movie[] }>('/api/admin/movies', { method: 'GET' }, true);
  }

  // Admin - Showtime management
  async addShowtime(showtimeData: {
    movie_id: string;
    showroom_id: string;
    start_time: string;
    end_time: string;
  }): Promise<{ message: string; show: Show }> {
    return this.fetchApi<{ message: string; show: Show }>('/api/admin/showtimes', {
      method: 'POST',
      body: JSON.stringify(showtimeData),
    }, true);
  }

  async getAdminShowtimes(): Promise<{ shows: Show[] }> {
    return this.fetchApi<{ shows: Show[] }>('/api/admin/showtimes', { method: 'GET' }, true);
  }

  // Admin - Promotion management
  async createPromotion(promotionData: {
    code: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    discount_percent: number;
  }): Promise<{ message: string; promotion: Promotion }> {
    return this.fetchApi<{ message: string; promotion: Promotion }>('/api/admin/promotions', {
      method: 'POST',
      body: JSON.stringify(promotionData),
    }, true);
  }

  async sendPromotion(code: string): Promise<{ message: string }> {
    return this.fetchApi<{ message: string }>('/api/admin/promotions/send', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }, true);
  }

  // Booking methods
  async getAvailableSeats(showId: string): Promise<{ 
    show_id: string; 
    seats: Seat[]; 
    showroom: { id: string; name: string; capacity: number } 
  }> {
    return this.fetchApi<{ 
      show_id: string; 
      seats: Seat[]; 
      showroom: { id: string; name: string; capacity: number } 
    }>(`/api/bookings/seats/${showId}`, {
      method: 'GET'
    }, true);
  }

  async reserveSeats(bookingData: {
    user_id: string;
    show_id: string;
    seat_ids: string[];
    ticket_category: string;
    price: number;
  }): Promise<{ message: string; booking_id: string }> {
    return this.fetchApi<{ message: string; booking_id: string }>('/api/bookings/reserve', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }, true);
  }
}

export const apiService = new ApiService();