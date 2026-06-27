# 2026-06-20 群权限字段补齐

## 背景

- PRD 中“群权限设置”是 Web 用户端群管理核心能力。
- 当前页面已接入 `/room/update` 的部分权限字段，但最新 Swagger 还提供了更多和 Web 群能力直接相关的权限字段。

## 调整

- `RoomSettingsParams` 补齐以下 `/room/update` 字段：
  - `allowEditNickname`
  - `allowShareQR`
  - `showOnlineStatus`
  - `allowMemberPrivateChat`
  - `allowAddFriend`
  - `allowAtAll`
  - `allowCreateNotice`
  - `allowQuitRoom`
- “允许添加群成员为好友”开关按最新 Swagger 语义优先读写 `allowAddFriend`，同时同步 `allowSendCard` 兼容旧字段。
- 群设置抽屉新增以下管理员/群主可见开关：
  - 允许成员修改群昵称
  - 允许成员分享群二维码
  - 允许查看在线状态
  - 允许成员私聊
  - 允许成员 @ 全体
  - 允许成员创建公告
  - 允许成员退出群组
- 群业务入口展示同步权限字段：
  - 群主/管理员始终可见群二维码和在线成员入口。
  - 普通成员按 `allowShareQR` 控制群二维码入口。
  - 普通成员按 `showOnlineStatus` 控制在线成员入口。
- 聊天输入区上传入口同步权限字段：
  - 单聊不受群权限影响。
  - 群主/管理员始终可见图片、视频、文件上传入口。
  - 普通群成员按 `allowUploadFile` 控制图片、视频、文件上传入口。
- 群成员用户卡片入口同步权限字段：
  - 成员资料查看优先按业务 `showMember` 控制，缺失时回退 OpenIM SDK `lookMemberInfo`。
  - 普通成员点击群成员卡片时，“加好友”优先按 `allowAddFriend` 控制，缺失时回退旧字段 `allowSendCard`，再回退 SDK `applyMemberFriend`。
  - 普通成员点击群成员卡片时，“发送消息”按 `allowMemberPrivateChat` 控制。
  - 群主/管理员不受普通成员加好友和私聊入口限制。
- 群邀请和退群入口同步权限字段：
  - 聊天头部群邀请图标按 `allowInviteFriend` 控制，群主/管理员始终可见。
  - 群设置成员缩略行的“添加”入口按 `allowInviteFriend` 控制，群主/管理员始终可见。
  - 群成员列表标题栏的邀请入口按 `allowInviteFriend` 控制，群主/管理员始终可见。
  - 普通成员退群按钮按 `allowQuitRoom` 控制；群主仍显示解散群按钮，管理员退群不受普通成员限制。
- 抽出 `src/utils/businessSwitch.ts` 统一业务开关解析规则，避免群设置、聊天输入区和用户卡片各自维护不同的 `0/1/boolean/null` 判断。
- 新增中英文文案。

## 契约

- 新增开关复用既有 `updateBusinessSwitch`，保存前仍走 `confirmUpdateGroupSetting` 二次确认。
- `allowAddFriend` 修正复用既有 `updateGroupPermission`，保存前同样经过二次确认；提交时同步 OpenIM SDK `applyMemberFriend`、业务 `allowAddFriend` 和旧兼容字段 `allowSendCard`。
- 用户点击确认后才调用 `/room/update`；本轮未触发任何保存动作。
- 字段已在本地 `docs/openim-swagger.json` 中静态命中。

## 复核

- 本地服务 `http://127.0.0.1:7777/index.html#/login` 返回 HTTP 200。
- 静态复核确认 `allowShareQR/showOnlineStatus` 已传入 `GroupBusinessEntrances`，并只影响入口展示，不会自动触发请求。
- 静态复核确认 `allowUploadFile` 已从 `ChatFooter` 传入 `SendActionBar`，仅影响上传 action 渲染，不会自动触发上传。
- 静态复核确认 `OPEN_USER_CARD` 事件新增 `notSendMessage`，并由 `UserCardModal` 只控制“发送消息”按钮渲染；`notAdd` 继续只控制“加好友”按钮渲染。
- 静态复核确认 `allowInviteFriend` 已覆盖聊天头部邀请、群设置成员行添加、群成员列表标题栏邀请三个入口；`allowQuitRoom` 已覆盖普通成员退群按钮。
- 静态复核确认源码当前没有 @ 全体发送入口，仅存在 `AtAllTag` 渲染/点击保护，因此 `allowAtAll` 本轮只作为设置项保存，不新增产品入口。
- 本轮尝试通过 Playwright/内置浏览器做页面截图复核，但 Node REPL/浏览器通道均被 `codex/sandbox-state-meta: missing field sandboxPolicy` 阻断；已保留本地页面 HTTP 200 和静态链路复核结果。
- 未运行单元测试、构建或验证脚本。
- 未触发登录、群权限保存或其他真实 mutation。
