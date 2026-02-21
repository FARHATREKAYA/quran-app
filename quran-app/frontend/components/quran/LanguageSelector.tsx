'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import useQuranStore from '@/lib/store';
import { TranslationLanguage } from '@/types/quran';
import { useTranslation } from '@/hooks/useTranslation';

interface LanguageSelectorProps {
  onLanguageChange?: (language: TranslationLanguage) => void;
}

export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const { language, setLanguage, theme } = useQuranStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageSelect = (selectedLanguage: TranslationLanguage) => {
    setLanguage(selectedLanguage);
    onLanguageChange?.(selectedLanguage);
    setIsOpen(false);
  };

  const LANGUAGES: { value: TranslationLanguage; label: string; flag: string; description: string }[] = [
    { value: 'english', label: t.english, flag: '🇬🇧', description: t.englishDesc },
    { value: 'french', label: t.french, flag: '🇫🇷', description: t.frenchDesc },
    { value: 'arabic', label: t.arabic, flag: '🇹🇳', description: t.arabicDesc },
  ];

  const currentLanguage = LANGUAGES.find(l => l.value === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          theme === 'dark'
            ? 'text-gray-300 hover:bg-gray-800'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-label={t.selectLanguage}
        title={t.selectLanguage}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLanguage?.flag}</span>
        <span className="hidden md:inline">{currentLanguage?.label}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute right-0 top-full mt-2 w-64 rounded-xl shadow-lg border z-50 overflow-hidden ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className={`px-4 py-3 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
            }`}>
              <p className={`text-xs font-medium uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {t.selectLanguage}
              </p>
            </div>
            <div className="py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => handleLanguageSelect(lang.value)}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 ${
                    language === lang.value
                      ? theme === 'dark'
                        ? 'bg-emerald-900/30 text-emerald-400'
                        : 'bg-emerald-50 text-emerald-700'
                      : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{lang.label}</p>
                    <p className={`text-xs mt-0.5 ${
                      language === lang.value
                        ? theme === 'dark' ? 'text-emerald-300' : 'text-emerald-600'
                        : theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {lang.description}
                    </p>
                  </div>
                  {language === lang.value && (
                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
