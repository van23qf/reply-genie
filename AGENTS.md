# AGENTS.md

## 项目概况

基于 unibest 模板的跨平台 uniapp 项目（Vue3 + TS + Vite5 + UnoCSS + wot-ui + z-paging）。目标平台为微信小程序（`mp-weixin`），也支持 H5 和 APP。

## 常用命令

```bash
pnpm dev            # H5 开发（端口 9000）
pnpm dev:mp         # 微信小程序开发（产物 dist/dev/mp-weixin）
pnpm build:mp       # 微信小程序构建

pnpm lint           # ESLint 检查
pnpm lint:fix       # ESLint 自动修复
pnpm type-check     # vue-tsc 类型检查
pnpm test           # vitest（watch 模式）
pnpm test:run       # vitest 单次运行

pnpm openapi        # 从 OpenAPI schema 生成 src/service/ 代码
```

验证顺序：`lint` → `type-check` → `test`

## 环境变量

- 环境文件在 `env/` 目录（非根目录），由 `vite.config.ts` 的 `envDir` 指定
- 按 mode 叠加：`.env` → `.env.development` / `.env.production`
- 非 H5 端 `dev` 命令的 vite command 是 `build`（不是 serve），env 加载以 mode 为准
- 变量必须以 `VITE_` 前缀暴露

## 架构要点

### 页面与路由
- **约定式路由**：页面在 `src/pages/` 下，文件路径即路由，通过 `vite-plugin-uni-pages` 自动生成 `pages.json`
- 页面配置使用 `definePage()` 宏（必须在 `<script setup>` 最顶部）
- 分包可配 `subPackages: ['src/pages-demo']`（在 `pages.config.ts`）
- 子目录 `components/` 和 `sections/` 被排除在页面扫描外

### Tabbar
- 三种策略：`NO_TABBAR(0)` / `NATIVE_TABBAR(1)` / `CUSTOM_TABBAR(2)`，在 `src/tabbar/config.ts` 切换
- 修改 tabbar 配置后需重启 dev，否则 `pages.json` 不会更新
- UnoCSS 动态图标需加入 `uno.config.ts` 的 `safelist` 或在页面中引入一次

### HTTP 请求
- 三套方案可选：简单 `http`（`src/http/http.ts`）、`alova`（`src/http/alova.ts`）、`vue-query`（`src/http/vue-query.ts`）
- 请求拦截器在 `src/http/interceptor.ts`，统一注入 baseUrl 和 Bearer token
- 支持 `query` 参数（`options.query` 自动序列化）
- 双 token 无感刷新逻辑在 `src/http/http.ts`
- 认证模式由 `VITE_AUTH_MODE`（`single` / `double`）控制

### 状态管理
- Pinia + `pinia-plugin-persistedstate`，持久化存储用 `uni.getStorageSync`
- Store 在 `src/store/`，`index.ts` 统一导出
- 初始化时立即 `setActivePinia()`（解决 APP 端白屏）

### 根组件
- `App.ku.vue` 是全局根组件（`@uni-ku/root`），包裹 `<KuRootView />` 和自定义 tabbar
- 不是 `App.vue`（后者仅做 SSR 入口）

### OpenAPI 代码生成
- `pnpm openapi` 生成 `src/service/` 下的 API 代码，eslint 已忽略此目录
- 配置在 `openapi-ts-request.config.ts`

## 代码规范

### Vue SFC 顺序
- `<script setup lang="ts">` → `<template>` → `<style>`（由 eslint `vue/block-order` 规则强制）
- `definePage()` 放最上面

### 条件编译
- uni-app 条件编译用注释包裹：`// #ifdef MP-WEIXIN` ... `// #endif`
- **禁止 ESLint 自动排序 import**（`perfectionist/sort-imports` 已关闭），因为排序会破坏条件编译边界

### 组件自动注册
- `wot-ui` 组件通过 easycom 自动注册（`wd-xxx`）
- 自定义组件 `fg-xxx` 放 `src/components/fg-xxx/` 自动注册
- `src/hooks/` 下的函数自动导入（`unplugin-auto-import`）
- vue 和 uni-app API（`ref`、`onLoad` 等）自动导入，无需手写 import

### 路径别名
- `@/` → `src/`
- `@img/` → `src/static/`（注意不是 `src/static/images/`）

## 测试

- vitest + jsdom，全局 API 可用（`describe`/`it`/`expect` 不需 import）
- `src/test-setup.ts`：每个测试前重置 Pinia + mock `uni` 全局对象 + mock `getCurrentPages`
- 测试文件放 `src/**/*.{test,spec}.{ts,tsx}`
- `src/uni_modules/` 排除在测试外

## 已知坑

- `src/pages.json` 和 `src/manifest.json` 是自动生成的，不要手动编辑（改 `pages.config.ts` 和 `manifest.config.ts`）
- `src/types/auto-import.d.ts`、`src/types/uni-pages.d.ts` 也是自动生成，不要手动编辑
- pnpm 严格模式：`preinstall` 强制使用 pnpm，npm/yarn 会被拒绝
- `sass` 版本锁定 `1.77.8`，勿随意升级
- `unconfig` 被 override 到 `7.3.2`，是解决已知兼容问题
