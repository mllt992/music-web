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

function renderLabel(to: string, label: string) {
  return () => h(RouterLink, { to }, { default: () => label })
}

const menuOptions = computed<MenuOption[]>(() => [
  { key: 'group-main', type: 'group', label: '浏览', children: [
    { key: '/discover', label: renderLabel('/discover', '发现') },
    { key: '/search', label: renderLabel('/search', '搜索') },
  ]},
  { key: 'group-lib', type: 'group', label: '我的', children: [
    { key: '/library', label: renderLabel('/library', '音乐库') },
  ]},
  { key: 'group-sys', type: 'group', label: '系统', children: [
    { key: '/settings', label: renderLabel('/settings', '设置') },
  ]},
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
            <div v-if="!collapsed" class="title">TuneHub</div>
            <div v-if="!collapsed" class="subtitle">音乐聚合</div>
          </div>
          <NMenu :options="menuOptions" :value="selectedKey" class="menu" />
        </NLayoutSider>

        <NLayout class="main">
          <NLayoutHeader bordered class="header">
            <div class="header-left">
              <div class="page-title">音乐</div>
              <div class="page-subtitle">像播放器一样克制、干净</div>
            </div>
            <div class="header-right">
              <div class="hint">TuneHub · LocalStorage · WebDAV</div>
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
  padding: 14px 14px 90px 14px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px 16px 0px 16px;
}
</style>


