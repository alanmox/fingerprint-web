export type DeviceInfo = {
  dpId: string;
  rdsId: string;
  rdsVer: string;
  mi: string;
  mc: string;
  serial: string;
  model: string;
};

export type EnrollSuccess = {
  success: true;
  template: Buffer;
  templateFormat: string;
  quality: number;
  capturedAtIso: string;
  device: DeviceInfo;
  vendorTemplateId?: string;
};

export type EnrollFailure = {
  success: false;
  errCode: string;
  errInfo: string;
};

export type EnrollResult = EnrollSuccess | EnrollFailure;

export type IdentifyMatch = {
  success: true;
  matched: true;
  vendorTemplateId: string;
  matchScore: number;
  capturedAtIso: string;
  device: DeviceInfo;
};

export type IdentifyNoMatch = {
  success: true;
  matched: false;
  capturedAtIso: string;
  device: DeviceInfo;
};

export type IdentifyFailure = {
  success: false;
  errCode: string;
  errInfo: string;
};

export type IdentifyResult = IdentifyMatch | IdentifyNoMatch | IdentifyFailure;

export interface FingerprintDeviceClient {
  getDeviceInfo(): Promise<DeviceInfo>;
  enrollTemplate(): Promise<EnrollResult>;
  identify(): Promise<IdentifyResult>;
}
