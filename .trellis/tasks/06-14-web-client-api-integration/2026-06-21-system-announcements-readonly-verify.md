# 2026-06-21 系统公告只读复测

## 背景

补充当前登录态下系统公告用户端接口的真实 Chrome 只读证据。该入口覆盖公告未读数、公告列表和公告详情。

本轮只打开公告弹窗并点击公告标题读取详情，不点击“标为已读”或“全部标为已读”，不触发公告已读 mutation。

## 复测过程

- 使用 Playwright CLI 连接真实 Google Chrome 的 `default` 会话。
- 当前页面：`http://127.0.0.1:7777/index.html#/chat/si_10000003_10000021`。
- 点击左侧栏“系统公告”入口。
- 点击第一条公告标题 `script-announcement-high-risk-1781591010` 查看详情。

## 结果

- 页面公告角标显示未读数 `7`。
- 公告列表正常展示真实公告数据，第一条为：
  - 标题：`script-announcement-high-risk-1781591010`
  - 内容摘要：`high risk content`
  - 时间字段：`1781591144`
- 公告详情区域正常展示：
  - 标题：`script-announcement-high-risk-1781591010`
  - 内容：`high risk content`
- 网络请求确认：
  - `POST /business-api/system/announcements?pageIndex=0&pageSize=30&access_token=...` 返回 200。
  - `POST /business-api/system/announcements/unread-count?access_token=...` 返回 200。
  - `POST /business-api/system/announcements/detail?announcementId=8a0b0fa2156347c6991bfc044666f2ab&access_token=...` 返回 200。
- 控制台复查：
  - `console error` 数量为 0。
- 未出现以下请求：
  - `/business-api/system/announcements/read`
  - `/business-api/system/announcements/read-all`
- 截图：
  - `output/playwright/chrome-system-announcements-readonly-verify-20260621.png`

## 结论

系统公告只读链路可用：未读数、列表和详情均通过 `/business-api` 代理携带业务 `access_token` 请求并返回 200；公告标已读入口仍停留在按钮/确认框之后，本轮未触发任何公告已读 mutation。

本轮未运行单元测试、构建或验证脚本；未新增或修改测试文件；未触发公告已读、上传、下载、删除、发送、审核、群设置保存或其他真实 mutation。
