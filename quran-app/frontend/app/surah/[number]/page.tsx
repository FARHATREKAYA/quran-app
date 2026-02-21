'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Settings, RotateCcw, BookOpen, List, AlertCircle, Repeat, Clock, CheckSquare, Square } from 'lucide-react';
import { VerseDisplay } from '@/components/quran/VerseDisplay';
import { LanguageSelector } from '@/components/quran/LanguageSelector';
import { SurahDescription } from '@/components/quran/SurahDescription';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useSurah } from '@/hooks/useQuran';
import { quranApi } from '@/lib/api';
import useQuranStore from '@/lib/store';
import { Verse, TranslationLanguage } from '@/types/quran';
import { useTranslation } from '@/hooks/useTranslation';

interface Timestamp {
  verse_number: number;
  start_time: number;
  end_time: number;
}

// Reciter configurations
const RECITERS = {
  abdul_basit: {
    id: 1,
    name: 'Abdul Basit (Mujawwad)',
    folder: 'Abdul_Basit_Murattal_64kbps',
  },
  alafasy: {
    id: 2,
    name: 'Mishary Al-Afasy',
    folder: 'Alafasy_128kbps',
  },
  husary: {
    id: 3,
    name: 'Al-Husary',
    folder: 'Husary_64kbps',
  },
};

type ReciterKey = keyof typeof RECITERS;
type PlayMode = 'verse' | 'full';

// Generate verse audio URL
const getVerseAudioUrl = (surahNumber: number, verseNumber: number, reciterFolder: string) => {
  const surahStr = surahNumber.toString().padStart(3, '0');
  const verseStr = verseNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/${reciterFolder}/${surahStr}${verseStr}.mp3`;
};

// Format time (seconds to MM:SS)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function SurahPage() {
  const params = useParams();
  const surahNumber = parseInt(params.number as string);
  const { theme, language } = useQuranStore();

  // Mode selection
  const [playMode, setPlayMode] = useState<PlayMode>('verse');

  // Loop mode
  const [isLoopMode, setIsLoopMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [loopCount, setLoopCount] = useState(0);
  const [loopStartTime, setLoopStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const AUTO_STOP_MINUTES = 30;
  const AUTO_STOP_SECONDS = AUTO_STOP_MINUTES * 60;

  // Audio state
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState<ReciterKey>('abdul_basit');
  const [showReciterMenu, setShowReciterMenu] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [fullSurahAudioUrl, setFullSurahAudioUrl] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Timestamps
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [timestampsSource, setTimestampsSource] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const verseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data, isLoading, error, refetch } = useSurah(surahNumber, language);
  const { t } = useTranslation();
  
  // Reciter configurations with translations
  const RECITERS = {
    abdul_basit: {
      id: 1,
      name: t.abdulBasit,
      folder: 'Abdul_Basit_Murattal_64kbps',
    },
    alafasy: {
      id: 2,
      name: t.alafasy,
      folder: 'Alafasy_128kbps',
    },
    husary: {
      id: 3,
      name: t.husary,
      folder: 'Husary_64kbps',
    },
  };

  // Calculate current verse
  const calculateCurrentVerseFromProgress = useCallback(() => {
    if (!data?.verses || audioProgress === 0) return null;
    
    if (timestamps.length > 0) {
      for (let i = 0; i < timestamps.length; i++) {
        const ts = timestamps[i];
        if (audioProgress >= ts.start_time && audioProgress < ts.end_time) {
          return i;
        }
      }
      return timestamps.length - 1;
    }
    
    if (audioDuration > 0) {
      const progressRatio = audioProgress / audioDuration;
      const totalVerses = data.verses.length;
      const estimatedVerseIndex = Math.floor(progressRatio * totalVerses);
      return Math.min(estimatedVerseIndex, totalVerses - 1);
    }
    
    return null;
  }, [audioProgress, audioDuration, data?.verses, timestamps]);

  // Scroll to verse
  const scrollToVerse = useCallback((index: number) => {
    const verseElement = verseRefs.current[index];
    if (verseElement) {
      verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Load timestamps
  const loadTimestamps = useCallback(async () => {
    if (playMode !== 'full') return;
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/quran/timestamps/${surahNumber}?reciter=${RECITERS[selectedReciter].id}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.timestamps) {
          setTimestamps(data.timestamps);
          setTimestampsSource(data.source);
        } else {
          setTimestamps([]);
          setTimestampsSource(data.source || 'unknown');
        }
      }
    } catch (err) {
      console.error('Failed to load timestamps:', err);
    }
  }, [surahNumber, selectedReciter, playMode]);

  // Toggle verse selection for loop
  const toggleVerseSelection = useCallback((verseIndex: number) => {
    setSelectedVerses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(verseIndex)) {
        newSet.delete(verseIndex);
      } else {
        newSet.add(verseIndex);
      }
      return newSet;
    });
  }, []);

  // Select all verses
  const selectAllVerses = useCallback(() => {
    if (!data?.verses) return;
    if (selectedVerses.size === data.verses.length) {
      setSelectedVerses(new Set());
    } else {
      setSelectedVerses(new Set(data.verses.map((_, i) => i)));
    }
  }, [data?.verses, selectedVerses.size]);

  // Clear selections
  const clearSelections = useCallback(() => {
    setSelectedVerses(new Set());
  }, []);

  // Get next verse in loop
  const getNextVerseInLoop = useCallback((currentIndex: number): number | null => {
    if (!isLoopMode || selectedVerses.size === 0) return null;
    
    const selectedArray = Array.from(selectedVerses).sort((a, b) => a - b);
    const currentPosition = selectedArray.indexOf(currentIndex);
    
    if (currentPosition === -1) {
      // Current verse not in selection, start from first selected
      return selectedArray[0];
    }
    
    if (currentPosition < selectedArray.length - 1) {
      // Return next verse in selection
      return selectedArray[currentPosition + 1];
    } else {
      // Finished one loop, increment counter and restart
      setLoopCount(prev => prev + 1);
      return selectedArray[0];
    }
  }, [isLoopMode, selectedVerses]);

  // Timer for elapsed time
  useEffect(() => {
    if (isPlaying && isLoopMode && loopStartTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - loopStartTime) / 1000);
        setElapsedTime(elapsed);
        
        // Auto-stop after 30 minutes
        if (elapsed >= AUTO_STOP_SECONDS) {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setIsPlaying(false);
          setIsLoopMode(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          alert(`Loop stopped after ${AUTO_STOP_MINUTES} minutes`);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isLoopMode, loopStartTime]);

  // Load full surah audio
  const loadFullSurahAudio = useCallback(async () => {
    try {
      const audioData = await quranApi.getAudio(surahNumber, RECITERS[selectedReciter].id);
      setFullSurahAudioUrl(audioData.audio_url);
    } catch (err) {
      console.error('Failed to load full surah audio:', err);
    }
  }, [surahNumber, selectedReciter]);

  // Play specific verse
  const playVerse = useCallback((index: number) => {
    if (!data?.verses[index]) return;
    
    setIsLoadingAudio(true);
    setCurrentVerseIndex(index);
    
    if (playMode === 'verse') {
      const verse = data.verses[index];
      const audioUrl = getVerseAudioUrl(
        surahNumber,
        verse.verse_number_in_surah,
        RECITERS[selectedReciter].folder
      );
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setIsLoadingAudio(false);
            scrollToVerse(index);
          })
          .catch((err) => {
            console.error('Play error:', err);
            setIsLoadingAudio(false);
          });
      }
    } else {
      scrollToVerse(index);
      setIsLoadingAudio(false);
    }
  }, [data?.verses, surahNumber, selectedReciter, playMode, scrollToVerse]);

  // Toggle play
  const togglePlay = useCallback(async () => {
    if (isLoopMode && selectedVerses.size > 0 && !isPlaying) {
      // Start loop mode
      const firstSelected = Math.min(...Array.from(selectedVerses));
      setLoopStartTime(Date.now());
      setElapsedTime(0);
      setLoopCount(0);
      playVerse(firstSelected);
      return;
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (playMode === 'verse') {
          if (currentVerseIndex === null) {
            playVerse(0);
          } else {
            audioRef.current.play();
            setIsPlaying(true);
          }
        } else {
          if (!fullSurahAudioUrl) {
            await loadFullSurahAudio();
          }
          if (audioRef.current.src) {
            audioRef.current.play()
              .then(() => setIsPlaying(true))
              .catch((err) => console.error('Play error:', err));
          }
        }
      }
    }
  }, [isPlaying, currentVerseIndex, playMode, fullSurahAudioUrl, isLoopMode, selectedVerses, playVerse, loadFullSurahAudio]);

  // Reset audio
  const resetAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentVerseIndex(null);
    setAudioProgress(0);
    setElapsedTime(0);
    setLoopCount(0);
    setLoopStartTime(null);
  }, []);

  // Handle audio ended
  const handleAudioEnded = useCallback(() => {
    if (playMode === 'verse') {
      if (isLoopMode && selectedVerses.size > 0) {
        const nextIndex = getNextVerseInLoop(currentVerseIndex!);
        if (nextIndex !== null) {
          setTimeout(() => playVerse(nextIndex), 500); // Small delay between verses
        } else {
          setIsPlaying(false);
          setIsLoopMode(false);
        }
      } else {
        // Normal verse mode
        if (currentVerseIndex !== null && data?.verses) {
          const nextIndex = currentVerseIndex + 1;
          if (nextIndex < data.verses.length) {
            playVerse(nextIndex);
          } else {
            setIsPlaying(false);
            setCurrentVerseIndex(null);
          }
        }
      }
    } else {
      setIsPlaying(false);
    }
  }, [playMode, currentVerseIndex, data?.verses, isLoopMode, selectedVerses, getNextVerseInLoop, playVerse]);

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setAudioProgress(audioRef.current.currentTime);
      
      if (playMode === 'full') {
        const newVerseIndex = calculateCurrentVerseFromProgress();
        if (newVerseIndex !== null && newVerseIndex !== currentVerseIndex) {
          setCurrentVerseIndex(newVerseIndex);
          scrollToVerse(newVerseIndex);
        }
      }
    }
  }, [playMode, currentVerseIndex, calculateCurrentVerseFromProgress, scrollToVerse]);

  // Handle loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  }, []);

  // Switch play mode
  const switchMode = useCallback((newMode: PlayMode) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentVerseIndex(null);
    setAudioProgress(0);
    setAudioDuration(0);
    setFullSurahAudioUrl(null);
    setPlayMode(newMode);
    
    if (newMode === 'full') {
      loadFullSurahAudio();
    }
  }, [loadFullSurahAudio]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Load timestamps
  useEffect(() => {
    if (playMode === 'full') {
      loadTimestamps();
    }
  }, [playMode, loadTimestamps]);

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-white dark:bg-gray-900 ${language === 'arabic' ? 'rtl' : 'ltr'}`}>
        <main className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen bg-white dark:bg-gray-900 ${language === 'arabic' ? 'rtl' : 'ltr'}`}>
        <main className="mx-auto max-w-4xl px-4 py-8">
          <ErrorMessage message={t.failedToLoadSurah} onRetry={refetch} />
        </main>
      </div>
    );
  }

  const { surah, verses } = data;
  const prevSurah = surah.number > 1 ? surah.number - 1 : null;
  const nextSurah = surah.number < 114 ? surah.number + 1 : null;
  const displayVerseIndex = playMode === 'full' ? calculateCurrentVerseFromProgress() : currentVerseIndex;

  const isRTL = language === 'arabic';

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'sepia' ? 'bg-[#f4ecd8]' : theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    } ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Audio Player Bar */}
      <div className="sticky top-16 z-40 border-b bg-white/90 dark:bg-gray-900/90 backdrop-blur-md dark:border-gray-700 px-4 py-3">
        <div className="mx-auto max-w-4xl">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center mb-3 gap-2">
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button
                onClick={() => switchMode('verse')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  playMode === 'verse'
                    ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <List className="h-4 w-4" />
                {t.verseByVerse}
              </button>
              <button
                onClick={() => switchMode('full')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  playMode === 'full'
                    ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                {t.fullSurah}
              </button>
            </div>
            
            {/* Loop Mode Toggle */}
            {playMode === 'verse' && (
              <button
                onClick={() => {
                  if (isLoopMode) {
                    setIsLoopMode(false);
                    resetAudio();
                  } else {
                    setIsLoopMode(true);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isLoopMode
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                <Repeat className={`h-4 w-4 ${isLoopMode ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }} />
                {t.loop}
              </button>
            )}
          </div>
          
          {/* Loop Info */}
          {isLoopMode && (
            <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200">
                  <span className="font-medium">{selectedVerses.size}</span> {selectedVerses.size === 1 ? t.verse : t.verses} {t.selected}
                  {loopCount > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      • {t.loop} {loopCount}
                    </span>
                  )}
                </div>
                {isPlaying && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(elapsedTime)} / {AUTO_STOP_MINUTES}:00</span>
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={selectAllVerses}
                  className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 transition-colors"
                >
                  {selectedVerses.size === verses.length ? t.deselectAll : t.selectAll}
                </button>
                <button
                  onClick={clearSelections}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 transition-colors"
                >
                  {t.clear}
                </button>
                {selectedVerses.size === 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                    {t.selectVersesToLoop}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowReciterMenu(!showReciterMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">{RECITERS[selectedReciter].name}</span>
                </button>
              
              {showReciterMenu && (
                <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-50`}>
                  {(Object.keys(RECITERS) as ReciterKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedReciter(key);
                        setShowReciterMenu(false);
                        resetAudio();
                        if (playMode === 'full') loadFullSurahAudio();
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        selectedReciter === key ? 'text-emerald-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {RECITERS[key].name}
                    </button>
                  ))}
                </div>
              )}
              </div>

              {/* Language Selector */}
              <LanguageSelector />
            </div>

            <div className="flex items-center gap-3">
              {displayVerseIndex !== null && (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {playMode === 'full' ? t.playing : t.verse} {verses[displayVerseIndex]?.verse_number_in_surah} / {verses.length}
                  </span>
                  <button
                    onClick={resetAudio}
                    className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    aria-label={t.reset}
                    title={t.reset}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                onClick={togglePlay}
                disabled={isLoadingAudio || (isLoopMode && selectedVerses.size === 0 && !isPlaying)}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px] justify-center"
              >
                {isLoadingAudio ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <>
                    <Pause className="h-5 w-5" />
                    <span>{t.pause}</span>
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    <span>{isLoopMode ? t.loop : t.play}</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {playMode === 'full' && audioDuration > 0 && (
            <div className="mt-3">
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-100" style={{ width: `${(audioProgress / audioDuration) * 100}%` }} />
              </div>
              {timestampsSource && (
                <div className="mt-2 flex items-center justify-center gap-2 text-xs">
                  {timestampsSource === 'database' ? (
                    <span className="text-emerald-600 dark:text-emerald-400">✓ {t.usingOfficialTimestamps}</span>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400">{t.usingEstimatedTiming}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <audio
        ref={audioRef}
        src={playMode === 'full' ? fullSurahAudioUrl || undefined : undefined}
        onEnded={handleAudioEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
      />
      
      <main className="mx-auto max-w-4xl px-4 py-8 pb-20 sm:px-6 lg:px-8">
        {/* Surah Header */}
        <div className="mb-8 text-center">
          <h1 className={`font-amiri text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {surah.name_arabic}
          </h1>
          <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {surah.name_english}
          </h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {surah.revelation_type === 'Meccan' ? t.meccan : t.medinan} • {surah.verse_count} {t.verses}
          </p>
        </div>

        {surah.number !== 9 && (
          <div className={`mb-8 text-center py-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <p className="font-amiri text-2xl leading-relaxed" dir="rtl">{t.bismillah}</p>
          </div>
        )}

        {/* Surah Description */}
        <SurahDescription description={surah.description} />

        {/* Verses */}
        <div className="space-y-4">
          {verses.map((verse: Verse, index: number) => (
            <div
              key={verse.id}
              ref={(el) => { verseRefs.current[index] = el; }}
              className={`transition-all duration-500 ${
                displayVerseIndex === index ? 'ring-2 ring-emerald-500 ring-offset-4 dark:ring-offset-gray-800 rounded-xl scale-[1.02]' : ''
              }`}
            >
              {/* Verse Selection Checkbox */}
              {isLoopMode && playMode === 'verse' && (
                <div className="mb-2 flex items-center gap-2">
                  <button
                    onClick={() => toggleVerseSelection(index)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedVerses.has(index)
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {selectedVerses.has(index) ? (
                      <>
                        <CheckSquare className="h-4 w-4" />
                        <span>{t.selected}</span>
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4" />
                        <span>{t.selectForLoop}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              
              <VerseDisplay 
                verse={verse} 
                isPlaying={displayVerseIndex === index && isPlaying}
                isLoading={displayVerseIndex === index && isLoadingAudio}
                onPlay={playMode === 'verse' && !isLoopMode ? () => playVerse(index) : undefined}
              />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between border-t pt-6 dark:border-gray-700">
          {prevSurah ? (
            <Link href={`/surah/${prevSurah}`} className="flex items-center gap-2 rounded-lg px-4 py-2 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors">
              <ChevronLeft className="h-5 w-5" />
              <span>{t.previousSurah}</span>
            </Link>
          ) : <div />}
          <Link href="/" className="text-gray-600 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors">
            {t.backToList}
          </Link>
          {nextSurah ? (
            <Link href={`/surah/${nextSurah}`} className="flex items-center gap-2 rounded-lg px-4 py-2 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors">
              <span>{t.nextSurah}</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : <div />}
        </div>
      </main>
    </div>
  );
}
