'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { SurahList } from '@/components/quran/SurahList';
import useQuranStore from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';

const queryClient = new QueryClient();

function HomeContent() {
  const { language, theme } = useQuranStore();
  const { t } = useTranslation();
  
  const isRTL = language === 'arabic';

  // Get background and text colors based on theme
  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-white';
      case 'sepia':
        return 'bg-[#f4ecd8] text-gray-900';
      case 'light':
      default:
        return 'bg-white text-gray-900';
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${getThemeClasses()} ${isRTL ? 'rtl' : 'ltr'}`}>
      <main className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className={`text-4xl font-bold mb-4 ${isRTL ? 'font-amiri' : ''} ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {t.welcome}
          </h1>
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {t.welcomeSubtitle}
          </p>
        </div>
        <SurahList />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HomeContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
