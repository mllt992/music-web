export type LrcLine = { time: number; text: string }

// 支持类似 [mm:ss.xx] 或 [mm:ss] 或多时间戳一行
export function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = []
  const rows = (lrc || '').split(/\r?\n/)
  for (const row of rows) {
    const timeTags = [...row.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)]
    if (timeTags.length === 0) continue
    const text = row.replace(/\[[^\]]+\]/g, '').trim()
    for (const m of timeTags) {
      const mm = Number(m[1])
      const ss = Number(m[2])
      const fracRaw = m[3]
      const frac = fracRaw ? Number(fracRaw.padEnd(3, '0')) : 0
      const t = mm * 60 + ss + frac / 1000
      if (Number.isFinite(t)) lines.push({ time: t, text })
    }
  }
  return lines.sort((a, b) => a.time - b.time)
}

export function findActiveLineIndex(lines: LrcLine[], currentTime: number) {
  if (!lines.length) return -1
  // 简单线性/二分都行，这里用二分
  let lo = 0
  let hi = lines.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const midLine = lines[mid]
    if (!midLine) break
    if (midLine.time <= currentTime) lo = mid + 1
    else hi = mid - 1
  }
  return Math.max(0, hi)
}


