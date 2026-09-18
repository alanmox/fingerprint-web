import type { ComponentType } from "react";
import {
  CheckCircleIcon,
  AlertIcon,
  XCircleIcon,
  WifiOffIcon,
  ClockIcon,
} from "@/components/icons";
import type { IconProps } from "@/components/icons";

export type ScanOutcomeState =
  | "matched-success"
  | "already-complete"
  | "unknown-fingerprint"
  | "ineligible"
  | "device-error"
  | "network-error"
  | "config-error";

type ScanOutcomeConfig = {
  label: string;
  icon: ComponentType<IconProps>;
  tone: "success" | "idle" | "blocked" | "error" | "offline";
};

export const SCAN_OUTCOME_CONFIG: Record<ScanOutcomeState, ScanOutcomeConfig> = {
  "matched-success": {
    label: "Attendance recorded",
    icon: CheckCircleIcon,
    tone: "success",
  },
  "already-complete": {
    label: "Already recorded today",
    icon: ClockIcon,
    tone: "idle",
  },
  "unknown-fingerprint": {
    label: "Fingerprint not recognized",
    icon: XCircleIcon,
    tone: "blocked",
  },
  ineligible: {
    label: "Registration incomplete",
    icon: AlertIcon,
    tone: "blocked",
  },
  "device-error": {
    label: "Scanner error",
    icon: AlertIcon,
    tone: "error",
  },
  "network-error": {
    label: "Connection lost",
    icon: WifiOffIcon,
    tone: "offline",
  },
  "config-error": {
    label: "Field site not configured",
    icon: AlertIcon,
    tone: "error",
  },
};

export function ScanStatus({ state }: { state: ScanOutcomeState }) {
  const config = SCAN_OUTCOME_CONFIG[state];
  const Icon = config.icon;

  return (
    <div className={`scan-status scan-status--${config.tone}`}>
      <Icon size={20} />
      <span>{config.label}</span>
    </div>
  );
}
