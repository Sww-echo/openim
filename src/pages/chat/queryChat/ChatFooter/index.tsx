import { useLatest } from "ahooks";
import { Button } from "antd";
import { t } from "i18next";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useEffect,
  useMemo,
  useState,
} from "react";

import CKEditor from "@/components/CKEditor";
import { getCleanText } from "@/components/CKEditor/utils";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import i18n from "@/i18n";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import type { BusinessSwitchValue } from "@/utils/businessSwitch";
import { isBusinessSwitchOn } from "@/utils/businessSwitch";
import {
  getAccountScopedItem,
  removeAccountScopedItem,
  setAccountScopedItem,
} from "@/utils/storage";

import SendActionBar from "./SendActionBar";
import { useFileMessage } from "./SendActionBar/useFileMessage";
import { useSendMessage } from "./useSendMessage";

const sendActions = [
  { label: t("placeholder.sendWithEnter"), key: "enter" },
  { label: t("placeholder.sendWithShiftEnter"), key: "enterwithshift" },
];

i18n.on("languageChanged", () => {
  sendActions[0].label = t("placeholder.sendWithEnter");
  sendActions[1].label = t("placeholder.sendWithShiftEnter");
});

const ChatFooter: ForwardRefRenderFunction<unknown, unknown> = () => {
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);
  const { isOwner, isAdmin } = useCurrentMemberRole();
  const canUploadFile =
    !currentConversation?.groupID ||
    isOwner ||
    isAdmin ||
    isBusinessSwitchOn(
      (currentGroupInfo as { allowUploadFile?: BusinessSwitchValue } | undefined)
        ?.allowUploadFile,
      true,
    );
  const draftKey = useMemo(
    () =>
      currentConversation?.conversationID
        ? `CHAT_DRAFT:${currentConversation.conversationID}`
        : undefined,
    [currentConversation?.conversationID],
  );
  const [draftState, setDraftState] = useState({
    key: "",
    html: "",
  });
  const html = draftKey && draftState.key === draftKey ? draftState.html : "";
  const latestHtml = useLatest(html);

  const { getImageMessage, getVideoMessage, getFileMessage } = useFileMessage();
  const { sendMessage } = useSendMessage();

  useEffect(() => {
    let canceled = false;

    if (!draftKey) {
      setDraftState({ key: "", html: "" });
      return;
    }

    getAccountScopedItem<string>(draftKey)
      .then((draftHtml) => {
        if (!canceled) {
          setDraftState({ key: draftKey, html: draftHtml ?? "" });
        }
      })
      .catch(() => {
        if (!canceled) {
          setDraftState({ key: draftKey, html: "" });
        }
      });

    return () => {
      canceled = true;
    };
  }, [draftKey]);

  useEffect(() => {
    if (!draftState.key) {
      return;
    }

    const timer = window.setTimeout(() => {
      const cleanText = getCleanText(draftState.html);

      if (cleanText) {
        void setAccountScopedItem(draftState.key, draftState.html);
      } else {
        void removeAccountScopedItem(draftState.key);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [draftState]);

  const onChange = (value: string) => {
    if (!draftKey) {
      return;
    }
    setDraftState({ key: draftKey, html: value });
  };

  const sendTextMessage = async (cleanText: string) => {
    const message = (await IMSDK.createTextMessage(cleanText)).data;
    const didStartSend = await sendMessage({ message });

    if (didStartSend && draftKey) {
      await removeAccountScopedItem(draftKey);
      setDraftState({ key: draftKey, html: "" });
    }
  };

  const enterToSend = () => {
    const cleanText = getCleanText(latestHtml.current ?? "");
    if (!cleanText) return;

    void sendTextMessage(cleanText);
  };

  return (
    <footer className="relative h-full bg-white py-px">
      <div className="flex h-full flex-col border-t border-t-[var(--gap-text)]">
        <SendActionBar
          sendMessage={sendMessage}
          getImageMessage={getImageMessage}
          getVideoMessage={getVideoMessage}
          getFileMessage={getFileMessage}
          canUploadFile={canUploadFile}
        />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <CKEditor value={html} onEnter={enterToSend} onChange={onChange} />
          <div className="flex items-center justify-end py-2 pr-3">
            <Button className="w-fit px-6 py-1" type="primary" onClick={enterToSend}>
              {t("placeholder.send")}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default memo(forwardRef(ChatFooter));
