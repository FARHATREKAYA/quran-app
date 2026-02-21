'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Bell, BellOff } from 'lucide-react';
import { prayerApi, PrayerTimes, PrayerTimeData } from '@/lib/prayerApi';
import useQuranStore from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';

export function PrayerTimesWidget() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerTimeData | null>(null);
  const [timeUntil, setTimeUntil] = useState<string>('');
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

      // Check if it's 5 minutes before prayer
      const now = new Date();
      const diff = nextPrayer.timeDate.getTime() - now.getTime();
      const minutesUntil = Math.floor(diff / (1000 * 60));

      if (minutesUntil === 5 && notificationsEnabled && !hasNotified) {
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
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <Clock className="h-4 w-4 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-500">{t.loading}...</span>
      </div>
    );
  }

  if (error || !nextPrayer) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <MapPin className="h-4 w-4 text-gray-400" />
        <span className="text-xs text-gray-500">{t.locationRequired || 'Location needed'}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
      theme === 'dark' 
        ? 'bg-emerald-900/30 border border-emerald-800' 
        : 'bg-emerald-50 border border-emerald-200'
    }`}>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            {getPrayerName(nextPrayer)}
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            {nextPrayer.time}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${
            timeUntil.includes('m') && parseInt(timeUntil) <= 10
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {timeUntil}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t.remaining || 'remaining'}
          </span>
        </div>
      </div>
      
      <button
        onClick={toggleNotifications}
        className={`p-1.5 rounded-md transition-colors ${
          notificationsEnabled
            ? 'bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300'
            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        title={notificationsEnabled ? t.notificationsOn : t.notificationsOff}
      >
        {notificationsEnabled ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
