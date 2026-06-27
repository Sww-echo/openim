import { RightOutlined } from "@ant-design/icons";
import { Button, Empty, Input, List, Modal, Spin } from "antd";
import { t } from "i18next";
import { memo, useCallback, useMemo, useState } from "react";

import { modal } from "@/AntdGlobalComp";
import {
  addOpenIMGroupNotice,
  deleteOpenIMGroupNotice,
  getOpenIMGroupNotices,
  getOpenIMJoinRequests,
  getOpenIMOnlineMembers,
  getOpenIMSpecialMembers,
  handleOpenIMJoinRequest,
  setOpenIMSpecialRole,
  updateOpenIMGroupNotice,
} from "@/api/group";
import OIMAvatar from "@/components/OIMAvatar";
import SettingRow from "@/components/SettingRow";
import {
  BusinessRecord,
  getBusinessListPayload,
  mergeBusinessRecordsByKey,
  pickBusinessId,
  pickBusinessJoinRequestId,
  pickBusinessText,
} from "@/utils/businessPayload";
import { feedbackToast } from "@/utils/common";

import GroupHelperPanel from "./GroupHelperPanel";
import GroupQRCodePanel from "./GroupQRCodePanel";

type PanelType =
  | "notices"
  | "joinRequests"
  | "onlineMembers"
  | "specialMembers"
  | "groupHelpers"
  | "groupQRCode";

const SPECIAL_ROLE = {
  normal: 3,
  invisible: 4,
  monitor: 5,
} as const;

type SpecialRole = (typeof SPECIAL_ROLE)[keyof typeof SPECIAL_ROLE];

const getUserName = (record: BusinessRecord) =>
  pickBusinessText(record, [
    "nickname",
    "nickName",
    "userName",
    "name",
    "account",
    "userId",
    "userID",
  ]);

const getFaceURL = (record: BusinessRecord) =>
  pickBusinessText(record, [
    "faceURL",
    "faceUrl",
    "avatar",
    "avatarUrl",
    "userFaceURL",
  ]);

const getNoticeText = (record: BusinessRecord) =>
  pickBusinessText(record, ["noticeContent", "content", "text", "notice", "message"]);

const getNoticeTitle = (record: BusinessRecord) =>
  pickBusinessText(record, ["title", "creatorName", "nickname", "userName"]) ||
  t("placeholder.groupAnnouncements");

const getNoticeId = (record: BusinessRecord) =>
  pickBusinessId(record, ["noticeId", "noticeID", "id"]);

const getSpecialRole = (record: BusinessRecord) => {
  const value = pickBusinessId(record, ["role", "specialRole", "memberRole"]);
  const role = Number(value);

  return Number.isFinite(role) ? role : SPECIAL_ROLE.normal;
};

const getSpecialRoleLabel = (role: number) => {
  if (role === SPECIAL_ROLE.invisible) {
    return t("placeholder.invisibleMember");
  }
  if (role === SPECIAL_ROLE.monitor) {
    return t("placeholder.monitorMember");
  }
  return t("placeholder.normalMember");
};

const GroupBusinessEntrances = ({
  roomId,
  hasPermissions,
  canShareQRCode = true,
  canViewOnlineMembers = true,
}: {
  roomId: string;
  hasPermissions: boolean;
  canShareQRCode?: boolean;
  canViewOnlineMembers?: boolean;
}) => {
  const [panel, setPanel] = useState<PanelType | null>(null);
  const [items, setItems] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [noticeContent, setNoticeContent] = useState("");
  const [addingNotice, setAddingNotice] = useState(false);
  const [editingNotice, setEditingNotice] = useState<BusinessRecord | null>(null);
  const normalizedRoomId = roomId.trim();
  const canUseRoomBusiness = Boolean(normalizedRoomId);

  const panelTitle = useMemo(() => {
    if (panel === "notices") {
      return t("placeholder.groupAnnouncements");
    }
    if (panel === "joinRequests") {
      return t("placeholder.joinRequests");
    }
    if (panel === "onlineMembers") {
      return t("placeholder.onlineMembers");
    }
    if (panel === "specialMembers") {
      return t("placeholder.specialMembers");
    }
    if (panel === "groupHelpers") {
      return t("placeholder.groupHelpers");
    }
    if (panel === "groupQRCode") {
      return t("placeholder.groupQRCode");
    }
    return "";
  }, [panel]);

  const loadPanel = useCallback(
    async (nextPanel: PanelType) => {
      setPanel(nextPanel);
      setItems([]);
      if (nextPanel === "groupHelpers" || nextPanel === "groupQRCode") {
        setLoading(false);
        setAddingNotice(false);
        setEditingNotice(null);
        setNoticeContent("");
        return;
      }
      if (!canUseRoomBusiness) {
        setLoading(false);
        setAddingNotice(false);
        setEditingNotice(null);
        setNoticeContent("");
        return;
      }
      setLoading(true);
      setAddingNotice(false);
      setEditingNotice(null);
      setNoticeContent("");
      try {
        if (nextPanel === "notices") {
          const response = await getOpenIMGroupNotices({ roomId: normalizedRoomId });
          setItems(
            mergeBusinessRecordsByKey(
              getBusinessListPayload(response),
              [],
              getNoticeId,
            ),
          );
          return;
        }

        const response =
          nextPanel === "joinRequests"
            ? await getOpenIMJoinRequests({
                roomId: normalizedRoomId,
                pageIndex: 0,
                pageSize: 50,
              })
            : nextPanel === "onlineMembers"
            ? await getOpenIMOnlineMembers({
                roomId: normalizedRoomId,
                pageIndex: 0,
                pageSize: 100,
              })
            : await getOpenIMSpecialMembers({
                roomId: normalizedRoomId,
                role: 0,
                pageIndex: 0,
                pageSize: 100,
              });
        setItems(getBusinessListPayload(response));
      } catch (error) {
        setItems([]);
        console.debug("Skipped business group panel list", {
          panel: nextPanel,
          roomId: normalizedRoomId,
          error,
        });
      } finally {
        setLoading(false);
      }
    },
    [canUseRoomBusiness, normalizedRoomId],
  );

  const reloadPanel = useCallback(async () => {
    if (panel) {
      await loadPanel(panel);
    }
  }, [loadPanel, panel]);

  const runConfirmedAction = useCallback(
    (title: string, content: string, action: () => Promise<unknown>) => {
      modal.confirm({
        title,
        content,
        onOk: async () => {
          try {
            await action();
            await reloadPanel();
            feedbackToast();
          } catch (error) {
            feedbackToast({ error });
          }
        },
      });
    },
    [reloadPanel],
  );

  const startAddNotice = useCallback(() => {
    if (!canUseRoomBusiness) {
      return;
    }

    setAddingNotice(true);
    setEditingNotice(null);
    setNoticeContent("");
  }, [canUseRoomBusiness]);

  const startEditNotice = useCallback(
    (record: BusinessRecord) => {
      const noticeId = pickBusinessId(record, ["noticeId", "id"]);

      if (!canUseRoomBusiness || !noticeId) {
        return;
      }

      setEditingNotice(record);
      setNoticeContent(getNoticeText(record));
    },
    [canUseRoomBusiness],
  );

  const saveNotice = useCallback(() => {
    if (!canUseRoomBusiness || (!addingNotice && !editingNotice)) {
      return;
    }

    const noticeId = editingNotice
      ? pickBusinessId(editingNotice, ["noticeId", "id"])
      : undefined;
    const content = noticeContent.trim();

    if (!content || (editingNotice && !noticeId)) {
      return;
    }

    runConfirmedAction(
      t("placeholder.save"),
      editingNotice
        ? t("placeholder.confirmUpdateGroupNotice")
        : t("placeholder.confirmAddGroupNotice"),
      async () => {
        if (editingNotice && noticeId) {
          await updateOpenIMGroupNotice({
            roomId: normalizedRoomId,
            noticeId,
            content,
          });
        } else {
          await addOpenIMGroupNotice({
            roomId: normalizedRoomId,
            content,
          });
        }
        setAddingNotice(false);
        setEditingNotice(null);
        setNoticeContent("");
      },
    );
  }, [
    addingNotice,
    canUseRoomBusiness,
    editingNotice,
    noticeContent,
    normalizedRoomId,
    runConfirmedAction,
  ]);

  const deleteNotice = useCallback(
    (record: BusinessRecord) => {
      const noticeId = pickBusinessId(record, ["noticeId", "id"]);

      if (!canUseRoomBusiness || !noticeId) {
        return;
      }

      runConfirmedAction(
        t("placeholder.delete"),
        t("placeholder.confirmDeleteRecord"),
        () =>
          deleteOpenIMGroupNotice({
            roomId: normalizedRoomId,
            noticeId,
          }),
      );
    },
    [canUseRoomBusiness, normalizedRoomId, runConfirmedAction],
  );

  const handleJoinRequest = useCallback(
    (record: BusinessRecord, agree: boolean) => {
      const requestId = pickBusinessJoinRequestId(record);

      if (!requestId) {
        return;
      }

      const actionText = agree ? t("placeholder.approve") : t("placeholder.reject");
      const userName = getUserName(record);

      runConfirmedAction(actionText, `${actionText} ${userName}?`, () =>
        handleOpenIMJoinRequest({
          requestId,
          agree,
        }),
      );
    },
    [runConfirmedAction],
  );

  const setSpecialRole = useCallback(
    (record: BusinessRecord, role: SpecialRole) => {
      const userId = pickBusinessId(record, ["userId", "userID", "targetUserId", "id"]);

      if (!canUseRoomBusiness || !userId) {
        return;
      }

      const roleText = getSpecialRoleLabel(role);
      const userName = getUserName(record);

      runConfirmedAction(roleText, `${roleText} ${userName}?`, () =>
        setOpenIMSpecialRole({
          roomId: normalizedRoomId,
          userId,
          role,
        }),
      );
    },
    [canUseRoomBusiness, normalizedRoomId, runConfirmedAction],
  );

  const renderNotices = () => (
    <>
      {hasPermissions && !addingNotice && !editingNotice && (
        <div className="mb-3 flex justify-end">
          <Button
            type="primary"
            disabled={!canUseRoomBusiness}
            onClick={startAddNotice}
          >
            {t("placeholder.add")}
          </Button>
        </div>
      )}
      {hasPermissions && (addingNotice || editingNotice) && (
        <div className="mb-3 flex gap-2">
          <Input.TextArea
            value={noticeContent}
            rows={2}
            maxLength={500}
            placeholder={t("placeholder.pleaseEnter")}
            onChange={(event) => setNoticeContent(event.target.value)}
          />
          <Button
            type="primary"
            disabled={!canUseRoomBusiness || !noticeContent.trim()}
            onClick={() => void saveNotice()}
          >
            {t("placeholder.save")}
          </Button>
          <Button
            onClick={() => {
              setAddingNotice(false);
              setEditingNotice(null);
              setNoticeContent("");
            }}
          >
            {t("cancel")}
          </Button>
        </div>
      )}
      <List
        dataSource={items}
        locale={{ emptyText: <Empty description={t("empty.noSearchResults")} /> }}
        renderItem={(item) => {
          const noticeId = pickBusinessId(item, ["noticeId", "id"]);

          return (
            <List.Item
              actions={
                hasPermissions
                  ? [
                      <Button
                        key="edit"
                        type="link"
                        disabled={!canUseRoomBusiness || !noticeId}
                        onClick={() => startEditNotice(item)}
                      >
                        {t("placeholder.edit")}
                      </Button>,
                      <Button
                        key="delete"
                        type="link"
                        danger
                        disabled={!canUseRoomBusiness || !noticeId}
                        onClick={() => deleteNotice(item)}
                      >
                        {t("placeholder.delete")}
                      </Button>,
                    ]
                  : undefined
              }
            >
              <List.Item.Meta
                title={getNoticeTitle(item)}
                description={getNoticeText(item)}
              />
            </List.Item>
          );
        }}
      />
    </>
  );

  const renderJoinRequests = () => (
    <List
      dataSource={items}
      locale={{ emptyText: <Empty description={t("empty.noSearchResults")} /> }}
      renderItem={(item) => {
        const requestId = pickBusinessJoinRequestId(item);

        return (
          <List.Item
            actions={[
              <Button
                key="approve"
                type="link"
                disabled={!requestId}
                onClick={() => handleJoinRequest(item, true)}
              >
                {t("placeholder.approve")}
              </Button>,
              <Button
                key="reject"
                type="link"
                danger
                disabled={!requestId}
                onClick={() => handleJoinRequest(item, false)}
              >
                {t("placeholder.reject")}
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<OIMAvatar src={getFaceURL(item)} text={getUserName(item)} />}
              title={getUserName(item)}
              description={pickBusinessText(item, ["reason", "remark", "message"])}
            />
          </List.Item>
        );
      }}
    />
  );

  const renderOnlineMembers = () => (
    <List
      dataSource={items}
      locale={{ emptyText: <Empty description={t("empty.noSearchResults")} /> }}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            avatar={<OIMAvatar src={getFaceURL(item)} text={getUserName(item)} />}
            title={getUserName(item)}
            description={pickBusinessText(item, ["userID", "userId", "account"])}
          />
        </List.Item>
      )}
    />
  );

  const renderSpecialMembers = () => (
    <List
      dataSource={items}
      locale={{ emptyText: <Empty description={t("empty.noSearchResults")} /> }}
      renderItem={(item) => {
        const role = getSpecialRole(item);
        const userId = pickBusinessId(item, ["userId", "userID", "targetUserId", "id"]);

        return (
          <List.Item
            actions={[
              <Button
                key="normal"
                type="link"
                disabled={
                  !canUseRoomBusiness || !userId || role === SPECIAL_ROLE.normal
                }
                onClick={() => setSpecialRole(item, SPECIAL_ROLE.normal)}
              >
                {t("placeholder.setNormalMember")}
              </Button>,
              <Button
                key="invisible"
                type="link"
                disabled={
                  !canUseRoomBusiness || !userId || role === SPECIAL_ROLE.invisible
                }
                onClick={() => setSpecialRole(item, SPECIAL_ROLE.invisible)}
              >
                {t("placeholder.setInvisibleMember")}
              </Button>,
              <Button
                key="monitor"
                type="link"
                disabled={
                  !canUseRoomBusiness || !userId || role === SPECIAL_ROLE.monitor
                }
                onClick={() => setSpecialRole(item, SPECIAL_ROLE.monitor)}
              >
                {t("placeholder.setMonitorMember")}
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<OIMAvatar src={getFaceURL(item)} text={getUserName(item)} />}
              title={getUserName(item)}
              description={getSpecialRoleLabel(role)}
            />
          </List.Item>
        );
      }}
    />
  );

  return (
    <>
      <SettingRow
        className="cursor-pointer"
        title={t("placeholder.groupAnnouncements")}
        rowClick={() => void loadPanel("notices")}
      >
        <RightOutlined rev={undefined} />
      </SettingRow>
      {hasPermissions && (
        <SettingRow
          className="cursor-pointer"
          title={t("placeholder.joinRequests")}
          rowClick={() => void loadPanel("joinRequests")}
        >
          <RightOutlined rev={undefined} />
        </SettingRow>
      )}
      {hasPermissions && (
        <SettingRow
          className="cursor-pointer"
          title={t("placeholder.specialMembers")}
          rowClick={() => void loadPanel("specialMembers")}
        >
          <RightOutlined rev={undefined} />
        </SettingRow>
      )}
      {hasPermissions && (
        <SettingRow
          className="cursor-pointer"
          title={t("placeholder.groupHelpers")}
          rowClick={() => void loadPanel("groupHelpers")}
        >
          <RightOutlined rev={undefined} />
        </SettingRow>
      )}
      {canShareQRCode && (
        <SettingRow
          className="cursor-pointer"
          title={t("placeholder.groupQRCode")}
          rowClick={() => void loadPanel("groupQRCode")}
        >
          <RightOutlined rev={undefined} />
        </SettingRow>
      )}
      {canViewOnlineMembers && (
        <SettingRow
          className="cursor-pointer"
          title={t("placeholder.onlineMembers")}
          rowClick={() => void loadPanel("onlineMembers")}
        >
          <RightOutlined rev={undefined} />
        </SettingRow>
      )}

      <Modal
        title={panelTitle}
        open={Boolean(panel)}
        footer={null}
        width={520}
        destroyOnClose
        onCancel={() => {
          setPanel(null);
          setItems([]);
        }}
      >
        <Spin spinning={loading}>
          {panel === "notices" && renderNotices()}
          {panel === "joinRequests" && renderJoinRequests()}
          {panel === "onlineMembers" && renderOnlineMembers()}
          {panel === "specialMembers" && renderSpecialMembers()}
          {panel === "groupHelpers" && <GroupHelperPanel roomId={normalizedRoomId} />}
          {panel === "groupQRCode" && <GroupQRCodePanel roomId={normalizedRoomId} />}
        </Spin>
      </Modal>
    </>
  );
};

export default memo(GroupBusinessEntrances);
