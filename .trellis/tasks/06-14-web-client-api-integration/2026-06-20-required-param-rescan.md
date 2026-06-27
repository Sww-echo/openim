# 2026-06-20 必填参数契约复扫

本轮继续按最新 `docs/openim-swagger.json` 复核当前 `src/api/**` 已接业务接口的必填参数，重点排查“路径已接，但真实请求可能漏必填字段”的问题。

## 本轮确认

- `/friends/remark`
  - Swagger 必填：`toUserId`、`remarkName`、`describe`。
  - 当前 `updateFriendRemark` 始终传 `toUserId`、`remarkName`，并给 `describe` 默认空字符串。
- `/room/openim/notice/update`
  - Swagger 必填：`roomId`、`noticeId`、`noticeContent`。
  - 当前 API 层 `normalizeNoticeParams` 会把页面传入的 `content` 统一映射为 `noticeContent`。
- `/room/openim/group-helpers/keywords/update/delete`
  - Swagger 字段为 `keyWordId`，不是 `keywordId`。
  - 当前页面读取 `keyWordId/keywordId/id`，提交时统一传 Swagger 字段 `keyWordId`。
- `/room/openim/join-requests/handle`
  - Swagger 必填：`requestId`、`action`。
  - 当前封装把页面 `agree` 归一为 `approve/reject` 后传 `action`。
- `/room/openim/member/set-special-role`
  - Swagger 必填：`roomId`、`userId`、`role`。
  - 当前页面提交 `role=3/4/5`，分别对应普通/隐身/监控成员。
- `/room/openim/member/mute`
  - Swagger 必填：`roomId`、`targetUserId`、`durationSeconds`。
  - 当前成员列表禁言输入限定整数分钟，提交前转换为整数秒，避免把小数传给整型参数。
- `/file/download`、`/file/preview`
  - Swagger 必填：`fileId`、`expiresAt`、`signature`。
  - 当前下载/预览链路仍要求先通过 `/file/sign` 取签名，并校验签名字段齐全后才继续。

## 仍需真实数据验收

- 以上复扫只证明源码参数契约对齐，不证明后端业务状态一定允许操作。
- 群公告、入群审核、特殊成员、群成员备注/禁言/解禁、文件下载/预览等仍需真实群主/管理员账号、真实群/文件/消息数据复测。
- 写操作和下载仍必须由用户明确确认后再触发。

## 验证方式

- 未运行单元测试、构建或验证脚本。
- 本轮只做源码和 Swagger 静态复扫；前一轮 Playwright 只读快照已确认登录页可正常渲染，控制台 0 errors。
