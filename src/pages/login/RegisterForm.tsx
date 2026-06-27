import { LeftOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Select, Space } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import md5 from "md5";
import { useNavigate } from "react-router-dom";

import {
  DEFAULT_ENTERPRISE_CODE,
  normalizeIMProfile,
  useRegister,
} from "@/api/login";
import { setAreaCode, setIMProfile, setPhoneNumber } from "@/utils/storage";

import { areaCode } from "./areaCode";
import { validateEnterpriseCodeInput } from "./enterpriseCode";
import type { FormType } from "./index";
import { getPhoneNumberRules } from "./rules";

type RegisterFormProps = {
  setFormType: (type: FormType) => void;
};

type FormFields = {
  phoneNumber: string;
  areaCode: string;
  nickname: string;
  password: string;
  password2: string;
  enterpriseCode?: string;
};

const RegisterForm = ({ setFormType }: RegisterFormProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormFields>();
  const navigate = useNavigate();
  const { mutate: register } = useRegister();

  const onFinish = async (fields: FormFields) => {
    setAreaCode(fields.areaCode);
    setPhoneNumber(fields.phoneNumber);
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
        user: {
          nickname: fields.nickname,
          faceURL: "",
          areaCode: fields.areaCode,
          phoneNumber: fields.phoneNumber,
          password: md5(fields.password),
        },
      },
      {
        async onSuccess(res) {
          try {
            await setIMProfile({
              ...normalizeIMProfile(res.data),
              account: fields.phoneNumber,
              areaCode: fields.areaCode,
              faceURL: "",
              nickname: fields.nickname,
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

  const back = () => {
    setFormType(0);
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
        onFinish={onFinish}
        autoComplete="off"
        className="mt-4"
        initialValues={{ areaCode: "+86", enterpriseCode: DEFAULT_ENTERPRISE_CODE }}
      >
        <Form.Item label={t("placeholder.phoneNumber")}>
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

        <Form.Item label={t("placeholder.enterpriseCode")} name="enterpriseCode">
          <Input disabled placeholder={t("toast.inputEnterpriseCode")} />
        </Form.Item>

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
          <Button type="primary" htmlType="submit" block>
            {t("confirm")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterForm;
