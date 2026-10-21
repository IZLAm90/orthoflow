import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  newOrderOpen: boolean
  setNewOrderOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  // Start closed on mobile, open on desktop
  sidebarOpen: window.innerWidth >= 768,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  newOrderOpen: false,
  setNewOrderOpen: (open) => set({ newOrderOpen: open }),
}))
