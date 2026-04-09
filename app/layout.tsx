import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALLANMOX Passkeys",
  description: "Next.js WebAuthn authentication starter with PostgreSQL and Prisma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
