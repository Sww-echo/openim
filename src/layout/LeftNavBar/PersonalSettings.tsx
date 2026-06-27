import { CloseOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Checkbox, Divider, Form, Input, message, Modal, Spin, Switch } from "antd";
import { t } from "i18next";
import md5 from "md5";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation } from "react-query";

import { modal } from "@/AntdGlobalComp";
import { errorHandle } from "@/api/errorHandle";
import { BusinessAllowType } from "@/api/friend";
import { modifyPassword } from "@/api/login";
import {
  getDefaultNotificationSettings,
  getNotificationSettings,
  type NotificationSettings,
  updateNotificationSettings,
} from "@/api/notification";
import {
  getUserPrivacySettings,
  updateGlobalOfflineNoPushMsg,
  updateUserPrivacySettings,
} from "@/api/userSettings";
import i18n from "@/i18n";
import { useUserStore } from "@/store";
import { LocaleString } from "@/store/type";
import { feedbackToast } from "@/utils/common";

import { OverlayVisibleHandle, useOverlayVisible } from "../../hooks/useOverlayVisible";
import { IMSDK } from "../MainContentWrap";
import BlackList from "./BlackList";

const webNotificationTypes = ["room_notice", "at_me", "robot_reply"];

const notificationLabelKeys: Record<string, string> = {
  at_me: "placeholder.notificationAtMe",
  robot_reply: "placeholder.notificationRobotReply",
  room_notice: "placeholder.notificationRoomNotice",
};

const getNotificationAllow = (
  settings: NotificationSettings | undefined,
  type: string,
) =>
  settings?.items.find((item) => item.type === type && item.scope !== "room")
    ?.allowNotification ?? settings?.defaultAllowAll ?? true;

const PersonalSettings: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

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
      width={360}
      className="no-padding-modal max-w-[70vw]"
      maskTransitionName=""
    >
      <PersonalSettingsContent closeOverlay={closeOverlay} />
    </Modal>
  );
};

export default memo(forwardRef(PersonalSettings));

export const PersonalSettingsContent = ({
  closeOverlay,
}: {
  closeOverlay?: () => void;
}) => {
  const localeStr = useUserStore((state) => state.appSettings.locale);
  const closeAction = useUserStore((state) => state.appSettings.closeAction);
  const updateAppSettings = useUserStore((state) => state.updateAppSettings);

  const backListRef = useRef<OverlayVisibleHandle>(null);
  const changePasswordRef = useRef<OverlayVisibleHandle>(null);

  const localeChange = (checked: boolean, locale: LocaleString) => {
    if (!checked) return;
    window.electronAPI?.ipcInvoke("changeLanguage", locale);
    i18n.changeLanguage(locale);
    updateAppSettings({
      locale,
    });
  };

  const closeActionChange = (checked: boolean, action: "miniSize" | "quit") => {
    if (checked) {
      window.electronAPI?.ipcInvoke("setKeyStore", {
        key: "closeAction",
        data: action,
      });
      updateAppSettings({
        closeAction: action,
      });
    }
  };

  const toBlackList = () => {
    backListRef.current?.openOverlay();
  };

  const toChangePassword = () => {
    changePasswordRef.current?.openOverlay();
  };

  return (
    <div className="flex flex-col bg-[var(--chat-bubble)]">
      <BlackList ref={backListRef} />
      <ChangePasswordModal ref={changePasswordRef} closeSettings={closeOverlay} />
      <div className="app-drag flex items-center justify-between bg-[var(--gap-text)] p-5">
        <span className="text-base font-medium">{t("placeholder.accountSetting")}</span>
        <CloseOutlined
          className="app-no-drag cursor-pointer text-[#8e9aaf]"
          rev={undefined}
          onClick={closeOverlay}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6">
          <div>
            <div className="pb-5 pt-4 text-base font-medium">
              {t("placeholder.personalSetting")}
            </div>
            <div className="pb-8 pl-1">
              <div className="pb-3 font-medium">{t("placeholder.chooseLanguage")}</div>
              <div>
                <Checkbox
                  checked={localeStr === "zh-CN"}
                  className="mr-4"
                  onChange={(e) => localeChange(e.target.checked, "zh-CN")}
                >
                  简体中文
                </Checkbox>
                <Checkbox
                  checked={localeStr === "en-US"}
                  onChange={(e) => localeChange(e.target.checked, "en-US")}
                >
                  English
                </Checkbox>
              </div>
            </div>
            {Boolean(window.electronAPI) && (
              <div className="pb-8 pl-1">
                <div className="pb-3 font-medium">
                  {t("placeholder.closeButtonEvent")}
                </div>
                <div>
                  <Checkbox
                    checked={closeAction === "quit"}
                    className="mr-4"
                    onChange={(e) => closeActionChange(e.target.checked, "quit")}
                  >
                    {t("placeholder.exitApplication")}
                  </Checkbox>
                  <Checkbox
                    checked={closeAction === "miniSize"}
                    onChange={(e) => closeActionChange(e.target.checked, "miniSize")}
                  >
                    {t("placeholder.minimize")}
                  </Checkbox>
                </div>
              </div>
            )}
            <NotificationSettingsSection />
            <FriendPrivacySettingsSection />
          </div>
        </div>
        <Divider className="m-0 border-4 border-[var(--gap-text)]" />
        <div
          className="flex cursor-pointer items-center justify-between px-6 py-4"
          onClick={toChangePassword}
        >
          <div className="text-base font-medium">{t("placeholder.changePassword")}</div>
          <RightOutlined rev={undefined} />
        </div>
        <Divider className="m-0 border-4 border-[var(--gap-text)]" />
        <div
          className="flex cursor-pointer items-center justify-between px-6 py-4"
          onClick={toBlackList}
        >
          <div className="text-base font-medium">{t("placeholder.blackList")}</div>
          <RightOutlined rev={undefined} />
        </div>
        <Divider className="m-0 border-4 border-[var(--gap-text)]" />
      </div>
    </div>
  );
};

const NotificationSettingsSection = memo(() => {
  const [settings, setSettings] = useState<NotificationSettings>();
  const [globalMessageAlert, setGlobalMessageAlert] = useState<boolean>();
  const [loading, setLoading] = useState(false);
  const [updatingGlobal, setUpdatingGlobal] = useState(false);
  const [updatingType, setUpdatingType] = useState<string>();

  const visibleTypes = useMemo(() => {
    const supportedTypes = settings?.supportedTypes ?? [];

    return webNotificationTypes.filter((type) => supportedTypes.includes(type));
  }, [settings?.supportedTypes]);

  const getLabel = useCallback(
    (type: string) =>
      t(notificationLabelKeys[type]) ||
      settings?.typeMetas.find((item) => item.type === type)?.label ||
      type,
    [settings?.typeMetas],
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      getUserPrivacySettings()
        .then((privacySettings) => {
          if (privacySettings.offlineNoPushMsg !== undefined) {
            setGlobalMessageAlert(privacySettings.offlineNoPushMsg !== 1);
          }
        })
        .catch((error) => {
          console.debug("Failed to load global message alert setting", error);
        });

      const currentSettings = await getNotificationSettings();
      if (currentSettings.supportedTypes.length && currentSettings.typeMetas.length) {
        setSettings(currentSettings);
        return;
      }

      const defaultSettings = await getDefaultNotificationSettings();
      setSettings({
        ...currentSettings,
        supportedTypes:
          currentSettings.supportedTypes.length > 0
            ? currentSettings.supportedTypes
            : defaultSettings.supportedTypes,
        typeMetas:
          currentSettings.typeMetas.length > 0
            ? currentSettings.typeMetas
            : defaultSettings.typeMetas,
        defaultAllowAll: currentSettings.defaultAllowAll ?? defaultSettings.defaultAllowAll,
      });
    } catch (error) {
      setSettings(undefined);
      console.debug("Failed to load notification settings", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateNotification = useCallback(
    (type: string, allowNotification: boolean) => {
      modal.confirm({
        title: t("placeholder.messageToast"),
        content: t("placeholder.confirmUpdateNotificationSetting"),
        onOk: async () => {
          setUpdatingType(type);
          try {
            await updateNotificationSettings({
              items: [
                {
                  type,
                  scope: "global",
                  allowNotification,
                },
              ],
            });
            setSettings((current) => {
              if (!current) {
                return current;
              }

              const otherItems = current.items.filter(
                (item) => !(item.type === type && item.scope !== "room"),
              );

              return {
                ...current,
                items: [
                  ...otherItems,
                  {
                    type,
                    scope: "global",
                    allowNotification,
                  },
                ],
              };
            });
            feedbackToast();
          } catch (error) {
            feedbackToast({ error });
          } finally {
            setUpdatingType(undefined);
          }
        },
      });
    },
    [],
  );

  const updateGlobalMessageAlert = useCallback((checked: boolean) => {
    modal.confirm({
      title: t("placeholder.messageToast"),
      content: t("placeholder.confirmUpdateNotificationSetting"),
      onOk: async () => {
        setUpdatingGlobal(true);
        try {
          await updateGlobalOfflineNoPushMsg(checked ? 0 : 1);
          setGlobalMessageAlert(checked);
          feedbackToast();
        } catch (error) {
          feedbackToast({ error });
        } finally {
          setUpdatingGlobal(false);
        }
      },
    });
  }, []);

  if (!loading && visibleTypes.length === 0 && globalMessageAlert === undefined) {
    return null;
  }

  return (
    <div className="pb-8 pl-1">
      <div className="pb-3 font-medium">{t("placeholder.messageToast")}</div>
      {loading ? (
        <Spin size="small" />
      ) : (
        <div className="space-y-3 pr-1">
          {globalMessageAlert !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm">{t("placeholder.globalMessageAlert")}</span>
              <Switch
                size="small"
                checked={globalMessageAlert}
                loading={updatingGlobal}
                onChange={updateGlobalMessageAlert}
              />
            </div>
          )}
          {visibleTypes.map((type) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm">{getLabel(type)}</span>
              <Switch
                size="small"
                checked={getNotificationAllow(settings, type)}
                loading={updatingType === type}
                onChange={(checked) => updateNotification(type, checked)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const FriendPrivacySettingsSection = memo(() => {
  const selfAllowAddFriend = useUserStore((state) => state.selfInfo.allowAddFriend);
  const updateSelfInfo = useUserStore((state) => state.updateSelfInfo);
  const [friendsVerify, setFriendsVerify] = useState<number | undefined>(
    selfAllowAddFriend,
  );
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const refuseAddFriend = friendsVerify === BusinessAllowType.NotAllow;

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await getUserPrivacySettings();
      if (settings.friendsVerify !== undefined) {
        setFriendsVerify(settings.friendsVerify);
        updateSelfInfo({ allowAddFriend: settings.friendsVerify });
      } else if (selfAllowAddFriend !== undefined) {
        setFriendsVerify(selfAllowAddFriend);
      }
    } catch (error) {
      console.debug("Failed to load user privacy settings", error);
      if (selfAllowAddFriend !== undefined) {
        setFriendsVerify(selfAllowAddFriend);
      }
    } finally {
      setLoading(false);
    }
  }, [selfAllowAddFriend, updateSelfInfo]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateFriendVerify = useCallback(
    (checked: boolean) => {
      const nextFriendsVerify = checked
        ? BusinessAllowType.NotAllow
        : BusinessAllowType.Allow;

      modal.confirm({
        title: t("placeholder.addFriendsSetting"),
        content: t("placeholder.confirmUpdateUserPrivacySetting"),
        onOk: async () => {
          setUpdating(true);
          try {
            await updateUserPrivacySettings({ friendsVerify: nextFriendsVerify });
            setFriendsVerify(nextFriendsVerify);
            updateSelfInfo({ allowAddFriend: nextFriendsVerify });
            feedbackToast();
          } catch (error) {
            feedbackToast({ error });
          } finally {
            setUpdating(false);
          }
        },
      });
    },
    [updateSelfInfo],
  );

  return (
    <div className="pb-8 pl-1">
      <div className="pb-3 font-medium">{t("placeholder.addFriendsSetting")}</div>
      {loading ? (
        <Spin size="small" />
      ) : (
        <div className="flex items-center justify-between pr-1">
          <span className="text-sm">{t("placeholder.refuseAddFriend")}</span>
          <Switch
            size="small"
            checked={refuseAddFriend}
            loading={updating}
            onChange={updateFriendVerify}
          />
        </div>
      )}
    </div>
  );
});

interface ChangePasswordProps {
  closeSettings?: () => void;
}

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePassword: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  ChangePasswordProps
> = ({ closeSettings }, ref) => {
  const [form] = Form.useForm<ChangePasswordFormValues>();
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const selfUserID = useUserStore((state) => state.selfInfo.userID);
  const userLogout = useUserStore((state) => state.userLogout);
  const { isLoading, mutate } = useMutation(modifyPassword, {
    onError: errorHandle,
  });

  const logoutAfterPasswordChange = async () => {
    try {
      await userLogout();
    } catch {
      await userLogout(true);
    }
  };

  const onFinish = (values: ChangePasswordFormValues) => {
    modal.confirm({
      title: t("placeholder.changePassword"),
      content: t("placeholder.confirmUpdatePassword"),
      onOk: () => {
        mutate(
          {
            userID: selfUserID,
            currentPassword: md5(values.currentPassword),
            newPassword: md5(values.newPassword),
          },
          {
            onSuccess: async () => {
              message.success(t("toast.updatePasswordSuccess"));
              form.resetFields();
              closeOverlay();
              closeSettings?.();
              await logoutAfterPasswordChange();
            },
          },
        );
      },
    });
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
      width={420}
      className="no-padding-modal"
      maskTransitionName=""
    >
      <div className="bg-[var(--chat-bubble)]">
        <div className="flex items-center justify-between bg-[var(--gap-text)] p-5">
          <span className="text-base font-medium">
            {t("placeholder.changePassword")}
          </span>
          <CloseOutlined
            className="app-no-drag cursor-pointer text-[#8e9aaf]"
            rev={undefined}
            onClick={closeOverlay}
          />
        </div>
        <Form
          form={form}
          colon={false}
          requiredMark={false}
          labelCol={{ span: 7 }}
          wrapperCol={{ span: 17 }}
          onFinish={onFinish}
          className="p-6"
          autoComplete="off"
        >
          <Form.Item
            label={t("placeholder.oldPassword")}
            name="currentPassword"
            rules={[{ required: true, message: t("toast.inputOldPassword") }]}
          >
            <Input.Password allowClear placeholder={t("toast.inputOldPassword")} />
          </Form.Item>
          <Form.Item
            label={t("placeholder.newPassword")}
            name="newPassword"
            help={<span className="text-xs text-gray-400">{t("toast.passwordRules")}</span>}
            rules={[
              {
                required: true,
                pattern: /^(?=.*[0-9])(?=.*[a-zA-Z]).{6,20}$/,
                message: t("toast.passwordRules"),
              },
            ]}
          >
            <Input.Password allowClear placeholder={t("toast.inputPassword")} />
          </Form.Item>
          <Form.Item
            label={t("placeholder.confirmPassword")}
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              {
                required: true,
                message: t("toast.reconfirmPassword"),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t("toast.passwordsDifferent")));
                },
              }),
            ]}
          >
            <Input.Password allowClear placeholder={t("toast.reconfirmPassword")} />
          </Form.Item>
          <Form.Item className="mb-0" wrapperCol={{ span: 24 }}>
            <div className="flex justify-end">
              <Button
                className="mr-3.5 border-0 bg-[var(--chat-bubble)] px-6"
                onClick={closeOverlay}
              >
                {t("cancel")}
              </Button>
              <Button className="px-6" type="primary" htmlType="submit" loading={isLoading}>
                {t("confirm")}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

const ChangePasswordModal = memo(forwardRef(ChangePassword));
