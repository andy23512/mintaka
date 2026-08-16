import { create } from 'zustand'

export type ToolId = 'none' | 'typing' | 'breath' | 'chord'

interface UIState {
  activeTool: ToolId
  setActiveTool: (tool: ToolId) => void
  audioStarted: boolean
  audioMuted: boolean
  volume: number
  startAudio: () => void
  toggleMute: () => void
  setVolume: (volume: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: 'none',
  setActiveTool: (tool) =>
    set((state) => ({ activeTool: state.activeTool === tool ? 'none' : tool })),
  audioStarted: false,
  audioMuted: true,
  volume: 0.7,
  startAudio: () => set({ audioStarted: true }),
  toggleMute: () => set((state) => ({ audioMuted: !state.audioMuted })),
  setVolume: (volume) => set({ volume, audioMuted: false }),
}))
