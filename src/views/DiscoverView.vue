<script setup lang="ts">
import { NEmpty, NSpin, useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createTuneHubClient, toplists, type TuneHubPlatform } from '../api/tunehub'
import { useAppStore } from '../stores/app'

const app = useAppStore()
const message = useMessage()
const router = useRouter()
const loading = ref(false)
const source = ref<TuneHubPlatform>('netease')
const boards = ref<Array<{ id: string; name: string; updateFrequency?: string; pic?: string }>>([])

const client = computed(() => createTuneHubClient(app.data.settings.api.baseUrl || 'https://music-dl.sayqz.com'))

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

function goToToplist(id: string, name: string) {
  router.push({ path: '/toplist', query: { id, name, source: source.value } })
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
                @click="goToToplist(board.id, board.name)"
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
</template>

<style scoped>
.discover {
  padding-bottom: 20px;
}

.head {
  margin-bottom: 20px;
}

.boards-container {
  display: flex;
  flex-direction: column;
  gap: 28px;
  animation: fadeIn 0.5s ease;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>


