import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode } from '../types/music';

interface SettingsState {
  appLanguage: LanguageCode;
  audioQuality: 'low' | 'normal' | 'high';
  dataSaver: boolean;
  theme: 'dark' | 'light';
  setLanguage: (lang: LanguageCode) => void;
  setAudioQuality: (q: 'low' | 'normal' | 'high') => void;
  toggleDataSaver: () => void;
  toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appLanguage: 'en',
      audioQuality: 'high',
      dataSaver: false,
      theme: 'dark',
      setLanguage: (appLanguage) => set({ appLanguage }),
      setAudioQuality: (audioQuality) => set({ audioQuality }),
      toggleDataSaver: () => set((s) => ({ dataSaver: !s.dataSaver })),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'ritika:settings', storage: createJSONStorage(() => AsyncStorage) }
  )
);
