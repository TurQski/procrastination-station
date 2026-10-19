import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Procrastination Station — Your next small step",
  description: "Turn a big goal into a realistic starting plan. Less overwhelm. One small step at a time.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
