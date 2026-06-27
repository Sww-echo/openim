# 2026-06-24 群共享文件登记必填参数防护补齐

## 背景

`/room/openim/share/add` 是群文件/视频发送成功后的异步登记接口。Swagger 契约要求：

- `roomId` 必填
- `type` 必填
- `size` 必填
- `url` 必填
- `name` 必填
- `fileId` 可选

此前已补过 `url` 为空时跳过登记，但执行层仍未统一 trim `roomId/url/name`，也没有对 `size` 做有限数值校验。为了避免发送成功后异步登记打出无效业务请求，本轮继续收紧必填参数防护。

## 变更

- 文件：`src/pages/chat/queryChat/ChatFooter/SendActionBar/index.tsx`
- 新增 `normalizeShareText`，统一 trim `roomId/url/name`。
- 新增 `normalizeShareSize`，只允许有限且非负的文件大小进入登记请求。
- `syncGroupShareFile` 在以下情况直接跳过 `/room/openim/share/add`：
  - 缺 `roomId`
  - 图片消息，不登记群共享文件
  - 缺业务文件 URL
  - 缺文件名
  - 文件大小不是有效数值
- 保留发送成功后异步登记策略：登记失败或跳过不影响 OpenIM SDK 消息发送结果。

## 约束

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未选择文件、未上传文件、未发送消息。
- 本轮未触发 `/room/openim/share/add` 真实请求。

## 后续验收条件

- 需要用户明确确认后，使用真实浏览器选择群文件或群视频发送，才能验证 `/room/openim/share/add` 的完整远端登记链路。
- 仍需后端兼容当前群 `roomId=OpenIM groupID` 或返回稳定业务 `roomId`，否则群共享相关只读/写入接口仍可能返回业务体失败。
