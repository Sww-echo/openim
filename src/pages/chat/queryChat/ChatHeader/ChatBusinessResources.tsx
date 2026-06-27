import { ConversationItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { Button, Empty, Input, List, Modal, Spin, Tabs } from "antd";
import { t } from "i18next";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { modal } from "@/AntdGlobalComp";
import {
  deleteFavoriteMessage,
  deleteMergeMessage,
  getFavoriteMessageContext,
  getFavoriteMessageDetail,
  getFavoriteMessages,
  getMergeMessageContext,
  getMergeMessageDetail,
  getSavedMergeMessages,
  updateFavoriteMessage,
} from "@/api/chat";
import {
  deleteFileResource,
  getFileReferenceStatus,
  getFileResourceDetail,
  getFileResourceReferences,
  getFileResources,
  getFileStorageOverview,
  getRoomFileStorageOverview,
  triggerBusinessFileDownload,
} from "@/api/file";
import {
  deleteOpenIMGroupShare,
  getOpenIMGroupShare,
  getOpenIMGroupShares,
} from "@/api/group";
import { useConversationStore } from "@/store";
import {
  BusinessRecord,
  getBusinessListPayload,
  pickBusinessId,
  pickBusinessNumber,
  pickBusinessText,
  pickExplicitBusinessRoomId,
} from "@/utils/businessPayload";
import { bytesToSize, feedbackToast } from "@/utils/common";

type ResourceTab = "favorites" | "merge" | "files" | "groupShares";

const PAGE_SIZE = 50;

const getFavoriteId = (record: BusinessRecord) =>
  pickBusinessId(record, ["favoriteId", "id"]);

const getEditableText = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" || typeof item === "number" ? String(item) : "",
      )
      .filter(Boolean)
      .join(",");
  }
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
};

const getMergeId = (record: BusinessRecord) =>
  pickBusinessId(record, ["mergeId", "id"]);

const getFileId = (record: BusinessRecord) =>
  pickBusinessId(record, ["fileId", "fileID", "resourceId", "id"]);

const getShareId = (record: BusinessRecord) =>
  pickBusinessId(record, ["shareId", "shareID", "id"]);

const getActionFileId = (record: BusinessRecord, tab: ResourceTab) =>
  tab === "groupShares"
    ? pickBusinessId(record, ["fileId", "fileID", "resourceId"])
    : getFileId(record);

const getMessageTitle = (record: BusinessRecord) =>
  pickBusinessText(record, [
    "title",
    "senderNickname",
    "nickname",
    "senderName",
    "fromUserId",
    "roomName",
  ]) || t("placeholder.messageHistory");

const getMessageDescription = (record: BusinessRecord) =>
  pickBusinessText(record, [
    "contentText",
    "content",
    "text",
    "message",
    "body",
    "note",
  ]) || JSON.stringify(record);

const getFileTitle = (record: BusinessRecord) =>
  pickBusinessText(record, [
    "fileName",
    "filename",
    "name",
    "originalName",
    "originName",
  ]) || t("placeholder.file");

const getFileDescription = (record: BusinessRecord) => {
  const fileSize = pickBusinessNumber(record, ["fileSize", "size"]);
  const ext = pickBusinessText(record, ["ext", "fileExt", "contentType", "mimeType"]);
  const meta = [fileSize === undefined ? "" : bytesToSize(fileSize), ext].filter(
    Boolean,
  );

  return meta.length > 0 ? meta.join(" / ") : JSON.stringify(record);
};

const showJsonDetail = (title: string, response: unknown) => {
  modal.info({
    title,
    width: 560,
    content: (
      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-xs">
        {JSON.stringify(response, null, 2)}
      </pre>
    ),
  });
};

const showReadonlyDetailFallback = (title: string, error: unknown) => {
  console.debug("[business-resource] readonly detail request failed", error);
  showJsonDetail(title, {});
};

const ChatBusinessResources = ({
  open,
  conversation,
  onClose,
}: {
  open: boolean;
  conversation?: ConversationItem;
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<ResourceTab>("favorites");
  const [items, setItems] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<{
    favoriteId: string | number;
    title: string;
    note: string;
    tags: string;
  }>();
  const [savingFavorite, setSavingFavorite] = useState(false);
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);
  const fallbackGroupID = conversation?.groupID ?? "";
  const businessRoomId = useMemo(
    () =>
      pickExplicitBusinessRoomId(
        currentGroupInfo as BusinessRecord | undefined,
        fallbackGroupID,
      ),
    [currentGroupInfo, fallbackGroupID],
  );
  const groupShareRoomId = businessRoomId || fallbackGroupID;
  const canShowGroupShares = Boolean(conversation?.groupID && groupShareRoomId);

  const loadItems = useCallback(
    async (nextTab: ResourceTab) => {
      setLoading(true);
      try {
        let response: unknown;

        if (nextTab === "favorites") {
          response = await getFavoriteMessages({
            deleted: 0,
            pageIndex: 0,
            pageSize: PAGE_SIZE,
          });
        } else if (nextTab === "merge") {
          response = await getSavedMergeMessages({
            deleted: 0,
            pageIndex: 0,
            pageSize: PAGE_SIZE,
          });
        } else if (nextTab === "groupShares") {
          if (!groupShareRoomId) {
            setItems([]);
            return;
          }
          response = await getOpenIMGroupShares({
            roomId: groupShareRoomId,
            pageIndex: 0,
            pageSize: PAGE_SIZE,
            userId: 0,
          });
        } else {
          response = await getFileResources({
            deleted: 0,
            pageIndex: 0,
            pageSize: PAGE_SIZE,
            roomId: businessRoomId || undefined,
          });
        }
        setItems(getBusinessListPayload(response));
      } catch (error) {
        setItems([]);
        console.debug("Failed to load chat business resources", error);
      } finally {
        setLoading(false);
      }
    },
    [businessRoomId, groupShareRoomId],
  );

  useEffect(() => {
    if (open) {
      void loadItems(activeTab);
    }
  }, [activeTab, loadItems, open]);

  useEffect(() => {
    if (!canShowGroupShares && activeTab === "groupShares") {
      setActiveTab("files");
    }
  }, [activeTab, canShowGroupShares]);

  const reload = useCallback(async () => {
    await loadItems(activeTab);
  }, [activeTab, loadItems]);

  const openFavoriteEditor = useCallback((record: BusinessRecord) => {
    const favoriteId = getFavoriteId(record);

    if (!favoriteId) {
      return;
    }

    setEditingFavorite({
      favoriteId,
      title: pickBusinessText(record, ["title"]) || getMessageTitle(record),
      note: pickBusinessText(record, ["note", "contentText", "content", "message"]),
      tags: getEditableText(record.tags),
    });
  }, []);

  const saveFavoriteEdit = useCallback(() => {
    if (!editingFavorite) {
      return;
    }

    modal.confirm({
      title: t("placeholder.editFavorite"),
      content: t("placeholder.confirmUpdateFavorite"),
      onOk: async () => {
        setSavingFavorite(true);
        try {
          await updateFavoriteMessage({
            favoriteId: editingFavorite.favoriteId,
            title: editingFavorite.title,
            note: editingFavorite.note,
            tags: editingFavorite.tags,
          });
          setEditingFavorite(undefined);
          await reload();
          feedbackToast();
        } catch (error) {
          feedbackToast({ error });
        } finally {
          setSavingFavorite(false);
        }
      },
    });
  }, [editingFavorite, reload]);

  const showActiveTabContext = useCallback(async () => {
    try {
      const response =
        activeTab === "favorites"
          ? await getFavoriteMessageContext()
          : activeTab === "merge"
          ? await getMergeMessageContext()
          : activeTab === "groupShares" && groupShareRoomId
          ? await getRoomFileStorageOverview(groupShareRoomId)
          : await getFileStorageOverview();
      const title =
        activeTab === "favorites"
          ? t("placeholder.favoriteContext")
          : activeTab === "merge"
          ? t("placeholder.mergeContext")
          : t("placeholder.fileStorageOverview");

      showJsonDetail(title, response);
    } catch (error) {
      const title =
        activeTab === "favorites"
          ? t("placeholder.favoriteContext")
          : activeTab === "merge"
          ? t("placeholder.mergeContext")
          : t("placeholder.fileStorageOverview");
      showReadonlyDetailFallback(title, error);
    }
  }, [activeTab, groupShareRoomId]);

  const showDetail = useCallback(
    async (record: BusinessRecord) => {
      const title = t("placeholder.details");

      try {
        if (activeTab === "favorites") {
          const favoriteId = getFavoriteId(record);
          if (!favoriteId) {
            return;
          }
          showJsonDetail(title, await getFavoriteMessageDetail(favoriteId));
          return;
        }
        if (activeTab === "merge") {
          const mergeId = getMergeId(record);
          if (!mergeId) {
            return;
          }
          showJsonDetail(title, await getMergeMessageDetail(mergeId));
          return;
        }
        if (activeTab === "groupShares") {
          const shareId = getShareId(record);

          if (!groupShareRoomId || !shareId) {
            showJsonDetail(title, record);
            return;
          }

          showJsonDetail(
            title,
            await getOpenIMGroupShare({
              roomId: groupShareRoomId,
              shareId,
            }),
          );
          return;
        }

        const fileId = getFileId(record);
        if (!fileId) {
          return;
        }
        showJsonDetail(title, await getFileResourceDetail(fileId));
      } catch (error) {
        showReadonlyDetailFallback(title, error);
      }
    },
    [activeTab, groupShareRoomId],
  );

  const showFileReferenceStatus = useCallback(
    async (record: BusinessRecord) => {
      const fileId = getActionFileId(record, activeTab);

      if (!fileId) {
        return;
      }

      const title = t("placeholder.fileReferenceStatus");

      try {
        showJsonDetail(title, await getFileReferenceStatus(fileId));
      } catch (error) {
        showReadonlyDetailFallback(title, error);
      }
    },
    [activeTab],
  );

  const showFileReferences = useCallback(
    async (record: BusinessRecord) => {
      const fileId = getActionFileId(record, activeTab);

      if (!fileId) {
        return;
      }

      const title = t("placeholder.fileReferences");

      try {
        showJsonDetail(title, await getFileResourceReferences(fileId));
      } catch (error) {
        showReadonlyDetailFallback(title, error);
      }
    },
    [activeTab],
  );

  const downloadFile = useCallback(
    (record: BusinessRecord) => {
      const fileId = getActionFileId(record, activeTab);

      if (!fileId) {
        return;
      }

      modal.confirm({
        title: t("placeholder.download"),
        content: t("placeholder.confirmDownloadFile"),
        onOk: async () => {
          try {
            await triggerBusinessFileDownload(fileId, getFileTitle(record));
          } catch (error) {
            feedbackToast({ error });
          }
        },
      });
    },
    [activeTab],
  );

  const deleteRecord = useCallback(
    (record: BusinessRecord) => {
      const recordId =
        activeTab === "favorites"
          ? getFavoriteId(record)
          : activeTab === "merge"
          ? getMergeId(record)
          : activeTab === "groupShares"
          ? getShareId(record)
          : getFileId(record);

      if (!recordId) {
        return;
      }

      modal.confirm({
        title: t("placeholder.delete"),
        content: t("placeholder.confirmDeleteRecord"),
        onOk: async () => {
          try {
            if (activeTab === "favorites") {
              await deleteFavoriteMessage(recordId);
            } else if (activeTab === "merge") {
              await deleteMergeMessage(recordId);
            } else if (activeTab === "groupShares") {
              if (!groupShareRoomId) {
                return;
              }
              await deleteOpenIMGroupShare({
                roomId: groupShareRoomId,
                shareId: recordId,
              });
            } else {
              await deleteFileResource(recordId);
            }
            await reload();
            feedbackToast();
          } catch (error) {
            feedbackToast({ error });
          }
        },
      });
    },
    [activeTab, groupShareRoomId, reload],
  );

  const renderList = useCallback(
    (tab: ResourceTab) => (
      <Spin spinning={loading}>
        <List
          dataSource={items}
          locale={{ emptyText: <Empty description={t("empty.noSearchResults")} /> }}
          renderItem={(item) => {
            const isFile = tab === "files" || tab === "groupShares";
            const actionFileId = isFile ? getActionFileId(item, tab) : undefined;
            const hasActionFileId = actionFileId !== undefined && actionFileId !== "";
            const favoriteId = tab === "favorites" ? getFavoriteId(item) : undefined;
            const mergeId = tab === "merge" ? getMergeId(item) : undefined;
            const fileId = tab === "files" ? getFileId(item) : undefined;
            const shareId = tab === "groupShares" ? getShareId(item) : undefined;
            const canShowDetail =
              tab === "favorites"
                ? Boolean(favoriteId)
                : tab === "merge"
                ? Boolean(mergeId)
                : tab === "files"
                ? Boolean(fileId)
                : true;
            const canDelete =
              tab === "favorites"
                ? Boolean(favoriteId)
                : tab === "merge"
                ? Boolean(mergeId)
                : tab === "files"
                ? Boolean(fileId)
                : Boolean(shareId);
            const title = isFile ? getFileTitle(item) : getMessageTitle(item);
            const description = isFile
              ? getFileDescription(item)
              : getMessageDescription(item);

            return (
              <List.Item
                actions={[
                  <Button
                    key="detail"
                    type="link"
                    disabled={!canShowDetail}
                    onClick={() => void showDetail(item)}
                  >
                    {t("placeholder.details")}
                  </Button>,
                  isFile && hasActionFileId && (
                    <Button
                      key="status"
                      type="link"
                      onClick={() => void showFileReferenceStatus(item)}
                    >
                      {t("placeholder.fileReferenceStatus")}
                    </Button>
                  ),
                  isFile && hasActionFileId && (
                    <Button
                      key="references"
                      type="link"
                      onClick={() => void showFileReferences(item)}
                    >
                      {t("placeholder.fileReferences")}
                    </Button>
                  ),
                  isFile && hasActionFileId && (
                    <Button
                      key="download"
                      type="link"
                      onClick={() => void downloadFile(item)}
                    >
                      {t("placeholder.download")}
                    </Button>
                  ),
                  tab === "favorites" && (
                    <Button
                      key="edit"
                      type="link"
                      disabled={!favoriteId}
                      onClick={() => openFavoriteEditor(item)}
                    >
                      {t("placeholder.edit")}
                    </Button>
                  ),
                  canDelete && (
                    <Button
                      key="delete"
                      type="link"
                      danger
                      onClick={() => deleteRecord(item)}
                    >
                      {t("placeholder.delete")}
                    </Button>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta title={title} description={description} />
              </List.Item>
            );
          }}
        />
      </Spin>
    ),
    [
      deleteRecord,
      downloadFile,
      items,
      loading,
      openFavoriteEditor,
      showDetail,
      showFileReferenceStatus,
      showFileReferences,
    ],
  );

  const tabItems = useMemo(() => {
    const tabs = [
      {
        key: "favorites",
        label: t("placeholder.favoriteMessages"),
        children: renderList("favorites"),
      },
      {
        key: "merge",
        label: t("placeholder.savedMergeMessages"),
        children: renderList("merge"),
      },
      {
        key: "files",
        label: t("placeholder.fileResources"),
        children: renderList("files"),
      },
    ];

    if (canShowGroupShares) {
      tabs.push({
        key: "groupShares",
        label: t("placeholder.groupSharedFiles"),
        children: renderList("groupShares"),
      });
    }

    return tabs;
  }, [canShowGroupShares, renderList]);

  const contextButtonLabel =
    activeTab === "favorites"
      ? t("placeholder.favoriteContext")
      : activeTab === "merge"
      ? t("placeholder.mergeContext")
      : t("placeholder.fileStorageOverview");

  return (
    <Modal
      title={t("placeholder.chatResources")}
      open={open}
      footer={null}
      width={680}
      destroyOnClose
      onCancel={() => {
        setItems([]);
        onClose();
      }}
    >
      <div className="mb-3 flex justify-end">
        <Button size="small" onClick={() => void showActiveTabContext()}>
          {contextButtonLabel}
        </Button>
      </div>
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) => setActiveTab(key as ResourceTab)}
      />
      <Modal
        title={t("placeholder.editFavorite")}
        open={Boolean(editingFavorite)}
        confirmLoading={savingFavorite}
        okText={t("placeholder.save")}
        onCancel={() => setEditingFavorite(undefined)}
        onOk={() => saveFavoriteEdit()}
      >
        <div className="space-y-3">
          <Input
            value={editingFavorite?.title}
            placeholder={t("placeholder.favoriteTitle")}
            onChange={(event) =>
              setEditingFavorite((current) =>
                current ? { ...current, title: event.target.value } : current,
              )
            }
          />
          <Input.TextArea
            value={editingFavorite?.note}
            autoSize={{ minRows: 3, maxRows: 5 }}
            placeholder={t("placeholder.favoriteNote")}
            onChange={(event) =>
              setEditingFavorite((current) =>
                current ? { ...current, note: event.target.value } : current,
              )
            }
          />
          <Input
            value={editingFavorite?.tags}
            placeholder={t("placeholder.favoriteTags")}
            onChange={(event) =>
              setEditingFavorite((current) =>
                current ? { ...current, tags: event.target.value } : current,
              )
            }
          />
        </div>
      </Modal>
    </Modal>
  );
};

export default memo(ChatBusinessResources);
