# 2026-06-19 群二维码生成确认保护

## 背景

继续审计群管理入口时，发现群二维码面板中的 `Generate` 会直接调用 `/room/openim/qr/create` 生成新的群二维码。

生成二维码会创建新的远端二维码/短码资源，属于用户主动触发的远端动作。为避免误触，应与扫码入群、下载、消息删除等入口保持一致，先展示确认框，用户确认后再执行生成。

## 处理

- `src/pages/chat/queryChat/GroupSetting/GroupQRCodePanel.tsx`
  - 新增 `confirmGenerateQRCode`。
  - `Generate` 按钮改为先展示确认框。
  - 只有点击确认框 `OK` 后才调用 `generateQRCode`，进而请求 `/room/openim/qr/create`。
- `src/i18n/resources/zh.json`
  - 新增 `placeholder.confirmGenerateGroupQRCode`：`确认为该群生成新的二维码吗？`
- `src/i18n/resources/en.json`
  - 新增 `placeholder.confirmGenerateGroupQRCode`：`Generate a new QR code for this group?`

## 真实 Chrome 检查

- 使用真实 Chrome 插件受控标签打开本地应用。
- 登录账号 `18888888888 / czp0422+`。
- 检查已知群：
  - `sg_4011035808`：当前账号可见群设置和群权限配置，但未渲染 `GroupBusinessEntrances` 业务入口块，页面没有 `Group QR Code` 入口。
  - `sg_3413653759`：当前账号只能看到基础群设置和 `Leave Group`，无群管理业务入口。
- 因当前真实群数据无法渲染群二维码入口，本轮未能在浏览器中点击到 `Generate` 按钮。
- 源码核对确认当前 `Generate` 按钮只绑定 `confirmGenerateQRCode`，`createOpenIMGroupQRCode` 仅在确认框 `onOk` 的 `generateQRCode` 中执行。

## 说明

本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。浏览器检查没有触发 `/room/openim/qr/create`，后续需要一个能渲染 `Group QR Code` 入口的真实群数据再补做弹窗点击验收。
