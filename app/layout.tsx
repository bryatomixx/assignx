import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { AcademyProvider } from "@/lib/store/AcademyProvider";
import { BoardProvider } from "@/lib/store/BoardProvider";
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
    "The training academy for AssignX agency partners. Build and sell AI agents. Start free with the 30 Days Challenge.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla adds
          cz-shortcut-listen, Grammarly its own) inject attributes onto <body>
          before React hydrates, which would otherwise trip a hydration warning
          we cannot control. This suppresses only body's own attribute diff. */}
      <body suppressHydrationWarning>
        <AcademyProvider>
          <BoardProvider>
            <AppShell>{children}</AppShell>
          </BoardProvider>
        </AcademyProvider>
      </body>
    </html>
  );
}
