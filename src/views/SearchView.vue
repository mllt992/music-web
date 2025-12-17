<script setup lang="ts">
import {
  NButton,
  NEmpty,
  NInput,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { computed, ref } from 'vue'
import { createTuneHubClient, aggregateSearch, search, buildApiUrl, type TuneHubPlatform, type TuneHubSearchResult } from '../api/tunehub'
import { useAppStore } from '../stores/app'
import { usePlayerStore } from '../stores/player'

const keyword = ref('')
const mode = ref<'aggregate' | 'single'>('aggregate')
const platform = ref<TuneHubPlatform>('netease')
const loading = ref(false)
const rows = ref<TuneHubSearchResult[]>([])
const message = useMessage()
const app = useAppStore()
const player = usePlayerStore()

const platformOptions: SelectOption[] = [
  { label: '网易云音乐 (netease)', value: 'netease' },
  { label: '酷我音乐 (kuwo)', value: 'kuwo' },
  { label: 'QQ音乐 (qq)', value: 'qq' },
]

const modeOptions: SelectOption[] = [
  { label: '聚合搜索（推荐）', value: 'aggregate' },
  { label: '指定平台搜索', value: 'single' },
]

const baseUrl = computed(() => app.data.settings.api.baseUrl || 'https://music-dl.sayqz.com')
const client = computed(() => createTuneHubClient(baseUrl.value))

// 生成封面图片URL
function getCoverUrl(song: any) {
  return buildApiUrl(baseUrl.value, {
    source: (song.platform || platform.value) as string,
    id: song.id,
    type: 'pic',
  })
}

async function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  try {
    loading.value = true
    if (mode.value === 'aggregate') {
      const data = await aggregateSearch({ client: client.value, keyword: kw, limit: 10, page: 1 })
      rows.value = data.results || []
    } else {
      const data = await search({ client: client.value, source: platform.value, keyword: kw, limit: 20, page: 1 })
      rows.value = data.results || []
    }
  } catch (e) {
    message.error((e as Error).message || '搜索失败')
  } finally {
    loading.value = false
  }
}


</script>

<template>
  <div>
    <div class="head">
      <div>
        <div class="section-title">搜索</div>
        <div class="section-subtitle">聚合搜索更像“网易/QQ”的体验：快、全、直接可播</div>
      </div>
    </div>

      <div class="toolbar surface-inset">
        <NSpace align="center" wrap>
          <NInput
            v-model:value="keyword"
            placeholder="搜索歌曲 / 歌手 / 专辑 / 歌单…"
            clearable
            @keyup.enter="doSearch"
          />
          <NSelect v-model:value="mode" :options="modeOptions" style="width: 160px" />
          <NSelect v-if="mode === 'single'" v-model:value="platform" :options="platformOptions" style="width: 180px" />
          <NButton type="primary" :loading="loading" :disabled="!keyword.trim()" @click="doSearch">搜索</NButton>
        </NSpace>
      </div>

    <div class="gap" />

  <NEmpty v-if="!loading && rows.length === 0" description="输入关键词开始搜索。建议用「聚合搜索」获得更全的结果。" />
      <div v-else class="results surface-inset">
        <div class="results-header">
          <div class="results-count">找到 {{ rows.length }} 首歌曲</div>
          <NButton size="small" type="primary" @click="player.playAll(rows.map(r => ({
              id: r.id,
              name: r.name,
              artist: r.artist,
              album: r.album,
              platform: (r.platform as TuneHubPlatform) || platform
            })))">
            播放全部
          </NButton>
        </div>
        <div class="results-grid">
          <div
            v-for="song in rows"
            :key="song.id"
            class="result-card"
            @click="player.play({
              id: song.id,
              name: song.name,
              artist: song.artist,
              album: song.album,
              platform: (song.platform as any) || platform,
            })"
          >
            <div class="result-cover" :style="{ backgroundImage: `url(${getCoverUrl(song)})` }"></div>
            <div class="result-info">
              <div class="result-name">{{ song.name }}</div>
              <div class="result-meta">
                <span v-if="song.artist">{{ song.artist }}</span>
                <span v-if="song.artist && song.album" class="sep">·</span>
                <span v-if="song.album">{{ song.album }}</span>
              </div>
            </div>
            <div class="result-platform">{{ (song.platform as string) || platform }}</div>
            <div class="result-play">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.toolbar {
  padding: 16px;
  animation: fadeIn 0.3s ease;
}



.gap {
  height: 12px;
}

.results {
  padding: 20px;
  animation: slideUp 0.4s ease;
}

.results-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.results-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
}

.results-grid {
  display: grid;
  gap: 8px;
}

.result-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.result-card:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
}

.result-card:hover .result-play {
  opacity: 1;
  transform: scale(1);
}

.result-cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  background-color: rgba(99, 102, 241, 0.15);
  margin-right: 12px;
}

.result-play {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  flex-shrink: 0;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  font-size: 13px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.sep {
  opacity: 0.5;
}

.result-platform {
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>


