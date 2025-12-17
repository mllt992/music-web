<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSwitch,
  useMessage,
} from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { usePlayerStore } from '../stores/player'
import { exportLocalData, importLocalData } from '../storage/local'
import { resolveConflict } from '../webdav/sync'
import { webdavTestMultiFile, webdavUploadMultiFile, webdavDownloadMultiFile } from '../webdav/multiFileSync'

const dataStats = computed(() => {
  const player = usePlayerStore()
  return {
    favorites: app.data.favorites.length,
    history: app.data.history.length,
    playlists: app.data.playlists.length,
    playCounts: Object.keys(player.playCounts).length
  }
})

const message = useMessage()
const app = useAppStore()

const conflictOptions = [
  { label: '服务端优先', value: 'server_wins' },
  { label: '本地优先', value: 'client_wins' },
]

const canSave = computed(() => true)

const sleepMinutes = ref(30)
const sleepTimerActive = ref(false)
const sleepEndTime = ref(0)
let sleepTimerInterval: ReturnType<typeof setInterval> | null = null

const formatSleepTime = computed(() => {
  const remaining = Math.max(0, Math.floor((sleepEndTime.value - Date.now()) / 1000))
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

function startSleepTimer() {
  if (!sleepMinutes.value || sleepMinutes.value < 1) {
    message.error('请输入有效的分钟数')
    return
  }
  sleepEndTime.value = Date.now() + sleepMinutes.value * 60 * 1000
  sleepTimerActive.value = true
  message.success(`已设置 ${sleepMinutes.value} 分钟后关闭`)
  
  sleepTimerInterval = setInterval(() => {
    if (Date.now() >= sleepEndTime.value) {
      cancelSleepTimer()
      window.close()
    }
  }, 1000)
}

function cancelSleepTimer() {
  sleepTimerActive.value = false
  if (sleepTimerInterval) {
    clearInterval(sleepTimerInterval)
    sleepTimerInterval = null
  }
  message.info('已取消定时关闭')
}

function save() {
  app.persist()
  message.success('已保存设置')
}

const importing = ref(false)
const importText = ref('')

async function copyExport() {
  const text = exportLocalData()
  await navigator.clipboard.writeText(text)
  message.success('已复制到剪贴板')
}

async function doImport() {
  try {
    const data = importLocalData(importText.value)
    app.replaceData(data)
    importing.value = false
    importText.value = ''
    message.success('已导入')
  } catch (e) {
    message.error((e as Error).message || '导入失败')
  }
}

const syncing = ref(false)

async function testWebdav() {
  try {
    syncing.value = true
    const success = await webdavTestMultiFile(app.data.settings.webdav)
    if (success) {
      message.success('连接成功')
    } else {
      message.error('连接失败')
    }
  } catch (e) {
    message.error((e as Error).message || '连接失败')
  } finally {
    syncing.value = false
  }
}

async function uploadWebdav() {
  try {
    syncing.value = true
    const player = usePlayerStore()
    await webdavUploadMultiFile(app.data.settings.webdav, app.data, player.playCounts)
    message.success('已上传到 WebDAV')
  } catch (e) {
    message.error((e as Error).message || '上传失败')
  } finally {
    syncing.value = false
  }
}

async function downloadWebdav() {
  try {
    syncing.value = true
    const result = await webdavDownloadMultiFile(app.data.settings.webdav)
    if (!result) {
      message.warning('远端没有可用数据（或版本不兼容）')
      return
    }
    
    const { data: remote, playCounts } = result
    
    // 根据冲突策略合并数据
    const resolved = resolveConflict(app.data, remote, app.data.settings.webdav.conflictStrategy)
    
    // 替换应用数据
    app.replaceData(resolved)
    
    // 同步播放次数数据
    const player = usePlayerStore()
    player.playCounts = playCounts
    player.favorites = app.data.favorites
    player.history = app.data.history
    player.playlists = app.data.playlists
    player.saveSettings()
    
    // 保存到 localStorage
    localStorage.setItem('music_favorites', JSON.stringify(player.favorites))
    localStorage.setItem('music_history', JSON.stringify(player.history))
    localStorage.setItem('music_playlists', JSON.stringify(player.playlists))
    localStorage.setItem('music_playCounts', JSON.stringify(player.playCounts))
    
    message.success('已从 WebDAV 拉取并应用')
  } catch (e) {
    message.error((e as Error).message || '拉取失败')
  } finally {
    syncing.value = false
  }
}

watch(
  () => app.data.settings.webdav.autoSync,
  (v) => {
    if (v) message.info('已开启自动同步（后续将补齐自动触发策略）')
  },
)
</script>

<template>
  <NCard title="设置" size="large">
    <NSpace vertical size="large">
      <NAlert type="warning" :bordered="false">
        数据通过LocalStorage存储在本地，为了避免数据丢失，建议您
        <strong>通过webdav配置存储您自己的数据。</strong>
      </NAlert>

        <NCard size="small" title="音乐 API（配置）">
          <NForm :model="app.data.settings" label-placement="left" label-width="110">
            <NFormItem label="Base URL">
              <NInput v-model:value="app.data.settings.api.baseUrl" placeholder="例如：http://127.0.0.1:3000" />
            </NFormItem>
            <NSpace>
              <NButton type="primary" :disabled="!canSave" @click="save">保存</NButton>
              <NButton @click="copyExport">导出（复制 JSON）</NButton>
              <NButton @click="importing = true">导入（粘贴 JSON）</NButton>
            </NSpace>
          </NForm>
        </NCard>

        <NCard size="small" title="定时关闭">
          <NForm :model="app.data.settings" label-placement="left" label-width="110">
            <NFormItem label="定时关闭">
              <NSpace>
                <NInputNumber v-model:value="sleepMinutes" :min="1" :max="180" placeholder="分钟" style="width: 120px" />
                <NButton :disabled="sleepTimerActive" @click="startSleepTimer">启动</NButton>
                <NButton v-if="sleepTimerActive" type="error" @click="cancelSleepTimer">取消</NButton>
              </NSpace>
            </NFormItem>
            <NAlert v-if="sleepTimerActive" type="info" :bordered="false">
              将在 {{ formatSleepTime }} 后自动关闭
            </NAlert>
          </NForm>
        </NCard>

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
            <NButton type="primary" :disabled="!canSave" @click="save">保存</NButton>
            <NButton :loading="syncing" @click="testWebdav">测试连接</NButton>
            <NButton :loading="syncing" @click="uploadWebdav">上传</NButton>
            <NButton :loading="syncing" @click="downloadWebdav">拉取</NButton>
          </NSpace>
        </NForm>
      </NCard>
    </NSpace>
  </NCard>

  <NModal v-model:show="importing" preset="card" title="导入数据（JSON）" style="width: min(900px, 92vw)">
    <NSpace vertical>
      <NInput v-model:value="importText" type="textarea" :autosize="{ minRows: 10, maxRows: 18 }" />
      <NSpace justify="end">
        <NButton @click="importing = false">取消</NButton>
        <NButton type="primary" @click="doImport">导入并覆盖本地</NButton>
      </NSpace>
    </NSpace>
  </NModal>
</template>
