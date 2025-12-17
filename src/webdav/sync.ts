import type { AppData, WebDavConfig } from '../storage/schema'
import { createDefaultData } from '../storage/schema'
import { createWebDavClient } from './client'

export async function webdavTest(cfg: WebDavConfig) {
  const client = createWebDavClient(cfg)
  await client.getDirectoryContents('/', { deep: false })
}

export async function webdavDownload(cfg: WebDavConfig): Promise<AppData | null> {
  const client = createWebDavClient(cfg)
  try {
    const raw = (await client.getFileContents(cfg.remotePath, { format: 'text' })) as string
    const parsed = JSON.parse(raw) as Partial<AppData>
    if (!parsed || parsed.version !== 1) return null
    return { ...createDefaultData(), ...parsed } as AppData
  } catch {
    return null
  }
}

export async function webdavUpload(cfg: WebDavConfig, data: AppData) {
  const client = createWebDavClient(cfg)
  const payload = JSON.stringify({ ...data, updatedAt: Date.now() }, null, 2)
  await client.putFileContents(cfg.remotePath, payload, { overwrite: true })
}

export function resolveConflict(local: AppData, remote: AppData, strategy: WebDavConfig['conflictStrategy']): AppData {
  if (strategy === 'client_wins') return local
  if (strategy === 'server_wins') return remote
  return remote.updatedAt >= local.updatedAt ? remote : local
}


