import { CloseOutlined } from "@ant-design/icons";
import { GroupItem, WSEvent } from "@openim/wasm-client-sdk/lib/types/entity";
import { Button, Input, InputRef } from "antd";
import { t } from "i18next";
import {
  FormEvent,
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";

import { getBusinessGroupInfo } from "@/api/group";
import { message } from "@/AntdGlobalComp";
import { searchBusinessUserInfo } from "@/api/login";
import DraggableModalWrap from "@/components/DraggableModalWrap";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { CardInfo } from "@/pages/common/UserCardModal";
import { useContactStore } from "@/store";
import { feedbackToast, isSameID } from "@/utils/common";

interface ISearchUserOrGroupProps {
  isSearchGroup: boolean;
  openUserCardWithData: (data: CardInfo) => void;
  openGroupCardWithData: (data: GroupItem) => void;
}

const SearchUserOrGroup: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  ISearchUserOrGroupProps
> = ({ isSearchGroup, openUserCardWithData, openGroupCardWithData }, ref) => {
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const inputRef = useRef<InputRef>(null);
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  useEffect(() => {
    if (isOverlayOpen) {
      setTimeout(() => inputRef.current?.focus());
    }
  }, [isOverlayOpen]);

  const getLocalGroup = () =>
    useContactStore
      .getState()
      .groupList.find((group) => isSameID(group.groupID, keyword));

  const getLocalFriend = () =>
    useContactStore
      .getState()
      .friendList.find((friend) => {
        const businessFriend = friend as typeof friend & {
          phoneNumber?: string | number;
          telephone?: string | number;
          account?: string | number;
        };

        return [
          businessFriend.userID,
          businessFriend.phoneNumber,
          businessFriend.telephone,
          businessFriend.account,
        ].some((value) => value !== undefined && isSameID(value, keyword));
      });

  const isKeywordMatchedUser = (
    targetUser?: CardInfo & {
      phoneNumber?: string | number;
      telephone?: string | number;
      account?: string | number;
    },
  ) =>
    Boolean(
      targetUser &&
        [
          targetUser.userID,
          targetUser.phoneNumber,
          targetUser.telephone,
          targetUser.account,
        ].some((value) => value !== undefined && isSameID(value, keyword)),
    );

  const searchData = async () => {
    if (!keyword) return;
    setLoading(true);
    if (isSearchGroup) {
      try {
        const groupInfo = await getBusinessGroupInfo(keyword);
        setLoading(false);
        const targetGroup = groupInfo ?? getLocalGroup();
        if (!targetGroup) {
          message.warning(t("empty.noSearchResults"));
          return;
        }
        openGroupCardWithData(targetGroup);
      } catch (error) {
        setLoading(false);
        const targetGroup = getLocalGroup();
        if (targetGroup) {
          openGroupCardWithData(targetGroup);
          return;
        }
        if ((error as WSEvent).errCode === 1004) {
          message.warning(t("empty.noSearchResults"));
          return;
        }
        feedbackToast({ error });
      }
    } else {
      try {
        const localFriend = getLocalFriend();
        if (localFriend) {
          setLoading(false);
          openUserCardWithData(localFriend);
          return;
        }

        const {
          data: { total, users },
        } = await searchBusinessUserInfo(keyword);
        setLoading(false);
        const targetUser = users.find(isKeywordMatchedUser);
        if (!total || !targetUser) {
          message.warning(t("empty.noSearchResults"));
          return;
        }
        const friendInfo = useContactStore
          .getState()
          .friendList.find((friend) => isSameID(friend.userID, targetUser.userID));

        openUserCardWithData({
          ...(friendInfo ?? {}),
          ...targetUser,
        });
      } catch (error) {
        setLoading(false);
        const localFriend = getLocalFriend();
        if (localFriend) {
          openUserCardWithData(localFriend);
          return;
        }
        if ((error as WSEvent).errCode === 1004) {
          message.warning(t("empty.noSearchResults"));
          return;
        }
        feedbackToast({ error });
      }
    }
  };

  const submitSearch = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    void searchData();
  };

  return (
    <DraggableModalWrap
      title={null}
      footer={null}
      open={isOverlayOpen}
      closable={false}
      width={332}
      onCancel={closeOverlay}
      styles={{
        mask: {
          opacity: 0,
          transition: "none",
        },
      }}
      afterClose={() => {
        setKeyword("");
      }}
      ignoreClasses=".ignore-drag, .cursor-pointer"
      className="no-padding-modal"
      maskTransitionName=""
    >
      <div className="flex h-12 items-center justify-between bg-[var(--gap-text)] px-5.5">
        <div>
          {isSearchGroup ? t("placeholder.addGroup") : t("placeholder.addFriends")}
        </div>
        <CloseOutlined
          className="cursor-pointer text-[var(--sub-text)]"
          rev={undefined}
          onClick={closeOverlay}
        />
      </div>
      <form className="ignore-drag" onSubmit={submitSearch}>
        <div className="border-b border-[var(--gap-text)] px-5.5 py-6">
          <Input.Search
            ref={inputRef}
            className="no-addon-search"
            placeholder={t("placeholder.pleaseEnter")}
            value={keyword}
            addonAfter={null}
            spellCheck={false}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="flex justify-end px-5.5 py-2.5">
          <Button
            htmlType="submit"
            loading={loading}
            className="ignore-drag px-6"
            type="primary"
            disabled={!keyword}
          >
            {t("confirm")}
          </Button>
          <Button
            htmlType="button"
            className="ignore-drag ml-3 border-0 bg-[var(--chat-bubble)] px-6"
            onClick={closeOverlay}
          >
            {t("cancel")}
          </Button>
        </div>
      </form>
    </DraggableModalWrap>
  );
};

export default memo(forwardRef(SearchUserOrGroup));
