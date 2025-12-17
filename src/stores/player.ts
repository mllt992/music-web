import { defineStore } from 'pinia'
import type { TuneHubPlatform, TuneHubQuality } from '../api/tunehub'

export type TrackRef = {
  id: string
  name: string
  artist?: string
  album?: string
  platform?: TuneHubPlatform | string
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
    quality: '320k' as TuneHubQuality,
    playing: false,
    history: [] as TrackRef[],
    favorites: [] as TrackRef[],
    playlists: [] as Playlist[],
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
  },
})


