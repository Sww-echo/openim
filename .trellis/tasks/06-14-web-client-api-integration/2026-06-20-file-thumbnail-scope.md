# 2026-06-20 文件缩略图接口触发范围收敛

## 背景

继续复核文件资源接口时，对照本地 `docs/openim-swagger.json` 确认 `/file/thumbnail` 参数说明为：

- `fileId` 必填。
- 描述为“已上传的文件ID（图片或PDF）”。

当前上传链路此前在任意文件上传成功且返回业务 `fileId` 后都会非阻塞调用 `/file/thumbnail`。这会让普通文件或视频也触发缩略图生成请求，和接口描述不一致。

## 本次处理

- `src/pages/chat/queryChat/ChatFooter/SendActionBar/useFileMessage.ts`
  - 新增 `canGenerateBusinessThumbnail` 判断。
  - 仅当文件类型为 `image/*` 或 `application/pdf` 时请求 `/file/thumbnail`。
  - 视频仍保留 `/file/convert` 或 `/file/convert/async` 转码链路。
  - 普通文件仍走 `/file/upload/context` 和 `/file/upload`，不再触发缩略图生成。

## 接口影响

- `/file/thumbnail`：减少非图片/PDF文件的无意义请求。
- `/file/upload`、`/file/compress`、`/file/convert`：现有主链路不变。

## 验证状态

本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。文件上传属于真实 mutation，本轮未在浏览器选择或上传文件；后续如需完整验证，需要用户明确确认后分别用图片、PDF、视频和普通文件复测。
