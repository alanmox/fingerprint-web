import crypto from "node:crypto";
import https from "node:https";

/**
 * Client for the Mantra MFS500 "RD Service" — a local HTTP(S) service the
 * Mantra driver installs on the operator's machine. This module (and the API
 * routes that call it) must run on the same machine as the scanner: it talks
 * to 127.0.0.1, which is unreachable from a remotely hosted server.
 *
 * The RD Service follows UIDAI's Registered Devices spec: device discovery
 * is a plain GET that returns a <DeviceInfo> document, and capture is a
 * request using the custom HTTP method "CAPTURE" with a <PidOptions> XML
 * body, returning a <PidData> document. In compliant/production mode the
 * <Data> element is an encrypted PID block — UIDAI's design intentionally
 * never exposes a raw fingerprint image to the calling page, so this client
 * only ever handles the encrypted blob (for hashing/audit) and capture
 * metadata (quality score, device serial, timestamps), never image pixels.
 *
 * Exact paths/method names can vary slightly by RD Service build, so they're
 * exposed as env vars — verify the defaults against your installed service
 * if capture calls fail.
 */

const BASE_URL = process.env.RD_SERVICE_BASE_URL ?? "https://127.0.0.1:11100";
const INFO_PATH = process.env.RD_SERVICE_INFO_PATH ?? "/rd/info";
const CAPTURE_PATH = process.env.RD_SERVICE_CAPTURE_PATH ?? "/rd/capture";
const CAPTURE_TIMEOUT_MS = Number(
  process.env.RD_SERVICE_CAPTURE_TIMEOUT_MS ?? 10000,
);
const PID_FORMAT = process.env.RD_SERVICE_PID_FORMAT ?? "0";
const PID_VERSION = process.env.RD_SERVICE_PID_VERSION ?? "2.0";
const PID_ENV = process.env.RD_SERVICE_ENV ?? "P";
const WADH = process.env.RD_SERVICE_WADH ?? "";
const DEFAULT_POSH = process.env.RD_SERVICE_POSH ?? "UNKNOWN";
// The RD Service typically installs a self-signed local certificate; only
// disable verification for that known local loopback service.
const ALLOW_SELF_SIGNED = process.env.RD_SERVICE_ALLOW_SELF_SIGNED !== "false";

export class RdServiceError extends Error {}

export type DeviceInfo = {
  dpId: string;
  rdsId: string;
  rdsVer: string;
  mi: string;
  mc: string;
  serial: string;
  model: string;
};

export type CaptureSuccess = {
  success: true;
  errCode: string;
  errInfo: string;
  qualityScore: number;
  fCount: string;
  capturedAtIso: string;
  device: DeviceInfo;
  pidDataHash: string;
  pidData: string;
};

export type CaptureFailure = {
  success: false;
  errCode: string;
  errInfo: string;
  qualityScore: number;
};

export type CaptureResult = CaptureSuccess | CaptureFailure;

function requestRdService(
  method: string,
  path: string,
  body?: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyBuffer = body ? Buffer.from(body, "utf8") : undefined;

    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method,
        rejectUnauthorized: !ALLOW_SELF_SIGNED,
        headers: bodyBuffer
          ? { "Content-Type": "text/xml", "Content-Length": bodyBuffer.length }
          : undefined,
        timeout: CAPTURE_TIMEOUT_MS + 5000,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          data += chunk;
        });
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, body: data }),
        );
      },
    );

    req.on("timeout", () =>
      req.destroy(new Error("The scanner service request timed out.")),
    );
    req.on("error", (cause) =>
      reject(
        new RdServiceError(
          `Could not reach the Mantra RD Service at ${BASE_URL}. Confirm it is installed and running on this machine. (${cause.message})`,
        ),
      ),
    );

    if (bodyBuffer) {
      req.write(bodyBuffer);
    }

    req.end();
  });
}

function getTagAttr(xml: string, tag: string, attr: string): string {
  const tagMatch = xml.match(new RegExp(`<${tag}\\b[^>]*>`, "i"));

  if (!tagMatch) {
    return "";
  }

  const attrMatch = tagMatch[0].match(new RegExp(`${attr}="([^"]*)"`, "i"));
  return attrMatch?.[1] ?? "";
}

function getTagContent(xml: string, tag: string): string {
  const match = xml.match(
    new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i"),
  );
  return match?.[1]?.trim() ?? "";
}

function getParamValue(xml: string, name: string): string {
  const match = xml.match(
    new RegExp(`<Param\\s+name="${name}"\\s+value="([^"]*)"`, "i"),
  );
  return match?.[1] ?? "";
}

function parseDeviceInfo(xml: string): DeviceInfo {
  return {
    dpId: getTagAttr(xml, "DeviceInfo", "dpId"),
    rdsId: getTagAttr(xml, "DeviceInfo", "rdsId"),
    rdsVer: getTagAttr(xml, "DeviceInfo", "rdsVer"),
    mi: getTagAttr(xml, "DeviceInfo", "mi"),
    mc: getTagAttr(xml, "DeviceInfo", "mc"),
    serial: getParamValue(xml, "srno") || getParamValue(xml, "serialNo"),
    model: getParamValue(xml, "name") || "Mantra MFS500",
  };
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  const { status, body } = await requestRdService("GET", INFO_PATH);

  if (status < 200 || status >= 300 || !body.includes("<DeviceInfo")) {
    throw new RdServiceError(
      "The scanner service did not return device information. Confirm the Mantra RD Service is running and the MFS500 is plugged in.",
    );
  }

  return parseDeviceInfo(body);
}

function buildPidOptionsXml(posh: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<PidOptions ver="1.0">' +
    `<Opts fCount="1" fType="0" iCount="0" pCount="0" format="${PID_FORMAT}" pidVer="${PID_VERSION}" ` +
    `timeout="${CAPTURE_TIMEOUT_MS}" posh="${posh}" env="${PID_ENV}" wadh="${WADH}" />` +
    "<Demo></Demo>" +
    "<CustOpts></CustOpts>" +
    "</PidOptions>"
  );
}

export async function captureFingerprint(options?: {
  posh?: string;
}): Promise<CaptureResult> {
  const pidOptions = buildPidOptionsXml(options?.posh ?? DEFAULT_POSH);
  const { status, body } = await requestRdService(
    "CAPTURE",
    CAPTURE_PATH,
    pidOptions,
  );

  if (status < 200 || status >= 300 || !body.includes("<PidData")) {
    throw new RdServiceError(
      "The scanner did not respond to the capture request.",
    );
  }

  const errCode = getTagAttr(body, "Resp", "errCode") || "0";
  const errInfo = getTagAttr(body, "Resp", "errInfo");
  const qualityScore = Number(getTagAttr(body, "Resp", "qScore") || 0);
  const fCount = getTagAttr(body, "Resp", "fCount");

  if (errCode !== "0") {
    return {
      success: false,
      errCode,
      errInfo:
        errInfo ||
        `Capture failed (error code ${errCode}). Check the scanner and try again.`,
      qualityScore,
    };
  }

  const pidData = getTagContent(body, "Data");
  const pidDataHash = crypto.createHash("sha256").update(pidData).digest("hex");

  return {
    success: true,
    errCode,
    errInfo,
    qualityScore,
    fCount,
    capturedAtIso: new Date().toISOString(),
    device: parseDeviceInfo(body),
    pidDataHash,
    pidData,
  };
}
