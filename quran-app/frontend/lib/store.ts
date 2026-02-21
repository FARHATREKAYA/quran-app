import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, TranslationLanguage } from '@/types/quran';

interface QuranState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Font size
  fontSize: number;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;

  // Translation
  showTranslation: boolean;
  setShowTranslation: (show: boolean) => void;

  // Language
  language: TranslationLanguage;
  setLanguage: (language: TranslationLanguage) => void;

  // Audio
  isPlaying: boolean;
  currentVerse: number | null;
  audioUrl: string | null;
  setPlaying: (playing: boolean) => void;
  setCurrentVerse: (verseId: number | null) => void;
  setAudioUrl: (url: string | null) => void;

  // Navigation
  currentSurah: number | null;
  setCurrentSurah: (surah: number | null) => void;

  // Loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;
}

const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),

      // Font size
      fontSize: 24,
      setFontSize: (size) => set({ fontSize: size }),
      increaseFontSize: () => {
        const current = get().fontSize;
        if (current < 48) set({ fontSize: current + 2 });
      },
      decreaseFontSize: () => {
        const current = get().fontSize;
        if (current > 12) set({ fontSize: current - 2 });
      },

      // Translation
      showTranslation: true,
      setShowTranslation: (show) => set({ showTranslation: show }),

      // Language
      language: 'english',
      setLanguage: (language) => set({ language }),

      // Audio
      isPlaying: false,
      currentVerse: null,
      audioUrl: null,
      setPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentVerse: (verseId) => set({ currentVerse: verseId }),
      setAudioUrl: (url) => set({ audioUrl: url }),

      // Navigation
      currentSurah: null,
      setCurrentSurah: (surah) => set({ currentSurah: surah }),

      // Loading
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),

      // Error
      error: null,
      setError: (error) => set({ error }),
    }),
    {
      name: 'quran-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        showTranslation: state.showTranslation,
        language: state.language,
      }),
    }
  )
);

export default useQuranStore;