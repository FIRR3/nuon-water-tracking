import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  login: () => void;
  logout: () => void;
  completeOnboarding: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  isLoggedIn: false,
  hasCompletedOnboarding: false,
  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false, hasCompletedOnboarding: false }),
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
}));