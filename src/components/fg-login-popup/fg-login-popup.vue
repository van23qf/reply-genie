<script setup lang="ts">
import { ref } from 'vue'
import { useTokenStore } from '@/store'
import { getWxUserProfile } from '@/api/login'

const tokenStore = useTokenStore()
const isLogging = ref(false)

async function handleLogin() {
  if (isLogging.value)
    return
  isLogging.value = true
  try {
    // getWxUserProfile 必须在用户手势（tap）中直接调用，
    // 不能放在异步链里，因此在此处先获取用户信息
    const profileRes = await getWxUserProfile()
    await tokenStore.miniWxLogin({
      encryptedData: profileRes.encryptedData,
      iv: profileRes.iv,
    })
  }
  finally {
    isLogging.value = false
  }
}

function handleClose() {
  if (isLogging.value)
    return
  tokenStore.showLoginPopup = false
}
</script>

<template>
  <view v-if="tokenStore.showLoginPopup" class="login-overlay">
    <view class="login-card" @click.stop>
      <!-- 头部 -->
      <view class="login-header">
        <view class="login-icon">
          <view class="i-carbon-logo-wechat inline-block" />
        </view>
        <text class="login-title">
          登录体验更多功能
        </text>
        <text class="login-desc">
          授权登录后获取个性化回话建议
        </text>
      </view>

      <!-- 登录按钮 -->
      <button
        class="login-btn"
        :loading="isLogging"
        :disabled="isLogging"
        hover-class="login-btn-hover"
        @click="handleLogin"
      >
        <view v-if="!isLogging" class="i-carbon-logo-wechat inline-block" />
        <text>{{ isLogging ? '登录中...' : '微信一键登录' }}</text>
      </button>
    </view>
  </view>
</template>

<style scoped>
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: rgba(6, 11, 9, 0.75);
  backdrop-filter: blur(8rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx;
}

.login-card {
  width: 100%;
  max-width: 560rpx;
  padding: 56rpx 44rpx 44rpx;
  background: rgba(10, 25, 18, 0.95);
  border: 1px solid rgba(0, 232, 162, 0.15);
  border-radius: 32rpx;
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-header {
  text-align: center;
  margin-bottom: 44rpx;
}

.login-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 24rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  background: linear-gradient(135deg, #00e8a2, #00b4d8);
  color: #060b09;
  margin-bottom: 24rpx;
}

.login-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #e8f5f0;
  margin-bottom: 12rpx;
}

.login-desc {
  display: block;
  font-size: 24rpx;
  color: rgba(232, 245, 240, 0.45);
}

.login-btn {
  width: auto;
  padding: 16rpx 56rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #060b09;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  background: linear-gradient(135deg, #00e8a2, #00b4d8);
  box-shadow: 0 4rpx 24rpx rgba(0, 232, 162, 0.25);
  transition: all 0.2s;
}

.login-btn-hover {
  opacity: 0.8;
  transform: scale(0.98);
}

.login-btn[disabled] {
  opacity: 0.6;
}
</style>
