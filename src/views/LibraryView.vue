<script setup lang="ts">
import { NEmpty, NButton, NModal, NInput, NSpace, useMessage } from 'naive-ui'
import { onMounted, ref, computed } from 'vue'
import { usePlayerStore } from '../stores/player'

const player = usePlayerStore()
const message = useMessage()
const showCreatePlaylist = ref(false)
const newPlaylistName = ref('')
const searchQuery = ref('')

const filteredFavorites = computed(() => {
  if (!searchQuery.value) return player.favorites
  const query = searchQuery.value.toLowerCase()
  return player.favorites.filter(track => 
    track.name.toLowerCase().includes(query) || 
    (track.artist && track.artist.toLowerCase().includes(query))
  )
})

const filteredHistory = computed(() => {
  if (!searchQuery.value) return player.history.slice(0, 20)
  const query = searchQuery.value.toLowerCase()
  const filtered = player.history.filter(track => 
    track.name.toLowerCase().includes(query) || 
    (track.artist && track.artist.toLowerCase().includes(query))
  )
  return filtered.slice(0, 20)
})

const filteredPlaylists = computed(() => {
  if (!searchQuery.value) return player.playlists
  const query = searchQuery.value.toLowerCase()
  return player.playlists.filter(playlist => {
    const nameMatch = playlist.name.toLowerCase().includes(query)
    const trackMatch = playlist.tracks.some(track => 
      track.name.toLowerCase().includes(query) || 
      (track.artist && track.artist.toLowerCase().includes(query))
    )
    return nameMatch || trackMatch
  })
})

onMounted(() => {
  // 首先尝试从 app store 加载数据（用于 WebDAV 同步）
  player.loadFromAppStore()
  // 如果 app store 中没有数据，再从 localStorage 加载
  if (player.favorites.length === 0) player.loadFavorites()
  if (player.history.length === 0) player.loadHistory()
  if (player.playlists.length === 0) player.loadPlaylists()
  player.loadPlayCounts()
})

function createPlaylist() {
  if (!newPlaylistName.value.trim()) {
    message.error('请输入歌单名称')
    return
  }
  player.createPlaylist(newPlaylistName.value.trim())
  message.success('歌单创建成功')
  newPlaylistName.value = ''
  showCreatePlaylist.value = false
}

function deletePlaylist(id: string) {
  player.deletePlaylist(id)
  message.success('歌单已删除')
}
</script>

<template>
  <div class="library">
    <div class="head">
      <div>
        <div class="section-title">音乐库</div>
        <div class="section-subtitle">收藏 · 历史 · 歌单</div>
      </div>
      <div class="head-right">
        <NInput
          v-model:value="searchQuery"
          placeholder="搜索歌曲、艺术家或歌单..."
          style="width: 240px; margin-right: 12px;"
          clearable
        >
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </template>
        </NInput>
        <NButton type="primary" @click="showCreatePlaylist = true">创建歌单</NButton>
      </div>
    </div>

    <div class="library-sections">
      <div class="section">
        <div class="section-header">
          <div class="section-title-small">收藏</div>
          <div class="section-count">{{ filteredFavorites.length }} 首歌曲</div>
        </div>
        <NEmpty v-if="filteredFavorites.length === 0" description="暂无收藏的歌曲" />
        <div v-else class="songs-grid">
          <div
            v-for="(track, idx) in filteredFavorites"
            :key="`${track.id}-${track.platform}`"
            class="song-card"
            @click="player.play(track)"
          >
            <div class="song-cover">
              <div class="song-rank">{{ idx + 1 }}</div>
              <div class="song-play-overlay">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            <div class="song-details">
              <div class="song-name">{{ track.name }}</div>
              <div v-if="track.artist" class="song-artist">{{ track.artist }}</div>
              <div class="play-count">播放 {{ player.getPlayCount(track) }} 次</div>
            </div>
            <button class="unfavorite-btn" @click.stop="player.toggleFavorite(track)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div class="section-title-small">历史</div>
          <div class="section-count">{{ filteredHistory.length }} 首歌曲</div>
        </div>
        <NEmpty v-if="filteredHistory.length === 0" description="暂无播放历史" />
        <div v-else class="songs-grid">
          <div
            v-for="(track, idx) in filteredHistory"
            :key="`${track.id}-${track.platform}-${idx}`"
            class="song-card"
            @click="player.play(track)"
          >
            <div class="song-cover">
              <div class="song-rank">{{ idx + 1 }}</div>
              <div class="song-play-overlay">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            <div class="song-details">
              <div class="song-name">{{ track.name }}</div>
              <div v-if="track.artist" class="song-artist">{{ track.artist }}</div>
              <div class="play-count">播放 {{ player.getPlayCount(track) }} 次</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div class="section-title-small">歌单</div>
          <div class="section-count">{{ filteredPlaylists.length }} 个歌单</div>
        </div>
        <NEmpty v-if="filteredPlaylists.length === 0" description="暂无歌单，点击右上角创建" />
        <div v-else class="playlists-container">
          <div v-for="playlist in filteredPlaylists" :key="playlist.id" class="playlist-card">
            <div class="playlist-header">
              <div class="playlist-info">
                <div class="playlist-name">{{ playlist.name }}</div>
                <div class="playlist-count">{{ playlist.tracks.length }} 首歌曲</div>
              </div>
              <NButton size="small" type="error" @click="deletePlaylist(playlist.id)">删除</NButton>
            </div>
            <NEmpty v-if="playlist.tracks.length === 0" description="暂无歌曲" style="padding: 20px 0;" />
            <div v-else class="songs-list">
              <div
                v-for="(track, idx) in playlist.tracks.slice(0, 10)"
                :key="`${track.id}-${track.platform}-${idx}`"
                class="song-item"
                @click="player.play(track)"
              >
                <div class="song-index">{{ idx + 1 }}</div>
                <div class="song-info">
                  <div class="song-name">{{ track.name }}</div>
                  <div v-if="track.artist" class="song-artist">{{ track.artist }}</div>
                  <div class="play-count-small">播放 {{ player.getPlayCount(track) }} 次</div>
                </div>
                <NButton size="tiny" quaternary @click.stop="player.removeTrackFromPlaylist(playlist.id, track.id, track.platform)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </NButton>
              </div>
              <div v-if="playlist.tracks.length > 10" class="show-more">
                <div class="more-text">还有 {{ playlist.tracks.length - 10 }} 首歌曲</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <NModal v-model:show="showCreatePlaylist" preset="dialog" title="创建歌单">
      <NSpace vertical>
        <NInput v-model:value="newPlaylistName" placeholder="请输入歌单名称" @keyup.enter="createPlaylist" />
      </NSpace>
      <template #action>
        <NSpace>
          <NButton @click="showCreatePlaylist = false">取消</NButton>
          <NButton type="primary" @click="createPlaylist">创建</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.library {
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

.library-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
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

.songs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-top: 20px;
  animation: fadeIn 0.5s ease;
}

.song-card {
  cursor: pointer;
  transition: transform 0.2s ease;
  position: relative;
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

.play-count {
  font-size: 11px;
  color: #6366f1;
  margin-top: 4px;
  font-weight: 500;
}

.play-count-small {
  font-size: 11px;
  color: #6366f1;
  margin-top: 2px;
  font-weight: 500;
}

.unfavorite-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ef4444;
  transition: all 0.2s ease;
  z-index: 10;
}

.unfavorite-btn:hover {
  background: white;
  transform: scale(1.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.show-more {
  text-align: center;
  padding: 12px;
  margin-top: 8px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.05);
  cursor: pointer;
  transition: background 0.2s ease;
}

.show-more:hover {
  background: rgba(99, 102, 241, 0.1);
}

.more-text {
  font-size: 13px;
  color: #6366f1;
  font-weight: 500;
}

.playlists-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}

.playlist-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  background: white;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.playlist-name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.playlist-count {
  font-size: 12px;
  color: var(--muted);
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.song-item:hover {
  background: rgba(99, 102, 241, 0.05);
}

.song-index {
  font-size: 13px;
  color: var(--muted);
  min-width: 24px;
  text-align: center;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: 14px;
  font-weight: 500;
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
}
</style>


