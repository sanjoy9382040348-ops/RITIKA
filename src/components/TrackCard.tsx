import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Track } from '../types/music';
import { getFontFamily, palettes } from '@theme/tokens';

interface Props {
  track: Track;
  onPress: (track: Track) => void;
}

export const TrackCard: React.FC<Props> = ({ track, onPress }) => {
  const colors = palettes.dark;

  return (
    <Pressable
      onPress={() => onPress(track)}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`${track.title} by ${track.artist}`}
    >
      <View style={styles.artWrap}>
        <Image source={{ uri: track.artworkUrl }} style={styles.art} />
        {track.isClassic && (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeText}>{track.releaseYear ?? 'Classic'}</Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={[styles.title, { color: colors.text, fontFamily: getFontFamily(track.language, 'semibold') }]}
      >
        {track.title}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.artist, { color: colors.textMuted, fontFamily: getFontFamily(track.language, 'regular') }]}
      >
        {track.artist}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { width: 148, marginRight: 14 },
  artWrap: { position: 'relative', marginBottom: 8 },
  art: { width: 148, height: 148, borderRadius: 14, backgroundColor: '#1E1E2A' },
  badge: { position: 'absolute', bottom: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  title: { fontSize: 14, marginBottom: 2 },
  artist: { fontSize: 12 },
});
