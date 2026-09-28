import { create } from 'zustand';
import type { ViewMode } from '@/types';

interface UiState {
  viewMode: ViewMode;
  sidebarOpen: boolean;
  composerOpen: boolean;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setComposerOpen: (open: boolean) => void;
}

/** Ephemeral UI state that does not need to survive a reload. */
export const useUiStore = create<UiState>((set) => ({
  viewMode: 'grid',
  sidebarOpen: false,
  composerOpen: false,
  setViewMode: (viewMode) => set({ viewMode }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  setComposerOpen: (composerOpen) => set({ composerOpen }),
}));
