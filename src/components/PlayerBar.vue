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
  position: sticky;
  bottom: 14px;
  z-index: 30;
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.bar {
  width: min(1100px, calc(100vw - 28px));
  padding: 12px 14px;
  border: 1px solid var(--border);
  background: var(--glass-strong);
  backdrop-filter: var(--blur);
  border-radius: 18px;
  box-shadow: var(--shadow);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  transform: translateY(10px);
  opacity: 0.92;
  transition: transform 200ms ease, opacity 200ms ease, box-shadow 200ms ease;
}

.wrap.active .bar {
  transform: translateY(0);
  opacity: 1;
}

.bar:hover {
  box-shadow: 0 18px 55px rgba(15, 23, 42, 0.14);
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  cursor: pointer;
}

.meta {
  min-width: 0;
}

.t {
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.s {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.time {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
  font-variant-numeric: tabular-nums;
}

.progress {
  grid-column: 1 / -1;
  margin-top: 8px;
}

.range {
  width: 100%;
  appearance: none;
  height: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.12);
  outline: none;
}

.range::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.18);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.14);
}
</style>


