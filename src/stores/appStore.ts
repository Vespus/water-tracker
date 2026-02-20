import { create } from 'zustand';

interface AppState {
  currentPage: 'dashboard' | 'history' | 'stats' | 'settings' | 'onboarding';
  setCurrentPage: (page: AppState['currentPage']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
}));
