import type { AppData } from './schema'
import { createDefaultData } from './schema'

const LS_KEY = 'music_app_data_v1'

export function loadLocalData(): AppData {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return createDefaultData()
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>
    if (parsed && parsed.version === 1) {
      return { ...createDefaultData(), ...parsed }
    }
    return createDefaultData()
  } catch {
    return createDefaultData()
  }
}

export function saveLocalData(data: AppData) {
  localStorage.setItem(LS_KEY, JSON.stringify({ ...data, updatedAt: Date.now() }))
}

export function exportLocalData(): string {
  return JSON.stringify(loadLocalData(), null, 2)
}

export function importLocalData(json: string) {
  const parsed = JSON.parse(json) as Partial<AppData>
  if (!parsed || parsed.version !== 1) throw new Error('不支持的数据版本')
  const merged = { ...createDefaultData(), ...parsed } as AppData
  saveLocalData(merged)
  return merged
}


