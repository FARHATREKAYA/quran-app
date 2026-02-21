'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch } from '@/hooks/useQuran';

interface SearchBarProps {
  onSearchResults?: (results: any) => void;
}

export function SearchBar({ onSearchResults }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const { data: searchResults, isLoading } = useSearch(query, query.length >= 2);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.length >= 2 && searchResults) {
      onSearchResults?.(searchResults);
    }
  }, [searchResults, onSearchResults]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search verses..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-emerald-600"></div>
        </div>
      )}
    </div>
  );
}