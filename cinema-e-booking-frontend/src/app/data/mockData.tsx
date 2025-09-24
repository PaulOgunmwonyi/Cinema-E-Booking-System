export interface Movie {
  id: number;
  title: string;
  genre: string;
  releaseDate: string;
  rating: number;
  description: string;
  poster: string;
  showDates: string[];
  showTimes: string[];
}

export const mockMovies: Movie[] = [
  {
    id: 1,
    title: "The Dark Knight",
    genre: "Action",
    releaseDate: "2008-07-18",
    rating: 9.0,
    description: "Batman faces his greatest challenge yet as the Joker wreaks havoc on Gotham City.",
    poster: "/api/placeholder/300/450",
    showDates: ["2025-09-15", "2025-09-16", "2025-09-17", "2025-09-18", "2025-09-19"],
    showTimes: ["10:00 AM", "1:00 PM", "4:00 PM", "7:00 PM", "10:00 PM"]
  },
  {
    id: 2,
    title: "Inception",
    genre: "Sci-Fi",
    releaseDate: "2010-07-16",
    rating: 8.8,
    description: "A thief who steals corporate secrets through dream-sharing technology.",
    poster: "/api/placeholder/300/450",
    showDates: ["2025-09-15", "2025-09-16", "2025-09-17", "2025-09-20", "2025-09-21"],
    showTimes: ["11:00 AM", "2:00 PM", "5:00 PM", "8:00 PM", "10:30 PM"]
  },
  {
    id: 3,
    title: "The Shawshank Redemption",
    genre: "Drama",
    releaseDate: "1994-09-23",
    rating: 9.3,
    description: "Two imprisoned men bond over years, finding solace and redemption.",
    poster: "/api/placeholder/300/450",
    showDates: ["2025-09-14", "2025-09-15", "2025-09-16", "2025-09-17"],
    showTimes: ["12:00 PM", "3:00 PM", "6:00 PM", "9:00 PM"]
  },
  {
    id: 4,
    title: "Pulp Fiction",
    genre: "Crime",
    releaseDate: "1994-10-14",
    rating: 8.9,
    description: "The lives of two mob hitmen, a boxer, and others intertwine in violent ways.",
    poster: "/api/placeholder/300/450",
    showDates: ["2025-09-16", "2025-09-17", "2025-09-18", "2025-09-19", "2025-09-22"],
    showTimes: ["1:30 PM", "4:30 PM", "7:30 PM", "10:30 PM"]
  },
  {
    id: 5,
    title: "The Godfather",
    genre: "Drama",
    releaseDate: "1972-03-24",
    rating: 9.2,
    description: "The aging patriarch of an organized crime dynasty transfers control to his son.",
    poster: "/api/placeholder/300/450",
    showDates: ["2025-09-15", "2025-09-18", "2025-09-20", "2025-09-22"],
    showTimes: ["11:30 AM", "2:30 PM", "5:30 PM", "8:30 PM"]
  }
];