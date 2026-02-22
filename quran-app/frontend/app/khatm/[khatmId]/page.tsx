'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  SkipForward,
  Target,
  ArrowRight,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { khatmApi, KhatmSession } from '@/lib/api';
import useQuranStore from '@/lib/store';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns';

interface KhatmDetails {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  frequency_type: string;
  reading_days?: string[];
  reading_time: string;
  reading_mode: string;
  enable_audio_break: boolean;
  total_sessions: number;
  completed_sessions: number;
  total_verses: number;
  completed_verses: number;
  progress_percentage: number;
  is_active: boolean;
  is_completed: boolean;
  reminder_minutes_before?: number;
  sessions: KhatmSession[];
}

export default function KhatmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const khatmId = parseInt(params.khatmId as string);
  
  const { token } = useAuth();
  const { t } = useTranslation();
  const { theme } = useQuranStore();
  
  const [khatm, setKhatm] = useState<KhatmDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (token && khatmId) {
      loadKhatm();
    }
  }, [token, khatmId]);

  const loadKhatm = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await khatmApi.getKhatmDetails(khatmId, token);
      setKhatm(data);
    } catch (err) {
      setError('Failed to load Khatm details');
      console.error('Error loading khatm:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKhatm = async () => {
    if (!token || !confirm(t.deleteKhatmConfirm || 'Are you sure?')) return;
    
    try {
      await khatmApi.deleteKhatm(khatmId, token);
      router.push('/khatm');
    } catch (err) {
      console.error('Error deleting khatm:', err);
    }
  };

  const getSessionForDate = (date: Date): KhatmSession | undefined => {
    if (!khatm) return undefined;
    return khatm.sessions.find(session => 
      isSameDay(parseISO(session.scheduled_date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500';
      case 'skipped': return 'bg-amber-500';
      case 'missed': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'skipped': return <SkipForward className="h-4 w-4 text-amber-500" />;
      case 'missed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error || !khatm) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            {error || 'Khatm not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${
      theme === 'dark' ? 'bg-gray-900' : theme === 'sepia' ? 'bg-amber-50' : 'bg-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-1 w-full">
        {/* Header - Mobile optimized */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link
            href="/khatm"
            className={`inline-flex items-center gap-2 text-xs sm:text-sm transition-colors ${
              theme === 'dark' ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-600'
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{t.backToKhatm || 'Back to Khatm'}</span>
          </Link>
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 truncate ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {khatm.title}
              </h1>
              {khatm.description && (
                <p className={`text-xs sm:text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {khatm.description}
                </p>
              )}
            </div>
            <button
              onClick={handleDeleteKhatm}
              className={`p-2 sm:p-3 rounded-lg transition-colors flex-shrink-0 ${
                theme === 'dark'
                  ? 'text-red-400 hover:bg-red-900/30'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Progress Overview - Mobile optimized */}
        <div className={`rounded-xl border p-4 sm:p-6 mb-6 sm:mb-8 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            <div className="text-center">
              <p className={`text-xl sm:text-3xl font-bold ${
                theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {Math.round(khatm.progress_percentage)}%
              </p>
              <p className={`text-xs sm:text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t.completed}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-xl sm:text-3xl font-bold ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {khatm.completed_sessions} <span className="text-sm font-normal">/ {khatm.total_sessions}</span>
              </p>
              <p className={`text-xs sm:text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t.sessions}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-xl sm:text-3xl font-bold ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`}>
                <span className="text-sm sm:text-base">{khatm.completed_verses.toLocaleString()}</span>
                <span className="text-xs sm:text-sm font-normal mx-1">/</span>
                <span className="text-xs sm:text-sm">{khatm.total_verses.toLocaleString()}</span>
              </p>
              <p className={`text-xs sm:text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t.verses}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-xl sm:text-3xl font-bold ${
                theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
              }`}>
                {khatm.total_sessions - khatm.completed_sessions}
              </p>
              <p className={`text-xs sm:text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t.remaining}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 sm:mt-6">
            <div className={`h-3 sm:h-4 rounded-full ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                style={{ width: `${khatm.progress_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Calendar View - Mobile optimized */}
        <div className={`rounded-xl border p-3 sm:p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className={`text-lg sm:text-xl font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {t.calendar || 'Calendar'}
            </h2>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <span className={`font-medium min-w-[100px] sm:min-w-[140px] text-center text-sm sm:text-base ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          {/* Days Header - Mobile optimized */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
            {[
              { key: 'sun', label: 'S' },
              { key: 'mon', label: 'M' },
              { key: 'tue', label: 'T' },
              { key: 'wed', label: 'W' },
              { key: 'thu', label: 'T' },
              { key: 'fri', label: 'F' },
              { key: 'sat', label: 'S' },
            ].map(({ key, label }) => (
              <div key={key} className={`text-center text-xs sm:text-sm font-medium py-1 sm:py-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {(t as Record<string, string>)[key] || label}
              </div>
            ))}
          </div>

          {/* Calendar Grid - Mobile optimized */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {daysInMonth.map((date) => {
              const session = getSessionForDate(date);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={date.toISOString()}
                  className={`aspect-square rounded-lg p-1 sm:p-2 relative transition-all min-h-[40px] sm:min-h-[60px] flex flex-col ${
                    session
                      ? theme === 'dark'
                        ? 'bg-gray-700 cursor-pointer hover:bg-gray-600'
                        : 'bg-gray-50 cursor-pointer hover:bg-gray-100'
                      : theme === 'dark'
                      ? 'bg-gray-800/50'
                      : 'bg-gray-50/50'
                  } ${isTodayDate ? 'ring-2 ring-emerald-500' : ''}`}
                >
                  <span className={`text-xs sm:text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {format(date, 'd')}
                  </span>

                  {session && (
                    <div className="absolute bottom-1 right-1 left-1 flex flex-col items-center">
                      {/* Status indicator dot */}
                      <div className={`w-2 h-2 rounded-full mb-0.5 ${getStatusColor(session.status)}`} />
                      {/* Verse count - hidden on very small screens */}
                      <div className={`hidden sm:flex items-center justify-center gap-0.5 text-[10px] px-1 rounded ${
                        session.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : session.status === 'skipped'
                          ? 'bg-amber-500/20 text-amber-400'
                          : session.status === 'missed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        <BookOpen className="h-2.5 w-2.5" />
                        {session.verse_count}
                      </div>
                    </div>
                  )}

                  {session && (
                    <Link
                      href={`/khatm/${khatm.id}/session/${session.id}`}
                      className="absolute inset-0"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sessions List - Mobile optimized */}
        <div className="mt-6 sm:mt-8">
          <h2 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {t.upcomingSessions || 'Upcoming Sessions'}
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {khatm.sessions
              .filter(s => s.status === 'scheduled')
              .slice(0, 5)
              .map((session) => (
                <Link
                  key={session.id}
                  href={`/khatm/${khatm.id}/session/${session.id}`}
                  className={`block rounded-xl border p-3 sm:p-4 transition-all hover:shadow-md ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Session number badge */}
                      <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <span className={`font-bold text-sm sm:text-base ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {session.session_number}
                        </span>
                      </div>
                      
                      {/* Session info */}
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium text-sm sm:text-base truncate ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {format(parseISO(session.scheduled_date), 'EEE, MMM d')}
                        </p>
                        <p className={`text-xs sm:text-sm truncate ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {session.start_surah} {session.start_verse_in_surah} → {session.end_surah} {session.end_verse_in_surah}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right side info */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                      <div className={`text-xs sm:text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                        <span>{session.scheduled_time}</span>
                      </div>
                      <div className={`text-xs sm:text-sm font-medium ${
                        theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                      }`}>
                        {session.verse_count} {t.verses}
                      </div>
                      <ArrowRight className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
