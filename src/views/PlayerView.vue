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
const visualCanvas = ref<HTMLCanvasElement | null>(null)

// 音频可视化相关
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let dataArray: Uint8Array | null = null
let animationFrame: number | null = null

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

// 初始化音频可视化
async function initVisualization() {
  if (!visualCanvas.value || !player.current) return

  // 查找音频元素
  const audioElements = document.getElementsByTagName('audio')
  if (audioElements.length === 0) return

  const audio = audioElements[0]

  try {
    // 创建音频上下文
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    
    // 创建媒体元素源并连接到分析器
    const source = audioContext.createMediaElementSource(audio)
    source.connect(analyser)
    analyser.connect(audioContext.destination)
    
    // 获取频率数据
    const bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)
    
    // 开始动画
    startVisualization()
  } catch (error) {
    console.error('音频可视化初始化失败:', error)
  }
}

// 开始可视化动画
function startVisualization() {
  if (!visualCanvas.value || !analyser || !dataArray) return

  const canvas = visualCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置canvas尺寸
  const resizeCanvas = () => {
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // 动画函数
  function draw() {
    animationFrame = requestAnimationFrame(draw)
    
    // 获取频率数据
    analyser.getByteFrequencyData(dataArray)
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 绘制频谱
    const barWidth = (canvas.width / dataArray.length) * 2.5
    let x = 0
    
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height * 0.8
      
      // 创建渐变颜色
      const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
      gradient.addColorStop(0, '#6366f1')
      gradient.addColorStop(0.5, '#8b5cf6')
      gradient.addColorStop(1, '#ec4899')
      
      ctx.fillStyle = gradient
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight)
      
      // 添加光晕效果
      ctx.shadowBlur = 10
      ctx.shadowColor = '#6366f1'
      
      x += barWidth + 1
    }
  }
  
  draw()
}

// 停止可视化
function stopVisualization() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  
  if (audioContext) {
    audioContext.close()
    audioContext = null
    analyser = null
    dataArray = null
  }
}

onMounted(async () => {
  setNowFromStorage()
  await loadLyrics()
  window.addEventListener('storage', setNowFromStorage)
  const interval = setInterval(setNowFromStorage, 100)
  
  // 初始化可视化
  await nextTick()
  if (player.current) {
    initVisualization()
  }
  
  return () => {
    clearInterval(interval)
    stopVisualization()
  }
})

// 监听歌曲变化，重新初始化可视化
watch(
  () => player.current?.id,
  async (newId) => {
    if (newId) {
      stopVisualization()
      await nextTick()
      initVisualization()
    }
  }
)
</script>

<template>
  <div class="wrap" :class="{ 'has-song': !!player.current }">
    <!-- 背景层 -->
    <div class="bg-layer">
      <div 
        class="bg-image" 
        :style="{ backgroundImage: picUrl ? `url(${picUrl})` : '' }"
        :class="{ 'active': !!player.current }"
      ></div>
      <div class="bg-overlay"></div>
    </div>
    
    <!-- 内容层 -->
    <div class="content">
      <div class="top">
        <NSpace align="center">
          <NButton quaternary @click="router.back()">返回</NButton>
          <div class="title">
            <div class="t">{{ player.current?.name || '未播放' }}</div>
            <div class="s">{{ player.current?.artist || '' }}</div>
          </div>
        </NSpace>
        <NSpace>
          <NButton size="small" :disabled="!player.current" @click="player.playing ? player.pause() : (player.playing = true)">
            {{ player.playing ? '暂停' : '播放' }}
          </NButton>
        </NSpace>
      </div>

      <div v-if="!player.current" class="empty">
        <NEmpty description="先从搜索/榜单里点一首歌开始播放" />
      </div>

      <div v-else class="grid">
      <div class="art surface-inset">
        <!-- 音乐可视化 -->
        <div class="visualization">
          <canvas ref="visualCanvas" class="visual-canvas"></canvas>
        </div>
        <div class="cover" :style="{ backgroundImage: picUrl ? `url(${picUrl})` : '' }" />
      </div>

        <div class="lyric surface-inset">
          <div v-if="lrcLines.length === 0" class="no-lyric">
            <NEmpty description="暂无歌词或歌词加载失败" />
          </div>
          <div v-else ref="lyricsContainer" class="lines">
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
    </div>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
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

.wrap.has-song .bg-layer {
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
  filter: blur(40px) brightness(0.5) saturate(1.2);
  transform: scale(1.1);
  opacity: 0;
  transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.bg-image.active {
  opacity: 1;
  transform: scale(1.15);
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.7) 100%);
  backdrop-filter: blur(10px);
}

/* 内容层 */
.content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 16px 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.top:hover {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.title .t {
  font-weight: 700;
  color: white;
  font-size: 18px;
  transition: all 0.3s ease;
}

.title .s {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: center;
  flex: 1;
}

@media (min-width: 980px) {
  .grid {
    grid-template-columns: 0.8fr 1.2fr;
    align-items: start;
  }
}

/* 专辑封面 */
.art {
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.art:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.15);
}

.visualization {
  width: 100%;
  height: 80px;
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.8s ease-out 0.4s both;
}

.visual-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.cover {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 18px;
  background: radial-gradient(600px 280px at 30% 20%, rgba(99, 102, 241, 0.22), transparent 60%),
    radial-gradient(520px 300px at 80% 25%, rgba(16, 185, 129, 0.18), transparent 60%),
    rgba(255, 255, 255, 0.5);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 20px 60px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: rotateSlow 20s linear infinite;
}

/* 发光光晕效果 */
.cover::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%);
  animation: breathe 3s ease-in-out infinite;
  opacity: 0.6;
  z-index: -1;
}

/* 唱片旋转动画 */
@keyframes rotateSlow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 呼吸灯效果 */
@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* 高光效果 */
.cover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: inherit;
}

/* 播放状态下的增强效果 */
.wrap.has-song .cover {
  box-shadow: 
    0 0 60px rgba(99, 102, 241, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.2),
    0 20px 60px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: rotateSlow 20s linear infinite, pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.01) rotate(0deg);
  }
}

.art:hover .cover {
  transform: scale(1.02) rotate(0deg);
  box-shadow: 
    0 0 80px rgba(99, 102, 241, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    0 24px 72px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.7);
  animation-play-state: paused;
}

.art:hover .cover::before {
  opacity: 1;
}

.art:hover .cover::after {
  animation-play-state: paused;
}

/* 歌词区域 */
.lyric {
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  min-height: 480px;
  animation: slideUp 0.8s ease-out 0.2s both;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.lyric:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.15);
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 20px;
  line-height: 2.0;
  max-height: 580px;
  overflow: auto;
  padding: 24px;
  scroll-behavior: smooth;
  transition: all 0.3s ease;
}

/* 歌词行样式 */
.line {
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 16px;
  text-align: center;
  position: relative;
  transform: scale(0.95) translateY(0);
  opacity: 0.7;
  filter: blur(0.5px);
}

/* 歌词下划线效果 */
.line::before {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  transform: translateX(-50%);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
}

/* 激活歌词样式 */
.line.active {
  color: white;
  font-weight: 700;
  font-size: 20px;
  transform: scale(1.08) translateY(0);
  opacity: 1;
  text-shadow: 
    0 0 20px rgba(99, 102, 241, 0.6),
    0 2px 12px rgba(0, 0, 0, 0.3),
    0 0 4px rgba(255, 255, 255, 0.8);
  filter: blur(0px);
  animation: lyricHighlight 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 歌词高亮动画 */
@keyframes lyricHighlight {
  0% {
    transform: scale(0.95) translateY(10px);
    opacity: 0.7;
    filter: blur(1px);
  }
  50% {
    transform: scale(1.1) translateY(-2px);
    opacity: 1;
    filter: blur(0px);
  }
  100% {
    transform: scale(1.08) translateY(0);
    opacity: 1;
    filter: blur(0px);
  }
}

/* 激活歌词下划线 */
.line.active::before {
  width: 80px;
  opacity: 1;
  animation: underlineGrow 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 下划线增长动画 */
@keyframes underlineGrow {
  0% {
    width: 0;
    opacity: 0;
  }
  100% {
    width: 80px;
    opacity: 1;
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

/* 滚动时的平滑过渡 */
.lines {
  scroll-behavior: smooth;
  overscroll-behavior-y: contain;
  scroll-snap-type: y mandatory;
}

.line {
  scroll-snap-align: center;
}

/* 滚动条样式 */
.lines::-webkit-scrollbar {
  width: 6px;
}

.lines::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.lines::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  transition: all 0.3s ease;
}

.lines::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.6s ease-out;
}

.no-lyric {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.6);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .content {
    padding: 16px;
    gap: 16px;
  }
  
  .top {
    padding: 12px 16px;
  }
  
  .title .t {
    font-size: 16px;
  }
  
  .art,
  .lyric {
    padding: 16px;
  }
  
  .cover {
    border-radius: 12px;
  }
  
  .lines {
    padding: 16px;
    gap: 16px;
  }
  
  .line {
    font-size: 14px;
  }
  
  .line.active {
    font-size: 18px;
  }
}
</style>


