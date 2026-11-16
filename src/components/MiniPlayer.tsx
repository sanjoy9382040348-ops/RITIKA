import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Pause, Play, SkipForward } from 'lucide-react-native';
import { usePlayerStore } from '@store/playerStore';
import { getFontFamily, palettes } from '@theme/tokens';

export const MiniPlayer: React.FC<{ onOpenFullPlayer: () => void }> = ({ onOpenFullPlayer }) => {
  const colors = palettes.dark;
  const { currentTrack, isPlaying, togglePlayPause, skipNext } = usePlayerStore();

  if (!currentTrack) return null;

  return (
    <Pressable onPress={onOpenFullPlayer} style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Image source={{ uri: currentTrack.artworkUrl }} style={styles.art} />
      <View style={styles.meta}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.text, fontFamily: getFontFamily(currentTrack.language, 'semibold') }]}
        >
          {currentTrack.title}
        </Text>
        <Text numberOfLines={1} style={[styles.artist, { color: colors.textMuted }]}>
          {currentTrack.artist}
        </Text>
      </View>
      <Pressable onPress={togglePlayPause} hitSlop={10} style={styles.btn}>
        {isPlaying ? <Pause size={22} color={colors.text} /> : <Play size={22} color={colors.text} />}
      </Pressable>
      <Pressable onPress={skipNext} hitSlop={10} style={styles.btn}>
        <SkipForward size={22} color={colors.text} />
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginBottom: 8, padding: 8, borderRadius: 14, borderWidth: 1, minHeight: 62 },
  art: { width: 44, height: 44, borderRadius: 8, marginRight: 10 },
  meta: { flex: 1 },
  title: { fontSize: 14 },
  artist: { fontSize: 12 },
  btn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
