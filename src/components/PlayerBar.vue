<script setup lang="ts">
import { NAvatar, NButton, NSelect, NSpace, useMessage, NPopover, NCheckbox, NInput } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { computed, ref, watch, onMounted } from 'vue'
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
const newPlaylistName = ref('')

onMounted(() => {
  player.loadPlaylists()
  player.loadSettings()
  player.loadHistory()
  player.loadFavorites()
  player.loadPlayCounts()
  
  // 尝试从 sessionStorage 恢复播放进度和总时长
  const savedTime = sessionStorage.getItem('player_now')
  const savedDuration = sessionStorage.getItem('player_duration')
  
  if (savedTime) {
    const time = parseFloat(savedTime)
    if (!isNaN(time) && isFinite(time) && time > 0) {
      currentTime.value = time
    }
  }
  
  if (savedDuration) {
    const savedDurationValue = parseFloat(savedDuration)
    if (!isNaN(savedDurationValue) && isFinite(savedDurationValue) && savedDurationValue > 0) {
      duration.value = savedDurationValue
    }
  }
})

const qualityOptions: SelectOption[] = [
  { label: '标准 128k', value: '128k' },
  { label: '高品质 320k', value: '320k' },
  { label: '无损 FLAC', value: 'flac' },
  { label: 'Hi-Res 24bit', value: 'flac24bit' },
]

function toggleTrackInPlaylist(playlistId: string, checked: boolean) {
  if (!player.current) return
  if (checked) {
    player.addTrackToPlaylist(playlistId, player.current)
    message.success('已添加到歌单')
  } else {
    player.removeTrackFromPlaylist(playlistId, player.current.id, player.current.platform)
    message.success('已从歌单移除')
  }
}

function createPlaylistInPopover() {
  if (!newPlaylistName.value.trim()) return
  const p = player.createPlaylist(newPlaylistName.value.trim())
  if (player.current) {
    player.addTrackToPlaylist(p.id, player.current)
    message.success('已创建歌单并添加歌曲')
  }
  newPlaylistName.value = ''
}

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
      // 获取保存的播放时间
      const savedTime = sessionStorage.getItem('player_now')
      const timeToRestore = savedTime ? parseFloat(savedTime) : 0
      
      // 重置状态，但保留时间
      duration.value = 0
      seeking.value = false
      
      // 重点：不要设置 crossorigin，否则目标音频域没配 CORS 时会导致"无声/加载失败"
      el.src = audioSrc.value
      
      // 添加音频加载事件监听，确保获取到正确的时长
      el.addEventListener('loadeddata', () => {
        duration.value = el.duration || 0
        
        // 恢复保存的播放时间
        if (!isNaN(timeToRestore) && isFinite(timeToRestore) && timeToRestore > 0 && timeToRestore < el.duration) {
          el.currentTime = timeToRestore
          currentTime.value = timeToRestore
        }
      }, { once: true })
      
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

watch(
  () => player.quality,
  () => {
    player.saveSettings()
  },
)

function onEnded() {
  // 如果当前有歌曲，且队列为空，则重新添加到队列
  if (player.current && player.queue.length === 0) {
    player.queue = [player.current]
  }
  
  // 循环模式下，如果只有一首歌，则重新播放同一首歌
  if (player.mode === 'loop' && player.queue.length === 1 && player.current) {
    // 重新播放同一首歌
    const el = audioRef.value
    if (el) {
      el.currentTime = 0
      el.play().catch(() => player.pause())
    }
    player.incrementPlayCount(player.current)
    return
  }
  
  player.next()
}

function onTimeUpdate() {
  const el = audioRef.value
  if (!el || seeking.value) return
  
  // 确保获取到有效的当前时间
  const current = el.currentTime
  if (current && !isNaN(current) && isFinite(current)) {
    currentTime.value = current
    sessionStorage.setItem('player_now', String(currentTime.value))
  }
}

function onLoadedMeta() {
  const el = audioRef.value
  if (!el) return
  
  // 确保获取到有效的时长
  const audioDuration = el.duration
  if (audioDuration && !isNaN(audioDuration) && isFinite(audioDuration)) {
    duration.value = audioDuration
    sessionStorage.setItem('player_duration', String(audioDuration))
  } else {
    // 如果获取不到时长，尝试等待一段时间再获取
    setTimeout(() => {
      if (el.duration && !isNaN(el.duration) && isFinite(el.duration)) {
        duration.value = el.duration
        sessionStorage.setItem('player_duration', String(el.duration))
      }
    }, 1000)
  }
}

function formatTime(sec: number) {
  // 添加更严格的时间验证
  if (!sec || isNaN(sec) || !isFinite(sec) || sec < 0) return '0:00'
  
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
          <NSpace align="center" :size="8">
            <NButton 
              circle 
              size="small" 
              :disabled="!player.current"
              @click="player.toggleMode()"
              :title="player.mode === 'order' ? '顺序播放' : player.mode === 'loop' ? '循环播放' : '随机播放'"
            >
              <svg v-if="player.mode === 'order'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
              <svg v-else-if="player.mode === 'loop'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
            </NButton>
            <NButton circle :disabled="!player.current" @click="player.playing ? player.pause() : (player.playing = true)">
              <svg v-if="player.playing" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </NButton>
            <NButton circle size="small" :disabled="!player.current" @click="player.prev()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </NButton>
            <NButton circle size="small" :disabled="!player.current" @click="player.next()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </NButton>
            <NButton 
              circle
              size="small" 
              :disabled="!player.current"
              :type="player.current && player.isFavorite(player.current) ? 'error' : 'default'"
              @click.stop="player.current && player.toggleFavorite(player.current)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" :fill="player.current && player.isFavorite(player.current) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </NButton>
            <NPopover trigger="click" placement="top" style="padding: 0; min-width: 200px">
              <template #trigger>
                <NButton circle size="small" :disabled="!player.current">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/>
                  </svg>
                </NButton>
              </template>
              <div style="padding: 12px;">
                <div style="font-weight: bold; margin-bottom: 8px;">添加到歌单</div>
                <div v-if="player.playlists.length === 0" style="color: #999; font-size: 12px; margin-bottom: 8px;">暂无歌单</div>
                <div style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                  <NCheckbox
                    v-for="p in player.playlists"
                    :key="p.id"
                    :checked="player.current && p.tracks.some(t => t.id === player.current?.id && t.platform === player.current?.platform)"
                    @update:checked="(v) => toggleTrackInPlaylist(p.id, v)"
                  >
                    {{ p.name }}
                  </NCheckbox>
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">
                   <NInput size="small" v-model:value="newPlaylistName" placeholder="新建歌单" @keyup.enter="createPlaylistInPopover">
                      <template #suffix>
                        <NButton size="tiny" text @click="createPlaylistInPopover">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        </NButton>
                      </template>
                   </NInput>
                </div>
              </div>
            </NPopover>
            <NButton 
              circle
              size="small" 
              :disabled="!audioSrc"
              tag="a"
              :href="audioSrc"
              :download="player.current ? `${player.current.name}.mp3` : undefined"
              target="_blank"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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


