import { Button, Empty, Input, List, Spin } from "antd";
import { t } from "i18next";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { modal } from "@/AntdGlobalComp";
import {
  addOpenIMGroupHelper,
  addOpenIMGroupHelperKeyword,
  deleteOpenIMGroupHelper,
  deleteOpenIMGroupHelperKeyword,
  getAvailableOpenIMGroupHelpers,
  getOpenIMGroupHelperContext,
  getOpenIMGroupHelpers,
  updateOpenIMGroupHelperKeyword,
} from "@/api/group";
import {
  BusinessRecord,
  getBusinessListPayload,
  isBusinessRecord,
  pickBusinessId,
  pickBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";
import { feedbackToast } from "@/utils/common";

interface KeywordEditState {
  groupHelperId: string | number;
  helperId?: string | number;
  keyWordId?: string | number;
}

const getHelperName = (record: BusinessRecord) =>
  pickBusinessText(record, [
    "helperName",
    "name",
    "title",
    "appName",
    "openAppName",
    "nickname",
  ]) || pickBusinessText(record, ["helperId", "id"]);

const getHelperDescription = (record: BusinessRecord) =>
  pickBusinessText(record, ["description", "desc", "remark", "intro", "content"]);

const getHelperId = (record: BusinessRecord) =>
  pickBusinessId(record, ["helperId", "openHelperId", "appHelperId", "id"]);

const getGroupHelperId = (record: BusinessRecord) =>
  pickBusinessId(record, [
    "groupHelperId",
    "roomHelperId",
    "helperRecordId",
    "groupAssistantId",
    "id",
  ]);

const getKeywordId = (record: BusinessRecord) =>
  pickBusinessId(record, ["keyWordId", "keywordId", "id"]);

const getKeywordText = (record: BusinessRecord) =>
  pickBusinessText(record, ["keyword", "keyWord", "key", "name"]);

const getKeywordValue = (record: BusinessRecord) =>
  pickBusinessText(record, ["value", "reply", "content", "response"]);

const getKeywordList = (record: BusinessRecord) => {
  const list = ["keywords", "keywordList", "keyWords", "autoResponses", "responses"]
    .map((key) => record[key])
    .find(Array.isArray);

  return Array.isArray(list) ? list.filter(isBusinessRecord) : [];
};

const getContextText = (payload: unknown) => {
  const context = unwrapBusinessPayload(payload);

  if (!isBusinessRecord(context)) {
    return "";
  }

  return pickBusinessText(context, [
    "description",
    "desc",
    "message",
    "remark",
    "notice",
  ]);
};

const GroupHelperPanel = ({ roomId }: { roomId: string }) => {
  const [helpers, setHelpers] = useState<BusinessRecord[]>([]);
  const [availableHelpers, setAvailableHelpers] = useState<BusinessRecord[]>([]);
  const [contextText, setContextText] = useState("");
  const [loading, setLoading] = useState(false);
  const [keywordEdit, setKeywordEdit] = useState<KeywordEditState | null>(null);
  const [keyword, setKeyword] = useState("");
  const [keywordValue, setKeywordValue] = useState("");

  const emptyNode = useMemo(
    () => <Empty description={t("empty.noSearchResults")} />,
    [],
  );
  const normalizedRoomId = roomId.trim();
  const canManage = Boolean(normalizedRoomId);

  const loadData = useCallback(async () => {
    if (!canManage) {
      setContextText("");
      setHelpers([]);
      setAvailableHelpers([]);
      return;
    }

    setLoading(true);
    try {
      const [contextResponse, helpersResponse, availableResponse] = await Promise.all([
        getOpenIMGroupHelperContext({ roomId: normalizedRoomId }),
        getOpenIMGroupHelpers({ roomId: normalizedRoomId }),
        getAvailableOpenIMGroupHelpers({
          roomId: normalizedRoomId,
          pageIndex: 0,
          pageSize: 50,
        }),
      ]);

      setContextText(getContextText(contextResponse));
      setHelpers(getBusinessListPayload(helpersResponse));
      setAvailableHelpers(getBusinessListPayload(availableResponse));
    } catch (error) {
      setContextText("");
      setHelpers([]);
      setAvailableHelpers([]);
      console.debug("Skipped business group helpers panel", {
        roomId: normalizedRoomId,
        error,
      });
    } finally {
      setLoading(false);
    }
  }, [canManage, normalizedRoomId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetKeywordEdit = useCallback(() => {
    setKeywordEdit(null);
    setKeyword("");
    setKeywordValue("");
  }, []);

  const runConfirmedAction = useCallback(
    (title: string, content: string, action: () => Promise<unknown>) => {
      modal.confirm({
        title,
        content,
        onOk: async () => {
          try {
            await action();
            resetKeywordEdit();
            await loadData();
            feedbackToast();
          } catch (error) {
            feedbackToast({ error });
          }
        },
      });
    },
    [loadData, resetKeywordEdit],
  );

  const addHelper = useCallback(
    (record: BusinessRecord) => {
      const helperId = getHelperId(record);

      if (!canManage || !helperId) {
        return;
      }

      runConfirmedAction(
        t("placeholder.add"),
        t("placeholder.confirmAddGroupHelper"),
        () =>
          addOpenIMGroupHelper({
            roomId: normalizedRoomId,
            helperId,
          }),
      );
    },
    [canManage, normalizedRoomId, runConfirmedAction],
  );

  const removeHelper = useCallback(
    (record: BusinessRecord) => {
      const groupHelperId = getGroupHelperId(record);

      if (!canManage || !groupHelperId) {
        return;
      }

      runConfirmedAction(
        t("placeholder.remove"),
        t("placeholder.confirmRemoveGroupHelper"),
        () =>
          deleteOpenIMGroupHelper({
            roomId: normalizedRoomId,
            groupHelperId,
          }),
      );
    },
    [canManage, normalizedRoomId, runConfirmedAction],
  );

  const startAddKeyword = useCallback(
    (record: BusinessRecord) => {
      const groupHelperId = getGroupHelperId(record);
      const helperId = getHelperId(record);

      if (!canManage || !groupHelperId) {
        return;
      }

      setKeywordEdit({ groupHelperId, helperId });
      setKeyword("");
      setKeywordValue("");
    },
    [canManage],
  );

  const startEditKeyword = useCallback(
    (helperRecord: BusinessRecord, keywordRecord: BusinessRecord) => {
      const groupHelperId = getGroupHelperId(helperRecord);
      const helperId = getHelperId(helperRecord);
      const keyWordId = getKeywordId(keywordRecord);

      if (!canManage || !groupHelperId || !keyWordId) {
        return;
      }

      setKeywordEdit({
        groupHelperId,
        helperId,
        keyWordId,
      });
      setKeyword(getKeywordText(keywordRecord));
      setKeywordValue(getKeywordValue(keywordRecord));
    },
    [canManage],
  );

  const saveKeyword = useCallback(() => {
    const keywordText = keyword.trim();
    const value = keywordValue.trim();

    if (!canManage || !keywordEdit || !keywordText || !value) {
      return;
    }

    runConfirmedAction(t("placeholder.save"), t("placeholder.confirmSaveKeyword"), () =>
      keywordEdit.keyWordId
        ? updateOpenIMGroupHelperKeyword({
            roomId: normalizedRoomId,
            groupHelperId: keywordEdit.groupHelperId,
            keyWordId: keywordEdit.keyWordId,
            keyword: keywordText,
            value,
          })
        : addOpenIMGroupHelperKeyword({
            roomId: normalizedRoomId,
            groupHelperId: keywordEdit.groupHelperId,
            keyword: keywordText,
            value,
          }),
    );
  }, [
    canManage,
    keyword,
    keywordEdit,
    keywordValue,
    normalizedRoomId,
    runConfirmedAction,
  ]);

  const removeKeyword = useCallback(
    (helperRecord: BusinessRecord, keywordRecord: BusinessRecord) => {
      const groupHelperId = getGroupHelperId(helperRecord);
      const keyWordId = getKeywordId(keywordRecord);

      if (!canManage || !groupHelperId || !keyWordId) {
        return;
      }

      runConfirmedAction(
        t("placeholder.delete"),
        t("placeholder.confirmDeleteKeyword"),
        () =>
          deleteOpenIMGroupHelperKeyword({
            roomId: normalizedRoomId,
            groupHelperId,
            keyWordId,
          }),
      );
    },
    [canManage, normalizedRoomId, runConfirmedAction],
  );

  const renderKeywordEditor = (groupHelperId: string | number) => {
    if (keywordEdit?.groupHelperId !== groupHelperId) {
      return null;
    }

    return (
      <div className="mt-2 flex flex-col gap-2">
        <Input
          value={keyword}
          maxLength={50}
          placeholder={t("placeholder.keyword")}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Input.TextArea
          value={keywordValue}
          rows={2}
          maxLength={500}
          placeholder={t("placeholder.replyContent")}
          onChange={(event) => setKeywordValue(event.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button size="small" onClick={resetKeywordEdit}>
            {t("cancel")}
          </Button>
          <Button
            size="small"
            type="primary"
            disabled={!canManage || !keyword.trim() || !keywordValue.trim()}
            onClick={saveKeyword}
          >
            {t("placeholder.save")}
          </Button>
        </div>
      </div>
    );
  };

  const renderKeywords = (record: BusinessRecord) => {
    const groupHelperId = getGroupHelperId(record);
    const keywords = getKeywordList(record);

    if (!groupHelperId) {
      return null;
    }

    return (
      <div className="mt-3 rounded border border-[var(--gap-text)] p-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-[var(--sub-text)]">
            {t("placeholder.autoReplyKeywords")}
          </span>
          <Button
            size="small"
            type="link"
            disabled={!canManage}
            onClick={() => startAddKeyword(record)}
          >
            {t("placeholder.addKeyword")}
          </Button>
        </div>
        {keywords.length > 0 && (
          <List
            size="small"
            dataSource={keywords}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="edit"
                    type="link"
                    size="small"
                    disabled={!canManage || !getKeywordId(item)}
                    onClick={() => startEditKeyword(record, item)}
                  >
                    {t("placeholder.edit")}
                  </Button>,
                  <Button
                    key="delete"
                    type="link"
                    size="small"
                    danger
                    disabled={!canManage || !getKeywordId(item)}
                    onClick={() => removeKeyword(record, item)}
                  >
                    {t("placeholder.delete")}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={getKeywordText(item)}
                  description={getKeywordValue(item)}
                />
              </List.Item>
            )}
          />
        )}
        {renderKeywordEditor(groupHelperId)}
      </div>
    );
  };

  return (
    <Spin spinning={loading}>
      {contextText && (
        <div className="mb-3 rounded bg-[#F4F5F7] p-3 text-xs text-[var(--sub-text)]">
          {contextText}
        </div>
      )}
      <List
        header={t("placeholder.addedGroupHelpers")}
        dataSource={helpers}
        locale={{ emptyText: emptyNode }}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                key="remove"
                type="link"
                danger
                disabled={!canManage || !getGroupHelperId(item)}
                onClick={() => removeHelper(item)}
              >
                {t("placeholder.remove")}
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={getHelperName(item)}
              description={
                <>
                  {getHelperDescription(item)}
                  {renderKeywords(item)}
                </>
              }
            />
          </List.Item>
        )}
      />
      <List
        className="mt-4"
        header={t("placeholder.availableGroupHelpers")}
        dataSource={availableHelpers}
        locale={{ emptyText: emptyNode }}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                key="add"
                type="link"
                disabled={!canManage || !getHelperId(item)}
                onClick={() => addHelper(item)}
              >
                {t("placeholder.add")}
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={getHelperName(item)}
              description={getHelperDescription(item)}
            />
          </List.Item>
        )}
      />
    </Spin>
  );
};

export default memo(GroupHelperPanel);
