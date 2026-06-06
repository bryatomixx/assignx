import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { AcademyProvider } from "@/lib/store/AcademyProvider";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AssignX | Agency Partners Academy",
    template: "%s | AssignX Academy",
  },
  description:
    "The training academy for AssignX agency partners. Build and sell AI agents — start free with the 30 Days Challenge.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <body>
        <AcademyProvider>
          <AppShell>{children}</AppShell>
        </AcademyProvider>
      </body>
    </html>
  );
}
