'use client';

import { useState, useEffect } from 'react';
import { Volume2, Copy, Check, Volume1, BookOpen, Bookmark, MessageCircle, Flag } from 'lucide-react';
import { Verse } from '@/types/quran';
import useQuranStore from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/lib/AuthContext';
import { bookmarksApi } from '@/lib/api';
import { TafsirModal } from './TafsirModal';
import { CommentsModal } from './CommentsModal';
import { ReportModal } from './ReportModal';

interface VerseDisplayProps {
  verse: Verse;
  isPlaying?: boolean;
  isLoading?: boolean;
  onPlay?: () => void;
}

export function VerseDisplay({ verse, isPlaying = false, isLoading = false, onPlay }: VerseDisplayProps) {
  const { fontSize, showTranslation, theme, language } = useQuranStore();
  const { t } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isTafsirOpen, setIsTafsirOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<number | null>(null);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Get the appropriate translation text based on selected language
  const getTranslationText = () => {
    switch (language) {
      case 'french':
        return verse.text_french || verse.text_english;
      case 'arabic':
        return ''; // No translation in Arabic mode
      case 'english':
      default:
        return verse.text_english;
    }
  };

  // Get translation label for copy
  const getTranslationForCopy = () => {
    switch (language) {
      case 'french':
        return verse.text_french || verse.text_english;
      case 'arabic':
        return '';
      case 'english':
      default:
        return verse.text_english;
    }
  };

  const handleCopy = async () => {
    // Strip HTML tags for copying
    const translationText = getTranslationForCopy();
    let cleanText = '';
    
    if (translationText) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = translationText;
      cleanText = tempDiv.textContent || tempDiv.innerText || '';
    }
    
    const text = cleanText 
      ? `${verse.text_arabic}\n\n${cleanText}\n\n[${verse.surah?.name_english} ${verse.verse_number_in_surah}]`
      : `${verse.text_arabic}\n\n[${verse.surah?.name_english} ${verse.verse_number_in_surah}]`;
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const translationText = getTranslationText();
  const showTranslationSection = showTranslation && language !== 'arabic' && translationText;

  // Check if verse is bookmarked
  useEffect(() => {
    if (isAuthenticated && token) {
      checkBookmarkStatus();
    }
  }, [isAuthenticated, token, verse.id]);

  const checkBookmarkStatus = async () => {
    if (!token) return;
    try {
      const result = await bookmarksApi.checkBookmark(verse.id, token);
      setIsBookmarked(result.is_bookmarked);
      setBookmarkId(result.bookmark_id);
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!isAuthenticated || !token) {
      alert(t.loginToBookmark || 'Please login to bookmark verses');
      return;
    }

    setIsBookmarkLoading(true);
    try {
      if (isBookmarked && bookmarkId) {
        await bookmarksApi.deleteBookmark(bookmarkId, token);
        setIsBookmarked(false);
        setBookmarkId(null);
      } else {
        const result = await bookmarksApi.createBookmark(verse.id, token);
        setIsBookmarked(true);
        setBookmarkId(result.id);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border p-6 transition-all duration-300 ${
      isPlaying 
        ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/20' 
        : theme === 'sepia' 
        ? 'border-amber-200 bg-amber-50' 
        : theme === 'dark' 
        ? 'border-gray-700 bg-gray-800' 
        : 'border-gray-200 bg-white'
    }`}>
      {/* Verse Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex items-center gap-3 ${
          isPlaying ? 'text-emerald-600 dark:text-emerald-400' : ''
        }`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
            isPlaying
              ? 'bg-emerald-600 text-white' 
              : theme === 'sepia' 
              ? 'bg-amber-200 text-amber-900' 
              : theme === 'dark' 
              ? 'bg-gray-700 text-gray-300' 
              : 'bg-emerald-100 text-emerald-700'
          }`}>
            {verse.verse_number_in_surah}
          </div>
          {isPlaying && (
            <div className="flex items-center gap-1">
              <Volume2 className="h-4 w-4 animate-pulse" />
              <span className="text-xs font-medium">{t.playing}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {(verse.tafsir_english || verse.tafsir_french) && (
            <button
              onClick={() => setIsTafsirOpen(true)}
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'text-emerald-400 hover:bg-gray-700'
                  : theme === 'sepia'
                  ? 'text-emerald-700 hover:bg-amber-100'
                  : 'text-emerald-600 hover:bg-gray-100'
              }`}
              aria-label={t.tafsir}
              title={t.tafsir}
            >
              <BookOpen className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onPlay}
            className={`p-2 rounded-full transition-colors ${
              isPlaying 
                ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
            aria-label={t.playFromHere}
            title={t.playFromHere}
          >
            <Volume1 className="h-5 w-5" />
          </button>
      <button
        onClick={handleCopy}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
        aria-label={t.copy}
        title={t.copy}
      >
        {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
      </button>
      {isAuthenticated && (
        <button
          onClick={toggleBookmark}
          disabled={isBookmarkLoading}
          className={`p-2 rounded-full transition-colors ${
            isBookmarked
              ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
          aria-label={isBookmarked ? t.removeBookmark : t.addBookmark}
          title={isBookmarked ? t.removeBookmark : t.addBookmark}
        >
          <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      )}
      {isAuthenticated && (
        <>
          <button
            onClick={() => setIsCommentsOpen(true)}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'text-blue-400 hover:bg-gray-700'
                : 'text-blue-600 hover:bg-gray-100'
            }`}
            aria-label={t.comments || 'Comments'}
            title={t.comments || 'Comments'}
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsReportOpen(true)}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'text-red-400 hover:bg-gray-700'
                : 'text-red-600 hover:bg-gray-100'
            }`}
            aria-label={t.report || 'Report Issue'}
            title={t.report || 'Report Issue'}
          >
            <Flag className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  </div>

      {/* Arabic Text */}
      <p 
        className={`font-amiri text-right leading-loose mb-4 transition-colors ${
          isPlaying 
            ? theme === 'dark' 
              ? 'text-emerald-100' 
              : 'text-emerald-900'
            : theme === 'dark'
            ? 'text-white'
            : theme === 'sepia'
            ? 'text-amber-900'
            : 'text-gray-900'
        }`} 
        style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }} 
        dir="rtl"
      >
        {verse.text_arabic}
        <span className={`inline-block mx-2 ${
          isPlaying 
            ? theme === 'dark' 
              ? 'text-emerald-400' 
              : 'text-emerald-700'
            : 'text-emerald-600'
        }`}>
          ﴿{verse.verse_number_in_surah}﴾
        </span>
      </p>

      {/* Translation */}
      {showTranslationSection && (
        <p 
          className={`leading-relaxed border-t pt-4 mt-4 [&_sup]:text-xs [&_sup]:align-super [&_sup]:text-emerald-600 [&_sup]:ml-0.5 ${
            theme === 'dark' 
              ? 'text-gray-400 border-gray-700' 
              : theme === 'sepia'
              ? 'text-amber-800 border-amber-200'
              : 'text-gray-600 border-gray-200'
          }`}
          style={{ fontSize: `${fontSize - 4}px` }}
          dangerouslySetInnerHTML={{ __html: translationText }}
        />
      )}

      {/* Tafsir Modal */}
      <TafsirModal
        isOpen={isTafsirOpen}
        onClose={() => setIsTafsirOpen(false)}
        verseNumber={verse.verse_number_in_surah}
        verseText={verse.text_arabic}
        tafsirEnglish={verse.tafsir_english}
        tafsirFrench={verse.tafsir_french}
      />

      {/* Comments Modal */}
      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        verseId={verse.id}
        verseNumber={verse.verse_number_in_surah}
        surahName={verse.surah?.name_english || ''}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        verseId={verse.id}
        verseNumber={verse.verse_number_in_surah}
        surahName={verse.surah?.name_english || ''}
      />
    </div>
  );
}
