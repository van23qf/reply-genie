<script setup lang="ts">
import { ref } from 'vue'
import FgTabbar from '@/tabbar/index.vue'
import { isPageTabbar } from './tabbar/store'
import { currRoute } from './utils'
import { useTokenStore } from '@/store'

const tokenStore = useTokenStore()

const isCurrentPageTabbar = ref(true)
onShow(() => {
  const { path } = currRoute()
  // “蜡笔小开心”提到本地是 '/pages/index/index'，线上是 '/' 导致线上 tabbar 不见了
  // 所以这里需要判断一下，如果是 '/' 就当做首页，也要显示 tabbar
  if (path === '/') {
    isCurrentPageTabbar.value = true
  }
  else {
    isCurrentPageTabbar.value = isPageTabbar(path)
  }

  // 微信小程序检查登录状态
  // #ifdef MP-WEIXIN
  tokenStore.checkAuth()
  // #endif
})

const helloKuRoot = ref('Hello AppKuVue')

const exposeRef = ref('this is form app.Ku.vue')

defineExpose({
  exposeRef,
})
</script>

<template>
  <view>
    <!-- 这个先隐藏了，知道这样用就行 -->
    <view class="hidden text-center">
      {{ helloKuRoot }}，这里可以配置全局的东西
    </view>

    <KuRootView />

    <FgTabbar v-if="isCurrentPageTabbar" />

    <!-- 微信小程序登录弹窗 -->
    <!-- #ifdef MP-WEIXIN -->
    <fg-login-popup />
    <!-- #endif -->
  </view>
</template>
