# 2026-06-21 聊天资源只读复测

## 背景

继续补 Web 用户端聊天资源入口的真实 Chrome 只读证据。该入口覆盖收藏消息、已保存合并消息和文件资源三个资源类列表接口。

本轮只切换资源 Tab 和观察列表，不点击详情、引用状态、引用关系、下载、删除、收藏上下文、合并上下文或容量概览等按钮；不触发任何下载或真实 mutation。

## 复测过程

- 使用 Playwright CLI 连接真实 Google Chrome 的 `default` 会话。
- 当前页面：`http://127.0.0.1:7777/index.html#/chat/si_10000003_10000021`。
- 当前会话：单聊 `www`。
- 打开聊天头部“聊天资源”弹窗。
- 依次切换：
  - `收藏消息`
  - `已保存合并消息`
  - `文件资源`

## 结果

- `收藏消息` Tab：
  - `POST /business-api/message/favorites?pageIndex=0&pageSize=50&deleted=0&access_token=...` 返回 200。
  - 页面显示空态：`未搜索到相关结果`。
- `已保存合并消息` Tab：
  - `POST /business-api/message/merge/saved?pageIndex=0&pageSize=50&deleted=0&access_token=...` 返回 200。
  - 页面显示空态：`未搜索到相关结果`。
- `文件资源` Tab：
  - `POST /business-api/file/resources?pageIndex=0&pageSize=50&deleted=0&access_token=...` 返回 200。
  - 页面显示两条文件资源：
    - `chuanxi.jpg`，`842.58 KB / jpg`
    - `chuanxi.jpg`，`841.29 KB / jpg`
- 控制台复查：
  - `console error` 数量为 0。
- 截图：
  - `output/playwright/chrome-chat-resources-readonly-verify-20260621.png`

## 结论

聊天资源弹窗的三个只读列表主链路可用，请求继续走 `/business-api` 代理，分页参数为 0 起始页码，页面能正确展示空态和真实文件资源列表。

本轮未运行单元测试、构建或验证脚本；未新增或修改测试文件；未触发上传、下载、删除、收藏、合并保存、转发、发送、审核、群设置保存或其他真实 mutation。
