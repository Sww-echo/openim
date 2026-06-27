# 2026-06-20 群二维码有效期参数对齐

## 背景

- Swagger `/room/openim/qr/create` 的 `expireHours` 描述为“默认168，最大720”。
- 群二维码面板此前默认值为 24 小时，虽然参数名和最大值已接入，但默认值与文档不一致。

## 调整

- `GroupQRCodePanel` 默认 `expireHours` 改为 `168`。
- 抽出 `DEFAULT_EXPIRE_HOURS = 168`、`MAX_EXPIRE_HOURS = 720`，`InputNumber` 继续限制最大 720。

## 验证

- 本轮只做源码静态复核和登录页 HTTP 只读复核。
- 未运行单元测试、构建或验证脚本。
- 未生成二维码、解析二维码、扫码入群或触发其他 mutation。
