import { create } from 'zustand';

type AppState = {
  showFolded: boolean;
  blacklistCollapsed: boolean;
  toggleFolded: () => void;
  toggleBlacklist: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  showFolded: false,
  blacklistCollapsed: false,
  toggleFolded: () => set((state) => ({ showFolded: !state.showFolded })),
  toggleBlacklist: () => set((state) => ({ blacklistCollapsed: !state.blacklistCollapsed })),
}));
