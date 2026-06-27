# 2026-06-24 文件 API 参数归一化

## 范围

本轮只处理 `src/api/file.ts` 封装层的参数归一化、空值过滤和必填参数短路，不触发真实上传、下载、删除、压缩、转码、缩略图生成或文件引用失效等远端副作用。

## 已处理

- 通用文件参数处理：
  - 新增 `emptyFileResponse`，缺必填参数时直接返回空响应，避免向后端发无效请求。
  - 新增 `normalizeFileText`、`normalizeFileNumber`、`normalizeFileParams`，统一 trim 字符串、过滤空字符串、过滤 `undefined/null/NaN`。
  - `pickString`、`pickId`、`getBusinessFileId` 返回值统一 trim，避免空白 ID 被当作有效文件 ID。

- 文件签名、预览、下载：
  - `getSignedFilePreviewUrl`、`getSignedFileDownloadUrl` 缺 `fileId` 时直接返回 `undefined`。
  - `triggerBusinessFileDownload` 缺 `fileId` 时抛出既有 `toast.downloadFailed`，不触发 DOM 下载。
  - `/file/sign` 缺 `fileId` 时短路。
  - `/file/download`、`/file/preview` 缺 `fileId/expiresAt/signature` 时短路。
  - 签名响应中的 `url/signature/expiresAt/resourceId/mode` 统一 trim。

- 上传上下文和上传：
  - `/file/upload/context` 传参前过滤空白参数。
  - `/file/upload` 传参前过滤空白参数；空文件对象不进入上传请求。

- 压缩、转码、缩略图：
  - `/file/compress`、`/file/compress/async` 缺 `fileId` 时短路，`maxWidth` 统一数值归一化。
  - `/file/convert`、`/file/convert/async` 缺 `fileId` 时短路。
  - `/file/thumbnail` 缺 `fileId` 时短路。

- 文件资源和存储：
  - `/file/resources` 列表参数统一过滤空白值，保留默认 `pageIndex=0/pageSize=20`。
  - `/file/resources/detail`、`/file/resources/references` 缺 `fileId` 时短路。
  - `/file/storage/room-overview` 缺 `roomId` 时短路。
  - `/file/delete` 缺 `fileId` 时短路。
  - `/file/reference/invalidate` 缺 `fileId` 或 `reason` 时短路。
  - `/file/reference/status` 缺 `fileId` 时短路。

## 验收状态

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器触发真实 mutation。
- 当前仅完成源码层参数契约防护与文档记录。

## 后续仍需

- 文件真实上传、下载、删除、引用失效仍需用户明确确认后再用真实浏览器逐项验收。
- 图片/视频业务预览完整链路仍依赖带真实业务 `fileId` 的消息数据继续核对。
