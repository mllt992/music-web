<script setup lang="ts">
import { NEmpty, NScrollbar, NSpin, useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { createTuneHubClient, toplist, toplists, type TuneHubPlatform } from '../api/tunehub'
import { useAppStore } from '../stores/app'
import { usePlayerStore } from '../stores/player'

const app = useAppStore()
const player = usePlayerStore()
const message = useMessage()
const loading = ref(false)
const source = ref<TuneHubPlatform>('netease')
const boards = ref<Array<{ id: string; name: string; updateFrequency?: string }>>([])
const songs = ref<Array<{ id: string; name: string }>>([])
const currentBoardId = ref<string>('')

const client = computed(() => createTuneHubClient(app.data.settings.api.baseUrl || 'https://music-dl.sayqz.com'))

async function loadBoards() {
  try {
    loading.value = true
    const data = await toplists({ client: client.value, source: source.value })
    boards.value = data.list || []
  } catch (e) {
    message.error((e as Error).message || '加载排行榜失败')
  } finally {
    loading.value = false
  }
}

async function loadBoardSongs(id: string) {
  try {
    loading.value = true
    currentBoardId.value = id
    const data = await toplist({ client: client.value, source: source.value, id })
    songs.value = data.list || []
  } catch (e) {
    message.error((e as Error).message || '加载榜单歌曲失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadBoards()
})
</script>

<template>
  <div class="discover">
    <div class="head">
      <div>
        <div class="section-title">发现音乐</div>
        <div class="section-subtitle">精选榜单 · 热门推荐</div>
      </div>
    </div>

    <div class="layout">
      <div class="boards-section">
        <div class="section-label">排行榜</div>
        <NSpin :show="loading && !boards.length">
          <NEmpty v-if="!loading && boards.length === 0" description="暂无榜单数据" />
          <div v-else class="boards-grid">
            <div
              v-for="board in boards"
              :key="board.id"
              class="board-card"
              :class="{ active: board.id === currentBoardId }"
              @click="loadBoardSongs(board.id)"
            >
              <div class="board-icon">🎵</div>
              <div class="board-name">{{ board.name }}</div>
              <div class="board-update">{{ board.updateFrequency || '实时更新' }}</div>
            </div>
          </div>
        </NSpin>
      </div>

      <div class="songs-section surface-inset">
        <div class="songs-header">
          <div class="section-label">榜单歌曲</div>
          <div v-if="songs.length" class="song-count">共 {{ songs.length }} 首</div>
        </div>
        
        <NSpin :show="loading && currentBoardId !== ''">
          <NEmpty v-if="!loading && songs.length === 0" description="选择榜单查看歌曲" />
          <NScrollbar v-else style="max-height: 580px">
            <div class="songs-list">
              <div
                v-for="(song, idx) in songs"
                :key="song.id"
                class="song-item"
                @click="player.play({ id: song.id, name: song.name, platform: source })"
              >
                <div class="song-index">{{ String(idx + 1).padStart(2, '0') }}</div>
                <div class="song-info">
                  <div class="song-name">{{ song.name }}</div>
                </div>
                <div class="song-action">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          </NScrollbar>
        </NSpin>
      </div>
    </div>
  </div>
</template>

<style scoped>
.discover {
  padding-bottom: 20px;
}

.head {
  margin-bottom: 20px;
}

.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 980px) {
  .layout {
    grid-template-columns: 380px 1fr;
  }
}

.section-label {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0.3px;
  margin-bottom: 14px;
}

.boards-section {
  animation: slideInLeft 0.4s ease;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.board-card {
  padding: 20px 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}

.board-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}

.board-card.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: #6366f1;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
}

.board-card.active .board-name,
.board-card.active .board-update {
  color: white;
}

.board-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.board-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: var(--fg0);
}

.board-update {
  font-size: 12px;
  color: var(--muted);
}

.songs-section {
  padding: 20px;
  animation: slideInRight 0.4s ease;
}

.songs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.song-count {
  font-size: 13px;
  color: var(--muted);
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.song-item:hover {
  background: rgba(99, 102, 241, 0.08);
}

.song-item:hover .song-action {
  opacity: 1;
}

.song-index {
  width: 28px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-action {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  opacity: 0;
  transition: all 0.2s ease;
}

.song-action:hover {
  transform: scale(1.1);
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>


