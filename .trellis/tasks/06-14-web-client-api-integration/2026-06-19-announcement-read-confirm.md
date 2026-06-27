# 2026-06-19 系统公告已读确认保护

## 背景

系统公告已接入 `/system/announcements`、`/system/announcements/detail`、`/system/announcements/read`、`/system/announcements/read-all`、`/system/announcements/unread-count`。复查时发现“全部标为已读”已有二次确认，但单条“标为已读”会直接调用 `/system/announcements/read`。

按当前验收约束，任何远端 mutation 都不能误触发；单条已读也属于远端状态变更，因此需要确认保护。

## 处理

- `src/layout/LeftNavBar/SystemAnnouncements.tsx`
  - 将单条标记已读拆为 `submitMarkRead` 和 `markRead`。
  - `markRead` 只打开确认框，不直接请求后端。
  - 用户确认后才调用 `/system/announcements/read`，并刷新列表与未读数。
- `src/i18n/resources/zh.json`
  - 新增 `placeholder.confirmMarkAnnouncementRead`：`确认将该系统公告标为已读吗？`
- `src/i18n/resources/en.json`
  - 新增 `placeholder.confirmMarkAnnouncementRead`：`Mark this system announcement as read?`

## 真实 Chrome 复测

- 先打开系统公告时出现“缺少访问令牌”，确认是当前页签登录态残留问题。
- 在同一页签重新登录账号 `18888888888` 后，系统公告列表正常返回真实公告数据。
- 点击第一条公告的 `Mark as Read`：
  - 弹出确认框。
  - 标题为 `Mark as Read`。
  - 内容为 `Mark this system announcement as read?`。
- 使用取消操作关闭确认框后，第一条公告仍保持可标记状态，未提交 `/system/announcements/read`。

## 说明

本轮没有运行单元测试、构建或验证脚本，未新增或修改测试文件。浏览器操作只触发登录、公告列表/未读数查询和确认框打开/取消；没有点击确认，没有提交单条已读或全部已读。
