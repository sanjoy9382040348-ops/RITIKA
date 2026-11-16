import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Download, Plus } from 'lucide-react-native';
import { useLibraryStore } from '@store/libraryStore';
import { usePlayerStore } from '@store/playerStore';
import { TrackRow } from '@components/TrackRow';
import { palettes } from '@theme/tokens';
import { Track } from '../../types/music';

type Tab = 'likes' | 'playlists' | 'recent' | 'offline';

export const LibraryScreen: React.FC = () => {
  const { t } = useTranslation();
  const colors = palettes.dark;
  const [tab, setTab] = useState<Tab>('likes');
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const {
    likedTracks,
    playlists,
    recentlyPlayed,
    offlineTracks,
    isLiked,
    toggleLike,
    createPlaylist,
    downloadForOffline,
  } = useLibraryStore();
  const playTrack = usePlayerStore((s) => s.playTrack);

  const handleOfflinePress = async (track: Track) => {
    if (!track.license.allowOfflineDownload) {
      Alert.alert('Offline Unavailable', `${track.providerId} license does not permit offline downloads for this track.`);
      return;
    }
    await downloadForOffline(track);
  };

  const activeList =
    tab === 'likes' ? likedTracks : tab === 'recent' ? recentlyPlayed : tab === 'offline' ? offlineTracks : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.heading, { color: colors.text }]}>{t('tabs.library')}</Text>

        <View style={styles.tabRow}>
          {(['likes', 'playlists', 'recent', 'offline'] as Tab[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[styles.tabBtn, { backgroundColor: tab === key ? colors.accent : colors.surface }]}
            >
              <Text style={{ color: tab === key ? '#FFF' : colors.text, fontSize: 12, fontWeight: '600' }}>
                {t(`library.${key}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'playlists' ? (
          <View style={{ flex: 1 }}>
            <View style={[styles.createRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                placeholder="New playlist name..."
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, color: colors.text, fontSize: 14 }}
              />
              <Pressable
                onPress={() => {
                  if (!newPlaylistName.trim()) return;
                  createPlaylist(newPlaylistName.trim());
                  setNewPlaylistName('');
                }}
                style={[styles.addBtn, { backgroundColor: colors.accent }]}
              >
                <Plus size={18} color="#FFF" />
              </Pressable>
            </View>

            <FlatList
              data={playlists}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => item.tracks.length && playTrack(item.tracks[0], item.tracks)}
                  style={[styles.playlistCard, { backgroundColor: colors.surface }]}
                >
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{item.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.tracks.length} tracks</Text>
                </Pressable>
              )}
            />
          </View>
        ) : (
          <FlatList
            data={activeList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 110 }}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <TrackRow
                    track={item}
                    isLiked={isLiked(item.id)}
                    onPress={(tr) => playTrack(tr, activeList)}
                    onToggleLike={toggleLike}
                  />
                </View>
                {tab === 'likes' && item.license.allowOfflineDownload && (
                  <Pressable onPress={() => handleOfflinePress(item)} style={styles.dlBtn}>
                    <Download size={18} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>
                Nothing here yet.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 14 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  createRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 48, marginBottom: 14 },
  addBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  playlistCard: { padding: 16, borderRadius: 14, marginBottom: 10 },
  dlBtn: { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
