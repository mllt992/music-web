<script setup lang="ts">
import { NButton, NEmpty, NSpace } from 'naive-ui'
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { usePlayerStore } from '../stores/player'
import { useAppStore } from '../stores/app'
import { buildApiUrl } from '../api/tunehub'
import { findActiveLineIndex, parseLrc, type LrcLine } from '../lyrics/lrc'

const router = useRouter()
const player = usePlayerStore()
const app = useAppStore()

const baseUrl = computed(() => app.data.settings.api.baseUrl || 'https://music-dl.sayqz.com')
const picUrl = computed(() => {
  if (!player.current) return ''
  return buildApiUrl(baseUrl.value, {
    source: (player.current.platform || 'netease') as string,
    id: player.current.id,
    type: 'pic',
  })
})
const lrcUrl = computed(() => {
  if (!player.current) return ''
  return buildApiUrl(baseUrl.value, {
    source: (player.current.platform || 'netease') as string,
    id: player.current.id,
    type: 'lrc',
  })
})

const lrcText = ref('')
const lrcLines = ref<LrcLine[]>([])
const now = ref(0)
const lyricsContainer = ref<HTMLElement | null>(null)
// 封面显示开关
const showCover = ref(true)

function setNowFromStorage() {
  const raw = sessionStorage.getItem('player_now')
  now.value = raw ? Number(raw) || 0 : 0
}

async function loadLyrics() {
  lrcText.value = ''
  lrcLines.value = []
  if (!lrcUrl.value) return
  try {
    const res = await axios.get(lrcUrl.value, { responseType: 'text' })
    lrcText.value = String(res.data || '')
    lrcLines.value = parseLrc(lrcText.value)
  } catch {
    // ignore
  }
}

const activeIdx = computed(() => findActiveLineIndex(lrcLines.value, now.value))

watch(activeIdx, (newIdx) => {
  if (newIdx >= 0 && lyricsContainer.value) {
    const activeEl = lyricsContainer.value.querySelector('.line.active')
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
})

watch(
  () => player.current?.id,
  async () => {
    await loadLyrics()
  },
)

onMounted(async () => {
  setNowFromStorage()
  await loadLyrics()
  window.addEventListener('storage', setNowFromStorage)
  const interval = setInterval(setNowFromStorage, 100)
  
  return () => {
    clearInterval(interval)
  }
})
</script>

<template>
  <div class="player-view" :class="{ 'has-song': !!player.current }">
    <!-- 背景层 -->
    <div class="bg-layer">
      <div 
        class="bg-image" 
        :style="{ backgroundImage: picUrl ? `url(${picUrl})` : '' }"
        :class="{ 'active': !!player.current, 'hidden': !showCover }"
      ></div>
      <div class="bg-overlay"></div>
    </div>
    
    <!-- 内容层 -->
    <div class="content">
      <div v-if="!player.current" class="empty">
        <NEmpty description="先从搜索/榜单里点一首歌开始播放" />
      </div>

      <!-- 歌词区域 -->
      <div v-else ref="lyricsContainer" class="lyrics">
        <div v-if="lrcLines.length === 0" class="no-lyric">
          <div class="no-lyric-cover" :style="{ backgroundImage: `url(${picUrl})` }"></div>
          <NEmpty description="暂无歌词或歌词加载失败" />
        </div>
        <div v-else class="lines">
          <div
            v-for="(line, idx) in lrcLines"
            :key="idx"
            class="line"
            :class="{ active: idx === activeIdx }"
          >
            {{ line.text || '…' }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 控制按钮 -->
    <div class="controls" v-if="player.current">
      <NButton quaternary circle size="large" @click="router.back()" class="back-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </NButton>
      
      <NButton quaternary circle size="large" @click="showCover = !showCover" class="cover-toggle">
        <svg v-if="showCover" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.player-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  animation: fadeIn 0.5s ease-out;
  position: relative;
  border-radius: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 背景层 */
.bg-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.player-view.has-song .bg-layer {
  opacity: 1;
}

.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(50px) brightness(0.8) saturate(0.9);
  transform: scale(1.2);
  opacity: 0;
  transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1), transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.bg-image.active {
  opacity: 0.7;
}

.bg-image.hidden {
  opacity: 0;
  transform: scale(1);
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

/* 内容层 */
.content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: hidden;
}

/* 歌词区域 */
.lyrics {
  width: 100%;
  max-width: 800px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 24px;
  line-height: 2.2;
  max-height: 100%;
  overflow: auto;
  padding: 20px;
  scroll-behavior: smooth;
  overscroll-behavior-y: contain;
  scroll-snap-type: y mandatory;
  width: 100%;
  text-align: center;
}

/* 歌词行样式 */
.line {
  color: rgba(0, 0, 0, 0.5);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 20px;
  text-align: center;
  position: relative;
  transform: scale(0.95) translateY(0);
  opacity: 0.7;
  filter: blur(0.5px);
  scroll-snap-align: center;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.line::before {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  width: 0;
  height: 2px;
  background: rgba(0, 0, 0, 0.3);
  transform: translateX(-50%);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  border-radius: 2px;
}

.line.active {
  color: black;
  font-weight: 600;
  font-size: 28px;
  transform: scale(1.05) translateY(0);
  opacity: 1;
  text-shadow: 
    0 0 15px rgba(255, 255, 255, 0.8),
    0 2px 10px rgba(0, 0, 0, 0.1);
  filter: blur(0px);
  animation: lyricHighlight 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 歌词高亮动画 */
@keyframes lyricHighlight {
  0% {
    transform: scale(0.95) translateY(20px);
    opacity: 0.7;
    filter: blur(1px);
  }
  50% {
    transform: scale(1.1) translateY(-4px);
    opacity: 1;
    filter: blur(0px);
  }
  100% {
    transform: scale(1.05) translateY(0);
    opacity: 1;
    filter: blur(0px);
  }
}

/* 激活歌词下划线 */
.line.active::before {
  width: 80px;
  opacity: 0.6;
  animation: underlineGrow 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 下划线增长动画 */
@keyframes underlineGrow {
  0% {
    width: 0;
    opacity: 0;
  }
  100% {
    width: 80px;
    opacity: 0.6;
  }
}

/* 非激活歌词的渐进效果 */
.line:not(.active) {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 前一行和后一行的特殊效果 */
.line:nth-child(odd) {
  animation: float 6s ease-in-out infinite;
}

.line:nth-child(even) {
  animation: float 6s ease-in-out infinite reverse;
}

/* 轻微浮动效果 */
@keyframes float {
  0%, 100% {
    transform: scale(0.95) translateY(0px);
  }
  50% {
    transform: scale(0.95) translateY(-2px);
  }
}

/* 滚动条样式 */
.lines::-webkit-scrollbar {
  width: 8px;
}

.lines::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.lines::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.lines::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 控制按钮 */
.controls {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.back-btn, .cover-toggle {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  color: #333;
}

.back-btn:hover, .cover-toggle:hover {
  background: white;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* 空状态 */
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: rgba(0, 0, 0, 0.6);
}

.no-lyric {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(0, 0, 0, 0.5);
  font-size: 18px;
  gap: 20px;
}

.no-lyric-cover {
  width: 200px;
  height: 200px;
  background-size: cover;
  background-position: center;
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  animation: coverPulse 3s ease-in-out infinite;
}

@keyframes coverPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  }
  50% {
    transform: scale(1.05);
    box-shadow: 
      0 25px 70px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .lines {
    gap: 16px;
    line-height: 1.8;
    padding: 10px;
  }
  
  .line {
    font-size: 16px;
    min-height: 40px;
  }
  
  .line.active {
    font-size: 22px;
  }
  
  .line.active::before {
    width: 60px;
  }
  
  .controls {
    top: 10px;
    left: 10px;
    right: 10px;
  }
  
  .back-btn, .cover-toggle {
    size: medium;
  }
  
  /* 响应式封面 */
  .no-lyric-cover {
    width: 150px;
    height: 150px;
    border-radius: 15px;
  }
}

@media (max-width: 480px) {
  .content {
    padding: 10px;
  }
  
  .lines {
    gap: 12px;
  }
  
  .line {
    font-size: 14px;
  }
  
  .line.active {
    font-size: 18px;
  }
}
</style>
