import createAxiosInstance from "@/utils/request";

const platformRequest = createAxiosInstance(
  import.meta.env.VITE_PLATFORM_API_URL || "/api/platform",
  false,
  {
    auth: false,
  },
);

export default platformRequest;
