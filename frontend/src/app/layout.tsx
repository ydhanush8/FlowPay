import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowPay",
  description: "Manage agreements and recurring payments securely",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#000000',
          borderRadius: '0.5rem',
        },
        elements: {
          /* Hide the email/password form — Google-only */
          formFieldRow: { display: 'none' },
          formButtonPrimary: { display: 'none' },
          dividerRow: { display: 'none' },
          footer: { display: 'none' },
          /* Make Google button more prominent */
          socialButtonsBlockButton: {
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            padding: '14px 20px',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
          },
          socialButtonsBlockButtonText: {
            fontWeight: '600',
            fontSize: '15px',
          },
          card: {
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          },
          headerSubtitle: {
            fontSize: '14px',
          },
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
          style={{ background: 'var(--bg)', color: 'var(--fg)' }}
        >
          <ThemeProvider>
            {children}
          </ThemeProvider>
          <Toaster position="top-right" richColors />
          <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        </body>
      </html>
    </ClerkProvider>
  );
}
