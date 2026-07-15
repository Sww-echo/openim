import createAxiosInstance from "@/utils/request";
import {
  getCurrentBusinessApiBaseURL,
  getEnterpriseApiProxyBaseURL,
} from "@/utils/enterpriseContext";

const resolveBusinessBaseURL = async () => {
  const enterpriseBaseURL = await getCurrentBusinessApiBaseURL();
  if (!enterpriseBaseURL) {
    return undefined;
  }

  if (import.meta.env.DEV) {
    return {
      baseURL: getEnterpriseApiProxyBaseURL(),
      headers: {
        "x-enterprise-api-base-url": enterpriseBaseURL,
      },
    };
  }

  return enterpriseBaseURL;
};

const businessRequest = createAxiosInstance(
  import.meta.env.VITE_CHAT_URL as string,
  false,
  {
    resolveBaseURL: resolveBusinessBaseURL,
  },
);

export default businessRequest;
