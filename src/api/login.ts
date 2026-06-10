import type { IAuthLoginRes, ICaptcha, IDoubleTokenRes, IMiniDecryptRes, IMiniLoginRes, IUpdateInfo, IUpdatePassword, IUserInfoRes, IWxUserProfile } from './types/login'
import { http } from '@/http/http'

/**
 * 登录表单
 */
export interface ILoginForm {
  username: string
  password: string
}

/**
 * 获取验证码
 * @returns ICaptcha 验证码
 */
export function getCode() {
  return http.get<ICaptcha>('/user/getCode')
}

/**
 * 用户登录
 * @param loginForm 登录表单
 */
export function login(loginForm: ILoginForm) {
  return http.post<IAuthLoginRes>('/auth/login', loginForm)
}

/**
 * 刷新token
 * @param refreshToken 刷新token
 */
export function refreshToken(refreshToken: string) {
  return http.post<IDoubleTokenRes>('/auth/refreshToken', { refreshToken })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return http.get<IUserInfoRes>('/user/info')
}

/**
 * 退出登录
 */
export function logout() {
  return http.get<void>('/auth/logout')
}

/**
 * 修改用户信息
 */
export function updateInfo(data: IUpdateInfo) {
  return http.post('/user/updateInfo', data)
}

/**
 * 修改用户密码
 */
export function updateUserPassword(data: IUpdatePassword) {
  return http.post('/user/updatePassword', data)
}

/**
 * 获取微信登录凭证
 * @returns Promise 包含微信登录凭证(code)
 */
export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve(res),
      fail: err => reject(new Error(err)),
    })
  })
}

/**
 * 微信登录
 * @param params 微信登录参数，包含code
 * @returns Promise 包含登录结果
 */
export function wxLogin(data: { code: string }) {
  return http.post<IAuthLoginRes>('/auth/wxLogin', data)
}

/**
 * 微信小程序登录 - 通过code获取openid和session_key
 * @param code 小程序登录凭证
 */
export function miniLogin(code: string) {
  return http.post<IMiniLoginRes>('/api/v1/wechat/mini/login', { code })
}

/**
 * 微信小程序登录 - 解密用户信息并获取access_token
 * @param data 解密参数
 */
export function miniDecrypt(data: { openid: string, encryptedData: string, iv: string, session_key: string }) {
  return http.post<IMiniDecryptRes>('/api/v1/wechat/mini/decrypt', data)
}

/**
 * 微信小程序 - 获取用户信息（需Bearer鉴权）
 */
export function getWechatUserInfo() {
  return http.get<IUserInfoRes>('/api/v1/wechat/user/info')
}

/**
 * 微信小程序 - 获取用户信息（头像、昵称等）
 * @returns Promise 包含encryptedData、iv等加密数据
 */
export function getWxUserProfile() {
  return new Promise<IWxUserProfile>((resolve, reject) => {
    // #ifdef MP-WEIXIN
    uni.getUserProfile({
      desc: '用于完善会员资料',
      success: res => resolve(res),
      fail: err => reject(new Error(err.errMsg || '获取用户信息失败')),
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('仅支持微信小程序'))
    // #endif
  })
}
