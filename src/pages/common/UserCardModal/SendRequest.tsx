import { LeftOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, Input } from "antd";
import { t } from "i18next";
import { useEffect, useMemo, useState } from "react";

import { addBusinessFriend, getLatestNewFriendRecord } from "@/api/friend";
import OIMAvatar from "@/components/OIMAvatar";
import { useContactStore } from "@/store/contact";
import {
  BusinessRecord,
  isBusinessRecord,
  pickBusinessNumber,
  pickBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";
import { feedbackToast } from "@/utils/common";

import { CardInfo } from ".";

const normalizeTargetUserID = (userID?: string | number | null) =>
  String(userID ?? "").trim();

const getLatestApplicationRecord = (response: unknown) => {
  const payload = unwrapBusinessPayload(response);
  if (isBusinessRecord(payload)) {
    return payload;
  }
  if (Array.isArray(payload)) {
    return payload.find(isBusinessRecord);
  }
  return undefined;
};

const getApplicationStatusText = (record?: BusinessRecord) => {
  if (!record) return "";

  const statusText = pickBusinessText(record, [
    "statusText",
    "stateText",
    "handleStatus",
  ]).toLowerCase();
  const status = pickBusinessNumber(record, [
    "handleResult",
    "status",
    "state",
    "applyStatus",
  ]);

  if (status === 1 || statusText.includes("agree") || statusText.includes("approve")) {
    return t("application.agreed");
  }
  if (
    status === 2 ||
    status === 3 ||
    statusText.includes("refuse") ||
    statusText.includes("reject")
  ) {
    return t("application.refused");
  }
  return t("application.pending");
};

const SendRequest = ({
  cardInfo,
  backToCard,
}: {
  cardInfo: CardInfo;
  backToCard: () => void;
}) => {
  const [reqMsg, setReqMsg] = useState("");
  const [latestRecord, setLatestRecord] = useState<BusinessRecord>();
  const { runAsync, loading } = useRequest(addBusinessFriend, {
    manual: true,
  });
  const targetUserID = normalizeTargetUserID(cardInfo.userID);
  const latestStatusText = useMemo(
    () => getApplicationStatusText(latestRecord),
    [latestRecord],
  );

  useEffect(() => {
    if (!targetUserID) {
      setLatestRecord(undefined);
      return;
    }

    getLatestNewFriendRecord(targetUserID)
      .then((response) => setLatestRecord(getLatestApplicationRecord(response)))
      .catch((error) => {
        console.debug("getLatestNewFriendRecord failed", error);
        setLatestRecord(undefined);
      });
  }, [targetUserID]);

  const submitApplication = async () => {
    if (!targetUserID) {
      feedbackToast({ error: new Error(t("toast.sendApplicationFailed")) });
      return;
    }

    try {
      await runAsync(targetUserID, reqMsg.trim());
      await useContactStore.getState().ensureFriendListLoaded(true);
      await useContactStore.getState().ensureFriendApplicationsLoaded(true);
      feedbackToast({ msg: t("toast.sendFreiendRequestSuccess") });
    } catch (error) {
      feedbackToast({ error, msg: t("toast.sendApplicationFailed") });
    }
    backToCard();
  };

  return (
    <div className="flex max-h-[520px] min-h-[484px] flex-col overflow-hidden px-5.5">
      <div className="w-full cursor-move">
        <div className="mb-8 mt-4.5 flex items-center">
          <LeftOutlined
            className="cursor-pointer text-[var(--sub-text)]"
            rev={undefined}
            onClick={backToCard}
          />
          <div className="ml-2 font-medium">{t("placeholder.friendVerification")}</div>
        </div>
      </div>
      <div className="ignore-drag flex flex-1 flex-col">
        <div className="flex items-center">
          <OIMAvatar size={60} src={cardInfo?.faceURL} text={cardInfo?.nickname} />
          <div className="ml-3 flex-1 overflow-hidden">
            <div
              className="mb-3 flex-1 truncate text-base font-medium"
              title={cardInfo?.nickname}
            >
              {cardInfo?.nickname}
            </div>
            <div className="mr-3 text-xs text-[var(--sub-text)]">
              {cardInfo?.userID}
            </div>
          </div>
        </div>
        {latestStatusText && (
          <div className="mt-4 rounded bg-[var(--chat-bubble)] px-3 py-2 text-xs text-[var(--sub-text)]">
            {t("application.latestStatus")}: {latestStatusText}
          </div>
        )}
        <div className="mt-7">
          <div className="text-xs text-[var(--sub-text)]">
            {t("application.information")}
          </div>
          <div className="mx-2 my-4">
            <Input.TextArea
              showCount
              value={reqMsg}
              maxLength={50}
              bordered={false}
              placeholder={t("placeholder.pleaseEnter")}
              spellCheck={false}
              style={{ padding: "8px 6px" }}
              autoSize={{ minRows: 6, maxRows: 6 }}
              onChange={(e) => setReqMsg(e.target.value)}
              className="bg-[var(--chat-bubble)] hover:bg-[var(--chat-bubble)]"
            />
          </div>
        </div>
        <div className="mx-2 mb-6 flex flex-1 items-end">
          <Button
            className="flex-1"
            type="primary"
            onClick={() => void submitApplication()}
            loading={loading}
            disabled={!targetUserID}
          >
            {t("placeholder.send")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendRequest;
