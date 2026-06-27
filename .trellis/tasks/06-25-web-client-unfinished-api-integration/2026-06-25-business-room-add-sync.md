# 2026-06-25 `/room/add` 后置同步接入

## 背景

旧任务中 `/room/add` 因 Swagger 契约偏旧系统结构而暂缓。接口顶层必填项为：

- `room`
- `text`
- `keys`

其余大量 `room.*`、`member.*`、`notice.*` 字段均为旧系统展开字段，直接替换当前 OpenIM SDK 建群风险较高。

## 实现

- `src/api/group.ts`
  - 新增 `createBusinessGroup()`。
  - 将 `room` 对象序列化为 JSON 字符串。
  - 将成员 `text` 数组序列化为 JSON 字符串。
  - `keys` 默认使用 `openim-web`，页面建群同步显式传 `openim-web-create-group`。

- `src/pages/common/ChooseModal/index.tsx`
  - 多人建群仍先调用 OpenIM SDK `createGroup`，保持现有主链路。
  - SDK 建群成功后，用返回的 `groupID/groupName/faceURL` 和成员列表尝试调用 `/room/add` 做业务侧后置同步。
  - `/room/add` 同步失败时只写 `console.debug`，不回滚 OpenIM 群，不阻断用户建群成功体验。

## 验证

- 本轮只做静态核对，未运行单元测试、构建、覆盖检查或验证脚本。
- 尚未打开浏览器真实创建群；后续可用测试数据触发建群，观察 `/business-api/room/add` 响应，确认后端是否接受当前 JSON 字符串契约。

