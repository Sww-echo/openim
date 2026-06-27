import createAxiosInstance from "@/utils/request";

const businessRequest = createAxiosInstance(
  import.meta.env.VITE_CHAT_URL as string,
  false,
);

export default businessRequest;
