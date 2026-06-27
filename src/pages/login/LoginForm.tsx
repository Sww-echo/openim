import { Button, Form, Input, Select, Space } from "antd";
import { t } from "i18next";
import md5 from "md5";
import { useNavigate } from "react-router-dom";

import {
  DEFAULT_ENTERPRISE_CODE,
  normalizeIMProfile,
  useLogin,
} from "@/api/login";
import { feedbackToast } from "@/utils/common";
import {
  getPhoneNumber,
  setAreaCode,
  setIMProfile,
  setPhoneNumber,
} from "@/utils/storage";

import { areaCode } from "./areaCode";
import { validateEnterpriseCodeInput } from "./enterpriseCode";
import type { FormType } from "./index";
import { getPhoneNumberRules } from "./rules";

type LoginFormProps = {
  setFormType: (type: FormType) => void;
};

const LoginForm = ({ setFormType }: LoginFormProps) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { mutate: login, isLoading: loginLoading } = useLogin();

  const onFinish = async (params: API.Login.LoginParams) => {
    if (params.phoneNumber) {
      setAreaCode(params.areaCode);
      setPhoneNumber(params.phoneNumber);
    }

    let enterpriseCode: string | undefined;
    try {
      enterpriseCode = await validateEnterpriseCodeInput(params.enterpriseCode);
    } catch (error) {
      feedbackToast({ error });
      return;
    }

    login(
      {
        ...params,
        password: md5(params.password ?? ""),
        enterpriseCode,
      },
      {
        onSuccess: async (data) => {
          try {
            await setIMProfile({
              ...normalizeIMProfile(data.data),
              account: params.account ?? params.phoneNumber,
              areaCode: params.areaCode,
              faceURL: data.data.faceURL,
              nickname: data.data.nickname,
              phoneNumber: params.phoneNumber,
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
          areaCode: "+86",
          phoneNumber: getPhoneNumber() ?? "",
          enterpriseCode: DEFAULT_ENTERPRISE_CODE,
        }}
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

        <Form.Item
          label={t("placeholder.password")}
          name="password"
          rules={[{ required: true, message: t("toast.inputPassword") }]}
        >
          <Input.Password allowClear placeholder={t("toast.inputPassword")} />
        </Form.Item>

        <Form.Item label={t("placeholder.enterpriseCode")} name="enterpriseCode">
          <Input disabled placeholder={t("toast.inputEnterpriseCode")} />
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
