import { GroupItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { Empty, Select, Spin } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";

import { useContactStore, useUserStore } from "@/store";
import { emit } from "@/utils/events";

import GroupListItem from "./GroupListItem";

export enum GroupTypeEnum {
  JoinedGroup,
  CreatedGroup,
}

const normalizeId = (id?: string | number) =>
  id === undefined || id === null ? "" : String(id).trim();

export const MyGroups = () => {
  const { t } = useTranslation();
  const [selectGroup, setSelectGroup] = useState(GroupTypeEnum.JoinedGroup);

  const joinedGroupList = useContactStore((state) => state.groupList);
  const groupListLoading = useContactStore(
    (state) => state.contactDataLoading.groupList,
  );
  const ensureGroupListLoaded = useContactStore((state) => state.ensureGroupListLoaded);
  const { userID } = useUserStore((state) => state.selfInfo);

  useEffect(() => {
    void ensureGroupListLoaded(false, { silent: true });
  }, [ensureGroupListLoaded]);

  const handleChange = (value: string) => {
    setSelectGroup(Number(value));
  };

  const { createdGroups, joinedGroups } = useMemo(() => {
    const currentUserID = normalizeId(userID);

    return joinedGroupList.reduce(
      (groups, group) => {
        const creatorUserID = normalizeId(group.creatorUserID);
        const isCreatedBySelf =
          Boolean(creatorUserID && currentUserID) && creatorUserID === currentUserID;

        groups.joinedGroups.push(group);

        if (isCreatedBySelf) {
          groups.createdGroups.push(group);
        }

        return groups;
      },
      {
        createdGroups: [] as GroupItem[],
        joinedGroups: [] as GroupItem[],
      },
    );
  }, [joinedGroupList, userID]);

  const filterGroup =
    selectGroup === GroupTypeEnum.CreatedGroup ? createdGroups : joinedGroups;

  const showGroupCard = useCallback((group: GroupItem) => {
    emit("OPEN_GROUP_CARD", group);
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="m-5.5 flex flex-row justify-between">
        <p className="text-base font-extrabold">{t("placeholder.myGroup")}</p>
        <Select
          value={String(selectGroup)}
          popupClassName="p-0"
          style={{ width: 200 }}
          onChange={handleChange}
          options={[
            {
              value: String(GroupTypeEnum.CreatedGroup),
              label: t("placeholder.myCreated"),
            },
            {
              value: String(GroupTypeEnum.JoinedGroup),
              label: t("placeholder.myJoined"),
            },
          ]}
        />
      </div>
      <div className="box-border flex-1 overflow-y-auto px-2 pb-3">
        {groupListLoading ? (
          <Spin className="mt-[30%] w-full" />
        ) : filterGroup.length === 0 ? (
          <Empty className="mt-[30%]" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Virtuoso
            className="h-full overflow-x-hidden"
            data={filterGroup}
            itemContent={(_, group) => (
              <GroupListItem
                key={group.groupID}
                source={group}
                showGroupCard={showGroupCard}
              />
            )}
          />
        )}
      </div>
    </div>
  );
};
