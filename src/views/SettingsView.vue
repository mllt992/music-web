<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCard,
  NInput,
  NModal,
  NSpace,
  useMessage,
} from 'naive-ui'
import { ref, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { usePlayerStore } from '../stores/player'
import { exportLocalData, importLocalData } from '../storage/local'
import { resolveConflict } from '../webdav/sync'
import { webdavTestMultiFile, webdavUploadMultiFile, webdavDownloadMultiFile } from '../webdav/multiFileSync'

// 导入拆分后的组件
import SettingsApi from '../components/SettingsApi.vue'
import SettingsSleep from '../components/SettingsSleep.vue'
import SettingsWebdav from '../components/SettingsWebdav.vue'

const message = useMessage()
const app = useAppStore()

const importing = ref(false)
const importText = ref('')
const syncing = ref(false)

function save() {
  app.persist()
  message.success('已保存设置')
}

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

      <SettingsApi 
        @save="save" 
        @copy-export="copyExport" 
        @open-import="importing = true" 
      />

      <SettingsSleep :app-settings="app.data.settings" />

      <SettingsWebdav 
        :syncing="syncing"
        @save="save"
        @test-webdav="testWebdav"
        @upload-webdav="uploadWebdav"
        @download-webdav="downloadWebdav"
      />
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
