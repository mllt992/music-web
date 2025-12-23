import { createClient, type WebDAVClient } from 'webdav'
import type { WebDavConfig } from '../storage/schema'

export function createWebDavClient(cfg: WebDavConfig): WebDAVClient {
  let url = cfg.url

  // 浏览器环境统一通过代理路径访问，避免跨域限制
  if (url.startsWith('http')) {
    try {
      const urlObj = new URL(url)
      const protocol = urlObj.protocol.replace(':', '')
      const encodedHost = encodeURIComponent(urlObj.host)
      const pathname = urlObj.pathname || '/'
      url = `/webdav-proxy/${protocol}/${encodedHost}${pathname}`
    } catch (e) {
      console.warn('WebDAV URL解析失败:', e)
    }
  }

  return createClient(url, {
    username: cfg.username,
    password: cfg.password,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
}

