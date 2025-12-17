import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../views/AppShell.vue'),
    children: [
      { path: '', redirect: '/discover' },
      { path: 'discover', component: () => import('../views/DiscoverView.vue') },
      { path: 'toplist', component: () => import('../views/ToplistView.vue') },
      { path: 'search', component: () => import('../views/SearchView.vue') },
      { path: 'library', component: () => import('../views/LibraryView.vue') },
      { path: 'playlist/:id', component: () => import('../views/PlaylistView.vue') },
      { path: 'settings', component: () => import('../views/SettingsView.vue') },
      { path: 'player', component: () => import('../views/PlayerView.vue') },
    ],
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})


