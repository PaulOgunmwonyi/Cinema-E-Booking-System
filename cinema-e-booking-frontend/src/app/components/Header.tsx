'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchModal from './SearchModal';

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [date, setDate] = useState('');
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const handleSearch = (query: string, filters?: { genre: string; date: string }) => {
    const searchParams = new URLSearchParams();
    if (query) searchParams.set('q', query);
    if (filters?.genre) searchParams.set('genre', filters.genre);
    if (filters?.date) searchParams.set('date', filters.date);
    
    router.push(`/pages/searchResults?${searchParams.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearch(searchQuery, { genre, date });
    }
  };

  const handleApplyFilters = (query: string, filters?: { genre: string; date: string }) => {
    // Update the states with the filter values
    setSearchQuery(query);
    if (filters) {
      setGenre(filters.genre);
      setDate(filters.date);
    }
    handleSearch(query, filters);
  };

  const handleResetFilters = () => {
    setGenre('');
    setDate('');
    setSearchQuery('');
  };

  return (
    <>
      <header className="glass-header border-b border-uga-white/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-white hover:text-gray-200 transition-colors duration-300">
                Cinema
              </Link>
              <Link href="/" className="text-white hover:text-gray-200 transition-colors duration-300 font-bold">
                Home
              </Link>
            </div>

            {/* Right side - Search */}
            <div className="flex items-center space-x-3 relative">
              <button
                ref={filterButtonRef}
                onClick={() => setIsModalOpen(true)}
                className="glass-button px-6 py-2 rounded-full font-bold text-white hover:text-gray-200 shadow-lg"
              >
                <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                Filter
              </button>
              
              <form onSubmit={handleSearchSubmit} className="flex">
                <input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input px-4 py-2 w-64 rounded-l-full text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
                  className="glass-button px-6 py-2 rounded-r-full font-bold text-white hover:text-gray-200 shadow-lg border-l-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        triggerElement={filterButtonRef.current}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        genre={genre}
        setGenre={setGenre}
        date={date}
        setDate={setDate}
      />
    </>
  );
};

export default Header;
