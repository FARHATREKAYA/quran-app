'use client';

import { useEffect, useState } from 'react';
import useQuranStore from '@/lib/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useQuranStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'sepia');
    
    // Add new theme class
    root.classList.add(theme);
    
    // Apply sepia background
    if (theme === 'sepia') {
      document.body.style.backgroundColor = '#f4ecd8';
    } else if (theme === 'dark') {
      document.body.style.backgroundColor = '#1a1a1a';
    } else {
      document.body.style.backgroundColor = '#ffffff';
    }
  }, [theme]);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}