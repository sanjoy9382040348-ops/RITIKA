import React, { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import {
  ChevronDown,
  Heart,
  ListMusic,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react-native';
import { usePlayerStore } from '@store/playerStore';
import { useLibraryStore } from '@store/libraryStore';
import { TrackRow } from '@components/TrackRow';
import { ENABLE_LYRICS, LyricsView } from '../lyrics/LyricsView';
import { getFontFamily, palettes } from '@theme/tokens';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const PlayerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = palettes.dark;
  const {
    currentTrack,
    currentStream,
    isPlaying,
    positionSec,
    durationSec,
    shuffle,
    repeatMode,
    queue,
    togglePlayPause,
    skipNext,
    skipPrev,
    seekTo,
    toggleShuffle,
    cycleRepeat,
    playTrack,
  } = usePlayerStore();

  const { isLiked, toggleLike } = useLibraryStore();
  const [panel, setPanel] = useState<'art' | 'queue' | 'lyrics'>('art');

  if (!currentTrack) return null;

  const progress = durationSec > 0 ? Math.min(1, positionSec / durationSec) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <ChevronDown size={26} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
          {currentTrack.providerId.toUpperCase()}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          {ENABLE_LYRICS && (
            <Pressable onPress={() => setPanel(panel === 'lyrics' ? 'art' : 'lyrics')} style={styles.iconBtn}>
              <Mic2 size={20} color={panel === 'lyrics' ? colors.accent : colors.text} />
            </Pressable>
          )}
          <Pressable onPress={() => setPanel(panel === 'queue' ? 'art' : 'queue')} style={styles.iconBtn}>
            <ListMusic size={22} color={panel === 'queue' ? colors.accent : colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.stage}>
        {panel === 'queue' ? (
          <FlatList
            data={queue}
            keyExtractor={(item, idx) => `${item.id}-${idx}`}
            renderItem={({ item }) => (
              <TrackRow track={item} isActive={item.id === currentTrack.id} onPress={(tr) => playTrack(tr, queue)} />
            )}
          />
        ) : panel === 'lyrics' ? (
          <LyricsView track={currentTrack} />
        ) : currentStream?.type === 'youtube_embed' ? (
          <View style={styles.ytWrap}>
            <YoutubePlayer
              height={220}
              play={isPlaying}
              videoId={currentStream.url}
              onChangeState={(state) => {
                if (state === 'ended') skipNext();
              }}
            />
          </View>
        ) : (
          <Image source={{ uri: currentTrack.artworkUrl }} style={styles.artwork} />
        )}
      </View>

      <View style={styles.infoRow}>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: colors.text, fontFamily: getFontFamily(currentTrack.language, 'bold') }]}
          >
            {currentTrack.title}
          </Text>
          <Text numberOfLines={1} style={[styles.artist, { color: colors.textMuted }]}>
            {currentTrack.artist}
          </Text>
        </View>
        <Pressable onPress={() => toggleLike(currentTrack)} style={styles.iconBtn}>
          <Heart
            size={24}
            color={isLiked(currentTrack.id) ? colors.accent : colors.textMuted}
            fill={isLiked(currentTrack.id) ? colors.accent : 'none'}
          />
        </Pressable>
      </View>

      {currentTrack.license.requiresAttribution && (
        <Text numberOfLines={1} style={[styles.attribution, { color: colors.textMuted }]}>
          {currentTrack.license.attributionText ?? currentTrack.license.name}
        </Text>
      )}

      <Pressable
        onPress={(e) => {
          const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / 320));
          seekTo(ratio * durationSec);
        }}
        style={styles.seekWrap}
      >
        <View style={[styles.seekTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.seekFill, { width: `${progress * 100}%`, backgroundColor: colors.accent }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{formatTime(positionSec)}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{formatTime(durationSec)}</Text>
        </View>
      </Pressable>

      <View style={styles.controls}>
        <Pressable onPress={toggleShuffle} style={styles.iconBtn}>
          <Shuffle size={22} color={shuffle ? colors.accent : colors.textMuted} />
        </Pressable>
        <Pressable onPress={skipPrev} style={styles.iconBtn}>
          <SkipBack size={28} color={colors.text} />
        </Pressable>
        <Pressable onPress={togglePlayPause} style={[styles.playBtn, { backgroundColor: colors.accent }]}>
          {isPlaying ? <Pause size={30} color="#FFF" /> : <Play size={30} color="#FFF" />}
        </Pressable>
        <Pressable onPress={skipNext} style={styles.iconBtn}>
          <SkipForward size={28} color={colors.text} />
        </Pressable>
        <Pressable onPress={cycleRepeat} style={styles.iconBtn}>
          {repeatMode === 'one' ? (
            <Repeat1 size={22} color={colors.accent} />
          ) : (
            <Repeat size={22} color={repeatMode === 'all' ? colors.accent : colors.textMuted} />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between', paddingBottom: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  iconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  stage: { flex: 1, justifyContent: 'center', marginVertical: 12 },
  artwork: { width: '100%', aspectRatio: 1, borderRadius: 20, backgroundColor: '#1E1E2A' },
  ytWrap: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 22 },
  artist: { fontSize: 15, marginTop: 2 },
  attribution: { fontSize: 11, marginBottom: 14 },
  seekWrap: { paddingVertical: 8 },
  seekTrack: { height: 5, borderRadius: 999, overflow: 'hidden' },
  seekFill: { height: '100%' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  playBtn: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
});
