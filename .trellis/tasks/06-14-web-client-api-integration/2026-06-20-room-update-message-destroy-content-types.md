# 2026-06-20 群消息销毁类型字段接入

## 背景

- 最新 Swagger `/room/update` 提供 `messageDestroyContentTypes`，描述为“消息销毁 contentType 列表，逗号分隔；空不更新”。
- 该字段属于已接入的“消息销毁设置”范围，此前只补了 `RoomSettingsParams` 类型，没有页面入口。

## 实现

- 群设置抽屉在“定期删除消息记录”设置下新增“消息销毁类型”多选。
- 支持 OpenIM 当前常用消息类型：文本、图片、语音、视频、文件、@消息、合并消息、名片、位置、自定义。
- 后端未返回该字段时，前端按“全类型”展示；保存时显式提交逗号分隔的 `contentType` 数字列表。
- 空选择会在前端提示并阻断提交，避免向 `/room/update` 发送无意义空值。
- 保存仍复用现有 `/room/update`、二次确认和本地 `currentGroupInfo` 更新链路。

## 验证

- `GroupSettings.tsx` 经本地 Vite 模块请求返回 200。
- 中英文 i18n JSON 经 Vite import 返回 200。
- 本轮未运行单元测试、构建或验证脚本。
- 受控 Chrome 使用测试账号登录成功，`/business-api/account/login` 返回 200，关键业务代理和 OpenIM 接口返回 200，页面正常停留在 `#/chat`。
- 未进入群设置保存，未触发 `/room/update`，未触发真实 mutation、上传、下载或发送。
