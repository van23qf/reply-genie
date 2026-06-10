import { useTokenStore } from '@/store'
import { debounce } from '@/utils/debounce'

interface ToLoginPageOptions {
  /**
   * 跳转模式, uni.navigateTo | uni.reLaunch
   * @default 'navigateTo'
   */
  mode?: 'navigateTo' | 'reLaunch'
  /**
   * 查询参数
   * @example '?redirect=/pages/home/index'
   */
  queryString?: string
}

/**
 * 弹出登录窗口（防抖处理）
 *
 * 如果要立即弹窗，不做延时，可以使用 `toLoginPage.flush()` 方法
 */
export const toLoginPage = debounce(() => {
  const tokenStore = useTokenStore()
  tokenStore.showLoginPopup = true
}, 500)
