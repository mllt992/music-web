<script setup lang="ts">
import { NEmpty, NButton, NInput, useMessage } from 'naive-ui'
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { useAppStore } from '../stores/app'
import { buildApiUrl } from '../api/tunehub'

const player = usePlayerStore()
const app = useAppStore()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const searchQuery = ref('')

// 获取API基础URL
const baseUrl = computed(() => app.data.settings.api.baseUrl || 'https://music-dl.sayqz.com')

// 生成封面图片URL
function getCoverUrl(track: any) {
  return buildApiUrl(baseUrl.value, {
    source: (track.platform || 'netease') as string,
    id: track.id,
    type: 'pic',
  })
}

// 获取当前播放列表ID
const playlistId = computed(() => route.params.id as string)

// 获取当前播放列表
const currentPlaylist = computed(() => {
  if (!Array.isArray(player.playlists)) return null
  return player.playlists.find(p => p.id === playlistId.value) || null
})

// 过滤播放列表中的歌曲
const filteredTracks = computed(() => {
  if (!currentPlaylist.value || !Array.isArray(currentPlaylist.value.tracks)) return []
  if (!searchQuery.value) return currentPlaylist.value.tracks
  const query = searchQuery.value.toLowerCase()
  return currentPlaylist.value.tracks.filter(track => 
    track.name.toLowerCase().includes(query) || 
    (track.artist && track.artist.toLowerCase().includes(query))
  )
})

// 加载播放列表数据
onMounted(() => {
  player.loadPlaylists()
  player.loadPlayCounts()
})

// 监听播放列表ID变化
watch(
  playlistId,
  () => {
    if (!currentPlaylist.value) {
      message.error('播放列表不存在')
      router.push('/library')
    }
  },
  { immediate: true }
)

// 播放列表中的歌曲
function playTrack(_track: any, index: number) {
  if (!currentPlaylist.value) return
  player.playAll(currentPlaylist.value.tracks, index)
}

// 从播放列表中移除歌曲
function removeTrack(trackId: string, platform?: string) {
  if (!playlistId.value) return
  player.removeTrackFromPlaylist(playlistId.value, trackId, platform)
  message.success('已从播放列表移除')
}

// 播放全部歌曲
function playAll() {
  if (!currentPlaylist.value || !Array.isArray(currentPlaylist.value.tracks) || currentPlaylist.value.tracks.length === 0) {
    message.warning('播放列表为空')
    return
  }
  player.playAll(currentPlaylist.value.tracks)
}

// 删除整个播放列表
function deletePlaylist() {
  if (!playlistId.value) return
  player.deletePlaylist(playlistId.value)
  message.success('播放列表已删除')
  router.push('/library')
}
</script>

<template>
  <div class="playlist-detail" v-if="currentPlaylist">
    <div class="head">
      <div>
        <div class="section-title">{{ currentPlaylist.name }}</div>
        <div class="section-subtitle">{{ currentPlaylist.tracks.length }} 首歌曲 · 创建于 {{ new Date(currentPlaylist.createdAt).toLocaleDateString() }}</div>
      </div>
      <div class="head-right">
        <NInput
          v-model:value="searchQuery"
          placeholder="搜索播放列表中的歌曲..."
          style="width: 240px; margin-right: 12px;"
          clearable
        >
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </template>
        </NInput>
        <NButton type="primary" @click="playAll">播放全部</NButton>
        <NButton type="error" @click="deletePlaylist">删除播放列表</NButton>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-title-small">歌曲列表</div>
        <div class="section-count">{{ filteredTracks.length }} 首歌曲</div>
      </div>
      <NEmpty v-if="filteredTracks.length === 0" description="播放列表中没有歌曲" />
      <div v-else class="songs-list">
        <div
          v-for="(track, idx) in filteredTracks"
          :key="`${track.id}-${track.platform}`"
          class="song-item"
          @click="playTrack(track, idx)"
        >
          <div class="song-index">{{ idx + 1 }}</div>
          <div class="song-cover-small" :style="{ backgroundImage: `url(${getCoverUrl(track)})` }"></div>
          <div class="song-info">
            <div class="song-name">{{ track.name }}</div>
            <div v-if="track.artist" class="song-artist">{{ track.artist }}</div>
            <div class="play-count">播放 {{ player.getPlayCount(track) }} 次</div>
          </div>
          <div class="song-actions">
            <NButton size="tiny" quaternary @click.stop="removeTrack(track.id, track.platform)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </NButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist-detail {
  padding-bottom: 20px;
}

.head {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.head-right {
  display: flex;
  align-items: center;
}

.section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.section-title-small {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.section-count {
  font-size: 14px;
  color: #6b7280;
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
  animation: fadeIn 0.5s ease;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border: 1px solid var(--border);
}

.song-item:hover {
  background: rgba(99, 102, 241, 0.05);
  transform: translateX(4px);
}

.song-index {
  font-size: 13px;
  color: var(--muted);
  min-width: 24px;
  text-align: center;
  font-weight: 500;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-artist {
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}

.play-count {
  font-size: 11px;
  color: #6366f1;
  font-weight: 500;
}

.song-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.song-item:hover .song-actions {
  opacity: 1;
}

.song-cover-small {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-size: cover;
  background-position: center;
  background-color: rgba(99, 102, 241, 0.15);
  margin-right: 12px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>