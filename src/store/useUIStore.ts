import { create } from 'zustand'

export type ToolId = 'none' | 'typing' | 'breath'

interface UIState {
  activeTool: ToolId
  setActiveTool: (tool: ToolId) => void
  audioStarted: boolean
  audioMuted: boolean
  startAudio: () => void
  toggleMute: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: 'none',
  setActiveTool: (tool) =>
    set((state) => ({ activeTool: state.activeTool === tool ? 'none' : tool })),
  audioStarted: false,
  audioMuted: false,
  startAudio: () => set({ audioStarted: true }),
  toggleMute: () => set((state) => ({ audioMuted: !state.audioMuted })),
}))
