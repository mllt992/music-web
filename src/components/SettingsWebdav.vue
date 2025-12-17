<script setup lang="ts">
import { NAlert, NButton, NCard, NForm, NFormItem, NInput, NInputNumber, NSelect, NSpace, NSwitch } from 'naive-ui'
import { computed } from 'vue'
import { useAppStore } from '../stores/app'
import { usePlayerStore } from '../stores/player'

const props = defineProps<{
  syncing: boolean
}>()

const emit = defineEmits(['save', 'test-webdav', 'upload-webdav', 'download-webdav'])

const app = useAppStore()
const player = usePlayerStore()

const dataStats = computed(() => {
  return {
    favorites: app.data.favorites.length,
    history: app.data.history.length,
    playlists: app.data.playlists.length,
    playCounts: Object.keys(player.playCounts).length
  }
})

const conflictOptions = [
  { label: '服务端优先', value: 'server_wins' },
  { label: '本地优先', value: 'client_wins' },
]
</script>

<template>
  <NCard size="small" title="WebDAV 同步（配置）">
    <NAlert type="info" :bordered="false" style="margin-bottom: 16px;">
      本地数据：收藏 {{ dataStats.favorites }} 首 | 历史 {{ dataStats.history }} 首 | 歌单 {{ dataStats.playlists }} 个 | 播放统计 {{ dataStats.playCounts }} 条
    </NAlert>
    <NForm :model="app.data.settings.webdav" label-placement="left" label-width="110">
      <NFormItem label="WebDAV 地址">
        <NInput v-model:value="app.data.settings.webdav.url" placeholder="例如：https://dav.example.com/dav" />
      </NFormItem>
      <NFormItem label="用户名">
        <NInput v-model:value="app.data.settings.webdav.username" />
      </NFormItem>
      <NFormItem label="密码">
        <NInput
          v-model:value="app.data.settings.webdav.password"
          type="password"
          show-password-on="click"
        />
      </NFormItem>
      <NFormItem label="存储路径">
        <NInput v-model:value="app.data.settings.webdav.remotePath" placeholder="/music-app/" />
        <template #feedback>
          建议使用多文件存储格式，数据将分散存储在指定路径下
        </template>
      </NFormItem>
      <NFormItem label="超时（ms）">
        <NInputNumber v-model:value="app.data.settings.webdav.timeoutMs" :min="1000" :step="1000" />
      </NFormItem>
      <NFormItem label="冲突策略">
        <NSelect v-model:value="app.data.settings.webdav.conflictStrategy" :options="conflictOptions" />
      </NFormItem>
      <NFormItem label="自动同步">
        <NSwitch v-model:value="app.data.settings.webdav.autoSync" />
      </NFormItem>
      <NSpace>
        <NButton type="primary" @click="emit('save')">保存</NButton>
        <NButton :loading="syncing" @click="emit('test-webdav')">测试连接</NButton>
        <NButton :loading="syncing" @click="emit('upload-webdav')">上传</NButton>
        <NButton :loading="syncing" @click="emit('download-webdav')">拉取</NButton>
      </NSpace>
    </NForm>
  </NCard>
</template>