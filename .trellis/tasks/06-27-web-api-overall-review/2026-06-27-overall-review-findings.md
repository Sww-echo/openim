# Web 最新接口接入整体 Review 记录

## Review 范围

- 接口文档：`docs/openim-frontend-api-doc.json`
- 需求来源：根目录 `需求清单.txt`
- 功能范围：登录、聊天、群管理三大功能项
- 复核方式：源码走查、验证脚本、Google Chrome 端到端流程复跑
- 测试入口：`http://127.0.0.1:7777/index.html`
- 测试账号：`18888888888` / `czp0422+` / 企业号 `LOCALTEST001`
- 测试群：`codex-api-realign-1782496629149`，OpenIM `groupID=2757436928`，业务 `roomId=6a3ebd7789552748667deb62`

## 接入总览

| 功能项 | 接入状态 | 复核结论 |
| --- | --- | --- |
| 登录 | 已按最新文档接入 | 主流程可登录进入 `#/chat`，企业号使用 `LOCALTEST001`，旧 Swagger 登录相关接口已移除或降级提示。 |
| 聊天 | 已按最新文档和 OpenIM SDK 边界接入 | 群聊发送、消息搜索、右键菜单、已读能力入口可用；存在系统消息展示、发送确认交互和已读详情展示问题。 |
| 群管理 | 已按最新文档和 OpenIM SDK 边界接入 | 我的群组、群资料、群公告、二维码、在线成员可用；存在文档缺口能力仍可点击、二维码入群状态判断不足等问题。 |

## 浏览器流程结果

- 登录成功后进入 `#/chat`。
- 通讯录 -> 我的群组有数据，目标群 `codex-api-realign-1782496629149` 可见。
- 打开目标群资料卡成功，点击“发送消息”进入 `#/chat/sg_2757436928`。
- 群聊文本发送成功；发送前会弹出“确认发送这条消息吗？”确认框。
- 聊天搜索能搜到文本消息；公告更新类系统消息在搜索结果中会展示 raw JSON。
- 消息右键菜单展示复制、转发、收藏、消息已读列表、撤回、删除。
- 已读详情接口能力可调用；但当没有 read/unread 明细时，UI 直接展示接口 JSON。
- 群设置入口存在；Header 设置图标 `alt=""`，可访问树中没有可识别的“设置”按钮名称。
- 群公告列表可读取到 `review流程测试公告`。
- 群二维码创建成功，短码 `0d0d35210020455d8cfe`；解析成功并显示群信息。
- 当前账号已在群内时，二维码解析后“申请加入”仍可点击。
- 在线成员接口返回 `群助手 1010` 和 `test-user 10000004`。
- 点击群权限“允许被搜索”后弹确认，确认后提示“最新接口文档未提供该功能接口，当前暂不可用”。

## 验证命令结果

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npm run verify:web-api-coverage` | 通过 | `expectedCount=101`，`missingInApiDoc=[]`，`missingInSource=[]`，`unexpectedSourceOnly=[]`，`unexpectedSourceNotInApiDoc=[]` |
| `npm run verify:web-api-contract` | 通过 | `checkedCount=240`，`failedCount=0` |
| `npm run verify:web-api-lint` | 通过 | 仅有 React version 未配置 warning |
| `npm run verify:web-api-behavior` | 未通过 | 3 个断言失败：错误提示文案、企业号常量、send-before 失败返回值；其中企业号断言仍检查旧 `C3PY9DYPU`，脚本需同步到 `LOCALTEST001` |
| `npx tsc --noEmit --pretty false` | 未通过 | 当前存在 5 类 TypeScript 类型错误，见下方发现项 |
| `npm run build -- --config vite.web.config.ts` | 通过 | 有 Vite/AntD/chunk/wasm_exec warning，但产物构建成功 |

## 发现项

### P0 / P1：需要优先处理

| 严重级别 | 类型 | 发现 | 证据 | 建议 |
| --- | --- | --- | --- | --- |
| 高 | 前端交互 + 文档缺口 | 群设置中大量业务权限、销毁、历史保留类开关明知最新文档没有写接口，但仍以可操作状态展示；用户确认后才失败。 | `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx:805` 起展示开关；`src/pages/chat/queryChat/GroupSetting/useGroupSettings.tsx:35` 的 `updateRoomSettings` 直接提示接口缺口。 | 对最新文档缺口能力禁用或隐藏；如产品要求保留入口，应在控件旁明确不可用状态，避免确认后才失败。 |
| 高 | 类型质量 | `tsc --noEmit` 不通过，接口接入后类型边界仍有未收敛风险。 | `src/api/announcement.ts:44`、`src/api/file.ts:498`、`src/api/file.ts:517`、`src/api/notification.ts:153`、`src/components/ApplicationItem/index.tsx:112`、`src/pages/common/UserCardModal/EditSelfInfo.tsx:27` 等。 | 先修类型门禁，再把 `tsc --noEmit` 纳入最终验收；避免 build 成功但运行期数据结构漂移。 |

### P2：影响体验或可理解性的缺陷

| 严重级别 | 类型 | 发现 | 证据 | 建议 |
| --- | --- | --- | --- | --- |
| 中 | 消息展示 | 群公告更新等系统消息未格式化，聊天区显示 `[暂未支持的消息类型]`，搜索结果会展示 raw JSON。 | `src/constants/im.ts:21` 的 `SystemMessageTypes` 未覆盖公告更新类 contentType；`src/pages/chat/queryChat/ChatHeader/ChatMessageSearch.tsx:45` 无字段命中时 `JSON.stringify(record)`。 | 补齐系统消息类型映射和展示文案；搜索结果应展示可读摘要，不应直接暴露原始接口对象。 |
| 中 | 消息详情展示 | 已读详情在没有可展示 read/unread 列表时，把完整接口响应 JSON 放进弹窗。 | `src/pages/chat/queryChat/MessageItem/index.tsx:183` 到 `202`。 | 改为业务态展示：暂无已读详情、接口未返回明细、或按 read/unread 计数展示。调试 JSON 仅保留在开发环境。 |
| 中 | 群二维码入群状态 | 当前账号已在群内时，二维码解析成功后“申请加入”仍可点击。 | `src/pages/chat/queryChat/GroupSetting/GroupQRCodePanel.tsx:144` 的 `canJoin = Boolean(resolvedCode)`；按钮仅 `disabled={!canJoin}`。 | 解析二维码后结合当前群成员态、当前会话群 ID 或后端返回状态禁用申请按钮，并展示“已在群内”。 |
| 中 | 聊天发送交互 | 每次发送文本都弹“确认发送这条消息吗？”，普通聊天流程过重，且本次复测中会触发 draggable 相关 console 错误。 | `src/pages/chat/queryChat/ChatFooter/index.tsx:134` 到 `142`。 | 仅对高风险动作保留确认；普通文本发送应直接发送。若确认来自测试防误发需求，应改为开发环境开关或可配置项。 |
| 中 | 运行期错误 | 点击或拖拽 AntD Modal 区域时，浏览器 console 出现 `TypeError: Cannot read properties of undefined (reading 'DRAGGABLE_DEBUG')`。 | `src/components/DraggableModalWrap/index.tsx` 将 `Draggable` 转为 `ElementType`，未处理浏览器环境下 `process.env` 兼容。 | 明确修复 `react-draggable` 对 `process.env` 的依赖，或升级/替换封装，避免 modal 操作产生运行期错误。 |
| 中 | 测试脚本同步 | `verify:web-api-behavior` 仍有旧断言或实现不一致断言。 | 企业号断言仍检查 `C3PY9DYPU`，当前需求和实测使用 `LOCALTEST001`。 | 区分真实缺陷和脚本滞后：同步企业号常量；重新核对错误提示和 send-before 失败返回值断言是否符合当前实现。 |

### P3：低风险但建议排期

| 严重级别 | 类型 | 发现 | 证据 | 建议 |
| --- | --- | --- | --- | --- |
| 低 | 可访问性 + 可测性 | 群设置 Header 入口是空 alt 图片，可访问树中没有“设置”按钮名称，只能用 CSS 选择器定位。 | `src/pages/chat/queryChat/ChatHeader/index.tsx:174` 到 `196`。 | 给按钮增加可访问名称，例如 `aria-label="群设置"`；图标 `alt` 使用明确文本或由按钮承载语义。 |
| 低 | 数据/展示 | 我的群组列表存在两个同名“我的群组”，当前前端不去重，也没有兜底命名污染处理。 | `src/store/contact.ts:787` 使用 `IMSDK.getJoinedGroupListPage`；`src/pages/contact/myGroups/index.tsx:41` 起直接展示列表。 | 如果这是测试数据可保留；如果产品不允许重复感知，应按 `groupID` 去重并对空/兜底群名做更明确展示。 |
| 低 | 产品口径 | 登录后会话列表初始为空，仅显示“创建群聊”；已有加入群可从通讯录找到。 | 浏览器流程复核：`#/chat` 初始会话依赖 SDK 历史会话，不等价于已加入群列表。 | 明确产品口径：会话列表是否只显示有消息历史的会话；如需要展示已加入群，应在空态引导或同步生成会话入口。 |

## 接口文档缺口

- 最新文档没有旧 `/room/update` 的用户端等价写接口，因此业务扩展权限、消息销毁、消息销毁通知、撤回时长、聊天记录保留、搜索入群方式等不能按旧接口写入。
- 最新文档没有普通搜索入群的直接入群接口；当前只有群二维码 `/room/openim/qr/join`。
- 最新文档没有用户端 `/room/set/admin`、`/room/member/delete`、`/room/transfer`、`/room/delete` 等旧业务写接口；当前应由 OpenIM SDK 承担或等待后端补文档。
- 最新文档未列出 `/room/openim/member/mute`、`/room/openim/member/unmute`、`/room/openim/member/remark/delete`；禁言走 SDK，删除备注通过 `remarkName=""` 的文档内更新接口实现。
- 登录侧最新文档未提供用户端退出业务接口、忘记密码、修改密码、校验旧密码接口；当前只能本地清理/降级提示，不能继续调用旧 Swagger 路径。

## 当前结论

- 三大功能项已经从旧 `openim-swagger.json` 主流程切到 `docs/openim-frontend-api-doc.json` 和 OpenIM SDK 边界。
- 接口覆盖和契约校验通过，说明“旧接口是否残留、文档接口是否遗漏”的静态对齐基本完成。
- 当前主要风险不在接口路径遗漏，而在：文档缺口功能的 UI 状态、系统消息/接口响应的用户可读性、类型门禁、以及少量行为测试脚本未同步。
- 后续修复优先级建议：先修 `tsc` 和群设置不可用开关，再修系统消息/搜索/已读详情展示，最后处理二维码成员态、发送确认、可访问性和数据展示口径。
