import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { providerRegistry } from '@providers/ProviderRegistry';
import { Track } from '../types/music';

interface LocalPlaylist {
  id: string;
  title: string;
  tracks: Track[];
}

interface LibraryState {
  likedTracks: Track[];
  playlists: LocalPlaylist[];
  recentlyPlayed: Track[];
  offlineTracks: Track[];
  isLiked: (id: string) => boolean;
  toggleLike: (track: Track) => void;
  createPlaylist: (title: string) => void;
  addRecentlyPlayed: (track: Track) => void;
  downloadForOffline: (track: Track) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      likedTracks: [],
      playlists: [],
      recentlyPlayed: [],
      offlineTracks: [],

      isLiked: (id) => get().likedTracks.some((t) => t.id === id),

      toggleLike: (track) =>
        set((s) => ({
          likedTracks: s.likedTracks.some((t) => t.id === track.id)
            ? s.likedTracks.filter((t) => t.id !== track.id)
            : [track, ...s.likedTracks],
        })),

      createPlaylist: (title) =>
        set((s) => ({
          playlists: [{ id: `pl-${Date.now()}`, title, tracks: [] }, ...s.playlists],
        })),

      addRecentlyPlayed: (track) =>
        set((s) => ({
          recentlyPlayed: [track, ...s.recentlyPlayed.filter((t) => t.id !== track.id)].slice(0, 30),
        })),

      downloadForOffline: async (track) => {
        if (!track.license.allowOfflineDownload) return;
        const stream = await providerRegistry.getStreamUrl(track);
        if (!stream || stream.type !== 'audio') return;

        const dest = `${FileSystem.documentDirectory}${track.id.replace(':', '_')}.mp3`;
        await FileSystem.downloadAsync(stream.url, dest);
        set((s) => ({
          offlineTracks: s.offlineTracks.some((t) => t.id === track.id) ? s.offlineTracks : [track, ...s.offlineTracks],
        }));
      },
    }),
    { name: 'ritika:library', storage: createJSONStorage(() => AsyncStorage) }
  )
);
