import createAxiosInstance from "@/utils/request";

const platformApiBaseURL = import.meta.env.DEV
  ? "/api/platform"
  : "https://platform.yuxinim.com/api/platform";

const platformRequest = createAxiosInstance(platformApiBaseURL, false, {
  auth: false,
});

export default platformRequest;
