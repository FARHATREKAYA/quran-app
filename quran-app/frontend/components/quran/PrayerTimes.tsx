'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Bell, BellOff, AlertCircle } from 'lucide-react';
import { prayerApi, PrayerTimes, PrayerTimeData } from '@/lib/prayerApi';
import useQuranStore from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';

export function PrayerTimesWidget() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerTimeData | null>(null);
  const [timeUntil, setTimeUntil] = useState<string>('');
  const [minutesUntil, setMinutesUntil] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);
  
  const { theme, language } = useQuranStore();
  const { t } = useTranslation();

  // Get prayer name based on language
  const getPrayerName = useCallback((prayer: PrayerTimeData): string => {
    switch (language) {
      case 'arabic':
        return prayer.nameAr;
      case 'french':
        return prayer.nameFr;
      default:
        return prayer.nameEn;
    }
  }, [language]);

  // Get location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError(t.locationError || 'Unable to get location');
          setLoading(false);
        }
      );
    } else {
      setError(t.locationNotSupported || 'Geolocation not supported');
      setLoading(false);
    }
  }, [t]);

  // Fetch prayer times
  useEffect(() => {
    if (!location) return;

    const fetchPrayerTimes = async () => {
      try {
        const times = await prayerApi.getPrayerTimes(location.latitude, location.longitude);
        setPrayerTimes(times);
        const next = prayerApi.getNextPrayer(times, language);
        setNextPrayer(next);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch prayer times:', err);
        setError(t.failedToLoadPrayerTimes || 'Failed to load prayer times');
        setLoading(false);
      }
    };

    fetchPrayerTimes();
    
    // Refresh every minute
    const interval = setInterval(fetchPrayerTimes, 60000);
    return () => clearInterval(interval);
  }, [location, language, t]);

  // Update countdown
  useEffect(() => {
    if (!nextPrayer) return;

    const updateCountdown = () => {
      const timeLeft = prayerApi.formatTimeUntil(nextPrayer.timeDate);
      setTimeUntil(timeLeft);

      // Calculate minutes remaining
      const now = new Date();
      const diff = nextPrayer.timeDate.getTime() - now.getTime();
      const minsUntil = Math.floor(diff / (1000 * 60));
      setMinutesUntil(minsUntil);

      // Check if it's 5 minutes before prayer
      if (minsUntil === 5 && notificationsEnabled && !hasNotified) {
        const prayerName = getPrayerName(nextPrayer);
        prayerApi.showNotification(
          t.prayerTimeNotification || 'Prayer Time Soon',
          `${prayerName} ${t.prayerIn5Minutes || 'in 5 minutes'}`
        );
        setHasNotified(true);
      }

      // Reset notification flag when prayer time passes
      if (diff <= 0) {
        setHasNotified(false);
        if (prayerTimes) {
          const next = prayerApi.getNextPrayer(prayerTimes, language);
          setNextPrayer(next);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer, prayerTimes, notificationsEnabled, hasNotified, language, getPrayerName, t]);

  // Request notification permission
  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
    } else {
      const granted = await prayerApi.requestNotificationPermission();
      setNotificationsEnabled(granted);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <Clock className="h-3.5 w-3.5 text-gray-400 animate-pulse" />
        <span className="text-xs text-gray-500">{t.loading}...</span>
      </div>
    );
  }

  if (error || !nextPrayer) {
    return (
      <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <MapPin className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs text-gray-500">{t.locationRequired || 'Location needed'}</span>
      </div>
    );
  }

  const showMobileAlert = minutesUntil > 0 && minutesUntil <= 150;

  return (
    <div className="relative">
      <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
        theme === 'dark' 
          ? 'bg-emerald-900/30 border border-emerald-800' 
          : 'bg-emerald-50 border border-emerald-200'
      }`}>
        <Clock className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200 truncate">
            {getPrayerName(nextPrayer)}
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            {nextPrayer.time}
          </span>
          <span className="hidden md:inline text-xs text-gray-400">•</span>
          <span className={`hidden md:inline text-xs font-semibold ${
            minutesUntil <= 100
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {timeUntil} {t.remaining}
          </span>
        </div>
        
        <button
          onClick={toggleNotifications}
          className={`hidden sm:flex p-1 rounded-md transition-colors flex-shrink-0 ${
            notificationsEnabled
              ? 'bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300'
              : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title={notificationsEnabled ? t.notificationsOn : t.notificationsOff}
        >
          {notificationsEnabled ? (
            <Bell className="h-3.5 w-3.5" />
          ) : (
            <BellOff className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Mobile Alert Notification - floating below widget */}
      {showMobileAlert && (
        <div className={`md:hidden absolute left-0 top-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg animate-pulse z-50 ${
          minutesUntil <= 50
            ? theme === 'dark'
              ? 'bg-amber-900/95 border border-amber-600'
              : 'bg-amber-50 border border-amber-300'
            : theme === 'dark'
              ? 'bg-emerald-900/95 border border-emerald-600'
              : 'bg-emerald-50 border border-emerald-300'
        }`}>
          <AlertCircle className={`h-3.5 w-3.5 flex-shrink-0 ${
            minutesUntil <= 5
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`} />
          <span className={`text-xs font-semibold whitespace-nowrap ${
            minutesUntil <= 5
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-emerald-700 dark:text-emerald-300'
          }`}>
            {timeUntil} {t.remaining}
          </span>
        </div>
      )}
    </div>
  );
}
