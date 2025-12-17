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
  realUrl?: string
  realUrlTimestamp?: number
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
    mode: 'order' as 'order' | 'loop' | 'loop_list' | 'shuffle',
    quality: '320k' as TuneHubQuality,
    playing: false,
    history: [] as TrackRef[],
    favorites: [] as TrackRef[],
    playlists: [] as Playlist[],
    playCounts: {} as Record<string, number>,
  }),
  actions: {
    play(track: TrackRef, list?: TrackRef[]) {
      // 保存当前歌曲，用于比较是否是同一首歌
      const isSameTrack = this.current && this.current.id === track.id && this.current.platform === track.platform
      
      this.current = track
      if (list) {
        this.queue = Array.isArray(list) ? [...list] : []
      } else if (!Array.isArray(this.queue) || this.queue.length === 0) {
        this.queue = [track]
      } else {
        // 检查歌曲是否已经在队列中
        const exists = this.queue.findIndex(t => t.id === track.id && t.platform === track.platform)
        if (exists === -1) {
          // 将新歌曲添加到队列中，保持当前歌曲在队列中
          this.queue.push(track)
        }
      }
      this.playing = true
      
      // 只有当播放新歌曲时才更新历史记录和播放计数
      if (!isSameTrack) {
        this.addToHistory(track)
        this.incrementPlayCount(track)
      }
      
      this.saveSettings()
    },
    playAll(tracks: TrackRef[], startIndex: number = 0) {
      if (!Array.isArray(tracks) || tracks.length === 0) return
      this.queue = [...tracks]
      if (startIndex >= 0 && startIndex < tracks.length) {
        this.current = tracks[startIndex] || null
        this.playing = true
        this.addToHistory(this.current)
        this.incrementPlayCount(this.current)
        this.saveSettings()
      }
    },
    toggleMode() {
      // 扩展播放模式，添加单曲循环模式
      const modes: ('order' | 'loop' | 'loop_list' | 'shuffle')[] = ['order', 'loop', 'loop_list', 'shuffle']
      // 兼容旧数据，如果是旧的loop模式，转换为新的loop_list模式
      const currentMode = this.mode === 'loop' ? 'loop_list' : this.mode as 'order' | 'loop' | 'loop_list' | 'shuffle'
      const idx = modes.indexOf(currentMode)
      this.mode = modes[(idx + 1) % modes.length] as 'order' | 'loop' | 'loop_list' | 'shuffle'
      this.saveSettings()
    },
    next() {
      if (!this.current || !Array.isArray(this.queue) || this.queue.length === 0) return

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
        // 单曲循环：保持当前歌曲不变
        nextIdx = idx
      } else if (this.mode === 'loop_list') {
        // 列表循环：播放完最后一首后回到第一首
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
        this.current = this.queue[nextIdx] || null
        this.playing = true
        this.addToHistory(this.current)
        this.incrementPlayCount(this.current)
        this.saveSettings()
      }
    },
    prev() {
      if (!this.current || !Array.isArray(this.queue) || this.queue.length === 0) return

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
        this.current = this.queue[nextIdx] || null
        this.playing = true
        this.addToHistory(this.current)
        this.incrementPlayCount(this.current)
        this.saveSettings()
      }
    },
    saveSettings() {
      localStorage.setItem('player_mode', this.mode)
      localStorage.setItem('music_playCounts', JSON.stringify(this.playCounts))
      
      // 保存当前播放状态
      if (this.current) {
        localStorage.setItem('player_current', JSON.stringify(this.current))
      } else {
        localStorage.removeItem('player_current')
      }
      
      localStorage.setItem('player_queue', JSON.stringify(this.queue))
      localStorage.setItem('player_playing', String(this.playing))
      localStorage.setItem('player_quality', this.quality)
    },
    loadSettings() {
      const m = localStorage.getItem('player_mode')
      // 兼容旧数据，添加loop_list模式
      if (m && ['order', 'loop', 'shuffle', 'loop_list'].includes(m)) {
        this.mode = m as 'order' | 'loop' | 'loop_list' | 'shuffle'
      }
      
      // 加载当前播放状态
      const currentTrack = localStorage.getItem('player_current')
      if (currentTrack) {
        try {
          this.current = JSON.parse(currentTrack)
        } catch {
          this.current = null
        }
      }
      
      const queue = localStorage.getItem('player_queue')
      if (queue) {
        try {
          this.queue = JSON.parse(queue)
        } catch {
          this.queue = []
        }
      }
      
      const playing = localStorage.getItem('player_playing')
      if (playing) {
        this.playing = playing === 'true'
      }
      
      const quality = localStorage.getItem('player_quality')
      if (quality && ['128k', '320k', 'flac', 'flac24bit'].includes(quality)) {
        this.quality = quality as TuneHubQuality
      }
    },
    pause() {
      this.playing = false
      this.saveSettings()
    },
    syncToAppStore() {
      const app = useAppStore()
      app.data.favorites = this.favorites
      app.data.history = this.history
      app.data.playlists = this.playlists
      app.persist()
    },
    addToHistory(track: TrackRef | null) {
      if (!track) return
      if (!Array.isArray(this.history)) {
        this.history = []
      }
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
      if (!Array.isArray(this.favorites)) {
        this.favorites = []
      }
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
      if (!Array.isArray(this.favorites)) return false
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
      if (!Array.isArray(this.playlists)) {
        this.playlists = []
      }
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
      if (!Array.isArray(this.playlists)) return
      const idx = this.playlists.findIndex(p => p.id === id)
      if (idx >= 0) {
        this.playlists.splice(idx, 1)
        this.savePlaylists()
      }
    },
    addTrackToPlaylist(playlistId: string, track: TrackRef) {
      if (!Array.isArray(this.playlists)) return
      const playlist = this.playlists.find(p => p.id === playlistId)
      if (!playlist) return
      if (!Array.isArray(playlist.tracks)) {
        playlist.tracks = []
      }
      const exists = playlist.tracks.findIndex(t => t.id === track.id && t.platform === track.platform)
      if (exists < 0) {
        playlist.tracks.push(track)
        this.savePlaylists()
      }
    },
    removeTrackFromPlaylist(playlistId: string, trackId: string, platform?: string) {
      if (!Array.isArray(this.playlists)) return
      const playlist = this.playlists.find(p => p.id === playlistId)
      if (!playlist || !Array.isArray(playlist.tracks)) return
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
    incrementPlayCount(track: TrackRef | null) {
      if (!track) return
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
      this.favorites = Array.isArray(app.data.favorites) ? app.data.favorites : []
      this.history = Array.isArray(app.data.history) ? app.data.history : []
      this.playlists = Array.isArray(app.data.playlists) ? app.data.playlists : []
    },
  },
})


