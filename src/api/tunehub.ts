import axios from 'axios'
import type { AxiosInstance } from 'axios'

export type TuneHubPlatform = 'netease' | 'kuwo' | 'qq'
export type TuneHubQuality = '128k' | '320k' | 'flac' | 'flac24bit'
export type TuneHubType =
  | 'info'
  | 'url'
  | 'pic'
  | 'lrc'
  | 'search'
  | 'aggregateSearch'
  | 'playlist'
  | 'toplist'
  | 'toplists'

export type TuneHubResponse<T> = {
  code: number
  message?: string
  data: T
  timestamp?: string
}

export type TuneHubSearchResult = {
  id: string
  name: string
  artist?: string
  album?: string
  url?: string
  platform?: TuneHubPlatform | string
}

export function normalizeBaseUrl(baseUrl: string) {
  const u = (baseUrl || '').trim()
  if (!u) return 'https://music-dl.sayqz.com'
  return u.replace(/\/+$/, '')
}

export function createTuneHubClient(baseUrl: string): AxiosInstance {
  return axios.create({
    baseURL: normalizeBaseUrl(baseUrl),
    timeout: 15000,
  })
}

export function buildApiUrl(
  baseUrl: string,
  params: Record<string, string | number | undefined>,
) {
  const url = new URL('/api/', normalizeBaseUrl(baseUrl) + '/')
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === '') return
    url.searchParams.set(k, String(v))
  })
  return url.toString()
}

export async function aggregateSearch(args: {
  client: AxiosInstance
  keyword: string
  limit?: number
  page?: number
}) {
  const res = await args.client.get<TuneHubResponse<{ keyword: string; results: TuneHubSearchResult[] }>>(
    '/api/',
    { params: { type: 'aggregateSearch', keyword: args.keyword, limit: args.limit ?? 10, page: args.page ?? 1 } },
  )
  if (res.data.code !== 200) throw new Error(res.data.message || '请求失败')
  return res.data.data
}

export async function search(args: {
  client: AxiosInstance
  source: TuneHubPlatform
  keyword: string
  limit?: number
  page?: number
}) {
  const res = await args.client.get<
    TuneHubResponse<{ keyword: string; total: number; results: TuneHubSearchResult[] }>
  >('/api/', {
    params: {
      source: args.source,
      type: 'search',
      keyword: args.keyword,
      limit: args.limit ?? 20,
      page: args.page ?? 1,
    },
  })
  if (res.data.code !== 200) throw new Error(res.data.message || '请求失败')
  return res.data.data
}

export async function toplists(args: { client: AxiosInstance; source: TuneHubPlatform }) {
  const res = await args.client.get<TuneHubResponse<{ list: Array<{ id: string; name: string; updateFrequency?: string }> }>>(
    '/api/',
    { params: { source: args.source, type: 'toplists' } },
  )
  if (res.data.code !== 200) throw new Error(res.data.message || '请求失败')
  return res.data.data
}

export async function toplist(args: { client: AxiosInstance; source: TuneHubPlatform; id: string }) {
  const res = await args.client.get<TuneHubResponse<{ list: Array<{ id: string; name: string }>; source?: string }>>(
    '/api/',
    { params: { source: args.source, type: 'toplist', id: args.id } },
  )
  if (res.data.code !== 200) throw new Error(res.data.message || '请求失败')
  return res.data.data
}


