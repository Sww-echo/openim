# 2026-06-19 下载动作确认保护

## 背景

Trellis 当前剩余风险中明确包含“下载类动作尚未执行真实验收，后续必须由用户明确确认后再触发”。继续审计 Web 端下载入口时，发现以下入口会在用户点击后直接触发下载：

- 聊天资源弹窗的文件资源和群共享文件 `Download`。
- 文件消息气泡右侧下载按钮。
- 消息右键菜单中的 `Download`。

这些动作会拉取远端文件或浏览器下载文件，应与 mutation 类入口保持一致，在真实环境中先展示确认框，用户确认后再执行下载。

## 处理

- `src/pages/chat/queryChat/ChatHeader/ChatBusinessResources.tsx`
  - 文件资源、群共享文件的 `Download` 按钮改为先弹确认框。
  - 点击 `OK` 后才调用 `triggerBusinessFileDownload`，点击 `Cancel` 不触发 `/file/sign`、`/file/download` 或实际下载。
- `src/pages/chat/queryChat/MessageItem/FileMessageRender.tsx`
  - 文件消息气泡下载按钮改为先弹确认框。
  - 点击 `OK` 后才根据业务 `fileId` 调用签名下载，或使用 SDK 原始 URL 兜底下载。
- `src/pages/chat/queryChat/MessageItem/index.tsx`
  - 消息右键菜单 `Download` 改为先弹确认框。
  - 点击 `OK` 后才执行业务文件下载或 SDK URL 兜底下载。
- `src/i18n/resources/zh.json`
  - 新增 `placeholder.confirmDownloadFile`：`确认下载当前文件吗？`
- `src/i18n/resources/en.json`
  - 新增 `placeholder.confirmDownloadFile`：`Download this file?`

## 真实 Chrome 复测

- 使用真实 Chrome 插件受控标签打开本地应用。
- 登录账号 `18888888888 / czp0422+` 成功进入 `#/chat`。
- 打开单聊 `si_10000003_10000009`。
- 点击右上角聊天资源入口，打开 `Chat Resources` 弹窗。
- 切换到 `File Resources` Tab，真实返回文件：
  - `chuanxi.jpg`，`842.58 KB / jpg`
  - `chuanxi.jpg`，`841.29 KB / jpg`
- 点击第一条文件资源的 `Download` 后弹出确认框：
  - 标题：`Download`
  - 内容：`Download this file?`
  - 按钮：`Cancel`、`OK`
- 点击 `Cancel` 后确认框关闭，未点击 `OK`，未实际下载文件。

## 说明

本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。浏览器复测只打开下载确认框并取消，没有触发真实文件下载。
