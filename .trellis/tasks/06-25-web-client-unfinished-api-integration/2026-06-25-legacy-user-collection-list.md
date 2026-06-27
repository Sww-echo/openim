# 2026-06-25 旧用户收藏列表兼容接入

## 接口

- `/user/collection/list`

## Swagger 核对

- 接口属于用户操作。
- 必填参数：`userId`。
- 可选参数：
  - `pageSize`
  - `pageIndex`
  - `type`

## 实现

- `src/api/chat.ts` 新增 `getLegacyUserCollections()`。
- 函数默认从当前登录用户读取 `userId`，并支持外部覆盖分页参数。
- 聊天资源面板“收藏消息”tab 读取时并联：
  - `/message/favorites`
  - `/user/collection/list`
- 两个来源按 `favoriteId/id` 合并，避免重复展示。
- 旧收藏列表只作为兼容读取来源，不替代新版收藏详情、编辑、删除等接口。
- 旧接口读取失败时不阻断新版收藏列表展示。

## 验证

- 已静态确认新增路径、封装和资源面板调用点存在。
- 已静态确认未引入冲突标记。
- `src/api/**` 唯一业务路径数更新为 156。
- 未新增、未修改、未运行单元测试。
- 未运行构建或类型检查。
- 未完成真实浏览器收藏资源面板复测，待登录后打开聊天资源面板确认。
