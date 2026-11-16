import { useEffect } from 'react';
import { apiClient } from '@api/client';
import { useAuthStore } from '@store/authStore';
import { useLibraryStore } from '@store/libraryStore';

export function useLibrarySync() {
  const isGuest = useAuthStore((s) => s.isGuest);
  const likedTracks = useLibraryStore((s) => s.likedTracks);
  const playlists = useLibraryStore((s) => s.playlists);

  useEffect(() => {
    if (isGuest) return;

    const timer = setTimeout(() => {
      apiClient.post('/sync', { likedTracks, playlists }).catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [isGuest, likedTracks, playlists]);
}
