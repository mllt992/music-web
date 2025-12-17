<script setup lang="ts">
import {
  NConfigProvider,
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMessageProvider,
  NTooltip,
} from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PlayerBar from '../components/PlayerBar.vue'
import { createTuneHubClient, getHealth, getStatus } from '../api/tunehub'
import { useAppStore } from '../stores/app'

const route = useRoute()
const collapsed = ref(false)
const appStore = useAppStore()

const status = ref<{
  running: boolean;
  loading: boolean;
  data?: {
    service: string;
    version: string;
    status: string;
    platforms: {
      total: number;
      enabled: number;
      loaded: number;
      platforms: string[];
    };
  };
}>({ running: false, loading: true })
const health = ref<{
  healthy: boolean;
  loading: boolean;
}>({ healthy: false, loading: true })

async function checkStatus() {
  status.value.loading = true
  try {
    const client = createTuneHubClient(appStore.data.settings.api.baseUrl)
    const res = await getStatus({ client })
    status.value.data = res
    status.value.running = res.status === 'running' && res.platforms.platforms.includes('netease')
  } catch {
    status.value.running = false
    status.value.data = undefined
  } finally {
    status.value.loading = false
  }
}

async function checkHealth() {
  health.value.loading = true
  try {
    const client = createTuneHubClient(appStore.data.settings.api.baseUrl)
    const res = await getHealth({ client })
    health.value.healthy = res.status === 'healthy'
  } catch {
    health.value.healthy = false
  } finally {
    health.value.loading = false
  }
}

async function checkApiStatus() {
  await Promise.all([checkStatus(), checkHealth()])
}

onMounted(() => {
  checkApiStatus()
  // Refresh every 30 seconds
  setInterval(checkApiStatus, 30000)
})

const themeOverrides = {
  common: {
    primaryColor: '#6366f1',
    primaryColorHover: '#585cf0',
    primaryColorPressed: '#4f52e8',
    borderRadius: '12px',
  },
  Card: {
    borderRadius: '16px',
  },
  Button: {
    borderRadiusMedium: '10px',
    borderRadiusSmall: '8px',
  },
  Input: {
    borderRadius: '12px',
  },
} as const

  const menuOptions = computed(() => [
    { key: '/discover', label: '发现', icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>' },
    { key: '/search', label: '搜索', icon: '<path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>' },
    { key: '/library', label: '音乐库', icon: '<path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>' },
    { key: '/settings', label: '设置', icon: '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81a.488.488 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>' },
  ])

const selectedKey = computed(() => (route.path === '/' ? '/discover' : route.path))
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NMessageProvider>
      <div class="app-container">
        <!-- 上：Header - 非播放页显示 -->
        <NLayoutHeader 
          v-if="route.path !== '/player'" 
          bordered 
          class="header"
        >
          <div class="header-left">
            <div class="page-title">音乐</div>
            <div class="page-subtitle">MUSIC</div>
          </div>
          <div class="header-right">
            <div class="hint">乖乖狼科技</div>
          </div>
        </NLayoutHeader>

        <!-- 中：主内容区 -->
        <div :class="['main-content', { 'player-mode': route.path === '/player' }]">
          <!-- 非播放页布局 -->
          <NLayout 
            v-if="route.path !== '/player'" 
            class="middle-container" 
            has-sider
          >
            <!-- 左边：Aside -->
            <NLayoutSider
              bordered
              :collapsed="collapsed"
              collapse-mode="width"
              :collapsed-width="56"
              :width="180"
              class="sider"
            >
              <div class="brand" @click="collapsed = !collapsed">
                <NTooltip trigger="hover" placement="right">
                  <template #trigger>
                    <div :class="['dot', { 'dot-green': status.running, 'dot-gray': !status.running && !status.loading, 'dot-loading': status.loading }]" />
                  </template>
                  <div style="min-width: 200px;">
                    <div style="font-weight: bold;">状态</div>
                    <div>{{ status.loading ? '检查中...' : status.running ? '服务运行正常' : '服务异常' }}</div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">/status</div>
                    <div v-if="status.data" style="margin-top: 8px; font-size: 12px;">
                      <div style="margin-top: 4px;">服务: {{ status.data.service }}</div>
                      <div style="margin-top: 2px;">版本: {{ status.data.version }}</div>
                      <div style="margin-top: 2px;">平台数: {{ status.data.platforms.enabled }}/{{ status.data.platforms.total }}</div>
                      <div style="margin-top: 2px;">启用平台: {{ status.data.platforms.platforms.join(', ') }}</div>
                    </div>
                  </div>
                </NTooltip>
                <NTooltip trigger="hover" placement="right">
                  <template #trigger>
                    <div :class="['dot', { 'dot-green': health.healthy, 'dot-gray': !health.healthy && !health.loading, 'dot-loading': health.loading }]" />
                  </template>
                  <div>
                    <div style="font-weight: bold;">健康</div>
                    <div>{{ health.loading ? '检查中...' : health.healthy ? '服务健康' : '服务不健康' }}</div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">/health</div>
                  </div>
                </NTooltip>
              </div>
              <div class="menu">
              <div
                v-for="item in menuOptions"
                :key="item.key"
                class="menu-item"
                :class="{
                  'menu-item--selected': selectedKey === item.key,
                  'menu-item--collapsed': collapsed
                }"
              >
                <router-link :to="item.key" style="display: contents;">
                  <div class="menu-item-content">
                    <div v-if="item.icon" class="menu-item-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" :innerHTML="item.icon" />
                    </div>
                    <span v-if="!collapsed" class="menu-item-label">{{ item.label }}</span>
                  </div>
                </router-link>
              </div>
            </div>
            </NLayoutSider>

            <!-- 右边：Content -->
            <NLayoutContent class="content surface">
              <div class="container">
                <router-view />
              </div>
            </NLayoutContent>
          </NLayout>
          
          <!-- 播放页布局 - 全屏显示 -->
          <div v-else class="player-container">
            <router-view />
          </div>
        </div>

        <!-- 下：播放器 -->
        <PlayerBar />
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 主内容区 */
.main-content {
  flex: 1;
  overflow: hidden;
}

/* 播放器模式 */
.player-mode {
  margin: 0;
  padding: 0;
}

/* 播放器容器 */
.player-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* 移除播放器模式下的边距和背景 */
.player-mode .middle-container {
  margin: 0;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
  border: none;
}

* {
  box-sizing: border-box;
}

.middle-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  margin: 0 14px 0 14px;
  background: var(--glass);
  backdrop-filter: var(--blur);
  box-shadow: var(--shadow-soft);
  border-left: 1px solid rgba(99, 102, 241, 0.15);
  border-right: 1px solid rgba(99, 102, 241, 0.15);
}

.sider {
  margin: 0;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
  overflow: hidden;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(99, 102, 241, 0.15);
}

.brand {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 14px;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.10);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.dot-green {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.15);
}

.dot-gray {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  box-shadow: 0 0 0 6px rgba(156, 163, 175, 0.10);
}

.dot-loading {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  animation: pulse 1.5s ease-in-out infinite;
}

.title {
  font-weight: 650;
  letter-spacing: 0.2px;
}

.subtitle {
  margin-left: auto;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

/* 自定义菜单样式 */
.menu {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 菜单项样式 */
.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 10px;
}

/* 菜单项内容样式 */
.menu-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  color: #000;
  text-decoration: none;
  transition: all 0.3s ease;
}

/* 菜单项悬停效果 */
.menu-item:hover {
  background: rgba(99, 102, 241, 0.08);
  transform: translateX(2px);
}

/* 选中菜单项样式 */
.menu-item--selected {
  background: rgba(99, 102, 241, 0.15);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

/* 选中菜单项内容样式 */
.menu-item--selected .menu-item-content {
  color: #6366f1;
  font-weight: 600;
}

/* 菜单项图标样式 */
.menu-item-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* 菜单项文字样式 */
.menu-item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 收缩状态样式 */
.menu-item--collapsed .menu-item-content {
  padding: 12px 0;
  justify-content: center;
  gap: 0;
}

/* 收缩状态下隐藏文字 */
.menu-item--collapsed .menu-item-label {
  display: none;
}

.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  margin: 14px 14px 0 14px;
  border-radius: 18px 18px 0 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 244, 255, 0.9) 100%);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8) inset;
  border: 1px solid rgba(99, 102, 241, 0.15);
  transition: all 0.3s ease;
  box-sizing: border-box;
  max-width: calc(100% - 28px);
}

.header:hover {
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.9) inset;
  border-color: rgba(99, 102, 241, 0.25);
}

.page-title {
  font-weight: 700;
  font-size: 18px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.page-subtitle {
  font-size: 12px;
  color: rgba(99, 102, 241, 0.6);
  font-weight: 500;
  letter-spacing: 1px;
}

.header-right {
  padding: 8px 14px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.header-right:hover {
  background: rgba(99, 102, 241, 0.08);
}

.hint {
  font-size: 12px;
  color: rgba(99, 102, 241, 0.6);
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: color 0.3s ease;
}

.hint:hover {
  color: rgba(99, 102, 241, 0.9);
}

.content {
  padding: 20px;
  overflow-y: auto;
  margin: 0;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
  height: 100%;
  flex: 1;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

</style>


