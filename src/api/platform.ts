import createAxiosInstance from "@/utils/request";

const platformRequest = createAxiosInstance("/api/platform", false, {
  auth: false,
});

export default platformRequest;
