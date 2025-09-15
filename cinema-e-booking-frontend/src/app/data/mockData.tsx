export interface Movie {
  id: number;
  title: string;
  genre: string;
  releaseDate: string;
  rating: number;
  description: string;
  poster: string;
}

export const mockMovies: Movie[] = [
  {
    id: 1,
    title: "The Dark Knight",
    genre: "Action",
    releaseDate: "2008-07-18",
    rating: 9.0,
    description: "Batman faces his greatest challenge yet as the Joker wreaks havoc on Gotham City.",
    poster: "/api/placeholder/300/450"
  },
  {
    id: 2,
    title: "Inception",
    genre: "Sci-Fi",
    releaseDate: "2010-07-16",
    rating: 8.8,
    description: "A thief who steals corporate secrets through dream-sharing technology.",
    poster: "/api/placeholder/300/450"
  },
  {
    id: 3,
    title: "The Shawshank Redemption",
    genre: "Drama",
    releaseDate: "1994-09-23",
    rating: 9.3,
    description: "Two imprisoned men bond over years, finding solace and redemption.",
    poster: "/api/placeholder/300/450"
  },
  {
    id: 4,
    title: "Pulp Fiction",
    genre: "Crime",
    releaseDate: "1994-10-14",
    rating: 8.9,
    description: "The lives of two mob hitmen, a boxer, and others intertwine in violent ways.",
    poster: "/api/placeholder/300/450"
  },
  {
    id: 5,
    title: "The Godfather",
    genre: "Drama",
    releaseDate: "1972-03-24",
    rating: 9.2,
    description: "The aging patriarch of an organized crime dynasty transfers control to his son.",
    poster: "/api/placeholder/300/450"
  }
];