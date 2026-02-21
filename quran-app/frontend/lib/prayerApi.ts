import axios from 'axios';

const PRAYER_API_BASE = 'https://api.aladhan.com/v1';

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface PrayerTimeData {
  name: string;
  nameEn: string;
  nameAr: string;
  nameFr: string;
  time: string;
  timeDate: Date;
}

export const prayerNames = {
  fajr: { en: 'Fajr', ar: 'الفجر', fr: 'Fajr' },
  sunrise: { en: 'Sunrise', ar: 'الشروق', fr: 'Lever du soleil' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر', fr: 'Dhuhr' },
  asr: { en: 'Asr', ar: 'العصر', fr: 'Asr' },
  maghrib: { en: 'Maghrib', ar: 'المغرب', fr: 'Maghrib' },
  isha: { en: 'Isha', ar: 'العشاء', fr: 'Isha' },
};

export const prayerApi = {
  getPrayerTimes: async (latitude: number, longitude: number): Promise<PrayerTimes> => {
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    
    const { data } = await axios.get(
      `${PRAYER_API_BASE}/timings/${dateStr}`,
      {
        params: {
          latitude,
          longitude,
          method: 2, // Islamic Society of North America
          school: 1, // Hanafi
        },
      }
    );

    const timings = data.data.timings;
    
    return {
      fajr: timings.Fajr,
      sunrise: timings.Sunrise,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
    };
  },

  getNextPrayer: (prayerTimes: PrayerTimes, language: string): PrayerTimeData | null => {
    const now = new Date();
    const prayers = [
      { key: 'fajr', time: prayerTimes.fajr },
      { key: 'sunrise', time: prayerTimes.sunrise },
      { key: 'dhuhr', time: prayerTimes.dhuhr },
      { key: 'asr', time: prayerTimes.asr },
      { key: 'maghrib', time: prayerTimes.maghrib },
      { key: 'isha', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = new Date(now);
      prayerTime.setHours(hours, minutes, 0, 0);

      if (prayerTime > now) {
        const names = prayerNames[prayer.key as keyof typeof prayerNames];
        return {
          name: prayer.key,
          nameEn: names.en,
          nameAr: names.ar,
          nameFr: names.fr,
          time: prayer.time,
          timeDate: prayerTime,
        };
      }
    }

    // If no prayer found today, return tomorrow's Fajr
    const [fajrHours, fajrMinutes] = prayerTimes.fajr.split(':').map(Number);
    const tomorrowFajr = new Date(now);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    tomorrowFajr.setHours(fajrHours, fajrMinutes, 0, 0);

    return {
      name: 'fajr',
      nameEn: prayerNames.fajr.en,
      nameAr: prayerNames.fajr.ar,
      nameFr: prayerNames.fajr.fr,
      time: prayerTimes.fajr,
      timeDate: tomorrowFajr,
    };
  },

  formatTimeUntil: (targetDate: Date): string => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  requestNotificationPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  showNotification: (title: string, body: string): void => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon.png',
        badge: '/icon.png',
      });
    }
  },
};
