import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  NotoSansBengali_400Regular,
  NotoSansBengali_600SemiBold,
  NotoSansBengali_700Bold,
} from '@expo-google-fonts/noto-sans-bengali';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import { useProgress } from 'react-native-track-player';

import '@i18n/index';
import { AppNavigator } from '@navigation/AppNavigator';
import { usePlayerStore } from '@store/playerStore';
import { useSettingsStore } from '@store/settingsStore';
import { adManager } from '@services/adManager';
import { palettes } from '@theme/tokens';
import { useLibrarySync } from './src/hooks/useLibrarySync';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

function AudioProgressSync() {
  const { position, duration } = useProgress(500);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const streamType = usePlayerStore((s) => s.currentStream?.type);

  useEffect(() => {
    if (streamType === 'audio') {
      setProgress(position, duration);
    }
  }, [position, duration, streamType, setProgress]);

  return null;
}

function AppShell() {
  useLibrarySync();
  return <AppNavigator />;
}

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  const colors = palettes[theme];

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansBengali_400Regular,
    NotoSansBengali_600SemiBold,
    NotoSansBengali_700Bold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
  });

  useEffect(() => {
    usePlayerStore.getState().initAudio();
    adManager.init();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <AudioProgressSync />
        <AppShell />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
