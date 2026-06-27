# 2026-06-20 单聊消息保存时长选项补齐

## 背景

继续按最新 `docs/openim-swagger.json` 复核已接入接口时，发现单聊设置中的 `/friends/update` 字段 `chatRecordTimeOut` 已经改为按 Swagger 使用 `*.0` 字符串，但下拉选项仍只有关闭、7 天、30 天、90 天。

Swagger 对该字段有两处明确说明：

- `/friends/update`：`好友聊天记录删除时间 1天=1.0`
- 相关用户/资料字段：`-1.0 永久保存，1.0 保存一天，365.0 保存一年`

## 本轮调整

- `src/pages/chat/queryChat/SingleSetting/index.tsx`
  - 保留现有 `-1.0`、`7.0`、`30.0`、`90.0` 选项。
  - 新增 `1.0`，对应 1 天。
  - 新增 `365.0`，对应 365 天/一年。
  - 继续兼容后端或历史数据返回的 `0`、`-1`、整数天数，展示前统一归一为 `*.0`。

## 验证状态

- 本轮只做源码级契约补齐。
- 未运行单元测试、构建或验证脚本。
- 未触发 `/friends/update` 或任何真实 mutation；下拉只有用户选择新值并确认后才会提交远端。
- 尝试连接真实 Chrome 做只读复测时，当前 Codex 桌面控制通道返回 `Computer Use native pipe path is unavailable`，因此本轮未完成浏览器复测。
