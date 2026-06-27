# 2026-06-25 只读资料补充兜底收敛

## 背景

继续按 Web 端接口接入任务复扫只读接口时，发现 SDK 用户资料和申请卡片已有本地/SDK 兜底数据，但业务侧只读补充失败时仍可能留下未处理 Promise 或用户级控制台错误日志。

涉及接口均为只读资料补充：

- `/user/get`
- `/friends/get`
- `/room/openim/detail`

## 本轮调整

- `src/store/user.ts`：`getSelfInfoByReq` 在 SDK `getSelfUserInfo` 成功后继续尝试 `/user/get` 合并业务资料；业务资料失败时只输出 `console.debug`，不影响登录态，不触发退出。
- `src/pages/common/UserCardModal/index.tsx`：用户卡片读取 `/friends/get` 或 `/user/get` 失败时降级为 `console.debug`，继续展示好友列表、SDK 或传入卡片数据。
- `src/components/ApplicationItem/index.tsx`：群申请卡片读取 `/room/openim/detail` 失败时降级为 `console.debug`，继续打开申请来源里的群卡片兜底数据。

## 边界

- 本轮不新增接口，不改变 mutation 流程。
- 未触发真实登录、发送、上传、下载、删除、审核、群设置保存、转让、解散、清空等远端动作。
- 未运行单元测试、构建、覆盖检查或验证脚本。
- 固定企业号继续保持 `LOCALTEST001`。

