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
// 加载状态管理
const loading = ref(false)

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

  // 如果已经有当前播放的歌曲，确保加载状态正确
  const el = audioRef.value
  if (player.current && el) {
    // 设置正确的src
    el.src = audioSrc.value
    // 如果使用的是缓存的实际URL，直接设置loading为false
    if (player.current.realUrl) {
      loading.value = false
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

  // 优先使用保存的实际URL，避免重复302跳转
  // 检查URL是否有效（有效期为1小时）
  const isValidUrl = player.current.realUrl &&
                    player.current.realUrlTimestamp &&
                    Date.now() - player.current.realUrlTimestamp < 36000000

  if (isValidUrl) {
    return player.current.realUrl
  }

  // URL无效或过期，清除并重新生成
  if (player.current.realUrl) {
    player.current.realUrl = undefined
    player.current.realUrlTimestamp = undefined
    player.saveSettings()
  }

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

    // 如果当前已经是相同的音频源，不需要重新加载
    if (el.currentSrc === audioSrc.value) {
      // 如果正在播放，确保loading状态正确
      if (player.playing && !el.paused) {
        loading.value = false
      }
      return
    }

    try {
      // 重置状态，不保留旧时间
      duration.value = 0
      currentTime.value = 0
      seeking.value = false
      // 设置加载状态为true
      loading.value = true

      // 重点：不要设置 crossorigin，否则目标音频域没配 CORS 时会导致"无声/加载失败"
      el.src = audioSrc.value

      // 设置音频元素的当前时间为0，确保新歌曲从0开始
      el.currentTime = 0

      // 添加事件监听器，在音频开始加载后获取实际URL
      const handleLoadStart = () => {
        // 保存实际URL和时间戳
        if (el.currentSrc && el.currentSrc !== audioSrc.value && player.current) {
          player.current.realUrl = el.currentSrc
          player.current.realUrlTimestamp = Date.now()
          player.saveSettings()
        }
      }

      // 添加音频加载事件监听，确保获取到正确的时长
      const handleLoadedData = () => {
        duration.value = el.duration || 0
        // 加载完成，设置loading为false
        loading.value = false
        // 再次检查实际URL
        handleLoadStart()
      }

      // 添加音频加载错误事件监听
      const handleError = () => {
        loading.value = false
        // 加载失败时清除可能的错误URL
        if (player.current) {
          player.current.realUrl = undefined
          player.current.realUrlTimestamp = undefined
          player.saveSettings()
        }
      }

      // 添加canplay事件监听，确保加载状态正确设置
      const handleCanPlay = () => {
        loading.value = false
        // 再次检查实际URL
        handleLoadStart()
      }

      // 添加loadstart事件监听，获取实际URL
      el.addEventListener('loadstart', handleLoadStart, { once: true })
      el.addEventListener('loadeddata', handleLoadedData, { once: true })
      el.addEventListener('error', handleError, { once: true })
      el.addEventListener('canplay', handleCanPlay, { once: true })

      // 添加canplaythrough事件，确保在音频可以流畅播放时也设置loading为false
      el.addEventListener('canplaythrough', () => {
        loading.value = false
      }, { once: true })

      if (player.playing) {
        try {
          await el.play()
          // 播放成功后立即设置loading为false
          loading.value = false
        } catch (playError) {
          // 播放失败但音频可能已加载，仍需设置loading为false
          loading.value = false
          message.error((playError as Error).message || '播放失败（可能是浏览器策略限制）')
        }
      }
    } catch (e) {
      message.error((e as Error).message || '播放失败（可能是跨域或资源不可用）')
      player.pause()
      // 加载失败，设置loading为false
      loading.value = false
      // 加载失败时清除可能的错误URL
      if (player.current) {
        player.current.realUrl = undefined
        player.current.realUrlTimestamp = undefined
        player.saveSettings()
      }
    }
  },
)

watch(
  () => player.playing,
  async (v) => {
    const el = audioRef.value
    if (!el) return
    try {
      if (v) {
        // 如果audio元素已经播放到末尾，重置currentTime并重新播放
        if (el.currentTime >= el.duration && el.duration > 0) {
          el.currentTime = 0
        }
        await el.play()
      } else {
        el.pause()
      }
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

  // 直接调用player.next()，它已经处理了所有播放模式
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
              :title="player.mode === 'order' ? '顺序播放' : player.mode === 'loop' ? '单曲循环' : player.mode === 'loop_list' ? '列表循环' : '随机播放'"
            >
              <svg v-if="player.mode === 'order'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
              <svg v-else-if="player.mode === 'loop'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 7h5v2H7V7zm3 10h5v2H10v-2zm-3-3h8v2H7v-2zm3-3h8v2h-8V9z"/>
              </svg>
              <svg v-else-if="player.mode === 'loop_list'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
            </NButton>
            <NButton
              circle
              :disabled="!player.current || loading"
              :loading="loading"
              @click="player.playing ? player.pause() : player.current && player.play(player.current)"
            >
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
            <!-- 查看所有播放列表 -->
            <NButton circle size="small" @click="router.push('/library')" title="查看所有播放列表">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 6h-2v2h-2V6H9v2H7V6H5v12h2v-2h2v2h8v-2h2v2h2V6h-2zM7 16H5v-2h2v2zm4 0H9v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
              </svg>
            </NButton>

            <!-- 当前播放队列 -->
            <NPopover trigger="click" placement="top" style="padding: 0; min-width: 300px; max-width: 500px;">
              <template #trigger>
                <NButton circle size="small" :disabled="!player.queue || player.queue.length === 0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                  </svg>
                </NButton>
              </template>
              <div style="padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; margin-bottom: 12px;">
                  <div>当前播放队列</div>
                  <div style="font-size: 12px; color: #666;">{{ player.queue.length }} 首歌曲</div>
                </div>
                <div v-if="!player.queue || player.queue.length === 0" style="text-align: center; color: #999; padding: 20px 0;">
                  播放队列为空
                </div>
                <div v-else>
                  <div style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                    <div
                      v-for="(track, idx) in player.queue"
                      :key="`${track.id}-${track.platform}-${idx}`"
                      class="queue-item"
                      :class="{ active: player.current && track.id === player.current.id && track.platform === player.current.platform }"
                      @click="player.play(track)"
                    >
                      <div class="queue-index">{{ idx + 1 }}</div>
                      <div class="queue-info">
                        <div class="queue-name">{{ track.name }}</div>
                        <div v-if="track.artist" class="queue-artist">{{ track.artist }}</div>
                      </div>
                      <NButton size="tiny" quaternary @click.stop="player.queue.splice(idx, 1); player.saveSettings()">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </NButton>
                    </div>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <NButton size="small" @click="player.queue = []; player.saveSettings()">清空队列</NButton>
                  </div>
                </div>
              </div>
            </NPopover>

            <!-- 添加到歌单 -->
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
                    :checked="!!(player.current && p.tracks.some(t => t.id === player.current?.id && t.platform === player.current?.platform))"
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
      @play="player.playing = true"
      @pause="player.playing = false"
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

/* 当前播放队列样式 */
.queue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.queue-item:hover {
  background: rgba(99, 102, 241, 0.05);
}

.queue-item.active {
  background: rgba(99, 102, 241, 0.1);
  border-left: 3px solid #6366f1;
}

.queue-index {
  font-size: 13px;
  color: #666;
  min-width: 20px;
  text-align: center;
}

.queue-item.active .queue-index {
  color: #6366f1;
  font-weight: 600;
}

.queue-info {
  flex: 1;
  min-width: 0;
}

.queue-name {
  font-weight: 500;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-artist {
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}
</style>


