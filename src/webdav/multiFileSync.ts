import type { AppData, WebDavConfig } from '../storage/schema'
import { createDefaultData } from '../storage/schema'
import { createWebDavClient } from './client'

export interface SyncDataFiles {
  settings: string
  favorites: string
  history: string
  playlists: string
  playCounts: string
}

export const DEFAULT_FILE_PATHS: SyncDataFiles = {
  settings: '/music-app/settings.json',
  favorites: '/music-app/favorites.json',
  history: '/music-app/history.json',
  playlists: '/music-app/playlists.json',
  playCounts: '/music-app/playCounts.json'
}

export interface SyncMetadata {
  version: number
  lastSync: number
  files: {
    [key in keyof SyncDataFiles]: {
      updatedAt: number
      size: number
      checksum?: string
    }
  }
}

export async function webdavTestMultiFile(cfg: WebDavConfig): Promise<boolean> {
  try {
    const client = createWebDavClient(cfg)
    await client.getDirectoryContents('/', { deep: false })
    return true
  } catch {
    return false
  }
}

export async function webdavUploadMultiFile(
  cfg: WebDavConfig, 
  data: AppData,
  playCounts: Record<string, number>
): Promise<void> {
  const client = createWebDavClient(cfg)
  const now = Date.now()
  
  try {
    // 上传设置
    const settingsData = {
      version: 1,
      updatedAt: now,
      settings: data.settings
    }
    await client.putFileContents(
      DEFAULT_FILE_PATHS.settings,
      JSON.stringify(settingsData, null, 2),
      { overwrite: true }
    )
    
    // 上传收藏
    const favoritesData = {
      version: 1,
      updatedAt: now,
      favorites: data.favorites
    }
    await client.putFileContents(
      DEFAULT_FILE_PATHS.favorites,
      JSON.stringify(favoritesData, null, 2),
      { overwrite: true }
    )
    
    // 上传历史
    const historyData = {
      version: 1,
      updatedAt: now,
      history: data.history
    }
    await client.putFileContents(
      DEFAULT_FILE_PATHS.history,
      JSON.stringify(historyData, null, 2),
      { overwrite: true }
    )
    
    // 上传歌单
    const playlistsData = {
      version: 1,
      updatedAt: now,
      playlists: data.playlists
    }
    await client.putFileContents(
      DEFAULT_FILE_PATHS.playlists,
      JSON.stringify(playlistsData, null, 2),
      { overwrite: true }
    )
    
    // 上传播放次数
    const playCountsData = {
      version: 1,
      updatedAt: now,
      playCounts
    }
    await client.putFileContents(
      DEFAULT_FILE_PATHS.playCounts,
      JSON.stringify(playCountsData, null, 2),
      { overwrite: true }
    )
    
    // 上传同步元数据
    const metadata: SyncMetadata = {
      version: 1,
      lastSync: now,
      files: {
        settings: { updatedAt: now, size: JSON.stringify(settingsData).length },
        favorites: { updatedAt: now, size: JSON.stringify(favoritesData).length },
        history: { updatedAt: now, size: JSON.stringify(historyData).length },
        playlists: { updatedAt: now, size: JSON.stringify(playlistsData).length },
        playCounts: { updatedAt: now, size: JSON.stringify(playCountsData).length }
      }
    }
    await client.putFileContents(
      '/music-app/metadata.json',
      JSON.stringify(metadata, null, 2),
      { overwrite: true }
    )
    
  } catch (error) {
    throw new Error(`WebDAV上传失败: ${error}`)
  }
}

export async function webdavDownloadMultiFile(
  cfg: WebDavConfig
): Promise<{ data: AppData; playCounts: Record<string, number> } | null> {
  const client = createWebDavClient(cfg)
  
  try {
    // 检查元数据文件是否存在（保留用于未来版本扩展）
    try {
      await client.getFileContents('/music-app/metadata.json', { format: 'text' })
    } catch {
      // 元数据文件不存在，可能是旧版本或首次同步
    }
    
    const defaultData = createDefaultData()
    let data: AppData = { ...defaultData }
    let playCounts: Record<string, number> = {}
    
    // 下载设置
    try {
      const settingsRaw = await client.getFileContents(DEFAULT_FILE_PATHS.settings, { format: 'text' })
      const settingsData = JSON.parse(settingsRaw as string)
      if (settingsData.settings) {
        data.settings = { ...data.settings, ...settingsData.settings }
      }
    } catch {
      // 文件不存在，使用默认设置
    }
    
    // 下载收藏
    try {
      const favoritesRaw = await client.getFileContents(DEFAULT_FILE_PATHS.favorites, { format: 'text' })
      const favoritesData = JSON.parse(favoritesRaw as string)
      if (favoritesData.favorites) {
        data.favorites = favoritesData.favorites
      }
    } catch {
      // 文件不存在，使用空收藏
    }
    
    // 下载历史
    try {
      const historyRaw = await client.getFileContents(DEFAULT_FILE_PATHS.history, { format: 'text' })
      const historyData = JSON.parse(historyRaw as string)
      if (historyData.history) {
        data.history = historyData.history
      }
    } catch {
      // 文件不存在，使用空历史
    }
    
    // 下载歌单
    try {
      const playlistsRaw = await client.getFileContents(DEFAULT_FILE_PATHS.playlists, { format: 'text' })
      const playlistsData = JSON.parse(playlistsRaw as string)
      if (playlistsData.playlists) {
        data.playlists = playlistsData.playlists
      }
    } catch {
      // 文件不存在，使用空歌单
    }
    
    // 下载播放次数
    try {
      const playCountsRaw = await client.getFileContents(DEFAULT_FILE_PATHS.playCounts, { format: 'text' })
      const playCountsData = JSON.parse(playCountsRaw as string)
      if (playCountsData.playCounts) {
        playCounts = playCountsData.playCounts
      }
    } catch {
      // 文件不存在，使用空播放次数
    }
    
    return { data, playCounts }
    
  } catch (error) {
    console.error('WebDAV下载失败:', error)
    return null
  }
}

export async function webdavGetFileList(cfg: WebDavConfig): Promise<string[]> {
  const client = createWebDavClient(cfg)
  
  try {
    const contents = await client.getDirectoryContents('/music-app/', { deep: false })
    // 处理不同类型的返回值
    const fileStats = Array.isArray(contents) ? contents : (contents.data || [])
    return fileStats.map((item: any) => typeof item === 'string' ? item : item.filename)
  } catch {
    return []
  }
}

export async function webdavDeleteOldFiles(cfg: WebDavConfig): Promise<void> {
  const client = createWebDavClient(cfg)
  
  try {
    // 删除旧的单文件格式
    await client.deleteFile('/music-app/data.json').catch(() => {})
  } catch {
    // 忽略删除错误
  }
}