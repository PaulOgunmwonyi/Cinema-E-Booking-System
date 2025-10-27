const API_BASE_URL = 'http://localhost:5001';

export interface Genre {
  id: string;
  name: string;
}

export interface Show {
  id: string;
  movie_id: string;
  start_time: string; 
}

export interface Movie {
  id: string;
  title: string;
  synopsis: string; 
  duration: number;
  mpaa_rating: string;
  release_date: string;
  poster_url: string;
  trailer_url?: string;
  Genres: Genre[];
  Shows: Show[];
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
}

export const apiService = new ApiService();