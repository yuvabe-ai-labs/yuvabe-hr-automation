import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { RouteFade } from "./_components/route-fade";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Yuvabe ATS",
  description: "Hiring is a human act.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hdrs = await headers();
  const session = {
    userId: hdrs.get("x-user-id") ?? "",
    role: hdrs.get("x-user-role") ?? "viewer",
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers session={session}>
          <RouteFade>{children}</RouteFade>
        </Providers>
      </body>
    </html>
  );
}
