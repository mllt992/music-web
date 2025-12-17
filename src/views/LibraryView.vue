<script setup lang="ts">
import { NEmpty, NTabs, NTabPane, NButton, NModal, NInput, NSpace, useMessage } from 'naive-ui'
import { onMounted, ref } from 'vue'
import { usePlayerStore } from '../stores/player'

const player = usePlayerStore()
const message = useMessage()
const showCreatePlaylist = ref(false)
const newPlaylistName = ref('')

onMounted(() => {
  player.loadHistory()
  player.loadFavorites()
  player.loadPlaylists()
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
      <NButton type="primary" @click="showCreatePlaylist = true">创建歌单</NButton>
    </div>

    <NTabs type="segment" animated>
      <NTabPane name="favorites" tab="收藏">
        <NEmpty v-if="player.favorites.length === 0" description="暂无收藏的歌曲" />
        <div v-else class="songs-grid">
          <div
            v-for="(track, idx) in player.favorites"
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
            </div>
            <button class="unfavorite-btn" @click.stop="player.toggleFavorite(track)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>
        </div>
      </NTabPane>
      <NTabPane name="history" tab="历史">
        <NEmpty v-if="player.history.length === 0" description="暂无播放历史" />
        <div v-else class="songs-grid">
          <div
            v-for="(track, idx) in player.history"
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
            </div>
          </div>
        </div>
      </NTabPane>
      <NTabPane name="playlists" tab="歌单">
        <NEmpty v-if="player.playlists.length === 0" description="暂无歌单，点击右上角创建" />
        <div v-else class="playlists-container">
          <div v-for="playlist in player.playlists" :key="playlist.id" class="playlist-card">
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
                v-for="(track, idx) in playlist.tracks"
                :key="`${track.id}-${track.platform}-${idx}`"
                class="song-item"
                @click="player.play(track)"
              >
                <div class="song-index">{{ idx + 1 }}</div>
                <div class="song-info">
                  <div class="song-name">{{ track.name }}</div>
                  <div v-if="track.artist" class="song-artist">{{ track.artist }}</div>
                </div>
                <NButton size="tiny" quaternary @click.stop="player.removeTrackFromPlaylist(playlist.id, track.id, track.platform)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </NButton>
              </div>
            </div>
          </div>
        </div>
      </NTabPane>
    </NTabs>

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


