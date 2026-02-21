'use client';

import Link from 'next/link';
import { Surah } from '@/types/quran';
import useQuranStore from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';

interface SurahCardProps {
  surah: Surah;
}

export function SurahCard({ surah }: SurahCardProps) {
  const { language, theme } = useQuranStore();
  const { t } = useTranslation();

  const isRTL = language === 'arabic';

  // Get theme-based classes
  const getCardClasses = () => {
    const baseClasses = 'group block rounded-xl border p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-500';
    
    switch (theme) {
      case 'dark':
        return `${baseClasses} border-gray-700 bg-gray-800 dark:hover:border-emerald-500`;
      case 'sepia':
        return `${baseClasses} border-amber-200 bg-amber-50 hover:border-emerald-500`;
      case 'light':
      default:
        return `${baseClasses} border-gray-200 bg-white hover:border-emerald-500`;
    }
  };

  const getTextClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          title: 'text-white group-hover:text-emerald-400',
          subtitle: 'text-gray-400',
          arabic: 'text-white',
        };
      case 'sepia':
        return {
          title: 'text-amber-900 group-hover:text-emerald-700',
          subtitle: 'text-amber-700',
          arabic: 'text-amber-900',
        };
      case 'light':
      default:
        return {
          title: 'text-gray-900 group-hover:text-emerald-600',
          subtitle: 'text-gray-500',
          arabic: 'text-gray-900',
        };
    }
  };

  const textClasses = getTextClasses();

  return (
    <Link
      href={`/surah/${surah.number}`}
      className={`${getCardClasses()} ${isRTL ? 'rtl' : 'ltr'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
            theme === 'dark' 
              ? 'bg-emerald-900 text-emerald-300' 
              : theme === 'sepia'
              ? 'bg-amber-200 text-amber-900'
              : 'bg-emerald-100 text-emerald-700'
          }`}>
            <span className="text-lg font-bold">{surah.number}</span>
          </div>
          <div>
            <h3 className={`text-lg font-semibold transition-colors ${textClasses.title}`}>
              {surah.name_english}
            </h3>
            <p className={`text-sm ${textClasses.subtitle}`}>
              {surah.name_transliteration} • {surah.verse_count} {t.verses}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-amiri text-2xl ${textClasses.arabic}`}>
            {surah.name_arabic}
          </p>
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            surah.revelation_type === 'Meccan' 
              ? theme === 'dark'
                ? 'bg-amber-900 text-amber-300'
                : 'bg-amber-100 text-amber-800'
              : theme === 'dark'
              ? 'bg-blue-900 text-blue-300'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {surah.revelation_type === 'Meccan' ? t.meccan : t.medinan}
          </span>
        </div>
      </div>
    </Link>
  );
}
