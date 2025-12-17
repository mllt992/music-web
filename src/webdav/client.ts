import { createClient, type WebDAVClient } from 'webdav'
import type { WebDavConfig } from '../storage/schema'

export function createWebDavClient(cfg: WebDavConfig): WebDAVClient {
  // 开发环境下使用代理避免CORS问题
  const isDev = import.meta.env.DEV
  let url = cfg.url
  
  if (isDev && url.includes('yp.mllt.cc')) {
    // 将原始URL转换为代理URL
    url = url.replace('https://yp.mllt.cc', '/webdav-proxy')
  }
  
  return createClient(url, {
    username: cfg.username,
    password: cfg.password,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
}


