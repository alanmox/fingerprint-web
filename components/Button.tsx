"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    busy?: boolean;
    variant?: "primary" | "secondary";
  }
>;

export function Button({
  children,
  busy = false,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      disabled={busy || props.disabled}
      {...props}
    >
      {busy ? "Please wait..." : children}
    </button>
  );
}

