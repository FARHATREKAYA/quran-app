'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Play,
  Pause,
  SkipForward,
  Settings,
  CheckCircle2,
  X,
  Volume2,
  BookOpen,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { khatmApi, quranApi } from '@/lib/api';
import useQuranStore from '@/lib/store';

interface SessionData {
  id: number;
  session_number: number;
  scheduled_time: string;
  status: string;
  start_surah?: string;
  end_surah?: string;
  start_verse_in_surah: number;
  end_verse_in_surah: number;
  verse_count: number;
  verses_read_count: number;
  current_verse_id?: number | null;
  reading_mode?: 'read_only' | 'read_listen';
  enable_audio_break?: boolean;
  verses: VerseData[];
}

interface VerseData {
  id: number;
  surah_id: number;
  surah_name: string;
  verse_number_in_surah: number;
  text_arabic: string;
  text_english: string;
  text_french: string;
  page_number: number;
  juz_number: number;
  audio_url?: string;
}

export default function SessionReadingPage() {
  const params = useParams();
  const router = useRouter();
  const khatmId = parseInt(params.khatmId as string);
  const sessionId = parseInt(params.sessionId as string);
  
  const { token } = useAuth();
  const { t } = useTranslation();
  const { theme, language } = useQuranStore();
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [readingMode, setReadingMode] = useState<'read_only' | 'read_listen'>('read_only');
  const [enableAudioBreak, setEnableAudioBreak] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completedVerses, setCompletedVerses] = useState<Set<number>>(new Set());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to strip HTML tags from text
  const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  useEffect(() => {
    if (token && khatmId && sessionId) {
      loadSession();
    }
  }, [token, khatmId, sessionId]);

  // Scroll to current verse when it changes
  useEffect(() => {
    if (session && readingMode === 'read_only') {
      const currentVerse = session.verses[currentVerseIndex];
      if (currentVerse) {
        const element = document.getElementById(`verse-${currentVerse.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentVerseIndex, session, readingMode]);

  const loadSession = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const data = await khatmApi.getSessionDetails(khatmId, sessionId, token);
      setSession(data);
      
      // Set reading mode from khatm settings
      if (data.reading_mode) {
        setReadingMode(data.reading_mode);
      }
      if (data.enable_audio_break !== undefined) {
        setEnableAudioBreak(data.enable_audio_break);
      }
      
      // Restore progress if exists
      if (data.current_verse_id) {
        const verseIndex = data.verses.findIndex((v: VerseData) => v.id === data.current_verse_id);
        if (verseIndex !== -1) {
          setCurrentVerseIndex(verseIndex);
        }
      }
    } catch (err) {
      setError('Failed to load session');
      console.error('Error loading session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const playVerse = async (index: number) => {
    if (!session || !audioRef.current) return;
    
    const verse = session.verses[index];
    
    try {
      // Load verse-by-verse audio dynamically
      const audioData = await quranApi.getVerseAudio(verse.surah_id, verse.verse_number_in_surah);
      audioRef.current.src = audioData.audio_url;
      audioRef.current.currentTime = 0;
      
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing audio for verse:', err);
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    
    if (readingMode === 'read_only') return;
    
    if (enableAudioBreak) {
      // Wait 3 seconds for user to repeat, then auto-advance
      breakTimerRef.current = setTimeout(() => {
        autoAdvance();
      }, 3000);
    } else {
      // No break, auto-advance immediately
      autoAdvance();
    }
  };

  const autoAdvance = () => {
    if (!session) return;
    
    if (currentVerseIndex < session.verses.length - 1) {
      const nextIndex = currentVerseIndex + 1;
      setCurrentVerseIndex(nextIndex);
      // Auto-play next verse
      setTimeout(() => {
        playVerse(nextIndex);
      }, 100);
    } else {
      // Session complete
      setShowCompleteModal(true);
    }
  };

  const nextVerse = () => {
    if (!session) return;
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    if (breakTimerRef.current) {
      clearTimeout(breakTimerRef.current);
      breakTimerRef.current = null;
    }
    
    // Mark current verse as completed
    setCompletedVerses(prev => {
      const newSet = new Set(prev);
      newSet.add(session.verses[currentVerseIndex].id);
      return newSet;
    });
    
    if (currentVerseIndex < session.verses.length - 1) {
      const nextIndex = currentVerseIndex + 1;
      setCurrentVerseIndex(nextIndex);
      // Don't auto-play - let user control it
    } else {
      // Session complete
      setShowCompleteModal(true);
    }
  };

  const prevVerse = () => {
    if (currentVerseIndex > 0) {
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      if (breakTimerRef.current) {
        clearTimeout(breakTimerRef.current);
        breakTimerRef.current = null;
      }
      
      const prevIndex = currentVerseIndex - 1;
      setCurrentVerseIndex(prevIndex);
      // Don't auto-play - let user control it
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      // Pause - clear any pending auto-advance
      audioRef.current?.pause();
      setIsPlaying(false);
      if (breakTimerRef.current) {
        clearTimeout(breakTimerRef.current);
        breakTimerRef.current = null;
      }
    } else {
      // Resume/play current verse
      playVerse(currentVerseIndex);
    }
  };

  const skipVerse = () => {
    if (breakTimerRef.current) {
      clearTimeout(breakTimerRef.current);
      breakTimerRef.current = null;
    }
    nextVerse();
  };

  const handleCompleteSession = async () => {
    if (!token || !session) return;
    
    try {
      const lastVerseId = session.verses[session.verses.length - 1]?.id || null;
      await khatmApi.completeSession(
        khatmId,
        sessionId,
        completedVerses.size,
        lastVerseId,
        token
      );
      
      router.push(`/khatm/${khatmId}`);
    } catch (err) {
      console.error('Error completing session:', err);
    }
  };

  const handleSkipSession = async () => {
    if (!token || !confirm(t.skipSessionConfirm || 'Skip this session?')) return;
    
    try {
      await khatmApi.skipSession(khatmId, sessionId, null, token);
      router.push(`/khatm/${khatmId}`);
    } catch (err) {
      console.error('Error skipping session:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (breakTimerRef.current) {
        clearTimeout(breakTimerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-amber-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-amber-50'
      }`}>
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            {error || 'Session not found'}
          </p>
        </div>
      </div>
    );
  }

  const currentVerse = session.verses[currentVerseIndex];
  const progress = ((currentVerseIndex + 1) / session.verses.length) * 100;

  return (
    <div className={`min-h-screen flex flex-col ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-amber-50'
    }`}>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={() => setIsPlaying(false)}
      />

      {/* Fixed Reading Header - Below Navbar */}
      <div className={`fixed top-16 left-0 right-0 z-40 border-b shadow-lg ${
        theme === 'dark' 
          ? 'bg-gray-900/98 border-gray-800' 
          : 'bg-amber-50/98 border-amber-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Top Row - Back & Settings */}
          <div className="flex items-center justify-between mb-3">
            <Link
              href={`/khatm/${khatmId}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-300 hover:text-emerald-400 hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-amber-100'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="font-medium">{t.backToKhatm || 'Back to Khatm'}</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-amber-100'
                }`}
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Middle Row - Current Position Info */}
          <div className="flex items-center justify-center mb-3">
            <div className={`text-center px-4 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {currentVerse.surah_name} {currentVerse.verse_number_in_surah}
              </span>
              <span className={`mx-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>|</span>
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t.verse || 'Verse'} {currentVerseIndex + 1} {t.of || 'of'} {session.verses.length}
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div>
            <div className={`h-2 rounded-full ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-amber-100'
            }`}>
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reading Area - Pushed down for navbar + header, padding bottom for footer */}
      <div className="max-w-4xl mx-auto px-4 py-8 pt-60 pb-40">
        {/* Surah Info */}
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {currentVerse.surah_name}
          </h2>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {t.juz || 'Juz'} {currentVerse.juz_number} • {t.page || 'Page'} {currentVerse.page_number}
          </p>
        </div>

        {/* Full Page Reading View */}
        <div className={`rounded-xl p-8 mb-8 ${
          theme === 'dark' 
            ? 'bg-gray-800' 
            : 'bg-white shadow-sm'
        }`}>
          {readingMode === 'read_only' ? (
            // Read Only Mode - Show all verses at once
            <div className="space-y-8">
              {session.verses.map((verse, index) => (
                <div
                  key={verse.id}
                  id={`verse-${verse.id}`}
                  className={`p-4 rounded-lg transition-all cursor-pointer ${
                    index === currentVerseIndex
                      ? theme === 'dark'
                        ? 'bg-emerald-900/30'
                        : 'bg-emerald-50'
                      : ''
                  } ${completedVerses.has(verse.id) ? 'opacity-60' : ''}`}
                  onClick={() => setCurrentVerseIndex(index)}
                >
                  {/* Arabic Text */}
                  <p 
                    className={`font-amiri text-right text-2xl leading-loose mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                    dir="rtl"
                  >
                    {verse.text_arabic}
                    <span className="inline-flex items-center justify-center w-8 h-8 mx-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                      {verse.verse_number_in_surah}
                    </span>
                  </p>
                  
                  {/* Translation */}
                  {language !== 'arabic' && (
                    <p className={`text-base leading-relaxed ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {stripHtmlTags(language === 'french' ? verse.text_french : verse.text_english)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Read + Listen Mode - Show current verse with audio
            <div className="space-y-6">
              {/* Audio Status Indicator */}
              <div className={`text-center py-2 px-4 rounded-lg ${
                isPlaying 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                <p className="text-sm font-medium flex items-center justify-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  {isPlaying 
                    ? (t.playingAudio || 'Playing Audio - Full Surah') 
                    : (t.audioReady || 'Audio Ready - Click Play')
                  }
                </p>
              </div>

              {/* Current Verse Highlight */}
              <div className={`p-6 rounded-xl border-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-emerald-500'
                  : 'bg-emerald-50 border-emerald-300'
              }`}>
                {/* Arabic Text */}
                <p 
                  className={`font-amiri text-right text-3xl leading-loose mb-6 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                  dir="rtl"
                >
                  {currentVerse.text_arabic}
                  <span className="inline-flex items-center justify-center w-10 h-10 mx-2 rounded-full bg-emerald-100 text-emerald-700 text-lg font-bold">
                    {currentVerse.verse_number_in_surah}
                  </span>
                </p>
                
                {/* Translation */}
                {language !== 'arabic' && (
                  <p className={`text-lg leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {stripHtmlTags(language === 'french' ? currentVerse.text_french : currentVerse.text_english)}
                  </p>
                )}
              </div>

              {/* Context - Previous and Next Verses */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentVerseIndex > 0 && (
                  <div className={`p-4 rounded-lg opacity-50 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <p className="text-xs mb-2 opacity-60">{t.previous || 'Previous'}</p>
                    <p className="font-amiri text-right text-lg" dir="rtl">
                      {session.verses[currentVerseIndex - 1].text_arabic.slice(0, 50)}...
                    </p>
                  </div>
                )}
                
                <div className={`p-4 rounded-lg flex items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <span className="text-sm opacity-60">{t.currentVerse || 'Current'}</span>
                </div>
                
                {currentVerseIndex < session.verses.length - 1 && (
                  <div className={`p-4 rounded-lg opacity-50 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <p className="text-xs mb-2 opacity-60">{t.next || 'Next'}</p>
                    <p className="font-amiri text-right text-lg" dir="rtl">
                      {session.verses[currentVerseIndex + 1].text_arabic.slice(0, 50)}...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer Controls - Always Visible */}
        <div className={`fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg p-4 ${
          theme === 'dark'
            ? 'bg-gray-900/98 border-gray-800'
            : 'bg-white/98 border-gray-200'
        }`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setShowCompleteModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t.complete || 'Complete'}
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={prevVerse}
                disabled={currentVerseIndex === 0}
                className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                title={t.previous || 'Previous'}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              {readingMode === 'read_listen' && (
                <button
                  onClick={togglePlay}
                  className="p-4 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  title={isPlaying ? (t.pause || 'Pause') : (t.play || 'Play')}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>
              )}

              <button
                onClick={nextVerse}
                disabled={currentVerseIndex === session.verses.length - 1}
                className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                title={t.next || 'Next'}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={handleSkipSession}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 text-gray-400 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.skip || 'Skip'}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />
          <div className={`relative w-full max-w-md rounded-2xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t.readingSettings || 'Reading Settings'}
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-2 rounded-full ${
                  theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Reading Mode */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.readingMode || 'Reading Mode'}
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setReadingMode('read_only')}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      readingMode === 'read_only'
                        ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20'
                        : theme === 'dark'
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5" />
                      <span>{t.readOnly || 'Read Only'}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setReadingMode('read_listen')}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      readingMode === 'read_listen'
                        ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20'
                        : theme === 'dark'
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5" />
                      <span>{t.readAndListen || 'Read & Listen'}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Audio Break */}
              {readingMode === 'read_listen' && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="audioBreak"
                    checked={enableAudioBreak}
                    onChange={(e) => setEnableAudioBreak(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="audioBreak" className={
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }>
                    {t.enableAudioBreak || 'Pause after each verse to repeat'}
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCompleteModal(false)}
          />
          <div className={`relative w-full max-w-md rounded-2xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
              <h3 className={`text-2xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t.completeSession || 'Complete Session?'}
              </h3>
              <p className={`mb-6 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t.completeSessionConfirm || `You've read ${completedVerses.size} out of ${session.verses.length} verses.`}
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className={`flex-1 py-3 border rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t.continueReading || 'Continue'}
                </button>
                <button
                  onClick={handleCompleteSession}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {t.complete || 'Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
