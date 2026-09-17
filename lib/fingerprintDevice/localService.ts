import https from "node:https";
import type {
  DeviceInfo,
  EnrollResult,
  FingerprintDeviceClient,
  IdentifyResult,
} from "./types";

/**
 * Client for Mantra's *local, non-Aadhaar* MFS500 capture/identify service —
 * the mode meant for attendance/access-control use cases (as opposed to the
 * UIDAI RD Service, which only returns an encrypted, non-matchable PID
 * block). Like the RD Service before it, this talks to a service the Mantra
 * driver installs on the operator's machine at 127.0.0.1.
 *
 * IMPORTANT: there is no live MFS500 device or vendor SDK documentation
 * available to verify the exact wire protocol here. Everything below —
 * paths, JSON request/response shapes, whether 1:N matching happens
 * server-side inside the local service (assumed) or must be done by this
 * app against raw templates — is a best-guess default, isolated behind
 * env vars and the FingerprintDeviceClient interface so it can be swapped
 * without touching any calling code. Before relying on this in production,
 * validate each request/response shape against the real installed service
 * (e.g. with Postman) and adjust the parsing below accordingly.
 */

const BASE_URL = process.env.MANTRA_LOCAL_BASE_URL ?? "https://127.0.0.1:11100";
const INFO_PATH = process.env.MANTRA_LOCAL_INFO_PATH ?? "/device/info";
const ENROLL_PATH = process.env.MANTRA_LOCAL_ENROLL_PATH ?? "/device/enroll";
const IDENTIFY_PATH =
  process.env.MANTRA_LOCAL_IDENTIFY_PATH ?? "/device/identify";
const TIMEOUT_MS = Number(process.env.MANTRA_LOCAL_TIMEOUT_MS ?? 10000);
const ALLOW_SELF_SIGNED =
  process.env.MANTRA_LOCAL_ALLOW_SELF_SIGNED !== "false";
const MATCH_THRESHOLD = Number(process.env.MANTRA_LOCAL_MATCH_THRESHOLD ?? 60);

export class FingerprintDeviceError extends Error {}

function requestJson<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyBuffer =
      body !== undefined
        ? Buffer.from(JSON.stringify(body), "utf8")
        : undefined;

    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method,
        rejectUnauthorized: !ALLOW_SELF_SIGNED,
        headers: bodyBuffer
          ? {
              "Content-Type": "application/json",
              "Content-Length": bodyBuffer.length,
            }
          : undefined,
        timeout: TIMEOUT_MS + 5000,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          data += chunk;
        });
        res.on("end", () => {
          if ((res.statusCode ?? 0) < 200 || (res.statusCode ?? 0) >= 300) {
            reject(
              new FingerprintDeviceError(
                `Scanner service responded with status ${res.statusCode}.`,
              ),
            );
            return;
          }

          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(
              new FingerprintDeviceError(
                "Scanner service returned an unexpected response.",
              ),
            );
          }
        });
      },
    );

    req.on("timeout", () =>
      req.destroy(new Error("The scanner service request timed out.")),
    );
    req.on("error", (cause) =>
      reject(
        new FingerprintDeviceError(
          `Could not reach the Mantra local capture service at ${BASE_URL}. Confirm it is installed and running on this machine. (${cause.message})`,
        ),
      ),
    );

    if (bodyBuffer) {
      req.write(bodyBuffer);
    }

    req.end();
  });
}

type RawDeviceInfoResponse = DeviceInfo;

type RawEnrollResponse =
  | {
      success: true;
      template: string;
      templateFormat: string;
      quality: number;
      capturedAt: string;
      device: DeviceInfo;
      vendorTemplateId?: string;
    }
  | { success: false; errCode: string; errInfo: string };

type RawIdentifyResponse =
  | {
      success: true;
      matched: true;
      vendorTemplateId: string;
      matchScore: number;
      capturedAt: string;
      device: DeviceInfo;
    }
  | { success: true; matched: false; capturedAt: string; device: DeviceInfo }
  | { success: false; errCode: string; errInfo: string };

export const localFingerprintDevice: FingerprintDeviceClient = {
  async getDeviceInfo(): Promise<DeviceInfo> {
    return requestJson<RawDeviceInfoResponse>("GET", INFO_PATH);
  },

  async enrollTemplate(): Promise<EnrollResult> {
    const response = await requestJson<RawEnrollResponse>("POST", ENROLL_PATH);

    if (!response.success) {
      return response;
    }

    return {
      success: true,
      template: Buffer.from(response.template, "base64"),
      templateFormat: response.templateFormat,
      quality: response.quality,
      capturedAtIso: response.capturedAt,
      device: response.device,
      vendorTemplateId: response.vendorTemplateId,
    };
  },

  async identify(): Promise<IdentifyResult> {
    const response = await requestJson<RawIdentifyResponse>(
      "POST",
      IDENTIFY_PATH,
    );

    if (!response.success) {
      return response;
    }

    if (!response.matched || response.matchScore < MATCH_THRESHOLD) {
      return {
        success: true,
        matched: false,
        capturedAtIso: response.capturedAt,
        device: response.device,
      };
    }

    return {
      success: true,
      matched: true,
      vendorTemplateId: response.vendorTemplateId,
      matchScore: response.matchScore,
      capturedAtIso: response.capturedAt,
      device: response.device,
    };
  },
};
