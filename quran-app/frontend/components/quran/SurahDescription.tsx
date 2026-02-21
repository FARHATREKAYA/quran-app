'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import useQuranStore from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';

interface SurahDescriptionProps {
  description?: string;
}

export function SurahDescription({ description }: SurahDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useQuranStore();
  const { t } = useTranslation();

  if (!description) return null;

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          container: 'bg-gray-800 border-gray-700',
          title: 'text-emerald-400',
          text: 'text-gray-300',
          button: 'text-emerald-400 hover:bg-gray-700',
        };
      case 'sepia':
        return {
          container: 'bg-amber-50 border-amber-200',
          title: 'text-emerald-700',
          text: 'text-amber-900',
          button: 'text-emerald-700 hover:bg-amber-100',
        };
      case 'light':
      default:
        return {
          container: 'bg-gray-50 border-gray-200',
          title: 'text-emerald-700',
          text: 'text-gray-700',
          button: 'text-emerald-600 hover:bg-gray-100',
        };
    }
  };

  const classes = getThemeClasses();

  return (
    <div className={`rounded-xl border p-4 mb-6 ${classes.container}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between gap-2 ${classes.button} rounded-lg p-2 transition-colors`}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <span className={`font-semibold ${classes.title}`}>
            {t.aboutThisSurah || 'About this Surah'}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>
      
      {isExpanded && (
        <div className={`mt-4 prose prose-sm max-w-none ${classes.text}`}>
          <div 
            dangerouslySetInnerHTML={{ __html: description }}
            className="leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}
