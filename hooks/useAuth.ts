import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  userId: string | null;
  login: (userId: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      hasCompletedOnboarding: false,
      userId: null,
      login: (userId: string) => set({ isLoggedIn: true, userId }),
      logout: () => set({ isLoggedIn: false, hasCompletedOnboarding: false, userId: null }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);