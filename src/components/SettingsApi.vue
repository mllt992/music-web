<script setup lang="ts">
import { NButton, NCard, NForm, NFormItem, NInput, NSpace } from 'naive-ui'
import { computed } from 'vue'
import { useAppStore } from '../stores/app'

const app = useAppStore()

const canSave = computed(() => true)
</script>

<template>
  <NCard size="small" title="音乐 API（配置）">
    <NForm :model="app.data.settings" label-placement="left" label-width="110">
      <NFormItem label="Base URL">
        <NInput v-model:value="app.data.settings.api.baseUrl" placeholder="例如：http://127.0.0.1:3000" />
      </NFormItem>
      <NSpace>
        <NButton type="primary" :disabled="!canSave" @click="$emit('save')">保存</NButton>
        <NButton @click="$emit('copy-export')">导出（复制 JSON）</NButton>
        <NButton @click="$emit('open-import')">导入（粘贴 JSON）</NButton>
      </NSpace>
    </NForm>
  </NCard>
</template>