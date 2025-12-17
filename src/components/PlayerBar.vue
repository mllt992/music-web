<script setup lang="ts">
import { NAvatar, NButton, NSelect, NSpace, useMessage } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useAppStore } from '../stores/app'
import { buildApiUrl } from '../api/tunehub'
import { useRouter } from 'vue-router'

const player = usePlayerStore()
const app = useAppStore()
const router = useRouter()
const message = useMessage()
const audioRef = ref<HTMLAudioElement | null>(null)
const duration = ref(0)
const currentTime = ref(0)
const seeking = ref(false)

const qualityOptions: SelectOption[] = [
  { label: '标准 128k', value: '128k' },
  { label: '高品质 320k', value: '320k' },
  { label: '无损 FLAC', value: 'flac' },
  { label: 'Hi-Res 24bit', value: 'flac24bit' },
]

const title = computed(() => {
  if (!player.current) return '未播放'
  const a = player.current.artist ? ` - ${player.current.artist}` : ''
  return `${player.current.name}${a}`
})

const baseUrl = computed(() => app.data.settings.api.baseUrl || 'https://music-dl.sayqz.com')
const audioSrc = computed(() => {
  if (!player.current) return ''
  return buildApiUrl(baseUrl.value, {
    source: (player.current.platform || 'netease') as string,
    id: player.current.id,
    type: 'url',
    br: player.quality,
  })
})

const picUrl = computed(() => {
  if (!player.current) return ''
  return buildApiUrl(baseUrl.value, {
    source: (player.current.platform || 'netease') as string,
    id: player.current.id,
    type: 'pic',
  })
})

watch(
  () => audioSrc.value,
  async () => {
    const el = audioRef.value
    if (!el) return
    if (!audioSrc.value) return
    try {
      // 重点：不要设置 crossorigin，否则目标音频域没配 CORS 时会导致“无声/加载失败”
      el.src = audioSrc.value
      if (player.playing) await el.play()
    } catch (e) {
      message.error((e as Error).message || '播放失败（可能是跨域或资源不可用）')
      player.pause()
    }
  },
)

watch(
  () => player.playing,
  async (v) => {
    const el = audioRef.value
    if (!el) return
    try {
      if (v) await el.play()
      else el.pause()
    } catch {
      player.pause()
    }
  },
)

function onEnded() {
  player.pause()
}

function onTimeUpdate() {
  const el = audioRef.value
  if (!el || seeking.value) return
  currentTime.value = el.currentTime || 0
  sessionStorage.setItem('player_now', String(currentTime.value))
}

function onLoadedMeta() {
  const el = audioRef.value
  if (!el) return
  duration.value = el.duration || 0
}

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function commitSeek(v: number) {
  const el = audioRef.value
  if (!el) return
  el.currentTime = v
}
</script>

<template>
  <div class="wrap" :class="{ active: !!player.current }">
    <div class="bar">
    <div class="left" role="button" tabindex="0" @click="router.push('/player')">
      <NAvatar :src="picUrl || undefined" round :size="34" />
      <div class="meta">
        <div class="t">{{ title }}</div>
        <div class="s">{{ player.current?.platform || '-' }} · {{ player.quality }}</div>
      </div>
    </div>

      <div class="center">
        <NSpace align="center">
          <NButton size="small" :disabled="!player.current" @click="player.playing ? player.pause() : (player.playing = true)">
            {{ player.playing ? '暂停' : '播放' }}
          </NButton>
          <NButton 
            size="small" 
            :disabled="!player.current"
            :type="player.current && player.isFavorite(player.current) ? 'error' : 'default'"
            @click.stop="player.current && player.toggleFavorite(player.current)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" :fill="player.current && player.isFavorite(player.current) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </NButton>
          <NButton 
            size="small" 
            :disabled="!audioSrc"
            tag="a"
            :href="audioSrc"
            :download="player.current ? `${player.current.name}.mp3` : undefined"
            target="_blank"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </NButton>
          <NSelect v-model:value="player.quality" size="small" :options="qualityOptions" style="width: 140px" />
          <div class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
        </NSpace>
      </div>

    <div class="progress" v-if="player.current">
      <input
        class="range"
        type="range"
        min="0"
        :max="Math.max(1, duration)"
        step="0.25"
        :value="currentTime"
        @pointerdown="seeking = true"
        @pointerup="seeking = false; commitSeek(Number(($event.target as HTMLInputElement).value))"
        @input="currentTime = Number(($event.target as HTMLInputElement).value)"
      />
    </div>

    <audio
      ref="audioRef"
      preload="none"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMeta"
    />
    </div>
  </div>
</template>

<style scoped>
.wrap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 0 14px 14px 14px;
  pointer-events: none;
}

.bar {
  width: min(1100px, 100%);
  padding: 14px 18px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.92) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(255,255,255,0.8) inset;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;
}

.wrap.active .bar {
  transform: translateY(0);
  opacity: 1;
}

.bar:hover {
  box-shadow: 0 24px 70px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(255,255,255,0.9) inset;
  border-color: rgba(99, 102, 241, 0.3);
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.left:hover {
  transform: translateX(2px);
}

.meta {
  min-width: 0;
}

.t {
  font-weight: 650;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.s {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.time {
  font-size: 13px;
  color: rgba(15, 23, 42, 0.6);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.progress {
  grid-column: 1 / -1;
  margin-top: 10px;
}

.range {
  width: 100%;
  appearance: none;
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(90deg, 
    rgba(99, 102, 241, 0.25) 0%, 
    rgba(139, 92, 246, 0.15) 100%);
  outline: none;
  cursor: pointer;
  transition: height 0.2s ease;
}

.range:hover {
  height: 6px;
}

.range::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: 2px solid white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

.range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}
</style>


