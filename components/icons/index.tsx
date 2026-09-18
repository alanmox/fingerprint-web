import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 22, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function FingerprintIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4c-3.9 0-7 3.1-7 7v2c0 2.5.6 4.8 1.8 6.8" />
      <path d="M17.5 19.5A11.4 11.4 0 0 0 19 11c0-3.9-3.1-7-7-7" />
      <path d="M8.5 20.2A9.9 9.9 0 0 1 7 14v-3a5 5 0 0 1 10 0v3c0 .8-.06 1.5-.18 2.2" />
      <path d="M10.2 21a13.8 13.8 0 0 1-1.6-6.5V11a3.4 3.4 0 0 1 6.8 0v3.2" />
      <path d="M12 11v2.5c0 2.1.4 4.1 1.2 6" />
    </Svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.3 12.3 2.6 2.6 4.8-5.4" />
    </Svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.2 2.6 19.8a1 1 0 0 0 .87 1.5h17.06a1 1 0 0 0 .87-1.5L12 3.2Z" />
      <path d="M12 9.5v4.4" />
      <path d="M12 17.3h.01" />
    </Svg>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </Svg>
  );
}

export function WifiOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 8.5a16.9 16.9 0 0 1 5-3.1" />
      <path d="M9.8 5a16.9 16.9 0 0 1 12.2 3.5" />
      <path d="M5.5 12a11.9 11.9 0 0 1 4.2-2.4" />
      <path d="M14 10.2a11.9 11.9 0 0 1 4.5 2" />
      <path d="M8.5 15.5a6.9 6.9 0 0 1 4.5-1.6c.7 0 1.4.1 2 .3" />
      <path d="M12 19h.01" />
      <path d="M2 2l20 20" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" />
      <path d="M3 21v-5h5" />
    </Svg>
  );
}

export function DeviceIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M9 7h6" />
      <circle cx="12" cy="15.5" r="2.3" />
    </Svg>
  );
}
