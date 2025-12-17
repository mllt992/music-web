<script setup lang="ts">
import {
  NButton,
  NDataTable,
  NEmpty,
  NInput,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { createTuneHubClient, aggregateSearch, search, type TuneHubPlatform, type TuneHubSearchResult } from '../api/tunehub'
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

const columns = computed<DataTableColumns<TuneHubSearchResult>>(() => [
  {
    title: '歌曲',
    key: 'name',
    render: (row) => h('div', { style: 'font-weight:650' }, row.name),
  },
  { title: '歌手', key: 'artist', render: (row) => row.artist || '-' },
  { title: '专辑', key: 'album', render: (row) => row.album || '-' },
  { title: '平台', key: 'platform', render: (row) => (row.platform as string) || platform.value },
  {
    title: '操作',
    key: 'actions',
    render: (row) =>
      h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () =>
            player.play({
              id: row.id,
              name: row.name,
              artist: row.artist,
              album: row.album,
              platform: (row.platform as TuneHubPlatform) || platform.value,
            }),
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
      <div class="tip">
        Base URL：<span class="mono">{{ baseUrl }}</span>
      </div>
    </div>

    <div class="gap" />

    <NEmpty v-if="!loading && rows.length === 0" description="输入关键词开始搜索。建议用「聚合搜索」获得更全的结果。" />
    <div v-else class="table-wrap surface-inset">
      <NDataTable :columns="columns" :data="rows" :loading="loading" :bordered="false" />
    </div>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.toolbar {
  padding: 12px;
}

.tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  color: var(--fg0);
}

.table-wrap {
  overflow: hidden;
}

.gap {
  height: 12px;
}
</style>


