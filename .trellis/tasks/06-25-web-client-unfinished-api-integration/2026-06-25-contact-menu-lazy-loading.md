# 2026-06-25 通讯录左侧菜单按需加载改造

## 背景

用户反馈通讯录左侧四个菜单切换时页面抖动，并且会请求很多接口；同时确认好友列表业务接口 `/friends/list` 返回了好友数据但列表未展示昵称。

本轮改造目标是：进入通讯录后不再全量预拉好友、群、好友申请、群申请、黑名单；只有选中左侧对应菜单时才请求该页面需要的数据，并保留 SDK 全局事件监听以保证消息、好友、群相关事件仍可实时接收。

## 涉及接口

- `/friends/list`
- `/room/list`
- `/friends/newFriendListWeb`
- `/friends/newFriend/list`
- `/room/openim/join-requests`
- `/friends/queryBlacklistWeb`
- `/friends/blacklist`

## 接入位置

- `src/store/contact.ts`
  - 新增 `contactDataLoaded`、`contactDataLoading` 状态。
  - 新增 `ensureFriendListLoaded()`、`ensureGroupListLoaded()`、`ensureFriendApplicationsLoaded()`、`ensureGroupApplicationsLoaded()`。
  - 使用模块级 pending Promise 对同类加载去重，避免重复点击或重复挂载造成并发重复请求。
  - 四类 `ensure*Loaded()` 统一返回加载成功标记；只有至少一个数据源成功时才标记 loaded，避免刷新直达页面失败后被错误缓存为已加载。
  - `/friends/list` 解析补充 `friends` 列表键，并支持 `toUserId`、`toNickname`、`displayTitle`、`profileCards` 等业务字段。
  - 合并业务好友数据时忽略空值，避免空业务字段覆盖 SDK 昵称或头像。
  - 修复刷新直达“我的好友”时 SDK 登录尚未完成导致 `IMSDK.getFriendListPage()` 抛错后直接中断的问题；SDK 好友列表和业务 `/friends/list` 现在独立容错，SDK 失败不会阻断业务好友接口调用。
  - 修复刷新直达“我的群组”或“群通知”时 SDK 群列表失败、业务群列表成功但返回空数组时被误判为失败的问题；现在以数据源请求是否成功为准，不以列表长度判断成败。
  - 好友申请、群申请列表读取也统一为 SDK 与业务源独立容错；SDK 未登录失败不会阻断业务申请接口，全部源失败时不覆盖已有列表。
  - 群通知业务接口需要 `roomId`，因此 `ensureGroupApplicationsLoaded()` 会先确保群列表已加载，再按群查询加入申请。

- `src/store/type.d.ts`
  - 补充通讯录懒加载状态和 ensure 方法类型。

- `src/utils/imCommon.ts`
  - `initStore()` 移除通讯录列表类全局请求，只保留会话、未读、自身信息和申请角标等初始化。

- `src/layout/useGlobalEvents.tsx`
  - `syncFinishHandler()` 移除好友列表、群列表刷新。
  - 保留 SDK 全局事件监听：新消息、会话、未读、好友、群、申请等事件仍由 SDK listener 更新 store。

- `src/pages/contact/myFriends/index.tsx`
  - 页面挂载时调用 `ensureFriendListLoaded()`。

- `src/pages/contact/myGroups/index.tsx`
  - 页面挂载时调用 `ensureGroupListLoaded()`。

- `src/pages/contact/newFriends/index.tsx`
  - 页面挂载时调用 `ensureFriendApplicationsLoaded()`。

- `src/pages/contact/groupNotifications/index.tsx`
  - 页面挂载时调用 `ensureGroupApplicationsLoaded()`。

- `src/layout/LeftNavBar/BlackList.tsx`
  - 黑名单弹窗打开后再调用 `getBlackListByReq()`，不再随登录初始化预拉。

- `src/layout/MainContentWrap.tsx`
  - 调整路由鉴权状态，避免普通子路由切换时反复置空布局导致页面抖动。

## 实时消息说明

本次改造只移除了通讯录 HTTP 列表的全局预加载，没有移除 SDK 事件监听。

- 群消息、好友消息仍由 `CbEvents.OnRecvNewMessages` 进入 `newMessageHandler()`，再由 `handleNewMessage()` 和 `pushNewMessage()` 更新当前会话消息列表。
- 会话变化和未读数仍由 SDK 会话事件更新。
- 好友、群、申请变更仍通过现有 SDK 事件更新 contact store。

因此按需加载不会影响在线实时收消息；它只影响通讯录页面列表数据的首次 HTTP 拉取时机。

## 验证

- 已执行 `npm run build`。
- 构建通过，无 TypeScript 或打包错误。
- 刷新直达“我的好友”边界已做代码级修复：业务好友接口不再依赖 SDK 好友分页成功后才执行。
- 刷新直达“我的群组”“新的好友”“群通知”边界已统一检查并修复：空列表响应不再等同失败，失败加载不会错误写入 loaded 缓存。
- 仍存在项目既有 Vite/antd/chunk size 警告：
  - antd `use client` directive ignored
  - `wasm_exec.js` script bundling warning
  - chunk size warning
  - npm project config warning

## 状态

已完成代码改造并通过构建验证。未执行 git commit 或 branch 操作。

## 原则说明

- KISS：按页面入口触发该页面需要的数据加载，不增加新的全局调度层。
- YAGNI：没有新增复杂缓存失效策略，只保留当前明确需要的 loaded/loading 和 force 参数。
- DRY：通讯录页面统一走 store 的 `ensure*Loaded` 方法，重复请求去重集中在 store。
- SOLID：页面负责触发加载，store 负责数据获取、合并、去重和状态管理，SDK 事件监听仍由全局事件模块负责。
