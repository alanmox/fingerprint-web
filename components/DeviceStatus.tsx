import { DeviceIcon } from "@/components/icons";

export type DeviceState = "idle" | "checking" | "ready" | "error";

const LABELS: Record<DeviceState, string> = {
  idle: "Scanner not connected",
  checking: "Checking scanner...",
  ready: "Scanner connected",
  error: "Scanner unavailable",
};

export function DeviceStatus({
  state,
  detail,
}: {
  state: DeviceState;
  detail?: string;
}) {
  return (
    <div className={`device-status device-status--${state}`}>
      <span className="device-status__dot" />
      <DeviceIcon className="device-status__icon" size={18} />
      <div>
        <strong>{LABELS[state]}</strong>
        {detail ? <p>{detail}</p> : null}
      </div>
    </div>
  );
}
