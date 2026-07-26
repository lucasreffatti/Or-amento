import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
 title: "Auto Elétrica Sérgio Car",
 description: "Plataforma de Gestão Multi-Tenant",
};

import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="pt-BR" suppressHydrationWarning>
 <body className={`${inter.variable} ${geistMono.variable} antialiased text-neutral-900 dark:text-neutral-50 dark:bg-black bg-[#FAFAFA]`}>
 <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
 {children}
 </ThemeProvider>
 </body>
 </html>
 );
}
