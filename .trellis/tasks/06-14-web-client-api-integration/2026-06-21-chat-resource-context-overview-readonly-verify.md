# 2026-06-21 聊天资源上下文与容量概览只读复测

## 范围

- 仅复测聊天资源弹窗中的只读入口：
  - 收藏上下文。
  - 合并上下文。
  - 文件容量概览。
- 未点击下载、删除、编辑、保存、收藏、发送或其他写操作入口。

## 浏览器复测

- 使用真实浏览器进入 `http://127.0.0.1:7777/index.html#/chat/si_10000003_10000021`。
- 当前单聊会话标题为 `www`，消息区可见历史消息 `橙子皮 / 你是谁`。
- 打开聊天头部“聊天资源”弹窗。

### 收藏上下文

- 默认停留在“收藏消息”Tab。
- 列表请求：
  - `POST /business-api/message/favorites?pageIndex=0&pageSize=50&deleted=0&access_token=...`
  - HTTP 200，页面显示空态。
- 点击“收藏上下文”：
  - `POST /business-api/message/favorites/context?access_token=...`
  - HTTP 200。
  - 弹窗显示 `favoriteSupported=true`、`mergeSupported=true`、`maxMergeCount=20`、`actionApis`、`fieldMetas`、`emptyState` 等元数据。

### 合并上下文

- 切换到“已保存合并消息”Tab。
- 列表请求：
  - `POST /business-api/message/merge/saved?pageIndex=0&pageSize=50&deleted=0&access_token=...`
  - HTTP 200，页面显示空态。
- 点击“合并上下文”：
  - `POST /business-api/message/merge/context?access_token=...`
  - HTTP 200。
  - 弹窗显示 `mergeForwardSupported=true`、`mergeSaveSupported=true`、`sdkSendRequired=true`、`maxMergeCount=50`、`actionApis`、`fieldMetas`、`contentTypeMetas` 等元数据。

### 文件容量概览

- 切换到“文件资源”Tab。
- 列表请求：
  - `POST /business-api/file/resources?pageIndex=0&pageSize=50&deleted=0&access_token=...`
  - HTTP 200。
  - 页面展示两条真实文件 `chuanxi.jpg`，大小分别为 `842.58 KB` 和 `841.29 KB`。
- 点击“容量概览”：
  - `POST /business-api/file/storage/overview?access_token=...`
  - HTTP 200。
  - 弹窗显示 `ownerUserId=10000003`、`totalSizeBytes=1724281`、`fileCount=2`、`quota`、`recentUploads`、`actionApis` 等容量和文件元数据。

## 验证边界

- 网络请求中未出现 `/file/download`、`/file/delete`、`/file/reference/invalidate`、`/message/favorites/delete`、`/message/merge/delete`、`/message/favorites/update`、`/message/merge/save` 等写操作或下载请求。
- Playwright console error 复查为 0，warning 复查为 0。
- 本轮未运行单元测试、构建或验证脚本。

## 结论

- 聊天资源弹窗的上下文和容量概览只读入口已通过真实浏览器验证。
- 这些接口继续通过 `/business-api` proxy 携带 `access_token` 访问，符合当前业务接口接入约定。

