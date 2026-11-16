import mobileAds, { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { AD_CONFIG } from '../config/ads';

class AdManager {
  private interstitial: InterstitialAd | null = null;
  private isLoaded = false;
  private tracksSinceLastAd = 0;
  private lastShownAt = 0;

  async init() {
    if (!AD_CONFIG.enabled) return;
    await mobileAds().initialize();
    this.loadInterstitial();
  }

  private loadInterstitial() {
    if (!AD_CONFIG.interstitialUnitId) return;

    const ad = InterstitialAd.createForAdRequest(AD_CONFIG.interstitialUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    ad.addAdEventListener(AdEventType.LOADED, () => {
      this.isLoaded = true;
    });

    ad.addAdEventListener(AdEventType.CLOSED, () => {
      this.isLoaded = false;
      this.lastShownAt = Date.now();
      this.loadInterstitial();
    });

    ad.addAdEventListener(AdEventType.ERROR, () => {
      this.isLoaded = false;
    });

    ad.load();
    this.interstitial = ad;
  }

  async onTrackStarted() {
    if (!AD_CONFIG.enabled) return;

    this.tracksSinceLastAd += 1;
    const cooldownPassed = Date.now() - this.lastShownAt >= AD_CONFIG.minCooldownMs;

    if (
      this.tracksSinceLastAd >= AD_CONFIG.interstitialEveryNSongs &&
      cooldownPassed &&
      this.isLoaded &&
      this.interstitial
    ) {
      this.tracksSinceLastAd = 0;
      await this.interstitial.show();
    }
  }
}

export const adManager = new AdManager();
