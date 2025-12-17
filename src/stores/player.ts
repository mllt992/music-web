import { defineStore } from 'pinia'
import type { TuneHubPlatform, TuneHubQuality } from '../api/tunehub'

export type TrackRef = {
  id: string
  name: string
  artist?: string
  album?: string
  platform?: TuneHubPlatform | string
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    current: null as TrackRef | null,
    quality: '320k' as TuneHubQuality,
    playing: false,
    history: [] as TrackRef[],
    favorites: [] as TrackRef[],
  }),
  actions: {
    play(track: TrackRef) {
      this.current = track
      this.playing = true
      this.addToHistory(track)
    },
    pause() {
      this.playing = false
    },
    addToHistory(track: TrackRef) {
      const exists = this.history.findIndex(t => t.id === track.id && t.platform === track.platform)
      if (exists >= 0) {
        this.history.splice(exists, 1)
      }
      this.history.unshift(track)
      if (this.history.length > 100) {
        this.history = this.history.slice(0, 100)
      }
      localStorage.setItem('music_history', JSON.stringify(this.history))
    },
    loadHistory() {
      const stored = localStorage.getItem('music_history')
      if (stored) {
        try {
          this.history = JSON.parse(stored)
        } catch {
          this.history = []
        }
      }
    },
    toggleFavorite(track: TrackRef) {
      const idx = this.favorites.findIndex(t => t.id === track.id && t.platform === track.platform)
      if (idx >= 0) {
        this.favorites.splice(idx, 1)
      } else {
        this.favorites.unshift(track)
      }
      localStorage.setItem('music_favorites', JSON.stringify(this.favorites))
    },
    isFavorite(track: TrackRef): boolean {
      return this.favorites.some(t => t.id === track.id && t.platform === track.platform)
    },
    loadFavorites() {
      const stored = localStorage.getItem('music_favorites')
      if (stored) {
        try {
          this.favorites = JSON.parse(stored)
        } catch {
          this.favorites = []
        }
      }
    },
  },
})


