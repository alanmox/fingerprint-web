import type { FingerprintDeviceClient } from "./types";
import { localFingerprintDevice } from "./localService";
import { mockFingerprintDevice, setMockIdentifyOverride } from "./mock";

const isLive = process.env.MANTRA_MODE === "live";

export const fingerprintDevice: FingerprintDeviceClient = isLive
  ? localFingerprintDevice
  : mockFingerprintDevice;

export const isMockMode = !isLive;
export { setMockIdentifyOverride };
export type {
  DeviceInfo,
  EnrollResult,
  FingerprintDeviceClient,
  IdentifyResult,
} from "./types";
