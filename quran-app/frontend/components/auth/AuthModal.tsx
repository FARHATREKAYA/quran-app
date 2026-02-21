'use client';

import { useState, useEffect } from 'react';
import { X, User, Lock, LogIn, UserPlus, UserCircle } from 'lucide-react';
// import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import useQuranStore from '@/lib/store';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

// Facebook SDK types
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { theme } = useQuranStore();
  const { t } = useTranslation();
  const { login, register, loginAsGuest, socialLogin } = useAuth();

  if (!isOpen) return null;

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          overlay: 'bg-black/70',
          modal: 'bg-gray-900 border-gray-700',
          header: 'border-gray-700',
          title: 'text-white',
          text: 'text-gray-300',
          input: 'bg-gray-800 border-gray-600 text-white placeholder-gray-500',
          button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          secondaryButton: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
          tabActive: 'bg-emerald-600 text-white',
          tabInactive: 'text-gray-400 hover:text-gray-200',
          close: 'text-gray-400 hover:text-white',
          error: 'text-red-400 bg-red-900/20',
        };
      case 'sepia':
        return {
          overlay: 'bg-black/50',
          modal: 'bg-[#f4ecd8] border-amber-300',
          header: 'border-amber-300',
          title: 'text-amber-900',
          text: 'text-amber-800',
          input: 'bg-amber-50 border-amber-300 text-amber-900 placeholder-amber-600',
          button: 'bg-emerald-700 hover:bg-emerald-600 text-white',
          secondaryButton: 'bg-amber-200 hover:bg-amber-300 text-amber-900',
          tabActive: 'bg-emerald-700 text-white',
          tabInactive: 'text-amber-700 hover:text-amber-900',
          close: 'text-amber-700 hover:text-amber-900',
          error: 'text-red-700 bg-red-100',
        };
      case 'light':
      default:
        return {
          overlay: 'bg-black/50',
          modal: 'bg-white border-gray-200',
          header: 'border-gray-200',
          title: 'text-gray-900',
          text: 'text-gray-600',
          input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
          button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          secondaryButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          tabActive: 'bg-emerald-600 text-white',
          tabInactive: 'text-gray-500 hover:text-gray-700',
          close: 'text-gray-400 hover:text-gray-600',
          error: 'text-red-600 bg-red-50',
        };
    }
  };

  const classes = getThemeClasses();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(username, password);
      } else if (mode === 'register') {
        await register(username, password);
      } else if (mode === 'guest') {
        await loginAsGuest();
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  /* Social login handlers - temporarily disabled
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setIsLoading(true);
      setError('');

      // Decode the JWT token to get user info
      const decoded = JSON.parse(atob(credentialResponse.credential!.split('.')[1]));

      await socialLogin(
        'google',
        credentialResponse.credential!,
        decoded.email,
        decoded.name,
        decoded.sub
      );

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded');
      return;
    }

    window.FB.login((response: any) => {
      if (response.authResponse) {
        // Get user info
        window.FB.api('/me', { fields: 'id,name,email' }, async (userInfo: any) => {
          try {
            setIsLoading(true);
            setError('');

            await socialLogin(
              'facebook',
              response.authResponse.accessToken,
              userInfo.email,
              userInfo.name,
              userInfo.id
            );

            onClose();
          } catch (err: any) {
            setError(err.response?.data?.detail || 'Facebook login failed');
          } finally {
            setIsLoading(false);
          }
        });
      } else {
        setError('Facebook login cancelled');
      }
    }, { scope: 'email' });
  };
  */

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${classes.overlay}`}>
      <div className={`relative w-full max-w-md rounded-2xl border shadow-2xl ${classes.modal}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${classes.header}`}>
          <h2 className={`text-2xl font-bold ${classes.title}`}>
            {mode === 'login' && (t.login || 'Login')}
            {mode === 'register' && (t.register || 'Register')}
            {mode === 'guest' && (t.continueAsGuest || 'Continue as Guest')}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${classes.close}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              mode === 'login' ? classes.tabActive : classes.tabInactive
            }`}
          >
            <LogIn className="h-4 w-4 inline mr-2" />
            {t.login || 'Login'}
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              mode === 'register' ? classes.tabActive : classes.tabInactive
            }`}
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            {t.register || 'Register'}
          </button>
          <button
            onClick={() => setMode('guest')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              mode === 'guest' ? classes.tabActive : classes.tabInactive
            }`}
          >
            <UserCircle className="h-4 w-4 inline mr-2" />
            {t.guest || 'Guest'}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${classes.error}`}>
              {error}
            </div>
          )}

          {mode === 'guest' ? (
            <div className="text-center">
              <p className={`mb-6 ${classes.text}`}>
                {t.guestDescription || 'Continue without creating an account. Your progress won\'t be saved.'}
              </p>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${classes.button} disabled:opacity-50`}
              >
                {isLoading ? (t.loading || 'Loading...') : (t.continueAsGuest || 'Continue as Guest')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${classes.text}`}>
                  <User className="h-4 w-4 inline mr-2" />
                  {t.username || 'Username'}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${classes.input}`}
                  placeholder={t.enterUsername || 'Enter your username'}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${classes.text}`}>
                  <Lock className="h-4 w-4 inline mr-2" />
                  {t.password || 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${classes.input}`}
                  placeholder={t.enterPassword || 'Enter your password'}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${classes.button} disabled:opacity-50`}
              >
                {isLoading 
                  ? (t.loading || 'Loading...') 
                  : mode === 'login' 
                    ? (t.login || 'Login') 
                    : (t.register || 'Register')
                }
              </button>
            </form>
          )}

      {/* Social Login - Temporarily disabled */
      /*
      {mode !== 'guest' && (
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${theme === 'dark' ? 'bg-gray-900 text-gray-400' : theme === 'sepia' ? 'bg-[#f4ecd8] text-amber-700' : 'bg-white text-gray-500'}`}>
                {t.orContinueWith || 'Or continue with'}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed')}
                size="large"
                width="100%"
              />
            </div>

            <button
              onClick={handleFacebookLogin}
              disabled={!fbLoaded || isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 hover:bg-gray-800 text-white'
                  : theme === 'sepia'
                  ? 'border-amber-300 hover:bg-amber-100 text-amber-900'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              } ${(!fbLoaded || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {isLoading ? 'Loading...' : 'Continue with Facebook'}
            </button>
          </div>
        </div>
      )}
      */}
        </div>
      </div>
    </div>
  );
}
