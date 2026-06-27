# 2026-06-22 聊天资源只读详情失败兜底与复测

## 范围

- 本轮只处理聊天资源弹窗中的只读查看入口：
  - 收藏/合并上下文。
  - 文件容量概览。
  - 文件详情。
  - 文件引用状态。
  - 文件引用关系。
- 不调整下载、删除、收藏编辑保存、合并保存、上传、发送、审核或群设置保存等写操作链路。

## 代码调整

- `src/pages/chat/queryChat/ChatHeader/ChatBusinessResources.tsx`
  - 新增 `showReadonlyDetailFallback(title, error)`。
  - 只读详情类请求失败时改为 `console.debug("[business-resource] readonly detail request failed", error)` 并展示空 JSON 详情弹窗。
  - 保留下载、删除、收藏编辑保存等主动操作的 `feedbackToast({ error })` 和确认链路。

## 真实浏览器复测

- 页面：`http://127.0.0.1:7777/index.html#/chat/si_10000003_10000021`
- 账号：当前登录用户 `10000003`。
- 操作：
  - 打开聊天头部“聊天资源”弹窗。
  - 点击“收藏上下文”。
  - 切换到“文件资源”。
  - 点击“容量概览”。
  - 对第一条 `chuanxi.jpg` 依次点击“详情”“引用状态”“引用关系”。

## 请求结果

- `POST /business-api/message/favorites/context?access_token=...` 返回 HTTP 200。
  - 响应包含 `favoriteSupported=true`、`mergeSupported=true`、`maxMergeCount=20`、`actionApis`。
- `POST /business-api/file/resources?pageIndex=0&pageSize=50&deleted=0&access_token=...` 返回 HTTP 200。
  - 页面展示两条 `chuanxi.jpg`。
- `POST /business-api/file/storage/overview?access_token=...` 返回 HTTP 200。
  - 响应包含 `ownerUserId=10000003`、`fileCount=2`、`quota`、`recentUploads`。
- `POST /business-api/file/resources/detail?fileId=d78c623fa5704797a08a27422385d17f&access_token=...` 返回 HTTP 200。
  - 响应包含下载/预览签名、压缩、缩略图、引用字段。
- `POST /business-api/file/reference/status?fileId=d78c623fa5704797a08a27422385d17f&access_token=...` 返回 HTTP 200。
  - 响应包含 `referenceInvalid=false`、`canDelete=false`。
- `POST /business-api/file/resources/references?fileId=d78c623fa5704797a08a27422385d17f&access_token=...` 返回 HTTP 200。
  - 响应包含 `referenced=false`、`referenceCount=0`、`references=[]`。

## 未触发项

- 未触发 `/file/download`。
- 未触发 `/file/delete`。
- 未触发 `/file/reference/invalidate`。
- 未触发上传、发送、收藏保存、合并保存、审核、群设置保存或其他真实 mutation。

## 结论

- 聊天资源只读详情类入口已具备失败兜底：后端只读接口临时失败时不再污染用户级错误 toast，页面仍保留入口并展示空详情。
- 本轮真实浏览器只读复测接口均返回 200，业务请求继续走 `/business-api` 代理。
- 控制台仍有 1 条既有 OpenIM SDK/对象类 error 记录；本轮网络请求未显示业务只读接口失败，也未触发写操作。
