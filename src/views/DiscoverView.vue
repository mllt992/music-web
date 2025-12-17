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

// 按类型分组榜单
const boardCategories = computed(() => {
  const categories = {
    hot: { name: '热门榜单', boards: [] as typeof boards.value },
    style: { name: '风格榜单', boards: [] as typeof boards.value },
    language: { name: '语种榜单', boards: [] as typeof boards.value },
    special: { name: '特色榜单', boards: [] as typeof boards.value },
  }

  boards.value.forEach(board => {
    const name = board.name
    if (name.includes('飙升') || name.includes('新歌') || name.includes('热歌') || name.includes('原创') || name.includes('实时')) {
      categories.hot.boards.push(board)
    } else if (name.includes('说唱') || name.includes('电音') || name.includes('摇滚') || name.includes('国风') || name.includes('民谣') || name.includes('ACG') || name.includes('古典')) {
      categories.style.boards.push(board)
    } else if (name.includes('韩语') || name.includes('日语') || name.includes('欧美') || name.includes('英文') || name.includes('俄语') || name.includes('泰语') || name.includes('越南')) {
      categories.language.boards.push(board)
    } else {
      categories.special.boards.push(board)
    }
  })

  return Object.entries(categories)
    .filter(([_, cat]) => cat.boards.length > 0)
    .map(([key, cat]) => ({ key, ...cat }))
})

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
        <NSpin :show="loading && !boards.length">
          <NEmpty v-if="!loading && boards.length === 0" description="暂无榜单数据" />
          <div v-else class="boards-container">
            <div v-for="category in boardCategories" :key="category.key" class="category-section">
              <div class="category-title">{{ category.name }}</div>
              <div class="boards-grid">
                <div
                  v-for="board in category.boards"
                  :key="board.id"
                  class="board-card"
                  :class="{ active: board.id === currentBoardId }"
                  @click="loadBoardSongs(board.id)"
                >
                  <div 
                    class="board-cover" 
                    :style="board.pic ? { backgroundImage: `url(${board.pic})` } : {}"
                  >
                    <div class="board-overlay">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div class="board-info">
                    <div class="board-name">{{ board.name }}</div>
                    <div class="board-update">{{ board.updateFrequency || '实时更新' }}</div>
                  </div>
                </div>
              </div>
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

@media (min-width: 1280px) {
  .layout {
    grid-template-columns: 1fr 480px;
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

.boards-container {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.category-section {
  animation: fadeIn 0.5s ease;
}

.category-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--fg0);
  letter-spacing: 0.5px;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}

.board-card {
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  overflow: hidden;
  background: white;
  border: 1px solid var(--border);
}

.board-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.18);
  border-color: rgba(99, 102, 241, 0.4);
}

.board-card:hover .board-overlay {
  opacity: 1;
}

.board-card.active {
  border-color: #6366f1;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
}

.board-cover {
  width: 100%;
  aspect-ratio: 1/1;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12));
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.board-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.board-info {
  padding: 10px 12px;
  background: white;
}

.board-name {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
  color: var(--fg0);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  min-height: 36px;
}

.board-update {
  font-size: 11px;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>


