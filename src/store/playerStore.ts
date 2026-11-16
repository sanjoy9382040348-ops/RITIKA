import { create } from 'zustand';
import TrackPlayer, { Capability, State } from 'react-native-track-player';
import { providerRegistry } from '@providers/ProviderRegistry';
import { adManager } from '@services/adManager';
import { StreamDescriptor, Track } from '../types/music';
import { getNextIndex, getPrevIndex, RepeatMode } from './queueUtils';
import { useLibraryStore } from './libraryStore';

interface PlayerState {
  currentTrack: Track | null;
  currentStream: StreamDescriptor | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  positionSec: number;
  durationSec: number;
  shuffle: boolean;
  repeatMode: RepeatMode;

  initAudio: () => Promise<void>;
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  seekTo: (sec: number) => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setProgress: (pos: number, dur: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  currentStream: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  positionSec: 0,
  durationSec: 0,
  shuffle: false,
  repeatMode: 'off',

  initAudio: async () => {
    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious, Capability.SeekTo],
        compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
      });
    } catch {
      // Already initialized
    }
  },

  playTrack: async (track, newQueue) => {
    const queue = newQueue ?? (get().queue.length ? get().queue : [track]);
    const idx = Math.max(0, queue.findIndex((t) => t.id === track.id));
    const stream = await providerRegistry.getStreamUrl(track);
    if (!stream) return;

    await adManager.onTrackStarted();
    useLibraryStore.getState().addRecentlyPlayed(track);

    set({
      currentTrack: track,
      currentStream: stream,
      queue,
      currentIndex: idx,
      positionSec: 0,
      durationSec: track.durationSec,
      isPlaying: true,
    });

    if (stream.type === 'audio') {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: track.id,
        url: stream.url,
        title: track.title,
        artist: track.artist,
        artwork: track.artworkUrl,
        duration: track.durationSec,
      });
      await TrackPlayer.play();
    } else {
      await TrackPlayer.reset();
    }
  },

  togglePlayPause: async () => {
    const { currentStream, isPlaying } = get();
    if (!currentStream) return;

    if (currentStream.type === 'audio') {
      const state = await TrackPlayer.getPlaybackState();
      if (state.state === State.Playing) {
        await TrackPlayer.pause();
        set({ isPlaying: false });
      } else {
        await TrackPlayer.play();
        set({ isPlaying: true });
      }
    } else {
      set({ isPlaying: !isPlaying });
    }
  },

  skipNext: async () => {
    const { currentIndex, queue, repeatMode, shuffle, playTrack } = get();
    const nextIdx = getNextIndex(currentIndex, queue.length, repeatMode, shuffle);
    if (nextIdx === null) {
      set({ isPlaying: false });
      return;
    }
    await playTrack(queue[nextIdx], queue);
  },

  skipPrev: async () => {
    const { currentIndex, queue, repeatMode, positionSec, seekTo, playTrack } = get();
    if (positionSec > 3) {
      await seekTo(0);
      return;
    }
    const prevIdx = getPrevIndex(currentIndex, queue.length, repeatMode);
    if (prevIdx !== null) await playTrack(queue[prevIdx], queue);
  },

  seekTo: async (sec) => {
    if (get().currentStream?.type === 'audio') {
      await TrackPlayer.seekTo(sec);
    }
    set({ positionSec: sec });
  },

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  cycleRepeat: () =>
    set((s) => ({
      repeatMode: s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off',
    })),

  setProgress: (positionSec, durationSec) => set({ positionSec, durationSec }),
}));
