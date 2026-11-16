import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_CONFIG } from '../config/ads';

export const AdBanner: React.FC = () => {
  const [failed, setFailed] = useState(false);

  if (!AD_CONFIG.enabled || !AD_CONFIG.bannerUnitId || failed) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={AD_CONFIG.bannerUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', paddingVertical: 4 },
});
