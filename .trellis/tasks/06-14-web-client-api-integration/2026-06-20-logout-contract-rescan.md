# 2026-06-20 退出登录接口契约复核

## 背景

- 继续对照最新 `docs/openim-swagger.json` 和当前源码，复核仍未直接接入的用户端路径。
- `/user/logout` 是 Swagger 中看起来与 Web 用户端相关的接口，但此前 Trellis 记录已将其列为待后端明确契约后再接。

## 复核结论

- 最新 Swagger `/user/logout` 的 GET/POST 定义仍同时要求以下 query 参数：
  - `deviceKey`：必填。
  - `devicekey`：必填。
  - `telephone`：必填，描述为“手机号码，使用MD5加密”。
  - `access_token`：必填，由统一业务请求层可自动补齐。
- `/account/login` 在 Swagger 中没有声明 `deviceKey/devicekey` 参数，也没有明确响应中的设备 key 字段。
- 当前 Web 本地账号结构稳定保存的是业务 token、OpenIM token、OpenIM userID、手机号明文、区号、昵称和头像，不保存可证明与后端会话一致的 device key。
- 登录请求当前按联调口径发送手机号明文和 MD5 密码；退出接口的 `telephone` 又要求 MD5 手机号，二者口径不一致，且没有文档说明是否必须与登录态设备信息配套。

## 处理

- 本轮不把 `/user/logout` 强接到退出按钮，避免退出时向生产业务后端发送缺失或伪造设备字段的 mutation 请求。
- 当前退出登录继续执行 OpenIM SDK logout + 本地业务/OpenIM token 清理 + store 清理 + 回登录页。
- 后续若后端明确 device key 来源和 `telephone` 加密口径，再补接业务退出接口。

## 复核

- 静态统计当前 `src/api/**` 中 `businessRequest` 唯一路径数为 107。
- 源码仍不在最新 Swagger 的业务路径仍只有既有 RTC `/user/rtc/get_token`。
- 本轮未运行单元测试、构建或验证脚本，未触发真实退出登录或任何远端 mutation。
