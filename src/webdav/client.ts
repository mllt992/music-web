import { createClient, type WebDAVClient } from 'webdav'
import type { WebDavConfig } from '../storage/schema'

export function createWebDavClient(cfg: WebDavConfig): WebDAVClient {
  return createClient(cfg.url, {
    username: cfg.username,
    password: cfg.password,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
}


