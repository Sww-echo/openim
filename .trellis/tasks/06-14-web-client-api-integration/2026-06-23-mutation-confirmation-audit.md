# 2026-06-23 写操作确认链路审计

## 范围

本轮只做源码审计和文档记录，不触发真实浏览器 mutation，不运行单元测试、构建或验证脚本。

审计目标是确认已接入的业务写操作是否存在“点击即执行”的误触风险。

## 结论

当前已检查的 Web 端主要写操作入口均有确认链路或属于明确的只读/本地操作入口，暂未发现必须修补的缺失确认点。

## 已确认有二次确认的入口

### 申请处理

- 新朋友同意/拒绝：公共 `ApplicationItem` 内部通过 `modal.confirm` 包裹。
- 群申请同意/拒绝：公共 `ApplicationItem` 内部通过 `modal.confirm` 包裹。
- 群设置里的入群审核同意/拒绝：`GroupBusinessEntrances.runConfirmedAction` 包裹。

### 好友和个人设置

- 加好友请求：`UserCardModal/SendRequest` 通过 `modal.confirm` 包裹。
- 加群请求：`GroupCardModal` 通过 `modal.confirm` 包裹。
- 黑名单移除：`LeftNavBar/BlackList` 通过 `modal.confirm` 包裹。
- 单聊免打扰、置顶、聊天记录保存时间：`SingleSetting.confirmUpdateSingleSetting` 包裹。
- 拉黑/移出黑名单、解除好友：`SingleSetting` 内单独 `modal.confirm` 包裹。
- 头像上传、个人资料保存、密码修改、日志上传：均通过 `modal.confirm` 包裹。
- 系统公告标记已读、全部已读：`SystemAnnouncements` 通过 `modal.confirm` 包裹。
- 用户通知设置更新：`PersonalSettings.updateNotification` 通过 `modal.confirm` 包裹。

### 聊天和文件

- 图片/视频/文件发送：选择文件后先弹确认，确认后才上传并调用发送链路。
- 文件消息下载：`FileMessageRender` 通过 `modal.confirm` 包裹。
- 消息右键下载、收藏、撤回、删除：`MessageItem` 内分别通过 `modal.confirm` 包裹。
- 聊天资源弹窗里的下载、删除、收藏编辑保存：`ChatBusinessResources` 通过 `modal.confirm` 包裹。
- 转发消息：`ChooseModal` 选择目标后通过 `modal.confirm` 包裹。

### 群管理

- 群头像上传、群名修改、群权限设置、消息销毁设置：`GroupSettings.confirmUpdateGroupSetting` 或单独 `modal.confirm` 包裹。
- 群免打扰、置顶、清空聊天记录：均通过 `modal.confirm` 包裹。
- 退群、解散群：`useGroupSettings` 内通过 `modal.confirm` 包裹。
- 群成员备注、禁言、解禁、设/取消管理员：`GroupMemberList` 内通过 `modal.confirm` 包裹。
- 群公告编辑保存、删除：`GroupBusinessEntrances.runConfirmedAction` 包裹。
- 特殊成员角色设置：`GroupBusinessEntrances.runConfirmedAction` 包裹。
- 群助手添加、移除、关键词增删改：`GroupHelperPanel.runConfirmedAction` 包裹。
- 群二维码生成、扫码入群：`GroupQRCodePanel` 通过 `modal.confirm` 包裹。
- 邀请成员、踢人、转让群主、建群：`ChooseModal.confirmChoose` 包裹；仅选择单个用户创建会话时直接打开单聊，不产生远端写操作。

## 仍未做真实 mutation 验收

以下入口代码有确认链路，但本轮没有点击确认执行真实远端变更：

- 好友申请同意/拒绝、加好友、删好友、拉黑/移出黑名单。
- 群申请同意/拒绝、邀请成员、踢人、转让群主、退群、解散群。
- 群设置保存、消息销毁设置保存、群公告编辑/删除。
- 群成员备注、禁言/解禁、管理员设置、特殊成员设置。
- 群助手添加/删除、关键词增删改。
- 群二维码生成、扫码入群。
- 图片/视频/文件上传发送、文件下载/删除/引用失效。
- 消息发送、转发、收藏、撤回、删除。
- 系统公告标记已读、通知设置更新、个人资料/头像/密码修改、日志上传。

## 风险说明

- 本轮只证明“前端入口存在确认链路”，不证明后端 mutation 成功。
- 群业务接口当前仍受 `roomId=OpenIM groupID` 契约影响，真实写操作验收需要后端先兼容或提供业务 `roomId` 映射。
- 后续真实写操作验收需要用户按模块单独确认，避免误触发送、删除、审核、清空等高风险动作。

