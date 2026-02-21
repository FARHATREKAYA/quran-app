'use client';

import { Linkedin, Heart } from 'lucide-react';
import useQuranStore from '@/lib/store';

export function Footer() {
  const { theme } = useQuranStore();

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          footer: 'bg-gray-900 border-t border-gray-800',
          text: 'text-gray-400',
          link: 'text-emerald-400 hover:text-emerald-300',
          heart: 'text-red-500',
        };
      case 'sepia':
        return {
          footer: 'bg-[#f4ecd8] border-t border-amber-300',
          text: 'text-amber-800',
          link: 'text-emerald-700 hover:text-emerald-600',
          heart: 'text-red-600',
        };
      case 'light':
      default:
        return {
          footer: 'bg-white border-t border-gray-200',
          text: 'text-gray-600',
          link: 'text-emerald-600 hover:text-emerald-700',
          heart: 'text-red-500',
        };
    }
  };

  const classes = getThemeClasses();

  return (
    <footer className={`fixed bottom-0 left-0 right-0 z-40 ${classes.footer} py-3 px-4`}>
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-2 text-sm">
        <span className={classes.text}>© {new Date().getFullYear()}</span>
        <span className={`font-semibold ${classes.text}`}>Farhat Rekaya</span>
        <Heart className={`h-4 w-4 ${classes.heart} fill-current`} />
        <span className={classes.text}>•</span>
        <a
          href="https://www.linkedin.com/in/farhatrekaya/"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1 transition-colors ${classes.link}`}
          aria-label="LinkedIn Profile"
        >
          <Linkedin className="h-4 w-4" />
          <span>LinkedIn</span>
        </a>
      </div>
    </footer>
  );
}
