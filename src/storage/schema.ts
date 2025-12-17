import type { TuneHubPlatform } from '../api/tunehub'

export type ConflictStrategy = 'server_wins' | 'client_wins'

export type WebDavConfig = {
  url: string
  username: string
  password: string
  remotePath: string
  timeoutMs: number
  autoSync: boolean
  conflictStrategy: ConflictStrategy
}

export type ApiConfig = {
  baseUrl: string
}

export type AppSettings = {
  api: ApiConfig
  webdav: WebDavConfig
}

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

export type AppDataV1 = {
  version: 1
  updatedAt: number
  settings: AppSettings
  favorites: TrackRef[]
  history: TrackRef[]
  playlists: Playlist[]
}

export type AppData = AppDataV1

export function createDefaultData(): AppDataV1 {
  const now = Date.now()
  return {
    version: 1,
    updatedAt: now,
    settings: {
      api: { baseUrl: '' },
      webdav: {
        url: '',
        username: '',
        password: '',
        remotePath: '/music-app/data.json',
        timeoutMs: 15000,
        autoSync: false,
        conflictStrategy: 'server_wins',
      },
    },
    favorites: [],
    history: [],
    playlists: [],
  }
}


