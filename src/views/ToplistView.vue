<script setup lang="ts">
import { NEmpty, NSpin, useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createTuneHubClient, toplist, type TuneHubPlatform } from '../api/tunehub'
import { useAppStore } from '../stores/app'
import { usePlayerStore } from '../stores/player'

const app = useAppStore()
const player = usePlayerStore()
const message = useMessage()
const route = useRoute()
const loading = ref(false)
const songs = ref<Array<{ id: string; name: string; pic?: string; artist?: string; album?: string }>>([])
const displayLimit = ref(20)

const boardId = computed(() => route.query.id as string)
const boardName = computed(() => route.query.name as string)
const source = computed(() => (route.query.source as TuneHubPlatform) || 'netease')
const client = computed(() => createTuneHubClient(app.data.settings.api.baseUrl || 'https://music-dl.sayqz.com'))
const displayedSongs = computed(() => songs.value.slice(0, displayLimit.value))

async function loadBoardSongs() {
  if (!boardId.value) return
  try {
    loading.value = true
    const data = await toplist({ client: client.value, source: source.value, id: boardId.value })
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
  await loadBoardSongs()
})
</script>

<template>
  <div class="toplist">
    <div class="head">
      <div>
        <div class="section-title">{{ boardName }}</div>
        <div class="section-subtitle">{{ songs.length }} 首歌曲</div>
      </div>
    </div>

    <NSpin :show="loading">
      <NEmpty v-if="!loading && songs.length === 0" description="暂无歌曲" />
      <div v-else class="songs-grid">
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
    </NSpin>
  </div>
</template>

<style scoped>
.toplist {
  padding-bottom: 20px;
}

.head {
  margin-bottom: 20px;
}

.songs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  animation: fadeIn 0.5s ease;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
