# 2026-06-24 HTTP 错误文案归一化

## 范围

本轮处理请求错误提示的源码契约，目标是让登录、验证码、注册、资料保存等使用 `errorHandle` 或 `feedbackToast` 的入口优先展示后端业务错误文案。不触发真实登录、验证码、注册、密码、资料保存或其它远端请求。

## 已处理

- `src/utils/common.ts`
  - 新增 `getFeedbackErrorMessage`，统一提取错误文案。
  - 支持直接错误对象中的 `resultMsg/errMsg/msg/errDlt/message`。
  - 支持 AxiosError 的 `response.data`，以及常见嵌套 `data/result/obj/error`。
  - 先读取后端业务体文案，再回退 `Error.message`，避免 HTTP 4xx/5xx 场景只展示 `Request failed with status code ...`。
  - `feedbackToast` 复用该提取逻辑。

- `src/api/errorHandle.ts`
  - `errorHandle` 支持从 AxiosError `response.data` 中读取 `errCode`，继续优先使用 `ErrCodeMap`。
  - 未命中 `ErrCodeMap` 时复用 `getFeedbackErrorMessage`，展示后端返回的 `resultMsg/errMsg/message`。

## 对 Trellis 目标的影响

- IP 限制和宵禁提示仍不直接接入 `/console/**/security/**` 后台接口。
- 如果 `/account/login` 在限制场景下用 HTTP 200 业务失败、HTTP 4xx 或 HTTP 5xx 返回业务文案，前端现在都会优先展示后端文案。
- 真实提示内容仍需要后端提供实际限制账号或限制响应后再用真实浏览器验收。

## 验收状态

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器触发真实登录或其它接口请求。
- 当前只完成源码层错误文案提取归一化与文档记录。
