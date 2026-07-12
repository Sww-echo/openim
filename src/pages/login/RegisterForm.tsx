import { LeftOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Select, Space } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import md5 from "md5";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  DEFAULT_ENTERPRISE_CODE,
  normalizeIMProfile,
  useRegister,
  useRegistrationConfig,
  useSendSms,
} from "@/api/login";
import { setAreaCode, setIMProfile, setPhoneNumber } from "@/utils/storage";

import { areaCode } from "./areaCode";
import { normalizeEnterpriseCode, validateEnterpriseCodeInput } from "./enterpriseCode";
import type { FormType } from "./index";
import { getPhoneNumberRules } from "./rules";

type RegisterFormProps = {
  setFormType: (type: FormType) => void;
};

type RegisterMethod = "phone" | "email";

type FormFields = {
  phoneNumber?: string;
  email?: string;
  areaCode: string;
  nickname: string;
  password: string;
  password2: string;
  verifyCode?: string;
  enterpriseCode?: string;
  registerMethod: RegisterMethod;
};

const phoneRegistrationMethods = new Set([
  "phone",
  "phone_number",
  "phonenumber",
  "telephone",
  "mobile",
  "sms",
]);

const emailRegistrationMethods = new Set(["email", "mail"]);

const supportsPhoneRegistration = (methods: string[]) =>
  methods.length === 0 ||
  methods.some((method) => phoneRegistrationMethods.has(method.trim().toLowerCase()));

const supportsEmailRegistration = (methods: string[]) =>
  methods.length === 0 ||
  methods.some((method) => emailRegistrationMethods.has(method.trim().toLowerCase()));

const RegisterForm = ({ setFormType }: RegisterFormProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormFields>();
  const enterpriseCodeValue = Form.useWatch("enterpriseCode", form);
  const registerMethod = Form.useWatch("registerMethod", form) ?? "phone";
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { mutate: register } = useRegister();
  const { mutate: sendSms, isLoading: sendSmsLoading } = useSendSms();
  const { data: registrationConfig, isLoading: registrationConfigLoading } =
    useRegistrationConfig(normalizeEnterpriseCode(enterpriseCodeValue));

  const registrationMethods = registrationConfig?.registrationMethods ?? ["phone"];
  const passwordRegistrationAllowed =
    registrationConfig?.passwordRegistrationAllowed ?? true;
  const verificationRegistrationRequired = !passwordRegistrationAllowed;
  const phoneRegistrationAllowed = supportsPhoneRegistration(registrationMethods);
  const emailRegistrationAllowed = supportsEmailRegistration(registrationMethods);
  const selectedRegisterMethod =
    verificationRegistrationRequired &&
    !phoneRegistrationAllowed &&
    emailRegistrationAllowed
      ? "email"
      : registerMethod;
  const availableRegisterMethods = [
    ...(phoneRegistrationAllowed
      ? [{ label: t("placeholder.phoneNumber"), value: "phone" }]
      : []),
    ...(emailRegistrationAllowed
      ? [{ label: t("placeholder.email"), value: "email" }]
      : []),
  ];

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onFinish = async (fields: FormFields) => {
    if (fields.phoneNumber) {
      setAreaCode(fields.areaCode);
      setPhoneNumber(fields.phoneNumber);
    }

    if (!availableRegisterMethods.length) {
      return message.error(t("toast.verificationRegistrationUnsupported"));
    }
    if (selectedRegisterMethod === "phone" && !phoneRegistrationAllowed) {
      return message.error(t("toast.phoneRegistrationUnsupported"));
    }
    if (selectedRegisterMethod === "email" && !emailRegistrationAllowed) {
      return message.error(t("toast.emailRegistrationUnsupported"));
    }
    if (verificationRegistrationRequired && !fields.verifyCode?.trim()) {
      return message.error(t("toast.inputVerifyCode"));
    }

    let enterpriseCode: string | undefined;
    try {
      enterpriseCode = await validateEnterpriseCodeInput(fields.enterpriseCode);
    } catch (error) {
      return message.error(
        error instanceof Error ? error.message : t("errCode.enterpriseCodeInvalid"),
      );
    }

    register(
      {
        autoLogin: true,
        enterpriseCode,
        verifyCode: verificationRegistrationRequired ? fields.verifyCode : undefined,
        user: {
          nickname: fields.nickname,
          faceURL: "",
          account:
            selectedRegisterMethod === "email" ? fields.email : fields.phoneNumber,
          areaCode: fields.areaCode,
          email: selectedRegisterMethod === "email" ? fields.email : undefined,
          phoneNumber:
            selectedRegisterMethod === "phone" ? fields.phoneNumber : undefined,
          password: md5(fields.password),
        },
      },
      {
        async onSuccess(res) {
          try {
            await setIMProfile({
              ...normalizeIMProfile(res.data),
              account:
                selectedRegisterMethod === "email" ? fields.email : fields.phoneNumber,
              areaCode: fields.areaCode,
              faceURL: "",
              nickname: fields.nickname,
              email: fields.email,
              phoneNumber: fields.phoneNumber,
            });
            message.success(t("toast.registerSuccess"));
            navigate("/chat");
          } catch (error) {
            message.error(
              error instanceof Error ? error.message : t("toast.invalidLoginResponse"),
            );
          }
        },
      },
    );
  };

  const sendSmsHandle = () => {
    if (countdown > 0 || sendSmsLoading) {
      return;
    }

    const verifyFields =
      selectedRegisterMethod === "email"
        ? ["email", "enterpriseCode"]
        : ["areaCode", "phoneNumber", "enterpriseCode"];

    form
      .validateFields(verifyFields)
      .then(
        async ({
          areaCode,
          email,
          phoneNumber,
          enterpriseCode,
        }: Pick<
          FormFields,
          "areaCode" | "email" | "phoneNumber" | "enterpriseCode"
        >) => {
          const normalizedEnterpriseCode = await validateEnterpriseCodeInput(
            enterpriseCode,
          );

          sendSms(
            {
              areaCode: selectedRegisterMethod === "phone" ? areaCode : undefined,
              email: selectedRegisterMethod === "email" ? email : undefined,
              enterpriseCode: normalizedEnterpriseCode,
              phoneNumber: selectedRegisterMethod === "phone" ? phoneNumber : undefined,
              usedFor: 1,
            },
            {
              onSuccess() {
                setCountdown(60);
              },
            },
          );
        },
      )
      .catch((error) => {
        if (error instanceof Error) {
          message.error(error.message);
        }
      });
  };

  const back = () => {
    setFormType(0);
    setCountdown(0);
    form.resetFields();
  };

  return (
    <div className="flex flex-col justify-between">
      <div className="cursor-pointer text-sm text-gray-400" onClick={back}>
        <LeftOutlined rev={undefined} />
        <span className="ml-1">{t("placeholder.getBack")}</span>
      </div>
      <div className={clsx("mt-4 text-2xl font-medium")}>
        <span>{t("placeholder.register")}</span>
      </div>
      <Form
        form={form}
        layout="vertical"
        labelCol={{ prefixCls: "custom-form-item" }}
        onFinish={(fields) => void onFinish(fields)}
        autoComplete="off"
        className="mt-4"
        initialValues={{
          areaCode: "+86",
          enterpriseCode: DEFAULT_ENTERPRISE_CODE,
          registerMethod: "phone",
        }}
      >
        {availableRegisterMethods.length > 1 && (
          <Form.Item label={t("placeholder.register")} name="registerMethod">
            <Select options={availableRegisterMethods} />
          </Form.Item>
        )}

        {selectedRegisterMethod === "phone" && (
          <Form.Item label={t("placeholder.phoneNumber")}>
            <Space.Compact className="w-full">
              <Form.Item name="areaCode" noStyle>
                <Select options={areaCode} className="!w-28" />
              </Form.Item>
              <Form.Item name="phoneNumber" noStyle rules={getPhoneNumberRules()}>
                <Input allowClear placeholder={t("toast.inputPhoneNumber")} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        )}

        {selectedRegisterMethod === "email" && (
          <Form.Item
            label={t("placeholder.email")}
            name="email"
            rules={[
              { required: true, message: t("toast.inputEmail") },
              { type: "email", message: t("toast.inputCorrectEmail") },
            ]}
          >
            <Input allowClear spellCheck={false} placeholder={t("toast.inputEmail")} />
          </Form.Item>
        )}

        <Form.Item label={t("placeholder.enterpriseCode")} name="enterpriseCode">
          <Input
            allowClear
            spellCheck={false}
            placeholder={t("toast.inputEnterpriseCode")}
          />
        </Form.Item>

        {verificationRegistrationRequired && (
          <Form.Item label={t("placeholder.verifyCode")} required>
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
        )}

        <Form.Item
          label={t("placeholder.nickName")}
          name="nickname"
          rules={[
            {
              required: true,
              message: t("toast.inputNickName"),
            },
          ]}
        >
          <Input allowClear spellCheck={false} placeholder={t("toast.inputNickName")} />
        </Form.Item>

        <Form.Item
          label={t("placeholder.password")}
          name="password"
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
          name="password2"
          dependencies={["password"]}
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
          className="mb-8"
        >
          <Input.Password allowClear placeholder={t("toast.reconfirmPassword")} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={registrationConfigLoading}
          >
            {t("confirm")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterForm;
