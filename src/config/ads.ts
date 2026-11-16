import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

export const AD_CONFIG = {
  enabled: true,
  interstitialEveryNSongs: 4,
  minCooldownMs: 60_000,

  bannerUnitId: __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : Platform.select({
        android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID ?? '',
        ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS ?? '',
      }) ?? '',

  interstitialUnitId: __DEV__
    ? TestIds.INTERSTITIAL
    : Platform.select({
        android: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID ?? '',
        ios: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS ?? '',
      }) ?? '',
};
