import { LeftOutlined } from "@ant-design/icons";
import { App, Button, Form, Input } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import md5 from "md5";
import { useNavigate } from "react-router-dom";

import { DEFAULT_ENTERPRISE_CODE, normalizeIMProfile, useRegister } from "@/api/login";
import { setAccount, setIMProfile } from "@/utils/storage";

import { validateEnterpriseCodeInput } from "./enterpriseCode";
import type { FormType } from "./index";

type RegisterFormProps = {
  setFormType: (type: FormType) => void;
};

type FormFields = {
  account: string;
  nickname: string;
  password: string;
  password2: string;
  enterpriseCode?: string;
};

const RegisterForm = ({ setFormType }: RegisterFormProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormFields>();
  const navigate = useNavigate();
  const { mutate: register, isLoading: registerLoading } = useRegister();

  const onFinish = async (fields: FormFields) => {
    const account = fields.account.trim();
    if (account) {
      setAccount(account);
    }

    let enterpriseCode: string | undefined;
    let enterpriseName: string | undefined;
    try {
      const enterpriseContext = await validateEnterpriseCodeInput(
        fields.enterpriseCode,
      );
      enterpriseCode = enterpriseContext?.enterpriseCode;
      enterpriseName = enterpriseContext?.enterpriseName;
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
          account,
          nickname: fields.nickname,
          faceURL: "",
          password: md5(fields.password),
        },
      },
      {
        async onSuccess(res) {
          try {
            await setIMProfile({
              ...normalizeIMProfile(res.data),
              account,
              enterpriseCode,
              enterpriseName,
              faceURL: "",
              nickname: fields.nickname,
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
        onFinish={(fields) => void onFinish(fields)}
        autoComplete="off"
        className="mt-4"
        initialValues={{ enterpriseCode: DEFAULT_ENTERPRISE_CODE }}
      >
        <Form.Item
          label={t("placeholder.account")}
          name="account"
          rules={[{ required: true, message: t("toast.inputAccount") }]}
        >
          <Input allowClear spellCheck={false} placeholder={t("toast.inputAccount")} />
        </Form.Item>

        <Form.Item label={t("placeholder.enterpriseCode")} name="enterpriseCode">
          <Input
            allowClear
            spellCheck={false}
            placeholder={t("toast.inputEnterpriseCode")}
          />
        </Form.Item>

        <Form.Item
          label={t("placeholder.nickName")}
          name="nickname"
          rules={[{ required: true, message: t("toast.inputNickName") }]}
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
            { required: true, message: t("toast.reconfirmPassword") },
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
          <Button type="primary" htmlType="submit" block loading={registerLoading}>
            {t("confirm")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterForm;
