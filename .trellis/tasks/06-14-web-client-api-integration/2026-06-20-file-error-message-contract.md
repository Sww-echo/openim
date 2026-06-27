# 2026-06-20 文件签名/下载错误提示收敛

## 背景

- 文件下载和预览链路依赖 `/file/sign` 返回有效 `fileId/expiresAt/signature` 或直接 URL。
- `src/api/file.ts` 此前在签名响应无效、无可下载地址时抛出英文技术错误，调用方通过 `feedbackToast` 可能直接展示给用户。

## 调整

- `assertSignedFileParams` 签名字段缺失时抛出 `toast.downloadFailed`。
- `triggerBusinessFileDownload` 无可下载 URL 时抛出 `toast.downloadFailed`。

## 影响

- 不改变 `/file/sign`、`/file/download`、`/file/preview` 的调用时机和参数。
- 下载/预览失败时继续由现有调用方捕获并展示统一下载失败提示，避免暴露后端签名结构细节。

## 验证

- 本轮只做源码静态复核和登录页 HTTP 只读复核。
- 未运行单元测试、构建或验证脚本。
- 未触发上传、下载、预览或其他 mutation/下载动作。
