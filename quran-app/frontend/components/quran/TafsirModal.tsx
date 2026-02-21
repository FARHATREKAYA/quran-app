'use client';

import { X, BookOpen } from 'lucide-react';
import useQuranStore from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';

interface TafsirModalProps {
  isOpen: boolean;
  onClose: () => void;
  verseNumber: number;
  verseText: string;
  tafsirEnglish?: string;
  tafsirFrench?: string;
}

export function TafsirModal({
  isOpen,
  onClose,
  verseNumber,
  verseText,
  tafsirEnglish,
  tafsirFrench,
}: TafsirModalProps) {
  const { theme, language } = useQuranStore();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          overlay: 'bg-black/70',
          modal: 'bg-gray-900 border-gray-700',
          header: 'border-gray-700',
          title: 'text-white',
          verse: 'text-emerald-400',
          text: 'text-gray-300',
          close: 'text-gray-400 hover:text-white hover:bg-gray-800',
        };
      case 'sepia':
        return {
          overlay: 'bg-black/50',
          modal: 'bg-[#f4ecd8] border-amber-300',
          header: 'border-amber-300',
          title: 'text-amber-900',
          verse: 'text-emerald-700',
          text: 'text-amber-900',
          close: 'text-amber-700 hover:text-amber-900 hover:bg-amber-200',
        };
      case 'light':
      default:
        return {
          overlay: 'bg-black/50',
          modal: 'bg-white border-gray-200',
          header: 'border-gray-200',
          title: 'text-gray-900',
          verse: 'text-emerald-600',
          text: 'text-gray-700',
          close: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        };
    }
  };

  const classes = getThemeClasses();

  const getTafsirText = () => {
    switch (language) {
      case 'french':
        return tafsirFrench || tafsirEnglish || t.noTafsirAvailable;
      case 'english':
      default:
        return tafsirEnglish || t.noTafsirAvailable;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${classes.overlay}`}>
      <div className={`relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border shadow-2xl ${classes.modal}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${classes.header}`}>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            <h3 className={`text-lg font-semibold ${classes.title}`}>
              {t.tafsir || 'Tafsir'} - {t.verse || 'Verse'} {verseNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${classes.close}`}
            aria-label={t.close || 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Verse Text */}
          <div className={`mb-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : theme === 'sepia' ? 'bg-amber-100' : 'bg-gray-50'}`}>
            <p className={`font-amiri text-right text-lg ${classes.verse}`} dir="rtl">
              {verseText}
            </p>
          </div>

          {/* Tafsir */}
          <div className={`prose prose-sm max-w-none ${classes.text}`}>
            <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${classes.title}`}>
              {t.explanation || 'Explanation'}
            </h4>
            <div 
              dangerouslySetInnerHTML={{ __html: getTafsirText() || '' }}
              className="leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${classes.header} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors`}
          >
            {t.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
