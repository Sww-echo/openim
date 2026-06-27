# 2026-06-20 业务接口代理配置复核

## 背景

当前 Web 端业务接口必须通过 `/business-api` proxy 访问，避免浏览器跨域；OpenIM SDK API/WS 继续使用独立地址。

## 当前配置

- `.env`
  - `VITE_CHAT_URL=/business-api`
  - `VITE_BUSINESS_API_TARGET=http://47.238.134.161:8092`
  - `VITE_API_URL=http://47.238.134.161:10002`
  - `VITE_WS_URL=ws://47.238.134.161:10001`
- `vite.proxy.ts`
  - `/business-api` 转发到 `VITE_BUSINESS_API_TARGET`，默认 `http://47.238.134.161:8092`。
  - rewrite 会移除 `/business-api` 前缀。
- `vite.config.ts`、`vite.web.config.ts`、`vite.legacy.config.ts`
  - 均通过 `createBusinessApiProxy(mode)` 注入业务代理。
- `src/api/business.ts`
  - `businessRequest` 使用 `import.meta.env.VITE_CHAT_URL`，即 `/business-api`。

## 结论

- businessApi 已按要求走本地 proxy，不再直连 `http://47.238.134.161:8092`，可规避浏览器跨域。
- OpenIM API 与 WS 地址仍分别指向 `http://47.238.134.161:10002`、`ws://47.238.134.161:10001`，符合当前后端配置。

## 验证状态

- 本轮仅做配置与源码只读核对。
- 未运行单元测试、构建或验证脚本。
- 未触发任何远端业务接口请求或 mutation。
