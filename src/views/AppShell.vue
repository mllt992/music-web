<script setup lang="ts">
import {
  NConfigProvider,
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NMessageProvider,
} from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PlayerBar from '../components/PlayerBar.vue'

const route = useRoute()
const collapsed = ref(false)

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

  function renderLabel(to: string, label: string, icon?: string) {
    return () => h(RouterLink, { to }, { default: () => h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
      icon ? h('svg', { width: '18', height: '18', viewBox: '0 0 24 24', fill: 'currentColor', innerHTML: icon }) : null,
      label
    ])})
  }

  const menuOptions = computed<MenuOption[]>(() => [
    { key: '/discover', label: renderLabel('/discover', '发现', '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>') },
    { key: '/search', label: renderLabel('/search', '搜索', '<path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>') },
    { key: '/library', label: renderLabel('/library', '音乐库', '<path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>') },
    { key: '/settings', label: renderLabel('/settings', '设置', '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81a.488.488 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>') },
  ])

const selectedKey = computed(() => (route.path === '/' ? '/discover' : route.path))
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NMessageProvider>
      <NLayout has-sider class="shell">
        <NLayoutSider
          bordered
          :collapsed="collapsed"
          collapse-mode="width"
          :collapsed-width="56"
          :width="220"
          class="sider"
        >
          <div class="brand" @click="collapsed = !collapsed">
            <div class="dot" />
            <div v-if="!collapsed" class="title">Music</div>
            <div v-if="!collapsed" class="subtitle"></div>
          </div>
          <NMenu :options="menuOptions" :value="selectedKey" class="menu" />
        </NLayoutSider>

        <NLayout class="main">
          <NLayoutHeader bordered class="header">
            <div class="header-left">
              <div class="page-title">音乐</div>
              <div class="page-subtitle">MUSIC</div>
            </div>
            <div class="header-right">
              <div class="hint">乖乖狼科技</div>
            </div>
          </NLayoutHeader>

          <NLayoutContent class="content">
            <div class="container surface">
              <router-view />
            </div>
            <PlayerBar />
          </NLayoutContent>
        </NLayout>
      </NLayout>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
.shell {
  height: 100%;
}

.main {
  background: transparent;
}

.sider {
  margin: 14px 0 14px 14px;
  border-radius: 18px;
  background: var(--glass);
  backdrop-filter: var(--blur);
  box-shadow: var(--shadow-soft);
}

.brand {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #6366f1, #10b981);
  box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.10);
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

.menu {
  padding: 6px;
}

.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  margin: 14px 14px 0 14px;
  border-radius: 18px;
  background: var(--glass);
  backdrop-filter: var(--blur);
  box-shadow: var(--shadow-soft);
}

.page-title {
  font-weight: 650;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.page-subtitle {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.hint {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.content {
  padding: 14px 14px 110px 14px;
  overflow-y: auto;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 16px 0px 16px;
}
</style>


