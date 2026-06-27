# 2026-06-25 旧群发言状态兼容接入

## 接口

- `/room/getSendMsgStatus`
- `/room/changeSendMsgStatus`

## Swagger 核对

- 两个接口均属于群组接口。
- 必填参数均为 `jid`。
- `/room/changeSendMsgStatus` 未提供目标状态参数，语义上按 toggle 处理。

## 实现

- `src/api/group.ts` 新增 `getLegacyGroupSendMsgStatus()` 和 `changeLegacyGroupSendMsgStatus()`。
- 群设置页复用已有“全体禁言”开关，不新增新 UI。
- 管理员或群主进入群设置时，通过 `/room/getSendMsgStatus` 读取旧系统发言状态。
- 旧接口状态能解析时优先展示旧状态；读取失败或无法解析时回退到现有 `limitSendSmg` 字段。
- 切换“全体禁言”时仍保留原有 `/room/update(limitSendSmg)` 保存链路。
- 仅当旧状态已知且目标状态发生变化时，调用 `/room/changeSendMsgStatus` 同步旧系统，避免未知状态下误触发 toggle。

## 验证

- 已静态确认新增路径、封装和调用点存在。
- 已静态确认未引入冲突标记。
- `src/api/**` 唯一业务路径数更新为 151。
- 未新增、未修改、未运行单元测试。
- 未运行构建或类型检查；当前本地 Node/npm 执行仍受环境权限限制。
- 未完成浏览器复测，待 `npm run dev:web` 服务可用后验证请求和状态回填。
