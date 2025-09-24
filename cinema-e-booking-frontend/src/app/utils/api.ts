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
  private async fetchApi<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
}

export const apiService = new ApiService();