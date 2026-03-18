import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import { DateRangeProvider } from "@/lib/date-range-context";
import { AccountProvider } from "@/lib/account-context";
import { I18nProvider } from "@/lib/i18n";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: "italic",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Traverse",
  description: "Track your crypto trades, analyze performance, and improve your strategy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="obsidian" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased text-foreground`}
      >
        <I18nProvider>
          <ThemeProvider>
            <DateRangeProvider>
              <AccountProvider>
                {children}
                <CookieConsent />
              </AccountProvider>
            </DateRangeProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
