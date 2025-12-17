<script setup lang="ts">
import { NButton, NEmpty, NSpace } from 'naive-ui'
import { computed, onMounted, ref, watch } from 'vue'
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
  return () => clearInterval(interval)
})
</script>

<template>
  <div class="wrap">
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
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title .t {
  font-weight: 650;
}
.title .s {
  font-size: 12px;
  color: var(--muted);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 980px) {
  .grid {
    grid-template-columns: 0.9fr 1.1fr;
    align-items: start;
  }
}

.art {
  padding: 14px;
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
  border: 1px solid var(--border);
}

.lyric {
  padding: 14px;
  min-height: 420px;
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 16px;
  line-height: 1.8;
  max-height: 560px;
  overflow: auto;
  padding: 20px 16px;
  scroll-behavior: smooth;
}

.line {
  color: rgba(15, 23, 42, 0.45);
  transition: all 0.3s ease;
  font-size: 15px;
  text-align: center;
}

.line.active {
  color: #6366f1;
  font-weight: 650;
  font-size: 18px;
  transform: scale(1.05);
}
</style>


