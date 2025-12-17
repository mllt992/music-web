import { defineStore } from 'pinia'
import type { AppData } from '../storage/schema'
import { loadLocalData, saveLocalData } from '../storage/local'

export const useAppStore = defineStore('app', {
  state: () => ({
    data: loadLocalData() as AppData,
  }),
  getters: {
    settings: (s) => s.data.settings,
  },
  actions: {
    persist() {
      saveLocalData(this.data)
    },
    replaceData(next: AppData) {
      this.data = next
      this.persist()
    },
    updateSettings(patch: Partial<AppData['settings']>) {
      this.data.settings = { ...this.data.settings, ...patch }
      this.persist()
    },
  },
})


