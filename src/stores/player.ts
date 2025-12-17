import { defineStore } from 'pinia'
import { useAppStore } from './app'
import type { TuneHubPlatform, TuneHubQuality } from '../api/tunehub'

export type TrackRef = {
  id: string
  name: string
  artist?: string
  album?: string
  platform?: TuneHubPlatform | string
  playCount?: number
}

export type Playlist = {
  id: string
  name: string
  tracks: TrackRef[]
  createdAt: number
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    current: null as TrackRef | null,
    queue: [] as TrackRef[],
    mode: 'order' as 'order' | 'loop' | 'shuffle',
    quality: '320k' as TuneHubQuality,
    playing: false,
    history: [] as TrackRef[],
    favorites: [] as TrackRef[],
    playlists: [] as Playlist[],
    playCounts: {} as Record<string, number>,
  }),
  actions: {
    play(track: TrackRef, list?: TrackRef[]) {
      this.current = track
      if (list) {
        this.queue = [...list]
      } else if (this.queue.length === 0) {
        this.queue = [track]
      }
      this.playing = true
      this.addToHistory(track)
      this.incrementPlayCount(track)
    },
    toggleMode() {
      const modes: ('order' | 'loop' | 'shuffle')[] = ['order', 'loop', 'shuffle']
      const idx = modes.indexOf(this.mode)
      this.mode = modes[(idx + 1) % modes.length]
      this.saveSettings()
    },
    next() {
      if (!this.current || this.queue.length === 0) return

      const idx = this.queue.findIndex(t => t.id === this.current?.id && t.platform === this.current?.platform)
      let nextIdx = -1

      if (this.mode === 'shuffle') {
        if (this.queue.length > 1) {
          do {
            nextIdx = Math.floor(Math.random() * this.queue.length)
          } while (nextIdx === idx)
        } else {
          nextIdx = 0
        }
      } else if (this.mode === 'loop') {
        nextIdx = (idx + 1) % this.queue.length
      } else {
        // order
        if (idx < this.queue.length - 1) {
          nextIdx = idx + 1
        } else {
          this.playing = false
          return
        }
      }

      if (nextIdx >= 0) {
        this.current = this.queue[nextIdx]
        this.playing = true
        this.addToHistory(this.current)
      }
    },
    prev() {
      if (!this.current || this.queue.length === 0) return

      const idx = this.queue.findIndex(t => t.id === this.current?.id && t.platform === this.current?.platform)
      let nextIdx = -1

      if (this.mode === 'shuffle') {
        // For simple shuffle prev, just go back in list wrapping around or random
        // Ideally should be history based, but for now simple prev
        nextIdx = (idx - 1 + this.queue.length) % this.queue.length
      } else if (this.mode === 'loop') {
        nextIdx = (idx - 1 + this.queue.length) % this.queue.length
      } else {
        // order
        if (idx > 0) {
          nextIdx = idx - 1
        }
      }

      if (nextIdx >= 0) {
        this.current = this.queue[nextIdx]
        this.playing = true
        this.addToHistory(this.current)
      }
    },
    saveSettings() {
      localStorage.setItem('player_mode', this.mode)
      localStorage.setItem('music_playCounts', JSON.stringify(this.playCounts))
    },
    loadSettings() {
      const m = localStorage.getItem('player_mode')
      if (m && ['order', 'loop', 'shuffle'].includes(m)) {
        this.mode = m as 'order' | 'loop' | 'shuffle'
      }
    },
    pause() {
      this.playing = false
    },
    syncToAppStore() {
      const app = useAppStore()
      app.data.favorites = this.favorites
      app.data.history = this.history
      app.data.playlists = this.playlists
      app.persist()
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
      this.syncToAppStore()
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
      this.syncToAppStore()
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
    createPlaylist(name: string) {
      const playlist: Playlist = {
        id: Date.now().toString(),
        name,
        tracks: [],
        createdAt: Date.now(),
      }
      this.playlists.push(playlist)
      this.savePlaylists()
      return playlist
    },
    deletePlaylist(id: string) {
      const idx = this.playlists.findIndex(p => p.id === id)
      if (idx >= 0) {
        this.playlists.splice(idx, 1)
        this.savePlaylists()
      }
    },
    addTrackToPlaylist(playlistId: string, track: TrackRef) {
      const playlist = this.playlists.find(p => p.id === playlistId)
      if (!playlist) return
      const exists = playlist.tracks.findIndex(t => t.id === track.id && t.platform === track.platform)
      if (exists < 0) {
        playlist.tracks.push(track)
        this.savePlaylists()
      }
    },
    removeTrackFromPlaylist(playlistId: string, trackId: string, platform?: string) {
      const playlist = this.playlists.find(p => p.id === playlistId)
      if (!playlist) return
      const idx = playlist.tracks.findIndex(t => t.id === trackId && t.platform === platform)
      if (idx >= 0) {
        playlist.tracks.splice(idx, 1)
        this.savePlaylists()
      }
    },
    savePlaylists() {
      localStorage.setItem('music_playlists', JSON.stringify(this.playlists))
      this.syncToAppStore()
    },
    loadPlaylists() {
      const stored = localStorage.getItem('music_playlists')
      if (stored) {
        try {
          this.playlists = JSON.parse(stored)
        } catch {
          this.playlists = []
        }
      }
    },
    incrementPlayCount(track: TrackRef) {
      const key = `${track.platform}-${track.id}`
      this.playCounts[key] = (this.playCounts[key] || 0) + 1
      localStorage.setItem('music_playCounts', JSON.stringify(this.playCounts))
      this.syncToAppStore()
    },
    getPlayCount(track: TrackRef): number {
      const key = `${track.platform}-${track.id}`
      return this.playCounts[key] || 0
    },
    loadPlayCounts() {
      const stored = localStorage.getItem('music_playCounts')
      if (stored) {
        try {
          this.playCounts = JSON.parse(stored)
        } catch {
          this.playCounts = {}
        }
      }
    },
    loadFromAppStore() {
      const app = useAppStore()
      this.favorites = app.data.favorites
      this.history = app.data.history
      this.playlists = app.data.playlists
    },
  },
})


