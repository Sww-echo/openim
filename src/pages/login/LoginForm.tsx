import { Button, Form, Input } from "antd";
import { t } from "i18next";
import md5 from "md5";
import { useNavigate } from "react-router-dom";

import { DEFAULT_ENTERPRISE_CODE, normalizeIMProfile, useLogin } from "@/api/login";
import { feedbackToast } from "@/utils/common";
import { getAccount, setAccount, setIMProfile } from "@/utils/storage";

import { validateEnterpriseCodeInput } from "./enterpriseCode";
import type { FormType } from "./index";

type LoginFormProps = {
  setFormType: (type: FormType) => void;
};

const LoginForm = ({ setFormType }: LoginFormProps) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { mutate: login, isLoading: loginLoading } = useLogin();

  const onFinish = async (params: API.Login.LoginParams) => {
    const account = params.account.trim();
    if (account) {
      setAccount(account);
    }

    let enterpriseCode: string | undefined;
    let enterpriseName: string | undefined;
    try {
      const enterpriseContext = await validateEnterpriseCodeInput(
        params.enterpriseCode,
      );
      enterpriseCode = enterpriseContext.enterpriseCode;
      enterpriseName = enterpriseContext.enterpriseName;
    } catch (error) {
      feedbackToast({ error });
      return;
    }

    login(
      {
        account,
        password: md5(params.password ?? ""),
        enterpriseCode,
      },
      {
        onSuccess: async (data) => {
          try {
            await setIMProfile({
              ...normalizeIMProfile(data.data),
              account,
              enterpriseCode,
              enterpriseName,
              faceURL: data.data.faceURL,
              nickname: data.data.nickname,
            });
            navigate("/chat");
          } catch (error) {
            feedbackToast({ error });
          }
        },
      },
    );
  };

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xl font-medium">{t("placeholder.welcome")}</div>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        labelCol={{ prefixCls: "custom-form-item" }}
        initialValues={{
          account: getAccount() ?? "",
          enterpriseCode: DEFAULT_ENTERPRISE_CODE,
        }}
      >
        <Form.Item
          label={t("placeholder.account")}
          name="account"
          rules={[{ required: true, message: t("toast.inputAccount") }]}
        >
          <Input allowClear spellCheck={false} placeholder={t("toast.inputAccount")} />
        </Form.Item>

        <Form.Item
          label={t("placeholder.password")}
          name="password"
          rules={[{ required: true, message: t("toast.inputPassword") }]}
        >
          <Input.Password allowClear placeholder={t("toast.inputPassword")} />
        </Form.Item>

        <Form.Item label={t("placeholder.enterpriseCode")} name="enterpriseCode">
          <Input
            allowClear
            spellCheck={false}
            placeholder={t("toast.inputEnterpriseCode")}
          />
        </Form.Item>

        <div className="mb-10 flex flex-row justify-between">
          <span
            className="cursor-pointer text-sm text-gray-400"
            onClick={() => setFormType(1)}
          >
            {t("placeholder.forgetPassword")}
          </span>
        </div>

        <Form.Item className="mb-4">
          <Button type="primary" htmlType="submit" block loading={loginLoading}>
            {t("placeholder.login")}
          </Button>
        </Form.Item>

        <div className="flex flex-row items-center justify-center">
          <span className="text-sm text-gray-400">
            {t("placeholder.registerToast")}
          </span>
          <span
            className="cursor-pointer text-sm text-blue-500"
            onClick={() => setFormType(2)}
          >
            {t("placeholder.toRegister")}
          </span>
        </div>
      </Form>
    </>
  );
};

export default LoginForm;
