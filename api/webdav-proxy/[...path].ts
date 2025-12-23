// @ts-nocheck
import { Buffer } from 'node:buffer'

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
])

const ALLOWED_METHODS = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS',
  'PROPFIND',
  'PROPPATCH',
  'MKCOL',
  'COPY',
  'MOVE',
  'LOCK',
  'UNLOCK',
  'REPORT',
]

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}

function setCors(res: any, origin?: string | string[]) {
  res.setHeader('Access-Control-Allow-Origin', Array.isArray(origin) ? origin[0] : origin || '*')
  res.setHeader('Access-Control-Allow-Headers', '*, Content-Type, Authorization, Depth, Overwrite, Destination, If-Modified-Since, If-Unmodified-Since, If-Match, If-None-Match, Translate, Range, Timeout, Dav')
  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '))
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, ETag, Date, Location, DAV')
}

function buildTargetUrl(req: any): string | null {
  const pathParam = req.query?.path
  const segments = Array.isArray(pathParam)
    ? pathParam
    : typeof pathParam === 'string' && pathParam.length > 0
      ? [pathParam]
      : []

  if (segments.length < 2) {
    return null
  }

  const [protocolSeg, hostSeg, ...rest] = segments
  const protocol = decodeURIComponent(String(protocolSeg)).toLowerCase()
  if (protocol !== 'http' && protocol !== 'https') {
    return null
  }

  const host = decodeURIComponent(String(hostSeg))
  if (!host) {
    return null
  }

  const decodedRest = rest.map((segment) => decodeURIComponent(String(segment)))
  let remotePath = `/${decodedRest.join('/')}`
  if (remotePath === '//') {
    remotePath = '/'
  }

  const rawPath = (req.url?.split('?')[0] ?? '') as string
  if (rawPath.endsWith('/') && !remotePath.endsWith('/')) {
    remotePath += '/'
  }

  const queryEntries = Object.entries(req.query ?? {}).filter(([key]) => key !== 'path')
  const searchParams = new URLSearchParams()
  for (const [key, value] of queryEntries) {
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item))
    } else if (value !== undefined) {
      searchParams.append(key, String(value))
    }
  }

  const searchString = searchParams.toString()
  return `${protocol}://${host}${remotePath}${searchString ? `?${searchString}` : ''}`
}

async function readRequestBody(req: any): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined
  }

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  if (!chunks.length) {
    return undefined
  }

  return Buffer.concat(chunks)
}

function sanitizeHeaders(reqHeaders: Record<string, string | string[] | undefined>): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(reqHeaders)) {
    if (!value) continue
    const lower = key.toLowerCase()
    if (HOP_BY_HOP_HEADERS.has(lower)) continue

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) headers.append(key, item)
      })
    } else {
      headers.set(key, value)
    }
  }
  return headers
}

export default async function handler(req: any, res: any) {
  setCors(res, req.headers.origin)

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const targetUrl = buildTargetUrl(req)
  if (!targetUrl) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid WebDAV proxy target' }))
    return
  }

  try {
    const headers = sanitizeHeaders(req.headers)
    const bodyBuffer = await readRequestBody(req)
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      redirect: 'manual',
    }

    if (bodyBuffer) {
      headers.set('content-length', String(bodyBuffer.byteLength))
      fetchOptions.body = bodyBuffer
    } else {
      headers.delete('content-length')
    }

    const upstream = await fetch(targetUrl, fetchOptions)

    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') return
      res.setHeader(key, value)
    })

    res.statusCode = upstream.status

    const arrayBuffer = await upstream.arrayBuffer()
    const responseBuffer = Buffer.from(arrayBuffer)
    res.end(responseBuffer)
  } catch (error) {
    console.error('WebDAV proxy error:', error)
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'WebDAV proxy request failed' }))
  }
}
