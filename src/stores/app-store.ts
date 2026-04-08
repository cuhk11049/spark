import { create } from 'zustand';
import { DEFAULT_VISITOR_USER_ID } from '../api/service';

type AppState = {
  showFolded: boolean;
  blacklistCollapsed: boolean;
  activeVisitorId: string;
  toggleFolded: () => void;
  toggleBlacklist: () => void;
  setActiveVisitorId: (visitorId: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  showFolded: false,
  blacklistCollapsed: false,
  activeVisitorId: DEFAULT_VISITOR_USER_ID,
  toggleFolded: () => set((state) => ({ showFolded: !state.showFolded })),
  toggleBlacklist: () => set((state) => ({ blacklistCollapsed: !state.blacklistCollapsed })),
  setActiveVisitorId: (activeVisitorId) => set({ activeVisitorId }),
}));
