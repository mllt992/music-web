<script setup lang="ts">
import { NAlert, NButton, NCard, NForm, NFormItem, NInputNumber, NSpace } from 'naive-ui'
import { computed, ref } from 'vue'

const props = defineProps<{
  appSettings: any
}>()

const emit = defineEmits(['save'])

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
    return
  }
  sleepEndTime.value = Date.now() + sleepMinutes.value * 60 * 1000
  sleepTimerActive.value = true
  
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
}
</script>

<template>
  <NCard size="small" title="定时关闭">
    <NForm :model="appSettings" label-placement="left" label-width="110">
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
</template>