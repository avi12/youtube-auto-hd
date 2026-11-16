import { installSdrCapabilities } from "@/lib/ythd-sdr";

export default defineUnlistedScript(() => {
  installSdrCapabilities();
});
