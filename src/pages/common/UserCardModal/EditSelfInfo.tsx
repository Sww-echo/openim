import { Button, DatePicker, Form, Input, Modal, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { t } from "i18next";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMutation } from "react-query";

import { modal } from "@/AntdGlobalComp";
import { errorHandle } from "@/api/errorHandle";
import { BusinessUserInfo, updateBusinessUserInfo } from "@/api/login";
import {
  getUserProfileMetas,
  type ProfileMeta,
  updateUserProfile,
} from "@/api/profile";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { useUserStore } from "@/store";

type CustomProfileFields = Record<string, string>;

interface EditSelfInfoValues extends BusinessUserInfo {
  birth: Dayjs;
  description?: string;
  customFields?: CustomProfileFields;
}

const defaultMetaKeys = new Set([
  "nickname",
  "nickName",
  "email",
  "phoneNumber",
  "telephone",
  "gender",
  "sex",
  "birth",
  "birthday",
  "description",
]);

const parseCustomFields = (value: unknown): CustomProfileFields => {
  if (!value) {
    return {};
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parseCustomFields(parsed);
    } catch {
      return {};
    }
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce(
    (nextFields, [key, fieldValue]) => {
      if (typeof fieldValue === "string" || typeof fieldValue === "number") {
        nextFields[key] = String(fieldValue);
      }
      return nextFields;
    },
    {} as CustomProfileFields,
  );
};

const EditSelfInfo: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  { refreshSelfInfo: () => void }
> = ({ refreshSelfInfo }, ref) => {
  const [form] = Form.useForm();
  const [profileMetas, setProfileMetas] = useState<ProfileMeta[]>([]);
  const selfInfo = useUserStore((state) => state.selfInfo);
  const updateSelfInfo = useUserStore((state) => state.updateSelfInfo);

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  const editableProfileMetas = useMemo(
    () => profileMetas.filter((meta) => !defaultMetaKeys.has(meta.key)),
    [profileMetas],
  );

  const updateSelfProfile = async (value: EditSelfInfoValues) => {
    const options = {
      nickname: value.nickname,
      email: value.email,
      gender: value.gender,
      birth: value.birth.unix() * 1000,
    };

    await updateBusinessUserInfo(options);
    await updateUserProfile({
      nickname: value.nickname,
      email: value.email,
      description: value.description,
      customFields: value.customFields,
    }).catch((error) => {
      console.debug("updateUserProfile failed", error);
    });

    return {
      ...options,
      description: value.description,
      customFields: value.customFields,
    };
  };

  const { isLoading, mutate } = useMutation(updateSelfProfile, {
    onError: errorHandle,
  });

  useEffect(() => {
    if (!isOverlayOpen) {
      return;
    }

    getUserProfileMetas()
      .then(setProfileMetas)
      .catch((error) => {
        setProfileMetas([]);
        console.debug("getUserProfileMetas failed", error);
      });
  }, [isOverlayOpen]);

  const onFinish = (value: EditSelfInfoValues) => {
    modal.confirm({
      title: t("placeholder.save"),
      content: t("placeholder.confirmUpdateSelfInfo"),
      onOk: async () => {
        mutate(value, {
          onSuccess: (options) => {
            updateSelfInfo(options);
            refreshSelfInfo();
            closeOverlay();
          },
        });
      },
    });
  };

  return (
    <Modal
      title={null}
      footer={null}
      closable={false}
      open={isOverlayOpen}
      centered
      onCancel={closeOverlay}
      destroyOnClose
      styles={{
        mask: {
          opacity: 0,
          transition: "none",
        },
      }}
      width={484}
      className="no-padding-modal"
      maskTransitionName=""
    >
      <div>
        <div className="flex bg-[var(--chat-bubble)] p-5">
          <span className="text-base font-medium">{t("placeholder.editInfo")}</span>
        </div>
        {isOverlayOpen && (
          <Form
            form={form}
            colon={false}
            requiredMark={false}
            labelCol={{ span: 3 }}
            onFinish={onFinish}
            className="sub-label-form p-6.5"
            autoComplete="off"
            initialValues={{
              ...selfInfo,
              description: selfInfo.description,
              customFields: parseCustomFields(selfInfo.customFields),
              birth: dayjs(selfInfo.birth),
            }}
          >
            <Form.Item
              label={t("placeholder.nickName")}
              name="nickname"
              rules={[{ required: true, message: t("toast.inputNickName") }]}
            >
              <Input maxLength={20} spellCheck={false} />
            </Form.Item>
            <Form.Item label={t("placeholder.gender")} name="gender">
              <Select>
                <Select.Option value={1}>{t("placeholder.man")}</Select.Option>
                <Select.Option value={2}>{t("placeholder.female")}</Select.Option>
                <Select.Option value={0}>{t("placeholder.unknown")}</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={t("placeholder.phoneNumber")}
              name="phoneNumber"
              // rules={[{ pattern: /^1[3-9]\d{9}$/, message: t("placeholder.inputCorrectPhoneNumber") }]}
            >
              <Input disabled />
            </Form.Item>

            <Form.Item
              label={t("placeholder.email")}
              name="email"
              rules={[{ type: "email", message: t("toast.inputCorrectEmail") }]}
            >
              <Input spellCheck={false} placeholder={t("toast.inputEmail")} />
            </Form.Item>

            <Form.Item label={t("placeholder.birth")} name="birth">
              <DatePicker
                disabledDate={(current) => current && current > dayjs().endOf("day")}
              />
            </Form.Item>

            <Form.Item label={t("placeholder.profileDescription")} name="description">
              <Input.TextArea
                maxLength={120}
                showCount
                autoSize={{ minRows: 2, maxRows: 4 }}
                spellCheck={false}
              />
            </Form.Item>

            {editableProfileMetas.map((meta) => (
              <Form.Item
                key={meta.key}
                label={meta.label}
                name={["customFields", meta.key]}
                rules={
                  meta.required
                    ? [{ required: true, message: t("toast.inputContent") }]
                    : undefined
                }
              >
                <Input maxLength={meta.maxLength ?? 80} spellCheck={false} />
              </Form.Item>
            ))}

            <Form.Item className="mb-0">
              <div className="flex justify-end">
                <Button
                  className="mr-3.5 border-0 bg-[var(--chat-bubble)] px-6"
                  onClick={closeOverlay}
                >
                  {t("cancel")}
                </Button>
                <Button
                  className="px-6"
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                >
                  {t("confirm")}
                </Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </div>
    </Modal>
  );
};

export default memo(forwardRef(EditSelfInfo));
