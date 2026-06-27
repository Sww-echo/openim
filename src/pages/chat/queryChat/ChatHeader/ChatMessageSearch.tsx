import { MessageItem as OpenIMMessageItem, ViewType } from "@openim/wasm-client-sdk";
import { ConversationItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { Button, Empty, Input, List, Modal, Spin } from "antd";
import { t } from "i18next";
import { memo, useCallback, useState } from "react";

import { modal } from "@/AntdGlobalComp";
import {
  addFavoriteMessage,
  mergeFavoriteMessages,
  previewMergeMessage,
  saveMergeMessage,
  searchGroupMessages,
  searchSingleMessages,
} from "@/api/chat";
import {
  BusinessRecord,
  getBusinessListPayload,
  pickBusinessAuditId,
  pickExplicitBusinessRoomId,
  pickBusinessText,
} from "@/utils/businessPayload";
import { feedbackToast } from "@/utils/common";
import { useConversationStore } from "@/store";
import { IMSDK } from "@/layout/MainContentWrap";

const LOCAL_SEARCH_RESULT = "__localSearchResult";

const normalizeSearchId = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const getAuditId = (record: BusinessRecord) =>
  record[LOCAL_SEARCH_RESULT] ? undefined : pickBusinessAuditId(record);

const getMessageTitle = (record: BusinessRecord, conversation?: ConversationItem) =>
  pickBusinessText(record, [
    "senderNickname",
    "nickname",
    "senderName",
    "fromUserId",
  ]) ||
  conversation?.showName ||
  "";

const getMessageContent = (record: BusinessRecord) =>
  pickBusinessText(record, ["contentText", "content", "text", "message", "body"]) ||
  JSON.stringify(record);

const collectLocalText = (value: unknown): string[] => {
  if (typeof value === "string") {
    return value.trim() ? [value] : [];
  }

  if (typeof value === "number") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectLocalText);
  }

  return [];
};

const joinLocalText = (...values: unknown[]) => collectLocalText(values).join(" ");

const getLocalMessageText = (message: OpenIMMessageItem, depth = 0): string =>
  joinLocalText(
    message.textElem?.content,
    message.advancedTextElem?.text,
    message.atTextElem?.text,
    depth === 0 && message.atTextElem?.quoteMessage
      ? getLocalMessageText(message.atTextElem.quoteMessage, depth + 1)
      : undefined,
    message.quoteElem?.text,
    depth === 0 && message.quoteElem?.quoteMessage
      ? getLocalMessageText(message.quoteElem.quoteMessage, depth + 1)
      : undefined,
    message.fileElem?.fileName,
    message.fileElem?.sourceUrl,
    message.videoElem?.videoUrl,
    message.videoElem?.snapshotUrl,
    message.pictureElem?.sourcePicture?.url,
    message.pictureElem?.bigPicture?.url,
    message.pictureElem?.snapshotPicture?.url,
    message.cardElem?.nickname,
    message.cardElem?.userID,
    message.mergeElem?.title,
    message.mergeElem?.abstractList,
    message.soundElem?.sourceUrl,
    message.locationElem?.description,
    message.customElem?.description,
    message.customElem?.data,
    message.customElem?.extension,
    message.notificationElem?.detail,
    message.typingElem?.msgTips,
    message.content,
  );

const toLocalSearchRecord = (message: OpenIMMessageItem): BusinessRecord => ({
  [LOCAL_SEARCH_RESULT]: true,
  clientMsgID: message.clientMsgID,
  serverMsgID: message.serverMsgID,
  senderNickname: message.senderNickname || message.sendID,
  fromUserId: message.sendID,
  sendTime: message.sendTime,
  contentText: getLocalMessageText(message),
});

const searchLocalMessages = async (
  conversationID: string,
  keyword: string,
): Promise<BusinessRecord[]> => {
  const { data } = await IMSDK.getAdvancedHistoryMessageList({
    count: 100,
    startClientMsgID: "",
    conversationID,
    viewType: ViewType.History,
  });
  const normalizedKeyword = keyword.toLowerCase();

  return data.messageList
    .filter((message) =>
      getLocalMessageText(message).toLowerCase().includes(normalizedKeyword),
    )
    .map(toLocalSearchRecord);
};

const ChatMessageSearch = ({
  open,
  conversation,
  onClose,
}: {
  open: boolean;
  conversation?: ConversationItem;
  onClose: () => void;
}) => {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BusinessRecord[]>([]);
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);

  const searchMessages = useCallback(
    async (value: string) => {
      const nextKeyword = value.trim();

      if (!nextKeyword || !conversation) {
        return;
      }

      setKeyword(nextKeyword);
      setLoading(true);
      try {
        let nextItems: BusinessRecord[] = [];
        let businessSearchError: unknown;
        let localSearchError: unknown;
        try {
          const conversationGroupID = normalizeSearchId(conversation.groupID);
          if (conversationGroupID) {
            const businessRoomId = normalizeSearchId(
              pickExplicitBusinessRoomId(
                currentGroupInfo as BusinessRecord | undefined,
                conversationGroupID,
              ) || conversationGroupID,
            );
            if (businessRoomId) {
              const response = await searchGroupMessages({
                roomId: businessRoomId,
                keyword: nextKeyword,
                pageIndex: 0,
                pageSize: 50,
              });
              nextItems = getBusinessListPayload(response);
            }
          } else {
            const peerUserId = normalizeSearchId(conversation.userID);
            if (peerUserId) {
              const response = await searchSingleMessages({
                peerUserId,
                keyword: nextKeyword,
                pageIndex: 0,
                pageSize: 50,
              });
              nextItems = getBusinessListPayload(response);
            }
          }
        } catch (error) {
          businessSearchError = error;
          console.debug("Business message search failed", error);
        }

        if (!nextItems.length) {
          try {
            nextItems = await searchLocalMessages(
              conversation.conversationID,
              nextKeyword,
            );
          } catch (error) {
            localSearchError = error;
            if (!businessSearchError) {
              throw error;
            }
          }
        }

        if (businessSearchError && !nextItems.length) {
          console.debug("Skipped business message search results", {
            businessSearchError,
            localSearchError,
          });
        }

        setItems(nextItems);
      } catch (error) {
        setItems([]);
        feedbackToast({ error });
      } finally {
        setLoading(false);
      }
    },
    [conversation, currentGroupInfo],
  );

  const previewMerge = useCallback(
    async (item: BusinessRecord) => {
      const auditId = getAuditId(item);

      if (!auditId) {
        return;
      }

      try {
        const response = await previewMergeMessage({
          auditIds: String(auditId),
          title: getMessageTitle(item, conversation),
        });
        modal.info({
          title: t("placeholder.mergePreview"),
          width: 560,
          content: (
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-xs">
              {JSON.stringify(response, null, 2)}
            </pre>
          ),
        });
      } catch (error) {
        feedbackToast({ error });
      }
    },
    [conversation],
  );

  const saveMerge = useCallback(
    (item: BusinessRecord) => {
      const auditId = getAuditId(item);

      if (!auditId) {
        return;
      }

      modal.confirm({
        title: t("placeholder.saveMergeMessage"),
        content: t("placeholder.confirmSaveMergeMessage"),
        onOk: async () => {
          try {
            await saveMergeMessage({
              auditIds: String(auditId),
              title: getMessageTitle(item, conversation),
              note: getMessageContent(item).slice(0, 120),
            });
            feedbackToast();
          } catch (error) {
            feedbackToast({ error });
          }
        },
      });
    },
    [conversation],
  );

  const favoriteSearchResult = useCallback((item: BusinessRecord) => {
    const auditId = getAuditId(item);

    if (!auditId) {
      return;
    }

    modal.confirm({
      title: t("placeholder.favorite"),
      content: t("placeholder.confirmFavoriteSearchResult"),
      onOk: async () => {
        try {
          await addFavoriteMessage(String(auditId));
          feedbackToast();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  }, []);

  const mergeFavoriteSearchResult = useCallback(
    (item: BusinessRecord) => {
      const auditId = getAuditId(item);

      if (!auditId) {
        return;
      }

      modal.confirm({
        title: t("placeholder.mergeFavoriteMessages"),
        content: t("placeholder.confirmMergeFavoriteSearchResult"),
        onOk: async () => {
          try {
            await mergeFavoriteMessages({
              auditIds: String(auditId),
              title: getMessageTitle(item, conversation),
              note: getMessageContent(item).slice(0, 120),
            });
            feedbackToast();
          } catch (error) {
            feedbackToast({ error });
          }
        },
      });
    },
    [conversation],
  );

  return (
    <Modal
      title={t("placeholder.chatHistorySearch")}
      open={open}
      footer={null}
      destroyOnClose
      width={560}
      onCancel={() => {
        setItems([]);
        setKeyword("");
        onClose();
      }}
    >
      <Input.Search
        autoFocus
        className="mb-3"
        defaultValue={keyword}
        placeholder={t("placeholder.search")}
        enterButton
        onSearch={(value) => void searchMessages(value)}
      />
      <Spin spinning={loading}>
        <List
          dataSource={items}
          locale={{ emptyText: <Empty description={t("empty.noSearchResults")} /> }}
          renderItem={(item) => {
            const title = getMessageTitle(item, conversation);
            const content = getMessageContent(item);
            const auditId = getAuditId(item);

            return (
              <List.Item
                actions={
                  auditId
                    ? [
                        <Button
                          key="preview"
                          type="link"
                          onClick={() => void previewMerge(item)}
                        >
                          {t("placeholder.mergePreview")}
                        </Button>,
                        <Button
                          key="save"
                          type="link"
                          onClick={() => void saveMerge(item)}
                        >
                          {t("placeholder.saveMergeMessage")}
                        </Button>,
                        <Button
                          key="favorite"
                          type="link"
                          onClick={() => void favoriteSearchResult(item)}
                        >
                          {t("placeholder.favorite")}
                        </Button>,
                        <Button
                          key="mergeFavorite"
                          type="link"
                          onClick={() => void mergeFavoriteSearchResult(item)}
                        >
                          {t("placeholder.mergeFavoriteMessages")}
                        </Button>,
                      ]
                    : undefined
                }
              >
                <List.Item.Meta title={title} description={content} />
              </List.Item>
            );
          }}
        />
      </Spin>
    </Modal>
  );
};

export default memo(ChatMessageSearch);
