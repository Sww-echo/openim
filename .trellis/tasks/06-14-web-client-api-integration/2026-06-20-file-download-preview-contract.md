# 2026-06-20 文件下载/预览契约复核

## 复核范围

按最新 `docs/openim-swagger.json` 复核文件下载、预览、资源列表和消息附件渲染链路：

- `/file/sign`：必填 `fileId`。
- `/file/download`：必填 `fileId/expiresAt/signature`。
- `/file/preview`：必填 `fileId/expiresAt/signature`。
- `/file/resources`：分页列表，封装默认 `pageIndex: 0`、`pageSize: 20`。
- `/file/resources/detail`、`/file/resources/references`、`/file/reference/status`：均以 `fileId` 查询。

## 当前结论

- `getSignedFilePreviewUrl` 和 `getSignedFileDownloadUrl` 都先调用 `/file/sign`。
- 签名响应若直接返回 URL，则直接使用 URL。
- 签名响应不含 URL 时，必须通过 `assertSignedFileParams` 确认 `fileId/expiresAt/signature` 全部存在，才会继续调用 `/file/preview` 或 `/file/download`。
- 图片/视频消息只有从消息 `ex` 中解析到业务 `fileId` 时才走业务签名预览；否则回退 OpenIM SDK URL。
- 文件气泡下载和消息右键下载均已先弹二次确认，再优先走业务签名下载，缺业务 `fileId` 时才回退 SDK URL。

## 本轮调整

- `src/api/file.ts`
  - `triggerBusinessFileDownload` 对 blob URL 的 `revokeObjectURL` 改为点击下载链接后的异步释放，避免部分浏览器在下载尚未开始消费 URL 时立即释放导致下载不稳定。

## 验证状态

- 本轮仅做源码契约复核和下载 URL 释放时机调整。
- 未运行单元测试、构建或验证脚本。
- 未触发文件上传、下载、预览、删除或其他真实 mutation/下载动作。
