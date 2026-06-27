# 2026-06-24 好友/用户 API 参数归一化

## 范围

本轮只处理 `src/api/friend.ts` 封装层的参数归一化和空值短路，不触发真实好友申请、删除好友、拉黑、移出黑名单、修改资料或备注保存等 mutation。

## 已处理

- 新增封装层文本归一化：
  - 用户 ID、账号、手机号、昵称、头像 URL、搜索关键词统一 trim。
  - 用户 ID 比较逻辑统一使用 trim 后的值。

- 用户资料与头像接口：
  - `/user/avatar/get` 缺 `userId` 时直接返回空头像，不发无效请求。
  - `/user/get` 批量查询前过滤空白 `userId`，全空时返回空列表。
  - 用户资料规范化时同步 trim `userID/account/nickname/faceURL/phoneNumber`。

- 好友资料与搜索接口：
  - `/friends/get` 查询前 trim `toUserId`，缺目标 ID 时短路。
  - `/friends/list` 缺当前用户 ID 时返回空列表；搜索关键词为空时不透传 `keyword`。
  - `/user/getByAccount`、`/user/public/search/list`、`/friends/page` 使用 trim 后关键词；关键词为空时返回空结果。

- 好友关系变更接口：
  - `/friends/remark`
  - `/friends/update/OfflineNoPushMsg`
  - `/friends/update`
  - `/friends/add`
  - `/friends/delete`
  - `/friends/blacklist/add`
  - `/friends/blacklist/delete`

  上述接口在封装层统一 trim `toUserId`；缺目标 ID 时短路，不发无效请求。

- 新朋友列表：
  - `/friends/newFriendListWeb` 缺当前用户 ID 时返回空列表，不发无效请求。

## 验收状态

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器触发真实 mutation。
- 当前仅完成源码层参数契约防护与文档记录。

## 后续仍需

- 浏览器复测仍按用户要求只在需要时执行。
- 好友申请、删除、拉黑、备注保存等 mutation 仍需用户明确确认后逐项验证。
