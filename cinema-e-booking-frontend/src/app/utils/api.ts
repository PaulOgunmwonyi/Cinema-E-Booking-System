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

class ApiService {
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
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
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country?: string;
    };
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
}

export const apiService = new ApiService();