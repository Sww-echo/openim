# 聊天上传失败原因提示修复记录

## 范围

- 群聊上传：图片、视频
- 私聊上传：图片、视频
- 上传接口：`/business-api/file/upload`

## 处理结果

- 上传阶段失败时，统一通过 `feedbackToast({ error })` 展示错误。
- 错误消息提取优先级已覆盖后端失败结构：
  - `data.reasonText`
  - `data.fieldErrors`
  - `resultMsg`
  - Axios `response.data`
- 视频确认后先显示上传中 loading：`视频上传...`，失败后销毁 loading 并显示后端原因。

## 验证记录

- `npx eslint --quiet "src/utils/common.ts" "src/pages/chat/queryChat/ChatFooter/SendActionBar/index.tsx" "src/pages/chat/queryChat/ChatFooter/useSendMessage.ts" "src/pages/chat/queryChat/ChatFooter/SendActionBar/useFileMessage.ts" "src/pages/chat/queryChat/MessageItem/VideoMessageRender.tsx"`：通过。
- Node 轻量解析校验：截图同结构响应可解析出 `当前用户不是群成员，不能上传群文件。`。
- Chrome + Playwright mock `/business-api/file/upload`：
  - 群聊图片：命中上传接口 1 次，显示后端失败原因。
  - 群聊视频：命中上传接口 1 次，确认后先显示上传中，再显示后端失败原因。
  - 私聊图片：命中上传接口 1 次，显示后端失败原因。
  - 私聊视频：命中上传接口 1 次，显示后端失败原因。

## 备注

- 浏览器控制台输出中文在 PowerShell 中显示为问号，但脚本在页面上下文内用同一字符串匹配，`reasonShown` 均为 `true`。
- 私聊验证使用测试账号自聊路由 `#/chat/si_10000004_10000004`，仅用于验证上传公共路径的失败提示。
