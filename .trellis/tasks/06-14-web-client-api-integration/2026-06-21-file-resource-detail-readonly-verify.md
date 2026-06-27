# 2026-06-21 文件资源详情只读复测

## 背景

继续补充聊天资源里文件资源详情类接口的真实 Chrome 只读证据。当前单聊资源列表已有真实文件 `chuanxi.jpg`，可以覆盖详情、引用状态和引用关系三个只读接口。

本轮只点击 `详情`、`引用状态`、`引用关系`，不点击 `下载` 或 `删除`，不触发文件下载、删除或引用失效等 mutation。

## 复测过程

- 使用 Playwright CLI 连接真实 Google Chrome 的 `default` 会话。
- 当前页面：`http://127.0.0.1:7777/index.html#/chat/si_10000003_10000021`。
- 打开“聊天资源”弹窗并停留在 `文件资源` Tab。
- 选择第一条 `chuanxi.jpg`：
  - 列表展示：`842.58 KB / jpg`
  - 业务 `fileId`：`d78c623fa5704797a08a27422385d17f`
- 依次点击：
  - `详情`
  - `引用状态`
  - `引用关系`

## 结果

- 文件详情：
  - `POST /business-api/file/resources/detail?fileId=d78c623fa5704797a08a27422385d17f&access_token=...` 返回 200。
  - 响应包含 `downloadUrl`、`previewUrl`、`previewSupported=true`、`compressed=true`、`hasThumbnail=true`、`thumbnailUrl`、`referenceCount=0`、`canDelete=true` 等字段。
- 引用状态：
  - `POST /business-api/file/reference/status?fileId=d78c623fa5704797a08a27422385d17f&access_token=...` 返回 200。
  - 响应包含 `referenceInvalid=false`、`canDelete=false`。
- 引用关系：
  - `POST /business-api/file/resources/references?fileId=d78c623fa5704797a08a27422385d17f&access_token=...` 返回 200。
  - 响应包含 `referenced=false`、`referenceCount=0`、`references=[]`，并展示空态说明 `暂无引用`。
- 控制台复查：
  - `console error` 数量为 0。
- 网络请求复查：
  - 未触发 `/business-api/file/download`。
  - 未触发 `/business-api/file/delete`。
  - 未触发 `/business-api/file/reference/invalidate`。
- 截图：
  - `output/playwright/chrome-file-resource-detail-readonly-verify-20260621.png`

## 结论

文件资源详情、引用状态和引用关系三个只读链路可用，请求继续走 `/business-api` 代理并携带业务 `access_token`。下载、删除和引用失效入口仍在独立按钮/确认流程之后，本轮未触发任何文件类 mutation 或下载动作。

本轮未运行单元测试、构建或验证脚本；未新增或修改测试文件。
