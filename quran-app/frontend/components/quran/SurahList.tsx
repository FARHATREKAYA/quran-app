'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useSurahs } from '@/hooks/useQuran';
import { SurahCard } from './SurahCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import useQuranStore from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';

export function SurahList() {
  const { data: surahs, isLoading, error, refetch } = useSurahs();
  const [searchQuery, setSearchQuery] = useState('');
  const { language, theme } = useQuranStore();
  const { t } = useTranslation();

  const filteredSurahs = useMemo(() => {
    if (!surahs) return [];
    if (!searchQuery.trim()) return surahs;

    const query = searchQuery.toLowerCase();
    return surahs.filter(
      (surah) =>
        surah.name_english.toLowerCase().includes(query) ||
        surah.name_arabic.includes(query) ||
        surah.name_transliteration.toLowerCase().includes(query) ||
        surah.number.toString() === query
    );
  }, [surahs, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorMessage 
          message={t.failedToLoad} 
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        }`} />
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full rounded-lg border py-3 pl-10 pr-4 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
            theme === 'dark' 
              ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
              : theme === 'sepia'
              ? 'border-amber-300 bg-amber-50 text-amber-900 placeholder-amber-600'
              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : theme === 'sepia' ? 'text-amber-700' : 'text-gray-600'
        }`}>
          {filteredSurahs.length} {filteredSurahs.length !== 1 ? t.surahs : t.surah}
        </p>
      )}

      {/* Surah Grid */}
      {filteredSurahs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSurahs.map((surah) => (
            <SurahCard key={surah.id} surah={surah} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className={
            theme === 'dark' ? 'text-gray-400' : theme === 'sepia' ? 'text-amber-700' : 'text-gray-500'
          }>
            {t.noResults}
          </p>
        </div>
      )}
    </div>
  );
}
