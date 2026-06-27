# 2026-06-20 文件发送确认与取消链路收口

## 背景

- 文件、图片、视频消息发送会触发真实远端动作：
  - 业务文件接口：`/file/upload/context`、`/file/upload`，图片/视频还可能触发压缩、转码、缩略图接口。
  - OpenIM SDK：创建消息并 `sendMessage`。
  - 群文件发送成功后可能非阻塞登记 `/room/openim/share/add`。
- 按当前验收约束，文件选择后不能直接上传或发送，必须先展示确认框，用户确认后才执行真实动作。

## 本次核对

- `src/pages/chat/queryChat/ChatFooter/SendActionBar/index.tsx`
  - `Upload.customRequest` 只调用 `fileHandle`。
  - `fileHandle` 只展示 `modal.confirm`。
  - 只有确认框 `onOk` 才调用 `runFileHandle`。
  - `runFileHandle` 内才会调用 `getImageMessage/getVideoMessage/getFileMessage`，也就是业务上传、压缩/转码、SDK 消息创建和发送入口。
- `/room/openim/share/add` Swagger 必填参数为 `roomId/type/size/url/name`，`fileId` 可选；当前同步逻辑已在缺少 `url` 时跳过登记，并按业务 `roomId` 传参。

## 本次调整

- 取消文件发送确认框时，调用 `options.onError?.(new Error("Upload canceled"))` 结束 AntD Upload 的本地请求状态。
- 取消确认不会调用：
  - `/file/upload/context`
  - `/file/upload`
  - `/file/compress`
  - `/file/convert`
  - `/file/thumbnail`
  - OpenIM SDK `sendMessage`
  - `/room/openim/share/add`

## 浏览器复测

- 通过 Chrome 扩展通道新建受控标签打开 `http://localhost:7777/index.html#/login`。
- 页面正常加载，控制台无 error。
- 当前 Chrome 可读到的用户标签均停留在登录页；为避免重复登录触发“其他设备登录”，本轮未进入聊天页选择文件，未触发文件选择、上传、发送或下载。

## 说明

- 本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。
- 完整上传/发送真实验收仍属于 mutation，需要用户明确确认并提供允许上传的本地文件后再执行。
