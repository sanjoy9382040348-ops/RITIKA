import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

const resources = {
  en: {
    translation: {
      tabs: { home: 'Home', search: 'Search', library: 'Library' },
      home: {
        greeting: 'Listen on Ritika',
        all: 'All',
        english: 'English',
        hindi: 'Hindi',
        bengali: 'Bengali',
        trending: 'Trending',
        newReleases: 'New Releases',
        classics: 'Classics (60s–90s)',
        moodsGenres: 'Moods & Genres',
      },
      search: { placeholder: 'Songs, artists, albums...', recent: 'Recent Searches' },
      library: { likes: 'Liked Songs', playlists: 'Playlists', recent: 'Recently Played', offline: 'Offline' },
      settings: { title: 'Settings', language: 'App Language', quality: 'Audio Quality', dataSaver: 'Data Saver', theme: 'Theme' },
    },
  },
  hi: {
    translation: {
      tabs: { home: 'होम', search: 'खोजें', library: 'लाइब्रेरी' },
      home: {
        greeting: 'Ritika पर सुनें',
        all: 'सभी',
        english: 'अंग्रेज़ी',
        hindi: 'हिंदी',
        bengali: 'बंगाली',
        trending: 'ट्रेंडिंग',
        newReleases: 'नए गाने',
        classics: 'क्लासिक्स (60s–90s)',
        moodsGenres: 'मूड और शैली',
      },
      search: { placeholder: 'गाने, कलाकार, एल्बम...', recent: 'हाल की खोजें' },
      library: { likes: 'पसंदीदा गाने', playlists: 'प्लेलिस्ट', recent: 'हाल ही में सुने गए', offline: 'ऑफ़लाइन' },
      settings: { title: 'सेटिंग्स', language: 'ऐप भाषा', quality: 'ऑडियो क्वालिटी', dataSaver: 'डेटा सेवर', theme: 'थीम' },
    },
  },
  bn: {
    translation: {
      tabs: { home: 'হোম', search: 'খুঁজুন', library: 'লাইব্রেরি' },
      home: {
        greeting: 'Ritika-তে শুনুন',
        all: 'সব',
        english: 'ইংরেজি',
        hindi: 'হিন্দি',
        bengali: 'বাংলা',
        trending: 'ট্রেন্ডিং',
        newReleases: 'নতুন গান',
        classics: 'ক্লাসিকস (৬০–৯০ দশক)',
        moodsGenres: 'মুড ও ঘরানা',
      },
      search: { placeholder: 'গান, শিল্পী, অ্যালবাম...', recent: 'সাম্প্রতিক খোঁজ' },
      library: { likes: 'পছন্দের গান', playlists: 'প্লেলিস্ট', recent: 'সম্প্রতি শোনা', offline: 'অফলাইন' },
      settings: { title: 'সেটিংস', language: 'অ্যাপের ভাষা', quality: 'অডিও কোয়ালিটি', dataSaver: 'ডেটা সেভার', theme: 'থিম' },
    },
  },
};

const deviceLang = getLocales()[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: ['en', 'hi', 'bn'].includes(deviceLang) ? deviceLang : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
