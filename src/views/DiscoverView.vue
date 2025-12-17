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
const boards = ref<Array<{ id: string; name: string; updateFrequency?: string; pic?: string }>>([])
const songs = ref<Array<{ id: string; name: string; pic?: string; artist?: string; album?: string }>>([])
const currentBoardId = ref<string>('')
const displayLimit = ref(20)

const client = computed(() => createTuneHubClient(app.data.settings.api.baseUrl || 'https://music-dl.sayqz.com'))
const displayedSongs = computed(() => songs.value.slice(0, displayLimit.value))

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
    displayLimit.value = 20
    const data = await toplist({ client: client.value, source: source.value, id })
    songs.value = data.list || []
  } catch (e) {
    message.error((e as Error).message || '加载榜单歌曲失败')
  } finally {
    loading.value = false
  }
}

function loadMore() {
  displayLimit.value += 20
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
          <div v-if="songs.length" class="song-count">显示 {{ displayedSongs.length }} / {{ songs.length }} 首</div>
        </div>
        
        <NSpin :show="loading && currentBoardId !== ''">
          <NEmpty v-if="!loading && songs.length === 0" description="选择榜单查看歌曲" />
          <div v-else>
            <div class="songs-grid">
              <div
                v-for="(song, idx) in displayedSongs"
                :key="song.id"
                class="song-card"
                @click="player.play({ id: song.id, name: song.name, artist: song.artist, album: song.album, platform: source })"
              >
                <div class="song-cover" :style="song.pic ? { backgroundImage: `url(${song.pic})` } : {}">
                  <div class="song-rank">{{ idx + 1 }}</div>
                  <div class="song-play-overlay">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div class="song-details">
                  <div class="song-name">{{ song.name }}</div>
                  <div v-if="song.artist" class="song-artist">{{ song.artist }}</div>
                </div>
              </div>
            </div>
            <div v-if="displayedSongs.length < songs.length" class="load-more">
              <button class="load-more-btn" @click="loadMore">
                加载更多 ({{ songs.length - displayedSongs.length }} 首)
              </button>
            </div>
          </div>
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
  max-height: calc(100vh - 240px);
  overflow-y: auto;
}

.songs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.song-count {
  font-size: 13px;
  color: var(--muted);
}

.songs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.song-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.song-card:hover {
  transform: translateY(-4px);
}

.song-card:hover .song-play-overlay {
  opacity: 1;
}

.song-cover {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;
}

.song-rank {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
}

.song-play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.song-details {
  padding: 0 4px;
}

.song-name {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  min-height: 36px;
}

.song-artist {
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.load-more {
  margin-top: 20px;
  text-align: center;
}

.load-more-btn {
  padding: 10px 24px;
  border-radius: 10px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
  color: #6366f1;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  transform: translateY(-1px);
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


