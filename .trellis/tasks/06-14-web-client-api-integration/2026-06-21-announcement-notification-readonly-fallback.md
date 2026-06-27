# 2026-06-21 系统公告与通知设置只读兜底

## 变更

- `src/layout/LeftNavBar/SystemAnnouncements.tsx`
  - 系统公告列表读取失败时改为清空列表、未读数置 0，并用 `console.debug` 记录。
  - 系统公告详情读取失败时保留当前列表项作为详情兜底，并用 `console.debug` 记录。
  - 标为已读、全部标为已读仍保留确认和错误提示，不做静默兜底。
- `src/layout/LeftNavBar/PersonalSettings.tsx`
  - 通知设置读取失败时改为隐藏通知设置分组，并用 `console.debug` 记录。
  - 通知开关更新仍保留二次确认和错误提示。

## 浏览器复测

- 使用真实浏览器连接当前本地服务 `http://127.0.0.1:7777`，账号为当前已登录的 `18888888888 / czp0422+`。
- 系统公告：
  - `/business-api/system/announcements?pageIndex=0&pageSize=30&access_token=...` 返回 200。
  - `/business-api/system/announcements/unread-count?access_token=...` 返回 200。
  - `/business-api/system/announcements/detail?announcementId=8a0b0fa2156347c6991bfc044666f2ab&access_token=...` 返回 200。
  - 页面展示真实公告 `script-announcement-high-risk-1781591010 / high risk content`。
  - 未触发 `/system/announcements/read` 或 `/system/announcements/read-all`。
- 通知设置：
  - 打开账号设置后触发 `/business-api/user/notification/settings?access_token=...`，返回 200。
  - 页面展示 `room_notice`、`at_me`、`robot_reply` 三个 Web 端通知开关。
  - 未点击任何通知开关，未触发 `/user/notification/settings/update`。

## 结论

- 系统公告和用户通知设置的只读链路已经走 `/business-api` proxy，并能在真实浏览器返回 200。
- 只读接口失败时不再弹用户级错误 toast，避免后端数据或契约临时不可用时污染页面体验。
- 写操作仍保留确认链路，未在本轮复测中触发任何真实 mutation。
- 本轮未运行单元测试、构建或验证脚本；仅使用真实浏览器复测。

