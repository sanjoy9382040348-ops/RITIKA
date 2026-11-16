import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, Play } from 'lucide-react-native';
import { Track } from '../types/music';
import { getFontFamily, palettes } from '@theme/tokens';

interface Props {
  track: Track;
  isActive?: boolean;
  isLiked?: boolean;
  onPress: (track: Track) => void;
  onToggleLike?: (track: Track) => void;
}

export const TrackRow: React.FC<Props> = ({ track, isActive, isLiked, onPress, onToggleLike }) => {
  const colors = palettes.dark;

  return (
    <Pressable
      onPress={() => onPress(track)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: isActive ? colors.accentSoft : pressed ? colors.surface : 'transparent' },
      ]}
    >
      <Image source={{ uri: track.artworkUrl }} style={styles.art} />
      <View style={styles.meta}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            { color: isActive ? colors.accent : colors.text, fontFamily: getFontFamily(track.language, 'semibold') },
          ]}
        >
          {track.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.sub, { color: colors.textMuted, fontFamily: getFontFamily(track.language, 'regular') }]}
        >
          {track.artist} · {track.providerId.toUpperCase()}
          {track.isClassic ? ` · ${track.releaseYear ?? 'Classic'}` : ''}
        </Text>
      </View>

      {onToggleLike ? (
        <Pressable onPress={() => onToggleLike(track)} hitSlop={12} style={styles.actionBtn}>
          <Heart size={20} color={isLiked ? colors.accent : colors.textMuted} fill={isLiked ? colors.accent : 'none'} />
        </Pressable>
      ) : (
        <View style={styles.actionBtn}>
          <Play size={18} color={colors.textMuted} />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, minHeight: 64 },
  art: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#1E1E2A', marginRight: 12 },
  meta: { flex: 1 },
  title: { fontSize: 15, marginBottom: 2 },
  sub: { fontSize: 12 },
  actionBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
