<script setup lang="ts">
import { NButton, NDataTable, NEmpty, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, onMounted, ref } from 'vue'
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

const boardColumns = computed<DataTableColumns<{ id: string; name: string; updateFrequency?: string }>>(() => [
  { title: '榜单', key: 'name' },
  { title: '更新', key: 'updateFrequency', render: (r) => r.updateFrequency || '-' },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h(
        NButton,
        { size: 'small', onClick: () => loadBoardSongs(r.id), type: r.id === currentBoardId.value ? 'primary' : 'default' },
        { default: () => '查看' },
      ),
  },
])

const songColumns = computed<DataTableColumns<{ id: string; name: string }>>(() => [
  { title: '歌曲', key: 'name' },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () => player.play({ id: r.id, name: r.name, platform: source.value }),
        },
        { default: () => '播放' },
      ),
  },
])
</script>

<template>
  <div>
    <div class="head">
      <div>
        <div class="section-title">发现</div>
        <div class="section-subtitle">快速入口：排行榜</div>
      </div>
    </div>

    <div class="grid">
      <div class="panel surface-inset">
        <div class="panel-head">
          <div class="panel-title">排行榜</div>
          <div class="panel-sub">toplists</div>
        </div>
        <NEmpty v-if="!loading && boards.length === 0" description="暂无榜单数据（请检查 Base URL 或网络）。" />
        <div v-else class="table-wrap">
          <NDataTable :columns="boardColumns" :data="boards" :loading="loading" :bordered="false" />
        </div>
      </div>

      <div class="panel surface-inset">
        <div class="panel-head">
          <div class="panel-title">榜单歌曲</div>
          <div class="panel-sub">toplist</div>
        </div>
        <NEmpty v-if="!loading && songs.length === 0" description="选择一个榜单查看歌曲。" />
        <div v-else class="table-wrap">
          <NDataTable :columns="songColumns" :data="songs" :loading="loading" :bordered="false" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.desc {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.7;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 980px) {
  .grid {
    grid-template-columns: 1fr 1.1fr;
  }
}

.panel {
  padding: 12px;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.panel-title {
  font-weight: 650;
}

.panel-sub {
  font-size: 12px;
  color: var(--muted);
}

.table-wrap {
  overflow: hidden;
}
</style>


