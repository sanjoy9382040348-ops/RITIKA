import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Ritika',
  slug: 'ritika',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0B0B0F',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.ritika.app',
    infoPlist: {
      UIBackgroundModes: ['audio'],
    },
  },
  android: {
    package: 'com.ritika.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0B0B0F',
    },
    permissions: ['FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_MEDIA_PLAYBACK', 'WAKE_LOCK'],
  },
  plugins: [
    'expo-font',
    'expo-localization',
    'expo-secure-store',
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: process.env.ADMOB_ANDROID_APP_ID ?? 'ca-app-pub-3940256099942544~3347511713',
        iosAppId: process.env.ADMOB_IOS_APP_ID ?? 'ca-app-pub-3940256099942544~1458002511',
      },
    ],
  ],
});
