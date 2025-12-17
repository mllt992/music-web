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
  }),
  actions: {
    play(track: TrackRef) {
      this.current = track
      this.playing = true
    },
    pause() {
      this.playing = false
    },
  },
})


