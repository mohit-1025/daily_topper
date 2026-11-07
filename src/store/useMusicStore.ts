import { create } from 'zustand'
import { studyMusic } from '@/services/studyMusic'
import type { ThemeId } from '@/types'

const VOLUME_KEY = 'dt-music-volume-v1'
const DEFAULT_VOLUME = 70

function initialVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY)
    const saved = raw === null ? Number.NaN : Number(raw)
    if (Number.isFinite(saved)) return Math.min(100, Math.max(0, Math.round(saved)))
  } catch {
    /* storage blocked — use the default */
  }
  return DEFAULT_VOLUME
}

interface MusicStore {
  playing: boolean
  busy: boolean
  volume: number
  toggle: (theme: ThemeId) => Promise<boolean>
  syncTheme: (theme: ThemeId) => void
  setVolume: (volume: number) => void
  stop: () => void
}

export const useMusicStore = create<MusicStore>((set) => ({
  playing: false,
  busy: false,
  volume: initialVolume(),

  toggle: async (theme) => {
    if (useMusicStore.getState().playing) {
      studyMusic.stop()
      set({ playing: false })
      return false
    }
    studyMusic.setVolume(useMusicStore.getState().volume)
    set({ busy: true })
    const started = await studyMusic.start(theme)
    set({ playing: started, busy: false })
    return started
  },

  syncTheme: (theme) => {
    void studyMusic.setTheme(theme).then((ok) => {
      if (!ok) set({ playing: false })
    })
  },

  setVolume: (volume) => {
    const next = Math.min(100, Math.max(0, Math.round(volume)))
    studyMusic.setVolume(next)
    try {
      localStorage.setItem(VOLUME_KEY, String(next))
    } catch {
      /* storage blocked — keep the in-memory value */
    }
    set({ volume: next })
  },

  stop: () => {
    studyMusic.stop()
    set({ playing: false, busy: false })
  },
}))
