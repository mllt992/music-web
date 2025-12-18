import { createClient, type WebDAVClient } from 'webdav'
import type { WebDavConfig } from '../storage/schema'

export function createWebDavClient(cfg: WebDavConfig): WebDAVClient {
  // 开发环境使用代理避免CORS问题
  const isDev = import.meta.env.DEV
  let url = cfg.url
  
  // 在开发环境中，使用代理服务器
  if (isDev && url.startsWith('http')) {
    try {
      const urlObj = new URL(url)
      // 使用更简单的代理路径格式
      const proxyPath = `/webdav-proxy/${urlObj.hostname}${urlObj.pathname}`
      url = proxyPath
    } catch (e) {
      // URL解析失败，使用原始URL
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


