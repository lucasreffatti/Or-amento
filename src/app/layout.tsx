import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScaleProvider } from "@/components/ScaleProvider";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
  title: "Auto Elétrica Sérgio Car",
  description: "Plataforma de Gestão Multi-Tenant",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${geistMono.variable} antialiased text-neutral-900`}>
        <ScaleProvider>
          {children}
        </ScaleProvider>
      </body>
    </html>
  );
}

