import { CloseOutlined } from "@ant-design/icons";
import { Button, Empty, List, Modal, Spin } from "antd";
import { t } from "i18next";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";

import { modal } from "@/AntdGlobalComp";
import {
  getSystemAnnouncementDetail,
  getSystemAnnouncements,
  getSystemAnnouncementUnreadCount,
  markAllSystemAnnouncementsRead,
  markSystemAnnouncementRead,
} from "@/api/announcement";
import {
  BusinessRecord,
  getBusinessListPayload,
  isBusinessRecord,
  pickBusinessId,
  pickBusinessNumber,
  pickBusinessText,
  toBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";
import { feedbackToast } from "@/utils/common";

import { OverlayVisibleHandle, useOverlayVisible } from "../../hooks/useOverlayVisible";

const toRecord = (payload: unknown): BusinessRecord => {
  const unwrapped = unwrapBusinessPayload(payload);

  if (isBusinessRecord(unwrapped)) {
    const nested = [unwrapped.announcement, unwrapped.detail, unwrapped.info].find(
      isBusinessRecord,
    );

    return {
      ...unwrapped,
      ...(nested ?? {}),
    };
  }

  return {};
};

const getUnreadCount = (payload: unknown) => {
  const unwrapped = unwrapBusinessPayload(payload);

  if (typeof unwrapped === "number" || typeof unwrapped === "string") {
    const count = Number(unwrapped);
    return Number.isFinite(count) ? count : 0;
  }

  if (!isBusinessRecord(unwrapped)) {
    return 0;
  }

  return (
    pickBusinessNumber(unwrapped, [
      "unreadCount",
      "unReadCount",
      "count",
      "total",
      "num",
    ]) ?? 0
  );
};

const getAnnouncementId = (record: BusinessRecord) =>
  pickBusinessId(record, ["announcementId", "noticeId", "id"]);

const getAnnouncementTitle = (record: BusinessRecord) =>
  pickBusinessText(record, ["title", "name", "subject"]) ||
  t("placeholder.systemAnnouncements");

const getAnnouncementContent = (record: BusinessRecord) =>
  pickBusinessText(record, [
    "content",
    "summary",
    "message",
    "text",
    "desc",
    "description",
  ]);

const getAnnouncementTime = (record: BusinessRecord) =>
  pickBusinessText(record, [
    "publishTime",
    "createdAt",
    "createTime",
    "updatedAt",
    "updateTime",
  ]);

const isAnnouncementUnread = (record: BusinessRecord) => {
  const value =
    record.readStatus ??
    record.isRead ??
    record.read ??
    record.status ??
    record.userReadStatus;
  const text = toBusinessText(value).toLowerCase();

  return (
    value === false ||
    value === 0 ||
    text === "0" ||
    text === "unread" ||
    text === "false"
  );
};

interface SystemAnnouncementsProps {
  onUnreadCountChange?: (count: number) => void;
}

const SystemAnnouncements: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  SystemAnnouncementsProps
> = ({ onUnreadCountChange }, ref) => {
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const [items, setItems] = useState<BusinessRecord[]>([]);
  const [detail, setDetail] = useState<BusinessRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await getSystemAnnouncementUnreadCount();
      onUnreadCountChange?.(getUnreadCount(response));
    } catch {
      onUnreadCountChange?.(0);
    }
  }, [onUnreadCountChange]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const [listResponse, countResponse] = await Promise.all([
        getSystemAnnouncements({ pageIndex: 0, pageSize: 30 }),
        getSystemAnnouncementUnreadCount(),
      ]);
      setItems(getBusinessListPayload(listResponse));
      onUnreadCountChange?.(getUnreadCount(countResponse));
    } catch (error) {
      setItems([]);
      onUnreadCountChange?.(0);
      console.debug("Failed to load system announcements", error);
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (isOverlayOpen) {
      void loadList();
    } else {
      setDetail(null);
    }
  }, [isOverlayOpen, loadList]);

  const openDetail = useCallback(async (record: BusinessRecord) => {
    const announcementId = getAnnouncementId(record);

    if (!announcementId) {
      setDetail(record);
      return;
    }

    setDetailLoading(true);
    try {
      const response = await getSystemAnnouncementDetail({ announcementId });
      setDetail(toRecord(response));
    } catch (error) {
      setDetail(record);
      console.debug("Failed to load system announcement detail", error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const submitMarkRead = useCallback(
    async (record: BusinessRecord) => {
      const announcementId = getAnnouncementId(record);

      if (!announcementId) {
        return;
      }

      try {
        await markSystemAnnouncementRead({ announcementId });
        await Promise.all([loadList(), refreshUnreadCount()]);
        feedbackToast();
      } catch (error) {
        feedbackToast({ error });
      }
    },
    [loadList, refreshUnreadCount],
  );

  const markRead = useCallback(
    (record: BusinessRecord) => {
      if (!getAnnouncementId(record)) {
        return;
      }

      modal.confirm({
        title: t("placeholder.markAsRead"),
        content: t("placeholder.confirmMarkAnnouncementRead"),
        onOk: () => submitMarkRead(record),
      });
    },
    [submitMarkRead],
  );

  const markAllRead = useCallback(() => {
    modal.confirm({
      title: t("placeholder.markAllAsRead"),
      content: t("placeholder.confirmMarkAllAnnouncementsRead"),
      onOk: async () => {
        try {
          await markAllSystemAnnouncementsRead();
          await Promise.all([loadList(), refreshUnreadCount()]);
          feedbackToast();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  }, [loadList, refreshUnreadCount]);

  const renderDetail = () => {
    if (!detail) {
      return null;
    }

    return (
      <div className="mb-4 rounded border border-[var(--gap-text)] p-3">
        <div className="mb-2 font-medium">{getAnnouncementTitle(detail)}</div>
        {getAnnouncementTime(detail) && (
          <div className="mb-2 text-xs text-[var(--sub-text)]">
            {getAnnouncementTime(detail)}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words text-sm">
          {getAnnouncementContent(detail) || t("empty.fileContentEmpty")}
        </div>
        {getAnnouncementId(detail) && (
          <div className="mt-3 flex justify-end">
            <Button size="small" onClick={() => void markRead(detail)}>
              {t("placeholder.markAsRead")}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      title={null}
      footer={null}
      closable={false}
      open={isOverlayOpen}
      onCancel={closeOverlay}
      centered
      destroyOnClose
      styles={{
        mask: {
          opacity: 0,
          transition: "none",
        },
      }}
      width={520}
      className="no-padding-modal max-w-[80vw]"
      maskTransitionName=""
    >
      <div className="bg-[var(--chat-bubble)]">
        <div className="app-drag flex items-center justify-between bg-[var(--gap-text)] p-5">
          <span className="text-base font-medium">
            {t("placeholder.systemAnnouncements")}
          </span>
          <CloseOutlined
            className="app-no-drag cursor-pointer text-[#8e9aaf]"
            rev={undefined}
            onClick={closeOverlay}
          />
        </div>
        <Spin spinning={loading || detailLoading}>
          <div className="max-h-[70vh] overflow-y-auto p-4">
            <div className="mb-3 flex justify-end">
              <Button size="small" onClick={markAllRead}>
                {t("placeholder.markAllAsRead")}
              </Button>
            </div>
            {renderDetail()}
            <List
              dataSource={items}
              locale={{ emptyText: <Empty description={t("empty.noSearchResults")} /> }}
              renderItem={(item) => {
                const announcementId = getAnnouncementId(item);
                const unread = isAnnouncementUnread(item);

                return (
                  <List.Item
                    className="cursor-pointer"
                    actions={[
                      <Button
                        key="read"
                        type="link"
                        size="small"
                        disabled={!announcementId || !unread}
                        onClick={(event) => {
                          event.stopPropagation();
                          void markRead(item);
                        }}
                      >
                        {t("placeholder.markAsRead")}
                      </Button>,
                    ]}
                    onClick={() => void openDetail(item)}
                  >
                    <List.Item.Meta
                      title={
                        <span className={unread ? "font-medium" : undefined}>
                          {getAnnouncementTitle(item)}
                        </span>
                      }
                      description={
                        <>
                          <div className="line-clamp-2">
                            {getAnnouncementContent(item)}
                          </div>
                          {getAnnouncementTime(item) && (
                            <div className="mt-1 text-xs text-[var(--sub-text)]">
                              {getAnnouncementTime(item)}
                            </div>
                          )}
                        </>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </div>
        </Spin>
      </div>
    </Modal>
  );
};

export default memo(forwardRef(SystemAnnouncements));
