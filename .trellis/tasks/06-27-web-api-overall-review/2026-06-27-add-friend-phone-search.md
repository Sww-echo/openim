# 添加好友手机号搜索排查记录

## 问题

- 入口：顶部加号 -> 添加好友。
- 现象：输入手机号搜索时提示未搜索到用户。

## 根因

- 最新接口文档中 `/user/getByAccount` 是“按通讯号查询”，不是手机号查询；用手机号调用会返回 `通讯号错误`。
- 当前搜索链路没有使用 `/user/get` 做用户资料兜底查询。
- 公开搜索和好友分页后存在前端精确字段过滤，若后端手机号字段为 `phone`、`telephone`、`mobile` 等，容易被过滤掉。

## 修复

- `src/api/friend.ts`
  - 增加 `getBusinessUserBySearchKey`，使用 `GET /user/get?userId=关键词` 作为用户 ID/手机号资料兜底查询。
  - `searchBusinessUserInfo` 搜索顺序调整为：通讯号 -> 公开搜索 -> `/user/get` 资料查询 -> 好友分页。
  - `/friends/page` 调用方式改为最新接口文档要求的 GET。
  - 用户资料归一化补充 `phone`、`telephone`、`mobile`、`mobilePhone`、`tel`、`setAccount` 字段映射，避免 UI 二次过滤误杀。

## 验证

- `npx eslint --quiet "src/api/friend.ts"`：通过。
- Chrome + Playwright：
  - 登录测试账号 `18888888888`。
  - 顶部加号 -> 添加好友 -> 输入 `18888888888`。
  - 网络链路命中 `/user/get?userId=18888888888`。
  - 用户资料卡片成功打开，展示 `test-user`、`10000004`、手机号 `18888888888`。

## 当前限制

- `/user/public/search/list` 不在最新 `docs/openim-frontend-api-doc.json` 中，但现有代码仍作为兼容链路保留。
- 搜索当前登录账号手机号会打开自己的资料卡片；添加自己好友的按钮逻辑由用户卡片现有 `isSelf` 状态处理。
