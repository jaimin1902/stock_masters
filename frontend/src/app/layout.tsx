import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from "@/components/layout/AppLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Stock Masters - Inventory Management System",
  description: "Comprehensive inventory management system for stock masters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
