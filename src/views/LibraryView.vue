<script setup lang="ts">
import { NCard, NTabs, NTabPane, NEmpty } from 'naive-ui'
</script>

<template>
  <NCard title="音乐库" size="large">
    <NTabs type="segment">
      <NTabPane name="playlists" tab="歌单">
        <NEmpty description="将从本地（LocalStorage）与 API 加载歌单。" />
      </NTabPane>
      <NTabPane name="favorites" tab="收藏">
        <NEmpty description="将展示你收藏的歌曲/歌单/专辑。" />
      </NTabPane>
      <NTabPane name="history" tab="历史">
        <NEmpty description="将展示播放历史（可同步）。" />
      </NTabPane>
    </NTabs>
  </NCard>
</template>


