<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { getSuggestions } from '@/api/suggestions'

// ===================== 类型定义 =====================
interface AIResponse {
  analysis: string
  suggestions: string[]
  tip: string
}

interface MessageItem {
  type: 'user' | 'ai'
  scene?: string
  role?: string
  style?: string
  data?: AIResponse
}

// ===================== 页面配置 =====================
definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '社恐回复神器',
  },
})

// ===================== 状态 =====================
const sceneInput = ref('')
const selectedRole = ref('')
const selectedStyle = ref('')
const isLoading = ref(false)
const messages = ref<MessageItem[]>([])
const showEmpty = ref(true)
const toastVisible = ref(false)
const toastText = ref('已复制到剪贴板')
const sceneError = ref(false)
const roleError = ref(false)
const styleError = ref(false)
const chatScrollTop = ref(0)
const showChatPanel = ref(false)
const customRoles = ref<string[]>([])
const customStyles = ref<string[]>([])
const showCustomInput = ref<'role' | 'style' | null>(null)
const customInputText = ref('')

// ===================== 快捷场景 =====================
const quickScenes = [
  { label: '女朋友问加班', text: '女朋友问我怎么又加班，是不是不想陪她' },
  { label: '领导临下班派活', text: '领导在下班前5分钟给我安排了一个紧急任务，让我明天一早交' },
  { label: '朋友借钱', text: '朋友找我借5000块钱说急用，但我自己也不宽裕' },
  { label: '父母催婚', text: '父母又打电话催我找对象结婚，说隔壁谁谁谁孩子都会走了' },
  { label: '同事推活', text: '同事把自己的活推给我做，说是帮我锻炼' },
  { label: '客户投诉', text: '客户对我们交付的产品不满意，要求退款并补偿' },
]

// ===================== 角色选项 =====================
const roles = [
  { label: '女朋友', icon: 'i-carbon-favorite' },
  { label: '朋友', icon: 'i-carbon-group' },
  { label: '公司领导', icon: 'i-carbon-portfolio' },
  { label: '父母', icon: 'i-carbon-home' },
  { label: '同事', icon: 'i-carbon-user' },
  { label: '亲戚', icon: 'i-carbon-tree-view-alt' },
]

// ===================== 风格选项 =====================
const styles = [
  { label: '拒绝', icon: 'i-carbon-close' },
  { label: '冷淡回应', icon: 'i-carbon-snowflake' },
  { label: '热情回应', icon: 'i-carbon-fire' },
  { label: '幽默回应', icon: 'i-carbon-face-satisfied' },
  { label: '真诚回应', icon: 'i-carbon-theater' },
]

const displayRoles = computed(() => [
  ...roles,
  ...customRoles.value.map(label => ({ label, icon: 'i-carbon-user-avatar' })),
])
const displayStyles = computed(() => [
  ...styles,
  ...customStyles.value.map(label => ({ label, icon: 'i-carbon-settings-adjust' })),
])

// ===================== 方法 =====================

/** 选择角色 */
function selectRole(role: string) {
  selectedRole.value = role
  roleError.value = false
}

/** 选择风格 */
function selectStyle(style: string) {
  selectedStyle.value = style
  styleError.value = false
}

function openCustomInput(type: 'role' | 'style') {
  customInputText.value = ''
  showCustomInput.value = type
}

function confirmCustomInput() {
  const text = customInputText.value.trim()
  if (!text)
    return

  if (showCustomInput.value === 'role') {
    if (!customRoles.value.includes(text) && !roles.some(r => r.label === text)) {
      customRoles.value.push(text)
    }
    selectedRole.value = text
    roleError.value = false
  }
  else if (showCustomInput.value === 'style') {
    if (!customStyles.value.includes(text) && !styles.some(s => s.label === text)) {
      customStyles.value.push(text)
    }
    selectedStyle.value = text
    styleError.value = false
  }
  showCustomInput.value = null
}

function cancelCustomInput() {
  showCustomInput.value = null
}

/** 填充快捷场景 */
function fillScene(text: string) {
  sceneInput.value = text
  sceneError.value = false
}

/** 提交 */
function handleSubmit() {
  if (isLoading.value)
    return

  // 验证
  let hasError = false
  if (!sceneInput.value.trim()) {
    sceneError.value = true
    hasError = true
  }
  if (!selectedRole.value) {
    roleError.value = true
    hasError = true
  }
  if (!selectedStyle.value) {
    styleError.value = true
    hasError = true
  }
  if (hasError)
    return

  // 隐藏空状态
  showEmpty.value = false

  // 清空旧消息
  messages.value = []

  // 添加用户消息
  messages.value.push({
    type: 'user',
    scene: sceneInput.value.trim(),
    role: selectedRole.value,
    style: selectedStyle.value,
  })

  // 滚动到底部
  scrollToBottom()

  // 显示加载状态
  isLoading.value = true
  showChatPanel.value = true

  getSuggestions({
    scene: sceneInput.value.trim(),
    role: selectedRole.value,
    style: selectedStyle.value,
  })
    .then((res) => {
      const data: AIResponse = res.output.result
      messages.value.push({
        type: 'ai',
        data,
      })
    })
    .catch(() => {
      messages.value.push({
        type: 'ai',
        data: {
          analysis: '服务暂时不可用',
          suggestions: ['请稍后重试', '请检查网络连接', '如持续失败请联系管理员'],
          tip: '抱歉，AI 服务暂时不可用，请稍后再试。',
        },
      })
    })
    .finally(() => {
      isLoading.value = false
      scrollToBottom()
    })
}

/** 清空对话 */
function clearChat() {
  messages.value = []
  showEmpty.value = true
  sceneInput.value = ''
  selectedRole.value = ''
  selectedStyle.value = ''
  sceneError.value = false
  roleError.value = false
  styleError.value = false
  showChatPanel.value = false
}

/** 返回输入面板 */
function backToInput() {
  showChatPanel.value = false
}

/** 复制文本 */
function copyText(text: string, index: number) {
  uni.setClipboardData({
    data: text,
    success: () => {
      showToast('已复制到剪贴板')
    },
  })
}

/** 显示 Toast */
function showToast(text: string) {
  toastText.value = text
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2000)
}

/** 滚动到底部 */
function scrollToBottom() {
  nextTick(() => {
    const query = uni.createSelectorQuery()
    query.select('.chat-messages').boundingClientRect()
    query.select('.chat-area').boundingClientRect()
    query.exec((res) => {
      if (res && res[0] && res[1]) {
        const messagesHeight = res[0].height
        const areaHeight = res[1].height
        if (messagesHeight > areaHeight) {
          chatScrollTop.value = messagesHeight - areaHeight + 100
        }
      }
    })
  })
}
</script>

<template>
  <view class="page-container">
    <!-- 背景光斑 -->
    <view class="orb orb-1" />
    <view class="orb orb-2" />
    <view class="orb orb-3" />

    <!-- 主内容 -->
    <view class="main-content">
      <!-- 头部 -->
      <view class="header">
        <view class="header-title">
          <view class="header-icon">
            <view class="i-carbon-magic-wand inline-block" />
          </view>
          <text class="title-gradient">
            社恐回复神器
          </text>
        </view>
        <text class="header-subtitle">
          描述你的社交场景，AI 帮你找到最合适的回应方式
        </text>
      </view>

      <!-- 主体 -->
      <view class="body-content">
        <!-- 输入面板 -->
        <view v-if="!showChatPanel" class="input-panel">
          <view class="glass-card input-card">
            <!-- 场景描述 -->
            <view class="section">
              <view class="section-label">
                <view class="i-carbon-tools inline-block" />
                <text>描述你的场景</text>
              </view>
              <textarea
                v-model="sceneInput"
                class="scene-input"
                placeholder="比如：女朋友看到我手机里和女同事的聊天记录，质问我为什么大半夜还在聊工作..."
                :maxlength="500"
                @input="sceneError = false"
              />
              <text v-if="sceneError" class="error-msg visible">
                请先描述你遇到的社交场景
              </text>
            </view>

            <!-- 快捷场景 -->
            <view class="quick-tags">
              <text
                v-for="scene in quickScenes"
                :key="scene.label"
                class="quick-tag"
                @click="fillScene(scene.text)"
              >
                {{ scene.label }}
              </text>
            </view>

            <!-- 交流对象 -->
            <view class="section">
              <view class="section-label">
                <view class="i-carbon-user inline-block" />
                <text>交流对象</text>
              </view>
              <view class="pill-group">
                <view
                  v-for="role in displayRoles"
                  :key="role.label"
                  class="pill"
                  :class="{ active: selectedRole === role.label }"
                  @click="selectRole(role.label)"
                >
                  <view :class="role.icon" class="inline-block" />
                  <text>{{ role.label }}</text>
                </view>
                <view class="pill pill-other" @click="openCustomInput('role')">
                  <view class="i-carbon-add inline-block" />
                  <text>其他</text>
                </view>
              </view>
              <text v-if="roleError" class="error-msg visible">
                请选择交流对象
              </text>
            </view>

            <!-- 回答风格 -->
            <view class="section">
              <view class="section-label">
                <view class="i-carbon-masks inline-block" />
                <text>回答风格</text>
              </view>
              <view class="pill-group">
                <view
                  v-for="style in displayStyles"
                  :key="style.label"
                  class="pill"
                  :class="{ active: selectedStyle === style.label }"
                  @click="selectStyle(style.label)"
                >
                  <view :class="style.icon" class="inline-block" />
                  <text>{{ style.label }}</text>
                </view>
                <view class="pill pill-other" @click="openCustomInput('style')">
                  <view class="i-carbon-add inline-block" />
                  <text>其他</text>
                </view>
              </view>
              <text v-if="styleError" class="error-msg visible">
                请选择回答风格
              </text>
            </view>

            <!-- 提交按钮 -->
            <button
              class="submit-btn"
              :disabled="isLoading"
              @click="handleSubmit"
            >
              <view class="i-carbon-send inline-block" />
              <text>{{ isLoading ? '正在分析...' : '获取回话建议' }}</text>
            </button>
          </view>
        </view>

        <!-- 聊天面板（覆盖层） -->
        <view v-if="showChatPanel" class="chat-panel">
          <view class="glass-card chat-card">
            <!-- 顶部栏 -->
            <view class="chat-header">
              <view class="back-btn" @click="backToInput">
                <view class="i-carbon-arrow-left inline-block" />
                <text>返回</text>
              </view>
              <view class="chat-header-center">
                <view class="chat-avatar">
                  <view class="i-carbon-bot inline-block" />
                </view>
                <view>
                  <text class="chat-title">回话顾问 AI</text>
                </view>
              </view>
              <view class="clear-btn" @click="clearChat">
                <view class="i-carbon-trash-can inline-block" />
                <text>清空</text>
              </view>
            </view>

            <!-- 聊天区域 -->
            <scroll-view
              class="chat-area"
              scroll-y
              :scroll-top="chatScrollTop"
              scroll-with-animation
            >
              <view class="chat-messages">
                <!-- 空状态 -->
                <view v-if="showEmpty" class="empty-state">
                  <view class="i-carbon-chat empty-icon inline-block" />
                  <text class="empty-title">描述你的社交场景</text>
                  <text class="empty-subtitle">选择对象和风格，获取专业回话建议</text>
                </view>

                <!-- 消息列表 -->
                <template v-for="(msg, index) in messages" :key="index">
                  <!-- 用户消息 -->
                  <view v-if="msg.type === 'user'" class="msg-user-wrapper">
                    <view class="user-bubble">
                      <view class="user-meta">
                        <text class="user-meta-tag">
                          <view class="i-carbon-user inline-block" />
                          {{ msg.role }}
                        </text>
                        <text class="user-meta-sep">|</text>
                        <text class="user-meta-tag">
                          <view class="i-carbon-masks inline-block" />
                          {{ msg.style }}
                        </text>
                      </view>
                      <text class="user-text">{{ msg.scene }}</text>
                    </view>
                  </view>

                  <!-- AI 回复 -->
                  <view v-else-if="msg.type === 'ai' && msg.data" class="msg-ai-wrapper">
                    <view class="ai-avatar">
                      <view class="i-carbon-bot inline-block" />
                    </view>
                    <view class="ai-card">
                      <!-- 场景分析 -->
                      <view class="ai-section">
                        <view class="ai-section-title">
                          <view class="i-carbon-idea inline-block" />
                          <text>场景分析</text>
                        </view>
                        <text class="ai-section-text">{{ msg.data.analysis }}</text>
                      </view>

                      <!-- 回话建议 -->
                      <view class="ai-section">
                        <view class="ai-section-title">
                          <view class="i-carbon-chat inline-block" />
                          <text>回话建议</text>
                          <text class="ai-section-hint">点击即可复制</text>
                        </view>
                        <view
                          v-for="(suggestion, sIndex) in msg.data.suggestions"
                          :key="sIndex"
                          class="suggest-item"
                          @click="copyText(suggestion, sIndex)"
                        >
                          <view class="suggest-num">
                            {{ sIndex + 1 }}
                          </view>
                          <text class="suggest-text">{{ suggestion }}</text>
                          <view class="copy-btn">
                            <view class="i-carbon-copy inline-block" />
                          </view>
                        </view>
                      </view>

                      <!-- 小贴士 -->
                      <view class="ai-tip">
                        <view class="ai-tip-title">
                          <view class="i-carbon-star inline-block" />
                          <text>小贴士</text>
                        </view>
                        <text class="ai-tip-text">{{ msg.data.tip }}</text>
                      </view>
                    </view>
                  </view>
                </template>

                <!-- 打字动画 -->
                <view v-if="isLoading" class="typing-wrapper">
                  <view class="ai-avatar">
                    <view class="i-carbon-bot inline-block" />
                  </view>
                  <view class="typing-dots">
                    <view class="typing-dot" />
                    <view class="typing-dot" />
                    <view class="typing-dot" />
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>
        </view>
      </view>
    </view>

    <!-- Toast -->
    <view class="toast" :class="{ show: toastVisible }">
      <view class="i-carbon-checkmark inline-block" />
      <text>{{ toastText }}</text>
    </view>

    <!-- 自定义输入弹窗 -->
    <view v-if="showCustomInput" class="modal-overlay" @click="cancelCustomInput">
      <view class="modal-card" @click.stop>
        <text class="modal-title">自定义{{ showCustomInput === 'role' ? '交流对象' : '回答风格' }}</text>
        <input
          v-model="customInputText"
          class="modal-input"
          :placeholder="showCustomInput === 'role' ? '如：邻居、老师、网友...' : '如：委婉拒绝、敷衍回应...'"
          :maxlength="20"
          @confirm="confirmCustomInput"
        >
        <view class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="cancelCustomInput">
            取消
          </button>
          <button class="modal-btn modal-btn-confirm" @click="confirmCustomInput">
            确定
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* ===================== 基础变量 ===================== */
.page-container {
  min-height: 100vh;
  background: #060b09;
  color: #e8f5f0;
  position: relative;
  overflow-x: hidden;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ===================== 背景光斑 ===================== */
.orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;
}

.orb-1 {
  width: 650rpx;
  height: 650rpx;
  background: radial-gradient(circle, #00e8a2, transparent);
  top: -220rpx;
  right: -120rpx;
  animation: orbFloat1 26s ease-in-out infinite;
}

.orb-2 {
  width: 420rpx;
  height: 420rpx;
  background: radial-gradient(circle, #00b4d8, transparent);
  bottom: -120rpx;
  left: -80rpx;
  animation: orbFloat2 22s ease-in-out infinite;
}

.orb-3 {
  width: 320rpx;
  height: 320rpx;
  background: radial-gradient(circle, #00e8a2, transparent);
  top: 45%;
  left: 38%;
  animation: orbFloat3 30s ease-in-out infinite;
}

@keyframes orbFloat1 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(-60rpx, 90rpx);
  }
  66% {
    transform: translate(40rpx, -50rpx);
  }
}

@keyframes orbFloat2 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(70rpx, -60rpx);
  }
  66% {
    transform: translate(-40rpx, 40rpx);
  }
}

@keyframes orbFloat3 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(-50rpx, -70rpx);
  }
  66% {
    transform: translate(60rpx, 50rpx);
  }
}

/* ===================== 主内容 ===================== */
.main-content {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ===================== 头部 ===================== */
.header {
  text-align: center;
  padding: 100rpx 32rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header-title {
  display: inline-flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.header-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  background: linear-gradient(135deg, #00e8a2, #00b4d8);
  color: #060b09;
}

.title-gradient {
  font-size: 48rpx;
  font-weight: 900;
  background: linear-gradient(135deg, #00e8a2, #00b4d8, #00e8a2);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 4s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

.header-subtitle {
  font-size: 24rpx;
  color: rgba(232, 245, 240, 0.45);
}

/* ===================== 主体布局 ===================== */
.body-content {
  flex: 1;
  padding: 0 32rpx 40rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* ===================== 毛玻璃卡片 ===================== */
.glass-card {
  background: rgba(10, 25, 18, 0.6);
  border: 1px solid rgba(0, 232, 162, 0.1);
  border-radius: 20rpx;
  position: relative;
  overflow: hidden;
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 232, 162, 0.25), transparent);
}

/* ===================== 输入面板 ===================== */
.input-card {
  padding: 32rpx;
}

.section {
  margin-bottom: 28rpx;
}

.section-label {
  font-size: 26rpx;
  font-weight: 600;
  color: rgba(232, 245, 240, 0.45);
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

/* ===================== 文本域 ===================== */
.scene-input {
  width: 100%;
  min-height: 200rpx;
  max-height: 400rpx;
  background: rgba(0, 232, 162, 0.04);
  border: 1px solid rgba(0, 232, 162, 0.1);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  color: #e8f5f0;
  font-size: 28rpx;
  line-height: 1.7;
  box-sizing: border-box;
  transition:
    border-color 0.25s,
    box-shadow 0.25s;
}

.scene-input::placeholder {
  color: rgba(232, 245, 240, 0.25);
}

/* ===================== 快捷标签 ===================== */
.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 28rpx;
}

.quick-tag {
  display: inline-block;
  padding: 8rpx 20rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
  color: rgba(232, 245, 240, 0.45);
  background: rgba(0, 232, 162, 0.05);
  border: 1px solid rgba(0, 232, 162, 0.08);
  transition: all 0.2s;
}

.quick-tag:active {
  background: rgba(0, 232, 162, 0.12);
  color: #e8f5f0;
}

/* ===================== 药丸选择器 ===================== */
.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  border-radius: 14rpx;
  font-size: 24rpx;
  font-weight: 500;
  background: rgba(0, 232, 162, 0.06);
  border: 1px solid rgba(0, 232, 162, 0.1);
  color: rgba(232, 245, 240, 0.45);
  transition: all 0.25s;
  user-select: none;
  white-space: nowrap;
}

.pill.active {
  background: rgba(0, 232, 162, 0.18);
  border-color: #00e8a2;
  color: #00e8a2;
  box-shadow: 0 0 20rpx rgba(0, 232, 162, 0.1);
}

/* ===================== 提交按钮 ===================== */
.submit-btn {
  width: 100%;
  padding: 20rpx;
  border: none;
  border-radius: 14rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #060b09;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: linear-gradient(135deg, #00e8a2, #00b4d8);
  box-shadow: 0 4rpx 24rpx rgba(0, 232, 162, 0.25);
  transition: all 0.3s;
}

.submit-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 8rpx 32rpx rgba(0, 232, 162, 0.35);
}

.submit-btn:disabled {
  opacity: 0.5;
}

/* ===================== 错误提示 ===================== */
.error-msg {
  color: #ff6b6b;
  font-size: 22rpx;
  margin-top: 8rpx;
  opacity: 0;
  transition: opacity 0.25s;
}

.error-msg.visible {
  opacity: 1;
}

/* ===================== 聊天面板 ===================== */
.chat-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  padding: 0 32rpx;
  padding-top: calc(env(safe-area-inset-top) + 100rpx);
  padding-bottom: env(safe-area-inset-bottom);
  background: #060b09;
  display: flex;
  flex-direction: column;
}

.chat-card {
  flex: 1;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid rgba(0, 232, 162, 0.1);
}

.chat-header-center {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  color: #00e8a2;
  background: rgba(0, 232, 162, 0.06);
  border: 1px solid rgba(0, 232, 162, 0.08);
}

.back-btn:active {
  background: rgba(0, 232, 162, 0.12);
}

.chat-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  background: linear-gradient(135deg, #00e8a2, #00b4d8);
  color: #060b09;
  flex-shrink: 0;
}

.chat-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #e8f5f0;
  display: block;
}

.chat-status {
  font-size: 22rpx;
  color: #00e8a2;
  display: block;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  color: rgba(232, 245, 240, 0.45);
  background: rgba(0, 232, 162, 0.06);
  border: 1px solid rgba(0, 232, 162, 0.08);
}

.clear-btn:active {
  background: rgba(0, 232, 162, 0.12);
}

/* ===================== 聊天区域 ===================== */
.chat-area {
  flex: 1;
  overflow-y: auto;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* ===================== 空状态 ===================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  font-size: 96rpx;
  color: rgba(0, 232, 162, 0.15);
  margin-bottom: 32rpx;
}

.empty-title {
  font-size: 28rpx;
  color: rgba(232, 245, 240, 0.45);
  margin-bottom: 12rpx;
  display: block;
}

.empty-subtitle {
  font-size: 24rpx;
  color: rgba(232, 245, 240, 0.25);
  display: block;
}

/* ===================== 用户消息气泡 ===================== */
.msg-user-wrapper {
  display: flex;
  justify-content: flex-end;
}

.user-bubble {
  max-width: 85%;
  padding: 20rpx 28rpx;
  background: rgba(0, 232, 162, 0.12);
  border: 1px solid rgba(0, 232, 162, 0.15);
  border-radius: 24rpx 24rpx 6rpx 24rpx;
  margin-left: auto;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
  font-size: 22rpx;
}

.user-meta-tag {
  color: #00e8a2;
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
}

.user-meta-sep {
  color: rgba(0, 232, 162, 0.3);
}

.user-text {
  font-size: 28rpx;
  line-height: 1.6;
  color: #e8f5f0;
  display: block;
  word-break: break-all;
}

/* ===================== AI 回复 ===================== */
.msg-ai-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.ai-card {
  flex: 1;
  padding: 28rpx;
  background: rgba(0, 232, 162, 0.04);
  border: 1px solid rgba(0, 232, 162, 0.08);
  border-radius: 20rpx;
}

.ai-section {
  margin-bottom: 24rpx;
}

.ai-section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #00e8a2;
}

.ai-section-text {
  font-size: 26rpx;
  line-height: 1.7;
  color: rgba(232, 245, 240, 0.6);
  display: block;
}

.ai-section-hint {
  font-size: 22rpx;
  color: rgba(232, 245, 240, 0.2);
  margin-left: auto;
  font-weight: normal;
}

/* ===================== 建议卡片 ===================== */
.suggest-item {
  padding: 20rpx 24rpx;
  border-radius: 14rpx;
  background: rgba(0, 232, 162, 0.04);
  border: 1px solid rgba(0, 232, 162, 0.06);
  margin-bottom: 16rpx;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  position: relative;
  transition: all 0.25s;
}

.suggest-item:active {
  background: rgba(0, 232, 162, 0.1);
  border-color: rgba(0, 232, 162, 0.2);
}

.suggest-num {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 700;
  background: rgba(0, 232, 162, 0.12);
  color: #00e8a2;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.suggest-text {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.6;
  color: #e8f5f0;
  word-break: break-all;
}

.copy-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 232, 162, 0.1);
  color: #00e8a2;
  font-size: 22rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

/* ===================== 小贴士 ===================== */
.ai-tip {
  padding: 20rpx 24rpx;
  border-radius: 14rpx;
  background: rgba(0, 180, 216, 0.06);
  border: 1px solid rgba(0, 180, 216, 0.1);
}

.ai-tip-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #00b4d8;
}

.ai-tip-text {
  font-size: 22rpx;
  line-height: 1.7;
  color: rgba(232, 245, 240, 0.6);
  display: block;
}

/* ===================== 打字动画 ===================== */
.typing-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 32rpx;
  border-radius: 20rpx;
  background: rgba(0, 232, 162, 0.06);
}

.typing-dot {
  display: inline-block;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #00e8a2;
  animation: typing 1.2s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-12rpx);
  }
}

/* ===================== Toast ===================== */
.toast {
  position: fixed;
  bottom: 80rpx;
  left: 50%;
  transform: translateX(-50%) translateY(160rpx);
  padding: 20rpx 40rpx;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 500;
  background: rgba(0, 232, 162, 0.15);
  border: 1px solid rgba(0, 232, 162, 0.25);
  color: #00e8a2;
  display: flex;
  align-items: center;
  gap: 12rpx;
  transition:
    transform 0.35s ease,
    opacity 0.35s;
  opacity: 0;
  z-index: 100;
  pointer-events: none;
  white-space: nowrap;
}

.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* ===================== 其他按钮 ===================== */
.pill-other {
  border-style: dashed;
  color: rgba(232, 245, 240, 0.3);
}

.pill-other:active {
  border-color: #00e8a2;
  color: #00e8a2;
  background: rgba(0, 232, 162, 0.1);
}

/* ===================== 自定义输入弹窗 ===================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  background: rgba(6, 11, 9, 0.75);
  backdrop-filter: blur(8rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
}

.modal-card {
  width: 100%;
  padding: 40rpx 32rpx;
  background: rgba(10, 25, 18, 0.95);
  border: 1px solid rgba(0, 232, 162, 0.15);
  border-radius: 24rpx;
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.5);
}

.modal-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #e8f5f0;
  display: block;
  margin-bottom: 28rpx;
  text-align: center;
}

.modal-input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  background: rgba(0, 232, 162, 0.05);
  border: 1px solid rgba(0, 232, 162, 0.12);
  border-radius: 14rpx;
  color: #e8f5f0;
  font-size: 28rpx;
  box-sizing: border-box;
  margin-bottom: 32rpx;
}

.modal-input::placeholder {
  color: rgba(232, 245, 240, 0.25);
}

.modal-actions {
  display: flex;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  padding: 14rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.modal-btn-cancel {
  background: rgba(232, 245, 240, 0.06);
  color: rgba(232, 245, 240, 0.45);
  border: 1px solid rgba(232, 245, 240, 0.08);
}

.modal-btn-confirm {
  background: linear-gradient(135deg, #00e8a2, #00b4d8);
  color: #060b09;
}

/* ===================== 响应式 ===================== */
@media (min-width: 1024px) {
  .chat-area {
    max-height: calc(100vh - 240rpx);
  }
}
</style>
