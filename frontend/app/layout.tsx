import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers"; // <--- Import cái này

export const metadata: Metadata = {
  title: "IOTA StreamRent",
  description: "Pay-as-you-go Rental on IOTA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers> {/* <--- Bọc Providers ở đây */}
          {children}
        </Providers>
      </body>
    </html>
  );
}