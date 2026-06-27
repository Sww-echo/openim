import { LeftOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Select, Space } from "antd";
import { t } from "i18next";
import md5 from "md5";
import { useEffect, useState } from "react";

import { useReset, useSendSms, useVerifyCode } from "@/api/login";
import {
  isBusinessRecord,
  pickBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";

import { areaCode } from "./areaCode";
import type { FormType } from "./index";
import { getPhoneNumberRules } from "./rules";

type ModifyFormProps = {
  setFormType: (type: FormType) => void;
};

type FormFields = {
  phoneNumber: string;
  areaCode: string;
  verifyCode: string;
  password: string;
  password2: string;
};

const ModifyForm = ({ setFormType }: ModifyFormProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormFields>();
  const [countdown, setCountdown] = useState(0);
  const [isConfirm, setIsConfirm] = useState(false);
  const [resetSerial, setResetSerial] = useState("");
  const { mutate: sendSms, isLoading: sendSmsLoading } = useSendSms();
  const { mutate: reset } = useReset();
  const { mutate: verifyCode } = useVerifyCode();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
        if (countdown === 1) {
          clearTimeout(timer);
          setCountdown(0);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onFinish = (fields: FormFields) => {
    if (!isConfirm) {
      verifyCode(
        {
          ...fields,
          usedFor: 2,
        },
        {
          onSuccess(response) {
            const payload = unwrapBusinessPayload(response);
            const serial = isBusinessRecord(payload)
              ? pickBusinessText(payload, [
                  "serial",
                  "deviceSerial",
                  "deviceID",
                  "deviceId",
                ])
              : "";

            if (!serial) {
              message.error(t("toast.missingPasswordResetSerial"));
              return;
            }

            setResetSerial(serial);
            setIsConfirm(true);
          },
        },
      );
    } else {
      reset(
        { ...fields, password: md5(fields.password), serial: resetSerial },
        {
          onSuccess() {
            message.success(t("toast.updatePasswordSuccess"));
            setFormType(0);
          },
        },
      );
    }
  };

  const sendSmsHandle = () => {
    if (countdown > 0 || sendSmsLoading) {
      return;
    }

    form
      .validateFields(["areaCode", "phoneNumber"])
      .then(({ areaCode, phoneNumber }: Pick<FormFields, "areaCode" | "phoneNumber">) => {
        sendSms(
          {
            phoneNumber,
            areaCode,
            usedFor: 2,
          },
          {
            onSuccess() {
              setCountdown(60);
            },
          },
        );
      })
      .catch(() => {
        // AntD has already rendered field-level validation feedback.
      });
  };

  const back = () => {
    setFormType(0);
    setResetSerial("");
    form.resetFields();
  };

  return (
    <div className="flex flex-col justify-between">
      <div className="cursor-pointer text-sm text-gray-400" onClick={back}>
        <LeftOutlined rev={undefined} />
        <span className="ml-1">{t("placeholder.getBack")}</span>
      </div>
      <div className="mt-6 text-2xl font-medium">{t("placeholder.forgetPassword")}</div>
      <Form
        form={form}
        layout="vertical"
        labelCol={{ prefixCls: "custom-form-item" }}
        onFinish={onFinish}
        autoComplete="off"
        className="mt-6"
        initialValues={{ areaCode: "+86" }}
      >
        {isConfirm && (
          <>
            <Form.Item
              label={t("placeholder.password")}
              name="password"
              help={
                <span className=" text-xs text-gray-400">
                  {t("toast.passwordRules")}
                </span>
              }
              rules={[
                {
                  required: true,
                  pattern: /^(?=.*[0-9])(?=.*[a-zA-Z]).{6,20}$/,
                  message: t("toast.passwordRules"),
                },
              ]}
              hidden={!isConfirm}
            >
              <Input.Password allowClear placeholder={t("toast.inputPassword")} />
            </Form.Item>
            <Form.Item
              label={t("placeholder.confirmPassword")}
              name="password2"
              rules={[
                {
                  required: true,
                  message: t("toast.reconfirmPassword"),
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }

                    return Promise.reject(new Error(t("toast.passwordsDifferent")));
                  },
                }),
              ]}
            >
              <Input.Password allowClear placeholder={t("toast.reconfirmPassword")} />
            </Form.Item>
          </>
        )}
        <Form.Item label={t("placeholder.phoneNumber")} required hidden={isConfirm}>
          <Space.Compact className="w-full">
            <Form.Item name="areaCode" noStyle>
              <Select options={areaCode} className="!w-28" />
            </Form.Item>
            <Form.Item
              name="phoneNumber"
              noStyle
              rules={getPhoneNumberRules()}
            >
              <Input allowClear placeholder={t("toast.inputPhoneNumber")} />
            </Form.Item>
          </Space.Compact>
        </Form.Item>

        <Form.Item
          label={t("placeholder.verifyCode")}
          hidden={isConfirm}
          required
        >
          <Space.Compact className="w-full">
            <Form.Item
              name="verifyCode"
              noStyle
              rules={[
                {
                  required: true,
                  message: t("toast.inputVerifyCode"),
                },
              ]}
            >
              <Input
                allowClear
                placeholder={t("toast.inputVerifyCode")}
                className="w-full"
              />
            </Form.Item>
            <Button
              type="primary"
              onClick={sendSmsHandle}
              loading={sendSmsLoading || countdown > 0}
              disabled={countdown > 0}
            >
              {countdown > 0
                ? t("date.second", { num: countdown })
                : t("placeholder.sendVerifyCode")}
            </Button>
          </Space.Compact>
        </Form.Item>
        <Form.Item className="mt-20">
          <Button type="primary" htmlType="submit" block>
            {isConfirm ? t("confirm") : t("placeholder.nextStep")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ModifyForm;
