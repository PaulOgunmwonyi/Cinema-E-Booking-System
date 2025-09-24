'use client';
<<<<<<< HEAD

import { useState, useEffect, useRef } from 'react';
=======
import { useState, useEffect, useRef } from 'react';
import { Genre, apiService } from '../utils/api';
>>>>>>> main

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (query: string, filters?: { genre: string; date: string }) => void;
<<<<<<< HEAD
  triggerElement: HTMLElement | null;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onApplyFilters, triggerElement }) => {
  const [genre, setGenre] = useState('');
  const [date, setDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const genres = [
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Horror',
    'Romance',
    'Sci-Fi',
    'Thriller',
    'Animation',
    'Documentary'
  ];
=======
  onResetFilters: () => void;
  triggerElement: HTMLElement | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  genre: string;
  setGenre: (genre: string) => void;
  date: string;
  setDate: (date: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  onResetFilters,
  triggerElement,
  searchQuery,
  setSearchQuery,
  genre,
  setGenre,
  date,
  setDate
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch genres from API
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genreData = await apiService.getGenres();
        setGenres(genreData);
      } catch (error) {
        console.error('Error fetching genres:', error);
        // Fallback to hardcoded genres if API fails
        setGenres([
          { id: '1', name: 'Action' },
          { id: '2', name: 'Adventure' },
          { id: '3', name: 'Comedy' },
          { id: '4', name: 'Drama' },
          { id: '5', name: 'Horror' },
          { id: '6', name: 'Romance' },
          { id: '7', name: 'Sci-Fi' },
          { id: '8', name: 'Thriller' },
          { id: '9', name: 'Animation' },
          { id: '10', name: 'Documentary' }
        ]);
      } finally {
        setLoadingGenres(false);
      }
    };

    fetchGenres();
  }, []);
>>>>>>> main

  useEffect(() => {
    if (isOpen && triggerElement) {
      const rect = triggerElement.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(8, rect.left - 200) // Ensure it doesn't go off-screen
      });
    }
  }, [isOpen, triggerElement]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && 
          triggerElement && !triggerElement.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerElement]);

  const handleApplyFilters = () => {
    onApplyFilters(searchQuery, { genre, date });
    onClose();
  };

  const handleReset = () => {
<<<<<<< HEAD
    setGenre('');
    setDate('');
    setSearchQuery('');
=======
    onResetFilters();
>>>>>>> main
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed z-50 glass-card animate-in slide-in-from-top-2 duration-300"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        minWidth: '350px',
        maxWidth: '400px'
      }}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
<<<<<<< HEAD
          <h2 className="text-xl font-bold text-uga-white drop-shadow-lg">Search Filters</h2>
          <button
            onClick={onClose}
            className="text-uga-white/70 hover:text-uga-white transition-colors duration-200 text-xl font-bold hover:rotate-90 transform"
=======
          <h2 className="text-xl font-bold text-black drop-shadow-lg">Search Filters</h2>
          <button
            onClick={onClose}
            className="text-black/70 hover:text-black transition-colors duration-200 text-xl font-bold hover:rotate-90 transform"
>>>>>>> main
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Search Query */}
          <div>
<<<<<<< HEAD
            <label className="block text-sm font-medium text-uga-white/90 mb-2">
=======
            <label className="block text-sm font-medium text-black/90 mb-2">
>>>>>>> main
              Search Term
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter movie title..."
<<<<<<< HEAD
              className="glass-input w-full px-4 py-2 rounded-lg text-uga-white placeholder-uga-white/60 focus:outline-none focus:ring-2 focus:ring-uga-white/50"
=======
              className="glass-input w-full px-4 py-2 rounded-lg text-black placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-uga-white/50"
>>>>>>> main
            />
          </div>

          {/* Genre Dropdown */}
          <div>
<<<<<<< HEAD
            <label className="block text-sm font-medium text-uga-white/90 mb-2">
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-lg text-uga-white focus:outline-none focus:ring-2 focus:ring-uga-white/50"
            >
              <option value="" className="bg-uga-arch-black text-uga-white">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g} className="bg-uga-arch-black text-uga-white">
                  {g}
                </option>
              ))}
            </select>
=======
            <label className="block text-sm font-medium text-black/90 mb-2">
              Genre
            </label>
            {loadingGenres ? (
              <div className="glass-input w-full px-4 py-2 rounded-lg text-black/50">
                Loading genres...
              </div>
            ) : (
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="glass-input w-full px-4 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-uga-white/50"
              >
                <option value="" className="bg-uga-arch-black text-uga-white">All Genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.name} className="bg-uga-arch-black text-uga-white">
                    {g.name}
                  </option>
                ))}
              </select>
            )}
>>>>>>> main
          </div>

          {/* Date Input */}
          <div>
<<<<<<< HEAD
            <label className="block text-sm font-medium text-uga-white/90 mb-2">
              Release Date
=======
            <label className="block text-sm font-medium text-black/90 mb-2">
              Show Date
>>>>>>> main
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
<<<<<<< HEAD
              className="glass-input w-full px-4 py-2 rounded-lg text-uga-white focus:outline-none focus:ring-2 focus:ring-uga-white/50"
=======
              className="glass-input w-full px-4 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-uga-white/50"
>>>>>>> main
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleReset}
<<<<<<< HEAD
            className="flex-1 glass-button px-4 py-2 text-uga-white/80 rounded-lg hover:text-uga-white font-medium"
=======
            className="flex-1 glass-button px-4 py-2 text-black/80 rounded-lg hover:text-black font-medium"
>>>>>>> main
          >
            Reset
          </button>
          <button
            onClick={handleApplyFilters}
<<<<<<< HEAD
            className="flex-1 px-4 py-2 bg-uga-red/80 text-uga-white rounded-lg hover:bg-uga-red font-medium shadow-lg backdrop-blur-sm border border-uga-white/20"
          >
            Apply Filters
=======
            className="flex-1 px-4 py-2 bg-uga-red/80 text-black rounded-lg hover:bg-uga-red font-medium shadow-lg backdrop-blur-sm border border-uga-white/20"
          >
            Search
>>>>>>> main
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
