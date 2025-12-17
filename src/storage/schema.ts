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

export type AppDataV1 = {
  version: 1
  updatedAt: number
  settings: AppSettings
  favorites: {
    songs: string[]
    playlists: string[]
    albums: string[]
  }
  history: {
    songs: Array<{ id: string; playedAt: number }>
  }
  playlists: Array<{
    id: string
    name: string
    trackIds: string[]
    createdAt: number
    updatedAt: number
  }>
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
    favorites: { songs: [], playlists: [], albums: [] },
    history: { songs: [] },
    playlists: [],
  }
}


