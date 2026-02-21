'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Moon, Sun, User, LogOut, LogIn, Bookmark, Target, Shield, Menu, X } from 'lucide-react';
import useQuranStore from '@/lib/store';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSelector } from '@/components/quran/LanguageSelector';
import { PrayerTimesWidget } from '@/components/quran/PrayerTimes';
import { AuthModal } from '@/components/auth/AuthModal';

export function Navbar() {
  const { theme, setTheme, fontSize, increaseFontSize, decreaseFontSize, language } = useQuranStore();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileMenuOpen(false);
    };
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'sepia'> = ['light', 'dark', 'sepia'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'sepia':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <Sun className="h-5 w-5" />;
    }
  };

  const isRTL = language === 'arabic';

  const mobileMenuBgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const mobileMenuBorderClass = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const mobileMenuTextClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  const mobileMenuHoverClass = theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100';

  return (
    <>
      <nav className={`sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80 dark:border-gray-800 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-emerald-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {t.appName}
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800 transition-colors"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-6">
        <Link
          href="/"
          className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors"
        >
          {t.surahs}
        </Link>
        {isAuthenticated && (
          <Link
            href="/bookmarks"
            className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <Bookmark className="h-4 w-4" />
            {t.bookmarks}
          </Link>
        )}
        {isAuthenticated && (
          <Link
            href="/khatm"
            className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <Target className="h-4 w-4" />
            {t.khatm || 'Khatm'}
          </Link>
        )}
        {isAuthenticated && user?.is_admin && (
          <Link
            href="/admin"
            className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
      </div>

        {/* Prayer Times Widget */}
        <div className="hidden lg:block">
          <PrayerTimesWidget />
        </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Font Size Controls */}
            <div className="hidden sm:flex items-center gap-1 border rounded-lg p-1 dark:border-gray-700">
              <button
                onClick={decreaseFontSize}
                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800 transition-colors"
                aria-label={t.decreaseFontSize}
                title={t.decreaseFontSize}
              >
                <span className="text-lg font-bold">A-</span>
              </button>
              <span className="text-sm text-gray-500 px-2 dark:text-gray-400">{fontSize}px</span>
              <button
                onClick={increaseFontSize}
                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800 transition-colors"
                aria-label={t.increaseFontSize}
                title={t.increaseFontSize}
              >
                <span className="text-lg font-bold">A+</span>
              </button>
            </div>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Auth Button */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {user?.username}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border z-50 py-1 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}>
                      {user?.is_admin && (
                        <Link
                          href="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className={`block px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                            theme === 'dark'
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Shield className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                          theme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <LogOut className="h-4 w-4" />
                        {t.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span className="hidden sm:inline">{t.login}</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800 transition-colors"
              aria-label={t.theme}
              title={t.theme}
            >
              {getThemeIcon()}
            </button>
      </div>
    </div>
  </nav>

  {/* Mobile Menu Overlay */}
  {isMobileMenuOpen && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Mobile Menu Panel */}
      <div className={`fixed inset-x-0 top-16 z-50 md:hidden ${mobileMenuBgClass} border-b ${mobileMenuBorderClass} shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto`}>
        <div className="px-4 py-6 space-y-4">
          {/* Navigation Links */}
          <div className="space-y-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg text-base font-medium ${mobileMenuTextClass} ${mobileMenuHoverClass} transition-colors`}
            >
              {t.surahs}
            </Link>
            {isAuthenticated && (
              <Link
                href="/bookmarks"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium ${mobileMenuTextClass} ${mobileMenuHoverClass} transition-colors`}
              >
                <Bookmark className="h-5 w-5" />
                {t.bookmarks}
              </Link>
            )}
            {isAuthenticated && (
              <Link
                href="/khatm"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium ${mobileMenuTextClass} ${mobileMenuHoverClass} transition-colors`}
              >
                <Target className="h-5 w-5" />
                {t.khatm || 'Khatm'}
              </Link>
            )}
            {isAuthenticated && user?.is_admin && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium ${mobileMenuTextClass} ${mobileMenuHoverClass} transition-colors`}
              >
                <Shield className="h-5 w-5" />
                Admin
              </Link>
            )}
          </div>

          {/* Divider */}
          <div className={`border-t ${mobileMenuBorderClass}`} />

          {/* Font Size Controls */}
          <div className="space-y-2">
            <span className={`block px-4 text-sm font-medium ${mobileMenuTextClass}`}>{t.fontSize || 'Font Size'}</span>
            <div className="flex items-center gap-2 px-4">
              <button
                onClick={decreaseFontSize}
                className={`flex-1 p-3 text-center rounded-lg border ${mobileMenuBorderClass} ${mobileMenuTextClass} ${mobileMenuHoverClass} transition-colors`}
              >
                <span className="text-lg font-bold">A-</span>
              </button>
              <span className="px-4 text-sm text-gray-500">{fontSize}px</span>
              <button
                onClick={increaseFontSize}
                className={`flex-1 p-3 text-center rounded-lg border ${mobileMenuBorderClass} ${mobileMenuTextClass} ${mobileMenuHoverClass} transition-colors`}
              >
                <span className="text-lg font-bold">A+</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className={`border-t ${mobileMenuBorderClass}`} />

          {/* Theme Toggle in Mobile Menu */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${mobileMenuTextClass} ${mobileMenuHoverClass} transition-colors`}
          >
            {getThemeIcon()}
            <span>{t.theme}</span>
          </button>

          {/* Language Selector */}
          <div className="px-4">
            <LanguageSelector />
          </div>

          {/* Divider */}
          <div className={`border-t ${mobileMenuBorderClass}`} />

          {/* Auth Section */}
          {isAuthenticated ? (
            <div className="space-y-2">
              <div className={`flex items-center gap-3 px-4 py-2 ${mobileMenuTextClass}`}>
                <User className="h-5 w-5" />
                <span className="font-medium">{user?.username}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors`}
              >
                <LogOut className="h-5 w-5" />
                {t.logout}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${mobileMenuTextClass} ${mobileMenuHoverClass} transition-colors`}
            >
              <LogIn className="h-5 w-5" />
              {t.login}
            </button>
          )}
        </div>
      </div>
    </>
  )}

  {/* Auth Modal */}
  <AuthModal
    isOpen={isAuthModalOpen}
    onClose={() => setIsAuthModalOpen(false)}
  />
</>
  );
}
