import { create } from 'zustand';

interface AuthState {
  isGuest: boolean;
  user: { id: string; name: string; email?: string } | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isGuest: true,
  user: null,
  signInWithGoogle: async () => {
    set({ isGuest: false, user: { id: 'demo-user', name: 'Ritika Listener' } });
  },
  signOut: () => set({ isGuest: true, user: null }),
}));
