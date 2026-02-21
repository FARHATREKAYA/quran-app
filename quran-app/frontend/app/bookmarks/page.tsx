'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark as BookmarkIcon, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { bookmarksApi, Bookmark } from '@/lib/api';
import useQuranStore from '@/lib/store';

export default function BookmarksPage() {
  const { isAuthenticated, token } = useAuth();
  const { t } = useTranslation();
  const { theme } = useQuranStore();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    loadBookmarks();
  }, [isAuthenticated, token]);

  const loadBookmarks = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await bookmarksApi.getBookmarks(token);
      setBookmarks(data);
    } catch (err) {
      setError('Failed to load bookmarks');
      console.error('Error loading bookmarks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: number) => {
    if (!token) return;
    
    try {
      await bookmarksApi.deleteBookmark(bookmarkId, token);
      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
    } catch (err) {
      console.error('Error deleting bookmark:', err);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-gray-900' : theme === 'sepia' ? 'bg-amber-50' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 text-sm mb-4 transition-colors ${
              theme === 'dark' ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-600'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
          <h1 className={`text-3xl font-bold flex items-center gap-3 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <BookmarkIcon className="h-8 w-8 text-emerald-600" />
            {t.myBookmarks}
          </h1>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className={`rounded-xl p-6 text-center ${
            theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
          }`}>
            <p>{error}</p>
            <button
              onClick={loadBookmarks}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t.retry}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && bookmarks.length === 0 && (
          <div className={`text-center py-12 rounded-xl ${
            theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
          }`}>
            <BookmarkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">{t.noBookmarks}</p>
            <Link
              href="/"
              className="inline-block mt-4 text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              {t.surahs}
            </Link>
          </div>
        )}

        {/* Bookmarks List */}
        {!isLoading && !error && bookmarks.length > 0 && (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className={`rounded-xl border p-6 transition-all hover:shadow-md ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : theme === 'sepia'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      href={`/surah/${bookmark.verse.surah.number}?verse=${bookmark.verse.verse_number_in_surah}`}
                      className={`block text-lg font-semibold mb-2 transition-colors ${
                        theme === 'dark' ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      {bookmark.verse.surah.name_english} - {t.verse} {bookmark.verse.verse_number_in_surah}
                    </Link>
                    <p className={`font-amiri text-right text-xl leading-loose mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`} dir="rtl">
                      {bookmark.verse.text_arabic}
                    </p>
                    {bookmark.notes && (
                      <p className={`text-sm mt-2 italic ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>
                        {bookmark.notes}
                      </p>
                    )}
                    <p className={`text-xs mt-2 ${
                      theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {new Date(bookmark.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark'
                        ? 'text-red-400 hover:bg-red-900/30'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                    aria-label={t.removeBookmark}
                    title={t.removeBookmark}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
