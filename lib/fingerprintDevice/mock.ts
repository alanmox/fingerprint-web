import type {
  DeviceInfo,
  EnrollResult,
  FingerprintDeviceClient,
  IdentifyResult,
} from "./types";

/**
 * Deterministic in-memory fake of the fingerprint device, used whenever
 * MANTRA_MODE isn't "live" (the default outside production). Lets the rest
 * of the app — enrollment, the kiosk scan flow, eligibility gating,
 * attendance toggling — be built and tested without real MFS500 hardware.
 *
 * Test control: pass an `x-mock-identify` header on the /api/kiosk/scan
 * request with a student's enrolled `vendorTemplateId` to simulate that
 * student scanning, `"no-match"` to simulate an unrecognized scan, or
 * `"error"` to simulate a device failure. With no header, identify()
 * matches the most recently enrolled template (convenient for manual
 * testing: enroll one student, then scan).
 */

const MOCK_DEVICE: DeviceInfo = {
  dpId: "MOCK.MANTRA.001",
  rdsId: "MOCK_RDS",
  rdsVer: "1.0.0",
  mi: "N",
  mc: "N",
  serial: "MOCK-MFS500-0001",
  model: "Mantra MFS500 (mock)",
};

let lastEnrolledVendorTemplateId: string | null = null;
let mockNextIdentifyOverride: string | null = null;

export function setMockIdentifyOverride(value: string | null) {
  mockNextIdentifyOverride = value;
}

export const mockFingerprintDevice: FingerprintDeviceClient = {
  async getDeviceInfo(): Promise<DeviceInfo> {
    return MOCK_DEVICE;
  },

  async enrollTemplate(): Promise<EnrollResult> {
    const vendorTemplateId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    lastEnrolledVendorTemplateId = vendorTemplateId;

    return {
      success: true,
      template: Buffer.from(`mock-template-${vendorTemplateId}`, "utf8"),
      templateFormat: "MOCK",
      quality: 75,
      capturedAtIso: new Date().toISOString(),
      device: MOCK_DEVICE,
      vendorTemplateId,
    };
  },

  async identify(): Promise<IdentifyResult> {
    const override = mockNextIdentifyOverride;
    mockNextIdentifyOverride = null;

    if (override === "error") {
      return {
        success: false,
        errCode: "MOCK_ERR",
        errInfo: "Simulated device error.",
      };
    }

    if (override === "no-match") {
      return {
        success: true,
        matched: false,
        capturedAtIso: new Date().toISOString(),
        device: MOCK_DEVICE,
      };
    }

    const vendorTemplateId = override ?? lastEnrolledVendorTemplateId;

    if (!vendorTemplateId) {
      return {
        success: true,
        matched: false,
        capturedAtIso: new Date().toISOString(),
        device: MOCK_DEVICE,
      };
    }

    return {
      success: true,
      matched: true,
      vendorTemplateId,
      matchScore: 92,
      capturedAtIso: new Date().toISOString(),
      device: MOCK_DEVICE,
    };
  },
};
