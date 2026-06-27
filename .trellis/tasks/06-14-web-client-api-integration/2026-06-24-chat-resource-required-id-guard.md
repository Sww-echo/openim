# 2026-06-24 聊天资源操作必填 ID 防护

## 背景

聊天资源弹窗中多个接口对资源 ID 有明确必填要求：

- `/message/favorites/detail`、`/message/favorites/update`、`/message/favorites/delete` 必须有 `favoriteId`
- `/message/merge/detail`、`/message/merge/delete` 必须有 `mergeId`
- `/file/resources/detail`、`/file/delete` 必须有 `fileId`
- `/room/openim/share/delete` 必须有 `shareId`

此前接口调用函数内部已经有 ID 守卫，缺 ID 时会直接返回；但列表操作按钮仍可能显示为可点击状态，用户点击后没有实际效果。

## 修改

- `src/pages/chat/queryChat/ChatHeader/ChatBusinessResources.tsx`
  - 收藏消息缺少 `favoriteId` 时禁用详情和编辑，不展示删除。
  - 已保存合并消息缺少 `mergeId` 时禁用详情，不展示删除。
  - 文件资源缺少 `fileId` 时禁用详情，不展示删除；引用状态、引用关系和下载仍继续以 `fileId` 存在为显示条件。
  - 群共享文件继续允许查看原始记录详情；缺少 `shareId` 时不展示删除。

## 结论

该调整让聊天资源类操作入口与接口必填参数保持一致，避免在后端返回字段不完整时暴露不可执行的详情、编辑或删除操作。真实下载、删除、收藏更新等仍属于副作用或 mutation，本轮未触发。

本轮未运行单元测试、构建、覆盖检查或验证脚本，未触发上传、下载、删除、收藏更新、合并消息删除、群共享文件删除或其他真实 mutation。

